from __future__ import annotations
import httpx  # 用于外部 API 调用
import asyncio
import os
import aiomysql
import time

import json
import re
import traceback
from typing import Any, Dict, List, Optional, Literal, Tuple
from uuid import uuid4
from datetime import datetime

import rdflib
from rdflib.namespace import OWL, RDF, RDFS, XSD

from public.public_variable import logger
from utils.databases.service_factory import create_mysql_service
from utils.databases.mysql.mysql_service import MySQLService


# ==================================================================================
# Part 1: 工具函数（字符串清洗、Turtle字面量格式化等）
# ==================================================================================

# 计时工具函数
def _tick() -> float:
    """返回当前时间戳（秒），用于计时起点"""
    return time.perf_counter()


def _tock(start: float, label: str = "") -> float:
    """计算耗时并记录日志，返回耗时（毫秒）"""
    elapsed_ms = (time.perf_counter() - start) * 1000
    if label:
        logger.info(f"{label} took {elapsed_ms:.1f} ms")
    return elapsed_ms


# 仅用于清洗 ex:局部名（允许：中文、字母、数字、下划线）
_NS_KEEP_RE = re.compile(r"[^A-Za-z0-9_\u4E00-\u9FFF]+")
# 只匹配 Turtle 里的 ex:局部名（不影响 RDF/XML）
_EX_LOCAL_RE = re.compile(r"ex:([^\s;,.]+)")

_NET_GATE_ENV_VAR = "NET_GATE"
_SANDBOX_SERVER_ENV_VAR = "SANDBOX_SERVER"


def _resolve_net_gate(value: Optional[str] = None) -> str:
    """优先使用入参或环境变量 NET_GATE，未配置则抛出异常"""
    candidate = (value or "").strip()
    if candidate:
        return candidate
    env_value = os.getenv(_NET_GATE_ENV_VAR, "").strip()
    if env_value:
        return env_value
    raise RuntimeError(f"环境变量 {_NET_GATE_ENV_VAR} 未配置，且未显式传入 net_gate 参数")


def _resolve_sandbox_server(value: Optional[str] = None) -> str:
    """
    优先使用入参、配置服务或环境变量 SANDBOX_SERVER，未配置则抛出异常
    
    解析顺序：
    1. 显式传入的 value 参数
    2. 配置服务的 ontology_route_url_python.sandbox_dev 字段
    3. 环境变量 SANDBOX_SERVER（降级方案）
    """
    # 1. 优先使用显式传入的参数
    candidate = (value or "").strip()
    if candidate:
        return candidate
    
    # 2. 尝试从配置服务获取
    try:
        from config import get_ontology_route_url_config_sync
        config = get_ontology_route_url_config_sync()
        if config and isinstance(config, dict):
            sandbox_dev = config.get("sandbox_dev", "").strip()
            if sandbox_dev:
                logger.debug(f"Using sandbox_server from config service: {sandbox_dev}")
                return sandbox_dev
    except Exception as e:
        logger.warning(f"Failed to get sandbox_server from config service, falling back to env var: {e}")
    
    # 3. 降级到环境变量
    env_value = os.getenv(_SANDBOX_SERVER_ENV_VAR, "").strip()
    if env_value:
        logger.debug(f"Using sandbox_server from environment variable: {env_value}")
        return env_value
    
    raise RuntimeError(
        f"未找到 sandbox_server 配置：配置服务的 ontology_route_url_python.sandbox_dev 为空，"
        f"且环境变量 {_SANDBOX_SERVER_ENV_VAR} 未配置，且未显式传入 sandbox_server 参数")


def _resolve_sandbox_env(
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> dict[str, str]:
    """统一解析沙箱环境，返回 {net_gate, sandbox_server, base}。

    - 优先使用显式参数，其次读取环境变量 NET_GATE/SANDBOX_SERVER
    - base = _build_sandbox_base(net_gate, sandbox_server)
    """
    gate = _resolve_net_gate(net_gate)
    server = _resolve_sandbox_server(sandbox_server)
    base = _build_sandbox_base(gate, server)
    return {"net_gate": gate, "sandbox_server": server, "base": base}


def _clean_local_token(local: str, fallback: str = "Unnamed") -> str:
    """清洗ex:局部名，移除非法字符"""
    if not local:
        return fallback
    cleaned = _NS_KEEP_RE.sub("", local)
    if cleaned and cleaned[0].isdigit():
        cleaned = "_" + cleaned
    return cleaned or fallback


def _sanitize_ex_local_names_collision_safe(ttl: str) -> tuple[str, dict]:
    """仅清洗 ex:XXX token；重名则追加 _2/_3…；其它内容完全不动。

    Args:
        ttl: Turtle格式的RDF字符串

    Returns:
        tuple[str, dict]: 清洗后的TTL字符串和原名到新名的映射字典
    """
    originals = []
    for m in _EX_LOCAL_RE.finditer(ttl):
        originals.append(m.group(1))
    originals = list(dict.fromkeys(originals))  # 去重保持顺序

    used = set()
    mapping = {}
    for old in originals:
        base = _clean_local_token(old)
        new_name = base
        if new_name in used and new_name != old:
            i = 2
            while f"{base}_{i}" in used:
                i += 1
            new_name = f"{base}_{i}"
        used.add(new_name)
        mapping[old] = new_name

    def _repl(m: re.Match) -> str:
        old = m.group(1)
        return f"ex:{mapping.get(old, old)}"

    new_ttl = _EX_LOCAL_RE.sub(_repl, ttl)
    return new_ttl, mapping


def _extract_parse_error(e: Exception, content: str) -> dict:
    """尽量从异常中解析出行号、列号与上下文。最小侵入实现。

    支持两类常见 rdflib 解析错误：
    1) Turtle BadSyntax: 文本中包含 'at line N'
    2) XML 解析错误: 形如 '<unknown>:1:0: not well-formed'
    若只拿到行号，列号置 0。
    """
    msg = str(e) or ""
    line = None
    # 模式1: at line N
    m1 = re.search(r"at line (\d+)", msg)
    if m1:
        try:
            line = int(m1.group(1))
        except ValueError:
            line = None
    # 模式2: :line:col:
    m2 = re.search(r":(\d+):(\d+):", msg)
    if m2:
        try:
            line = int(m2.group(1))
        except ValueError:
            pass
    return {"line": line, "original_error": msg}


def _ttl_literal(text: Optional[str], lang: Optional[str] = None) -> str:
    """将任意字符串转成合法 Turtle 字面量

    Args:
        text: 要转换的文本
        lang: 可选的语言标签（如 'zh', 'en'）

    Returns:
        str: Turtle格式的字面量字符串
    """
    if text is None:
        text = ""
    t = str(text)
    if '\n' in t or '\r' in t or '"' in t:
        t = t.replace('"""', '\\"""')
        lit = f'"""{t}"""'
    else:
        lit = f'"{t}"'
    if lang:
        lit += f'@{lang}'
    return lit


# ==================================================================================
# Part 2: OWL/Turtle 导出（从MySQL数据库导出为OWL格式）
# ==================================================================================


async def _build_compact_markdown(
    ontology_name: Optional[str],
    ontology_label: Optional[str],
    object_rows: List[Dict],
    attrs_rows: List[Dict],
    link_rows: List[Dict],
    logic_rows: List[Dict],
    action_rows: List[Dict],
    logic_bind_rows: List[Dict],
    is_public:bool,
) -> Dict[str, Any]:
    """构建层级Markdown格式的本体定义
    
    格式示例:
    # 本体: sample (样例本体)
    
    ## 对象 (Objects)
    
    ### Customer (客户)
    描述: 客户描述
    - 主键: customer_id (客户ID)
    - 标题: customer_name (客户姓名)
    - 属性:
      - customer_id [string]: 客户自身的唯一标识
      - customer_name [string]: 客户姓名
    - 关系:
      - hasOrder → Order (拥有订单)
        关联: Customer.customer_id = Order.customer_id
    
    Returns:
        字典包含:
            - content: Markdown格式的本体定义字符串
            - stats: 统计信息字典
    """
    lines = []
    
    # 标题
    if ontology_name:
        title = f"# 本体: {ontology_name}"
        if ontology_label:
            title += f" ({ontology_label})"
        lines.append(title)
        lines.append("")
    
    # 构建对象索引
    obj_map = {obj["id"]: obj for obj in object_rows}
    
    # 按对象类型分组属性
    attrs_by_obj: Dict[str, List[Dict]] = {}
    for attr in attrs_rows:
        obj_id = attr.get("object_type_id")
        if obj_id:
            attrs_by_obj.setdefault(obj_id, []).append(attr)
    
    # 按对象类型分组关系
    links_by_obj: Dict[str, List[Dict]] = {}
    # print("打印link_rows")
    # print(link_rows)
    for link in link_rows:
        src_obj_id = link.get("source_object_type_id") or link.get("source_attr_object_type_id")
        if src_obj_id:
            links_by_obj.setdefault(src_obj_id, []).append(link)
    
    # 按对象类型分组action
    actions_by_obj: Dict[str, List[Dict]] = {}
    for action in action_rows:
        obj_id = action.get("object_type_id")
        if obj_id:
            actions_by_obj.setdefault(obj_id, []).append(action)
    
    # 按对象类型分组logic
    logics_by_obj: Dict[str, List[str]] = {}
    for bind in logic_bind_rows:
        obj_id = bind.get("object_type_id")
        logic_name = bind.get("logic_type_name")
        if obj_id and logic_name:
            logics_by_obj.setdefault(obj_id, []).append(logic_name)
    
    # 类型映射
    def _map_field_type(field_type: Optional[str]) -> str:
        if not field_type:
            return "string"
        ft = str(field_type).lower()
        if "string" in ft or "varchar" in ft or "text" in ft:
            return "string"
        elif "int" in ft:
            return "integer"
        elif "float" in ft or "double" in ft:
            return "double"
        elif "decimal" in ft:
            return "decimal"
        elif "bool" in ft:
            return "boolean"
        elif "date" in ft and "time" in ft:
            return "datetime"
        elif "date" in ft:
            return "date"
        elif "time" in ft:
            return "time"
        else:
            return "string"
    
    # Objects部分
    if object_rows:
        lines.append("## 对象 (Objects)")
        lines.append("")
        
        for obj in object_rows:
            if not is_public:
                obj_id = obj["id"]
            else:
                obj_id = obj["object_type_id"]
            obj_name = obj.get("object_type_name", "Unknown")
            obj_label = obj.get("object_type_label", "")
            obj_desc = obj.get("object_type_desc", "")
            
            # 对象标题 - 使用三级标题
            header = f"### {obj_name}"
            if obj_label:
                header += f" ({obj_label})"
            lines.append(header)
            
            # 对象描述
            if obj_desc:
                lines.append(f"描述: {obj_desc}")
            
            # 获取属性
            obj_attrs = attrs_by_obj.get(obj_id, [])
            pk_attr = None
            pk_label = None
            title_attr = None
            title_label = None
            
            # 先找出主键和标题属性
            for attr in obj_attrs:
                if attr.get("is_primary_key") == 1:
                    pk_attr = attr.get("field_name") or attr.get("attribute_name", "")
                    pk_label = attr.get("attribute_name", "")
                if attr.get("is_title") == 1:
                    title_attr = attr.get("field_name") or attr.get("attribute_name", "")
                    title_label = attr.get("attribute_name", "")
            
            # 主键
            if pk_attr:
                lines.append(f"- 主键: {pk_attr}" + (f" ({pk_label})" if pk_label and pk_label != pk_attr else ""))
            
            # 标题字段
            if title_attr:
                lines.append(f"- 标题: {title_attr}" + (f" ({title_label})" if title_label and title_label != title_attr else ""))
            
            # 属性列表
            if obj_attrs:
                lines.append("- 属性:")
                for attr in obj_attrs:
                    field_name = attr.get("field_name") or attr.get("attribute_name", "")
                    attr_label = attr.get("attribute_name", "")  # 中文名
                    attr_desc = attr.get("attribute_desc", "")
                    field_type = _map_field_type(attr.get("field_type"))
                    
                    # 格式: field_name [type]: 描述
                    attr_line = f"  - {field_name}"
                    if attr_label and attr_label != field_name:
                        attr_line += f" ({attr_label})"
                    attr_line += f" [{field_type}]"
                    if attr_desc:
                        attr_line += f": {attr_desc}"
                    lines.append(attr_line)
            
            # 关系列表
            
            obj_links = links_by_obj.get(obj_id, [])
            # print("打印关系列表")
            # print(obj_links)
            if obj_links:
                lines.append("- 关系:")
                for link in obj_links:
                    # 获取关系名称（用作关系标签）
                    src_name = link.get("source_name", "")
                    src_label = link.get("source_label", "")
                    tgt_label = link.get("target_label", "")
                    
                    # 获取实际的对象名称 - 优先使用直接从对象类型表获取的名称
                    src_obj_name = (
                        link.get("source_direct_object_name") or 
                        link.get("source_attr_object_name") or 
                        obj_name
                    )
                    tgt_obj_name = (
                        link.get("target_direct_object_name") or 
                        link.get("target_attr_object_name") or 
                        "Unknown"
                    )
                    
                    # 获取对象标签
                    src_obj_label = link.get("source_direct_object_label", "")
                    tgt_obj_label = link.get("target_direct_object_label", "")
                    
                    # 获取属性名称
                    src_attr = link.get("source_attribute_name", "")
                    tgt_attr = link.get("target_attribute_name", "")
                    link_type = link.get("link_type")
                    
                    # 关系标签行 - 使用实际对象名称
                    relation_line = f"  - {src_obj_name}"
                    if src_obj_label and src_obj_label != src_obj_name:
                        relation_line += f" ({src_obj_label})"
                    relation_line += f" → {tgt_obj_name}"
                    if tgt_obj_label and tgt_obj_label != tgt_obj_name:
                        relation_line += f" ({tgt_obj_label})"
                    
                    # 如果有关系标签，添加关系说明
                    if src_label:
                        relation_line += f" [{src_label}]"
                    elif src_name:
                        relation_line += f" [{src_name}]"
                    
                    lines.append(relation_line)
                    
                    # 关联信息 - 使用实际对象名称
                    if src_attr and tgt_attr:
                        lines.append(f"    关联: {src_obj_name}.{src_attr} = {tgt_obj_name}.{tgt_attr}")
                    
                    # 如果是多对多关系，可以添加标记
                    if link_type == 2:
                        lines.append(f"    类型: 多对多关系")
                    elif link_type == 4:
                        lines.append(f"    类型: 语义关系")
            
            # 绑定的Actions
            obj_actions = actions_by_obj.get(obj_id, [])
            if obj_actions:
                lines.append("- 绑定动作:")
                for action in obj_actions:
                    action_name = action.get("action_name", "")
                    action_label = action.get("action_label", "")
                    if action_name:
                        action_line = f"  - {action_name}"
                        if action_label:
                            action_line += f" ({action_label})"
                        lines.append(action_line)
            
            # 绑定的Logics
            obj_logics = logics_by_obj.get(obj_id, [])
            if obj_logics:
                lines.append("- 绑定函数:")
                for logic_name in obj_logics:
                    lines.append(f"  - {logic_name}")
            
            lines.append("")
    
    # Logic Functions部分
    if logic_rows:
        lines.append("## 逻辑函数 (Logic Functions)")
        lines.append("")
        
        for logic in logic_rows:
            logic_name = logic.get("logic_type_name", "")
            logic_label = logic.get("logic_type_label", "")
            logic_desc = logic.get("logic_type_desc", "")
            
            # 函数标题
            header = f"### {logic_name}"
            if logic_label:
                header += f" ({logic_label})"
            lines.append(header)
            
            # 函数描述
            if logic_desc:
                lines.append(f"描述: {logic_desc}")
            
            # 解析参数
            sig_detail = logic.get("signature_detail")
            if sig_detail:
                try:
                    sig = json.loads(sig_detail) if isinstance(sig_detail, str) else sig_detail
                    if isinstance(sig, dict) and sig:
                        lines.append("- 参数:")
                        for pname, detail in sig.items():
                            if isinstance(detail, dict):
                                ptype = detail.get("type", "string")
                                is_required = detail.get("is_required", False)
                                pdesc = detail.get("desc", "")
                                
                                # 简化类型名
                                ptype_simple = ptype.replace("xsd:", "")
                                required_text = "必填" if is_required else "可选"
                                
                                param_line = f"  - {pname} [{ptype_simple}, {required_text}]"
                                if pdesc:
                                    param_line += f": {pdesc}"
                                lines.append(param_line)
                    else:
                        lines.append("- 参数: 无")
                except:
                    lines.append("- 参数: 无")
            else:
                lines.append("- 参数: 无")
            
            lines.append("")
    
    # Actions部分
    if action_rows:
        lines.append("## 行动 (Actions)")
        lines.append("")
        
        for action in action_rows:
            action_name = action.get("action_name", "")
            action_label = action.get("action_label", "")
            action_desc = action.get("action_desc", "")
            
            # Action标题
            header = f"### {action_name}"
            if action_label:
                header += f" ({action_label})"
            lines.append(header)
            
            # Action描述
            if action_desc:
                lines.append(f"描述: {action_desc}")
            
            # 解析参数
            sig_detail = action.get("signature_detail")
            input_param = action.get("intput_param")
            
            has_params = False
            if sig_detail:
                try:
                    sig = json.loads(sig_detail) if isinstance(sig_detail, str) else sig_detail
                    if isinstance(sig, dict) and sig:
                        lines.append("- 参数:")
                        has_params = True
                        for pname, detail in sig.items():
                            if isinstance(detail, dict):
                                ptype = detail.get("type", "string")
                                is_required = detail.get("is_required", False)
                                pdesc = detail.get("desc", "")
                                
                                ptype_simple = ptype.replace("xsd:", "")
                                required_text = "必填" if is_required else "可选"
                                
                                param_line = f"  - {pname} [{ptype_simple}, {required_text}]"
                                if pdesc:
                                    param_line += f": {pdesc}"
                                lines.append(param_line)
                except:
                    pass
            
            if not has_params and input_param:
                try:
                    params = json.loads(input_param) if isinstance(input_param, str) else input_param
                    if isinstance(params, list) and params:
                        lines.append("- 参数:")
                        has_params = True
                        for p in params:
                            if isinstance(p, dict):
                                pname = p.get("param_name", "")
                                ptype = p.get("param_type", "string")
                                is_required = p.get("param_required") == 1
                                pdesc = p.get("param_desc", "")
                                
                                ptype_simple = ptype.replace("xsd:", "")
                                required_text = "必填" if is_required else "可选"
                                
                                param_line = f"  - {pname} [{ptype_simple}, {required_text}]"
                                if pdesc:
                                    param_line += f": {pdesc}"
                                lines.append(param_line)
                except:
                    pass
            
            if not has_params:
                lines.append("- 参数: 无")
            
            lines.append("")
    
    # 构建统计信息
    stats = {
        "objects": len(object_rows),
        "attributes": len(attrs_rows),
        "relations": len(link_rows),
        "logic": len(logic_rows),
        "actions": len(action_rows),
        "interfaces": 0  # compact格式不包含接口
    }
    
    return {
        "content": "\n".join(lines),
        "stats": stats
    }


async def export_ontology_to_owl(
    ontology_id: str,
    object_type_id: Optional[List[str]] = None,
    is_public:bool = True
) -> Tuple[str, Dict[str, int]]:
    """导出指定 ontology_id 的结构为 OWL (Turtle 语法) 字符串
    
    Returns:
        元组包含:
            - OWL内容字符串
            - 统计信息字典 (objects, attributes, relations, logic, actions, interfaces)
    """

    # 记录当前请求的发布状态
    status_text = "发布状态" if is_public else "非发布状态"
    logger.info(f"导出本体到OWL - ontology_id: {ontology_id}, 状态: {status_text}")

    # mysql = create_mysql_service()
    # if mysql is None:
    #     raise RuntimeError("MySQL service not configured")
    if not is_public:
        mysql = await create_mysql_service()
        if object_type_id is None:
            object_rows = await mysql.afetch_all(
                """
                SELECT id, object_type_name, object_type_label, object_type_desc
                FROM ontology_object_type
                WHERE ontology_id = %s AND sync_status < 3 AND status <> 0

                ORDER BY id
                """,
                (str(ontology_id),),
            )
        else:
            sel_ids: List[str] = [str(x) for x in object_type_id]
            in_clause = ",".join(["%s"] * len(sel_ids))
            # 读取对象类型
            object_rows = await mysql.afetch_all(
                f"""
                SELECT id, object_type_name, object_type_label, object_type_desc
                FROM ontology_object_type
                WHERE ontology_id = %s AND sync_status < 3 AND status <> 0
                AND id IN ({in_clause})
                ORDER BY object_type_name
                """,
                (str(ontology_id), *sel_ids),
            )

        object_ids = [r["id"] for r in object_rows]
        allowed_object_ids = set(object_ids)

        # 如果有 object_type_id 限制，需要自动补充相关的中间对象
        if object_type_id and object_ids:
            # 查询涉及选中对象的多对多关系（link_type = 2）
            sel_ids_for_middle = [str(x) for x in object_ids]
            in_clause_middle = ",".join(["%s"] * len(sel_ids_for_middle))
            
            # 找出所有涉及选中对象的多对多关系
            many_to_many_links = await mysql.afetch_all(
                f"""
                SELECT DISTINCT id
                FROM ontology_link_type
                WHERE ontology_id = %s 
                AND sync_status < 3
                AND status <> 0
                AND link_type = 2
                AND (source_object_type_id IN ({in_clause_middle})
                    OR target_object_type_id IN ({in_clause_middle}))
                """,
                (str(ontology_id), *sel_ids_for_middle, *sel_ids_for_middle),
            )
            
            many_to_many_link_ids = [link["id"] for link in many_to_many_links]
            
            # 查询这些多对多关系对应的中间对象
            if many_to_many_link_ids:
                middle_objects = await mysql.afetch_all(
                    f"""
                    SELECT id, object_type_name, object_type_label, object_type_desc
                    FROM ontology_object_type
                    WHERE ontology_id = %s 
                    AND sync_status < 3 
                    AND status <> 0
                    AND link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                    """,
                    (str(ontology_id), *many_to_many_link_ids),
                )
                
                # 将中间对象补充到 object_rows 和 allowed_object_ids
                for middle_obj in middle_objects:
                    if middle_obj["id"] not in allowed_object_ids:
                        object_rows.append(middle_obj)
                        object_ids.append(middle_obj["id"])
                        allowed_object_ids.add(middle_obj["id"])

        # 读取属性表
        attrs_rows: List[Dict] = []
        if object_ids:
            attrs_rows = await mysql.afetch_all(
                f"""
                SELECT object_type_id, field_name, attribute_desc, attribute_name, attribute_label, is_primary_key, is_title, id, field_type
                FROM ontology_object_type_attribute
                WHERE object_type_id IN ({','.join(['%s']*len(object_ids))}) AND sync_status < 3 AND status > 0
                ORDER BY field_name
                """,
                tuple(object_ids),
            )
        if object_type_id:
            # 读取关联表（通过端点属性找到其所属对象，取对象英文名作为 domain/range）
            link_rows = await mysql.afetch_all(
                f"""
                SELECT
                lt.id,
                lt.source_name,
                lt.source_label,
                lt.target_name,
                lt.target_label,
                lt.link_type,
                sattr.attribute_name AS source_attribute_name,
                sattr.attribute_label AS source_attribute_label,
                tattr.attribute_name AS target_attribute_name,
                tattr.attribute_label AS target_attribute_label,
                lt.source_attribute_id,
                lt.target_attribute_id,
                lt.source_object_type_id,
                lt.target_object_type_id,
                sattr.object_type_id AS source_attr_object_type_id,
                tattr.object_type_id AS target_attr_object_type_id,
                sobj.object_type_name AS source_attr_object_name,
                tobj.object_type_name AS target_attr_object_name,
                src_direct.object_type_name AS source_direct_object_name,
                src_direct.object_type_label AS source_direct_object_label,
                tgt_direct.object_type_name AS target_direct_object_name,
                tgt_direct.object_type_label AS target_direct_object_label
                FROM ontology_link_type lt
                LEFT JOIN ontology_object_type_attribute sattr ON sattr.id = lt.source_attribute_id AND sattr.sync_status < 3
                LEFT JOIN ontology_object_type sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                LEFT JOIN ontology_object_type_attribute tattr ON tattr.id = lt.target_attribute_id AND tattr.sync_status < 3
                LEFT JOIN ontology_object_type tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                LEFT JOIN ontology_object_type src_direct ON src_direct.id = lt.source_object_type_id AND src_direct.sync_status < 3
                LEFT JOIN ontology_object_type tgt_direct ON tgt_direct.id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                AND (
                    lt.source_object_type_id IN ({in_clause})
                OR lt.target_object_type_id IN ({in_clause})
                )
                ORDER BY lt.source_name, lt.target_name
                """,
                (str(ontology_id), *sel_ids, *sel_ids),
            )
        else:
            link_rows = await mysql.afetch_all(
                """
                SELECT
                lt.id,
                lt.source_name,
                lt.source_label,
                lt.target_name,
                lt.target_label,
                lt.link_type,
                sattr.attribute_name AS source_attribute_name,
                sattr.attribute_label AS source_attribute_label,
                tattr.attribute_name AS target_attribute_name,
                tattr.attribute_label AS target_attribute_label,
                lt.source_attribute_id,
                lt.target_attribute_id,
                lt.source_object_type_id,
                lt.target_object_type_id,
                sattr.object_type_id AS source_attr_object_type_id,
                tattr.object_type_id AS target_attr_object_type_id,
                sobj.object_type_name AS source_attr_object_name,
                tobj.object_type_name AS target_attr_object_name,
                src_direct.object_type_name AS source_direct_object_name,
                src_direct.object_type_label AS source_direct_object_label,
                tgt_direct.object_type_name AS target_direct_object_name,
                tgt_direct.object_type_label AS target_direct_object_label
                FROM ontology_link_type lt
                LEFT JOIN ontology_object_type_attribute sattr ON sattr.id = lt.source_attribute_id AND sattr.sync_status < 3
                LEFT JOIN ontology_object_type sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                LEFT JOIN ontology_object_type_attribute tattr ON tattr.id = lt.target_attribute_id AND tattr.sync_status < 3
                LEFT JOIN ontology_object_type tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                LEFT JOIN ontology_object_type src_direct ON src_direct.id = lt.source_object_type_id AND src_direct.sync_status < 3
                LEFT JOIN ontology_object_type tgt_direct ON tgt_direct.id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                ORDER BY lt.source_name, lt.target_name
                """,
                (str(ontology_id),),
            )
        # 过滤掉涉及被排除对象类型（status == 0）的关系
        if not allowed_object_ids:
            link_rows = []
        else:
            _filtered_links = []
            for lr in link_rows:
                src_ot = lr.get("source_object_type_id") or lr.get("source_attr_object_type_id")
                tgt_ot = lr.get("target_object_type_id") or lr.get("target_attr_object_type_id")
                if src_ot in allowed_object_ids and tgt_ot in allowed_object_ids:
                    _filtered_links.append(lr)
            link_rows = _filtered_links
        
        # 查询多对多关系的中间对象
        middle_object_by_link: Dict[str, Optional[str]] = {}
        if link_rows:
            # 收集所有 link_type == 2 的 link_id
            many_to_many_link_ids = [lr["id"] for lr in link_rows if lr.get("link_type") == 2]
            if many_to_many_link_ids:
                # 查询这些 link 对应的中间对象
                middle_obj_rows = await mysql.afetch_all(
                    f"""
                    SELECT link_type_id, object_type_name
                    FROM ontology_object_type
                    WHERE link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                    AND sync_status < 3
                    AND status <> 0
                    """,
                    tuple(many_to_many_link_ids),
                )
                for mo in middle_obj_rows:
                    link_id = mo.get("link_type_id")
                    obj_name = mo.get("object_type_name")
                    if link_id and obj_name:
                        middle_object_by_link[str(link_id)] = obj_name
        
        # 读取每条连接对应的标签（含方向）
        link_tag_rows = await mysql.afetch_all(
            """
            SELECT
            ltt.link_type_id  AS link_id,
            ltt.link_direct   AS link_direct,
            t.tag_name        AS tag_name,
            t.tag_label       AS tag_label,
            t.tag_desc        AS tag_desc
            FROM ontology_link_type_tag ltt
            JOIN ontology_tag t ON t.id = ltt.tag_id
            JOIN ontology_link_type lt ON lt.id = ltt.link_type_id
            WHERE lt.ontology_id = %s
            AND lt.sync_status < 3
            AND t.sync_status < 3
            ORDER BY ltt.link_type_id
            """,
            (str(ontology_id),),
        )

        # 组装：每个 link_id -> [tags]
        tags_by_link: Dict[str, List[Dict]] = {}
        for r in link_tag_rows:
            tags_by_link.setdefault(r["link_id"], []).append(r)

        # 读取标签表（如果有）
        tag_rows = await mysql.afetch_all(
            """
            SELECT DISTINCT t.tag_name, t.tag_label, t.tag_desc
            FROM ontology_tag t
            JOIN ontology_link_type_tag ltt ON t.id = ltt.tag_id
            JOIN ontology_link_type lt ON ltt.link_type_id = lt.id
            WHERE lt.ontology_id = %s
            AND lt.sync_status < 3
            AND t.sync_status < 3
            ORDER BY t.tag_name
            """,
            (str(ontology_id),),
        )

        # 读取函数定义（仅导出待同步或已新建/修改的函数，且为 function 或 api 类型）
        logic_rows = await mysql.afetch_all(
            """
            SELECT
            id,
            logic_type_name,
            logic_type_label,
            logic_type_desc,
            signature_detail,
            intput_param,
            output_param,
            build_type,
            api_id
            FROM ontology_logic_type
            WHERE ontology_id = %s
            AND sync_status <= 2
            AND status <> 0
            AND build_type IN ('function', 'api')
            ORDER BY logic_type_name
            """,
            (str(ontology_id),),
        )
        
        # 收集所有有效的逻辑ID，用于后续过滤绑定关系
        valid_logic_ids = set(str(row["id"]) for row in logic_rows) if logic_rows else set()

        # 读取本体名称（ontology_manage.ontology_name）
        ontology_name = None
        try:
            ontology_row = await mysql.afetch_one(
                """
                SELECT ontology_name, ontology_label
                FROM ontology_manage
                WHERE id = %s
                """,
                (str(ontology_id),),
            )
            if ontology_row:
                ontology_name = ontology_row.get("ontology_name")
                ontology_label = ontology_row.get("ontology_label")
        except Exception:
            # 忽略异常，不影响导出主流程
            ontology_name = None
            ontology_label = None

        # ================= 构造输出 =================
        lines: List[str] = [
            "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
            "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
            "@prefix owl: <http://www.w3.org/2002/07/owl#> .",
            "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
            "@prefix prov: <http://www.w3.org/ns/prov#> .",
            "@prefix dcterms: <http://purl.org/dc/terms/> .",
            "@prefix ex: <http://asiainfo.com/example-owl#> .",
            "",
            "##################################",
            "# 基础抽象类与通用语义（禁止变动）",
            "##################################",
            'ex:Entity a owl:Class ; rdfs:subClassOf prov:Entity ; rdfs:label "实体"@zh .',
            'ex:Object a owl:Class ; rdfs:subClassOf ex:Entity ; rdfs:label "本体对象"@zh .',
            'ex:Action a owl:Class ; rdfs:subClassOf prov:Activity ; rdfs:label "行动"@zh .',
            'ex:Logic a owl:Class ; rdfs:subClassOf prov:Activity ; rdfs:label "决策/逻辑函数"@zh .',
            'ex:hasPrimaryKey a owl:AnnotationProperty ; rdfs:label "主键属性"@zh ; rdfs:comment "在类级别声明该对象的主键数据属性"@zh .',
            'ex:hasTitle a owl:AnnotationProperty ; rdfs:label "标题属性"@zh ; rdfs:comment "在类级别声明该对象的标题数据属性"@zh .',
            'ex:bindAction a owl:ObjectProperty ; rdfs:label "本体对象关联行动"@zh ; rdfs:domain ex:Object ; rdfs:range ex:Action .',
            'ex:bindLogic a owl:ObjectProperty ; rdfs:label "本体对象关联函数"@zh ; rdfs:domain ex:Object ; rdfs:range ex:Logic .',
            'ex:custom_relation a owl:ObjectProperty ; rdfs:label "自定义对象与对象之间的关系"@zh .',
            # === 函数与参数相关基础定义 ===
            'ex:Parameter a owl:Class ; rdfs:label "函数参数"@zh .',
            'ex:hasParameter a owl:ObjectProperty ; rdfs:label "有参数"@zh ; rdfs:domain ex:Logic ; rdfs:range ex:Parameter .',
            # 'ex:expectedOutputDescription a owl:DatatypeProperty ; rdfs:label "期望输出描述"@zh ; rdfs:domain ex:Logic ; rdfs:range xsd:string .',
            'ex:paramName a owl:DatatypeProperty ; rdfs:label "参数名"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:paramType a owl:DatatypeProperty ; rdfs:label "参数类型"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:paramTypeNode a owl:ObjectProperty ; rdfs:label "参数类型节点"@zh ; rdfs:domain ex:Parameter .',
            'ex:ListType a owl:Class ; rdfs:label "列表类型"@zh .',
            'ex:DictType a owl:Class ; rdfs:label "字典类型"@zh .',
            'ex:itemType a owl:DatatypeProperty ; rdfs:label "元素类型"@zh .',
            'ex:keyType a owl:DatatypeProperty ; rdfs:label "键类型"@zh .',
            'ex:valueType a owl:DatatypeProperty ; rdfs:label "值类型"@zh .',
            # 'ex:paramDescription a owl:DatatypeProperty ; rdfs:label "参数描述"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:isOptional a owl:DatatypeProperty ; rdfs:label "是否可选"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:boolean .',
            'ex:defaultValue a owl:DatatypeProperty ; rdfs:label "默认值"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:ontologyName a owl:Class ; rdfs:label "本体名称"@zh .',
            'ex:domainAttribute a owl:AnnotationProperty ; rdfs:label "域属性"@zh ; rdfs:comment "指定对象属性的域端使用哪个数据属性建立关联"@zh .',
            'ex:rangeAttribute a owl:AnnotationProperty ; rdfs:label "值域属性"@zh ; rdfs:comment "指定对象属性的值域端使用哪个数据属性建立关联"@zh .',
            'ex:relationLabel a owl:AnnotationProperty ; rdfs:label "关系标签"@zh ; rdfs:comment "表示关系的语义标签名称（如hasOrder、isPartOf等），用于标识关系类型"@zh .',
            'ex:hasMiddleObject a owl:ObjectProperty ; rdfs:label "中间对象"@zh ; rdfs:comment "用来描述多对多关系的情况下，两个对象所使用到的中间对象"@zh .',
        ]

        # ======== 本体名称定义（位于可用函数定义之前） ========
        if ontology_name:
            on_local = _clean_local_token(str(ontology_name), "OntologyName")
            lines.extend([
                "##################################",
                "# 本体名称",
                "##################################",
                f"ex:{on_local} a ex:ontologyName ;",
                f"  rdfs:label {_ttl_literal(ontology_label, 'zh')} .",
                "",
            ])

        # ============ 可用函数定义（来自 ontology_logic_type） ============
        def _parse_params(raw: Optional[Any]) -> List[Dict[str, Any]]:
            params: List[Dict[str, Any]] = []
            if raw is None or raw == "":
                return params

            def _map_type(t: Any) -> str:
                if t is None:
                    return "xsd:string"
                v = str(t).strip()
                v_low = v.lower()
                if v.startswith("xsd:"):
                    return v
                mapping = {
                    "str": "xsd:string",
                    "string": "xsd:string",
                    "int": "xsd:integer",
                    "integer": "xsd:integer",
                    "float": "xsd:double",
                    "double": "xsd:double",
                    "decimal": "xsd:decimal",
                    "bool": "xsd:boolean",
                    "boolean": "xsd:boolean",
                }
                return mapping.get(v_low, v)

            def _parse_collection_type(t: Any) -> Optional[Dict[str, Any]]:
                if t is None:
                    return None
                s = str(t).strip()
                if not s:
                    return None
                low = s.lower()
                # list or list[elem]
                if low.startswith("list"):
                    m = re.match(r"^list\s*(?:\[(.+)\])?$", low)
                    item = None
                    if m:
                        inner = m.group(1)
                        if inner:
                            item = _map_type(inner.strip())
                    return {"kind": "ListType", "itemType": item}
                # dict or dict[key,val]
                if low.startswith("dict"):
                    m = re.match(
                        r"^dict\s*(?:\[([^,\]]+)\s*,\s*([^\]]+)\])?$", low)
                    k = v = None
                    if m:
                        kraw = m.group(1)
                        vraw = m.group(2)
                        if kraw:
                            k = _map_type(kraw.strip())
                        if vraw:
                            v = _map_type(vraw.strip())
                    return {"kind": "DictType", "keyType": k, "valueType": v}
                return None

            def _build_type_hint(node: Dict[str, Any]) -> str:
                if not node:
                    return ""
                kind = node.get("kind")
                if kind == "ListType":
                    item = node.get("itemType")
                    return f"list[{item}]" if item else "list"
                if kind == "DictType":
                    kt = node.get("keyType")
                    vt = node.get("valueType")
                    if kt and vt:
                        return f"dict[{kt},{vt}]"
                    return "dict"
                return ""

            data: Any = None
            # 优先处理原生对象
            if isinstance(raw, (dict, list)):
                data = raw
            else:
                s = str(raw).strip()
                # 尝试 JSON
                try:
                    data = json.loads(s)
                except Exception:
                    data = None

            if data is not None:
                # 0) 新格式 signature_detail：{"p": {"type": "int", "is_required": true, "desc": "..."}}
                if isinstance(data, dict) and any(isinstance(v, dict) for v in data.values()):
                    for k, v in data.items():
                        if not isinstance(v, dict):
                            continue
                        name = str(k).strip()
                        if not name:
                            continue
                        # 支持集合类型
                        ct = _parse_collection_type(v.get("type"))
                        if ct:
                            ptype = _build_type_hint(ct)
                            params.append({
                                "name": name,
                                "type": ptype,
                                "type_node": ct,
                                "optional": (not bool(v.get("is_required", False))),
                                "default": None,
                            })
                            continue
                        ptype = _map_type(v.get("type"))
                        is_required = bool(v.get("is_required", False))
                        params.append({
                            "name": name,
                            "type": ptype,
                            "optional": (not is_required),
                            "default": None,
                        })
                    return params

                # 1) 旧格式：dict 映射格式：{"name":"str", ...}
                if isinstance(data, dict) and "parameters" not in data:
                    for k, v in data.items():
                        name = str(k).strip()
                        if not name:
                            continue
                        ptype = _map_type(v)
                        params.append({
                            "name": name,
                            "type": ptype,
                            "optional": False,
                            "default": None,
                        })
                    return params

                # 2) 结构化列表/对象格式：[{name,type,isOptional,default}] 或 {parameters:[...]}
                items = data.get("parameters") if isinstance(data, dict) else data
                items = items if isinstance(items, list) else []
                for it in items:
                    if not isinstance(it, dict):
                        continue
                    name = it.get("name") or it.get("paramName") or it.get("key")
                    ptype = it.get("type") or it.get(
                        "paramType") or it.get("datatype")
                    optional = it.get("optional") if it.get(
                        "optional") is not None else it.get("isOptional")
                    default = it.get("default") if it.get("default") not in (
                        None, "") else it.get("defaultValue")
                    if name:
                        # 强制转换 optional 为布尔
                        if isinstance(optional, str):
                            opt_bool = optional.strip().lower() in ("true", "1", "yes", "y")
                        else:
                            opt_bool = bool(
                                optional) if optional is not None else False
                        params.append({
                            "name": str(name),
                            "type": str(_map_type(ptype)) if ptype else "xsd:string",
                            "optional": opt_bool,
                            "default": default,
                        })
                return params

            # 非 JSON：尝试逗号分隔的 "name:type"，可选用 ?，默认值用 =
            # 例："prod_inst_id:xsd:string, used_stra_ids:xsd:string?=\"1,2\""
            try:
                s2 = str(raw).strip()
                items = [t.strip() for t in re.split(r"[,\n]", s2) if t.strip()]
                for token in items:
                    default_val = None
                    if "=" in token:
                        token, default_val = token.split("=", 1)
                        default_val = default_val.strip().strip('"')
                    optional = token.endswith("?")
                    token = token[:-1] if optional else token
                    name, ptype = (token.split(":", 1) + ["xsd:string"])[:2]
                    params.append({
                        "name": name.strip(),
                        "type": ptype.strip() or "xsd:string",
                        "optional": optional,
                        "default": default_val,
                    })
            except Exception:
                return params
            return params

        if logic_rows:
            lines.extend([
                "##################################",
                "# 可用函数",
                "##################################",
            ])
            for f in logic_rows:
                fname_raw = f.get("logic_type_name") or "UnnamedFunction"
                fname = _clean_local_token(str(fname_raw), "UnnamedFunction")
                flabel = f.get("logic_type_label") or fname_raw
                fdesc = (f.get("logic_type_desc") or "")
                build_type = f.get("build_type") or "function"
                # output_desc = (f.get("output_param") or "").strip()
                
                # 根据 build_type 获取参数
                params = []
                if build_type == "api":
                    # 从 ontology_api_param 表中查询参数
                    api_id = f.get("api_id")
                    if api_id:
                        api_param_rows = await mysql.afetch_all(
                            """
                            SELECT
                            param_name,
                            param_type,
                            param_method,
                            param_mode,
                            param_desc,
                            is_required,
                            default_value
                            FROM ontology_api_param
                            WHERE api_id = %s
                            AND param_mode = 'request'
                            ORDER BY param_name
                            """,
                            (str(api_id),),
                        )
                        # 将 API 参数转换为统一的参数格式
                        for ap in api_param_rows:
                            param_type = ap.get("param_type") or "string"
                            # 映射参数类型到 xsd 类型
                            type_mapping = {
                                "string": "xsd:string",
                                "integer": "xsd:integer",
                                "number": "xsd:double",
                                "boolean": "xsd:boolean",
                            }
                            xsd_type = type_mapping.get(param_type.lower(), "xsd:string")
                            is_required = ap.get("is_required") == "1"
                            params.append({
                                "name": ap.get("param_name"),
                                "type": xsd_type,
                                "optional": not is_required,
                                "default": ap.get("default_value"),
                            })
                else:
                    # 对于 function 类型，优先使用 signature_detail；如无则回退到 intput_param
                    params = _parse_params(
                        f.get("signature_detail") or f.get("intput_param"))

                # 与 csat 风格一致：函数个体 + 参数
                lines.append(f"ex:{fname} a ex:Logic ;")
                lines.append(f"  rdfs:label {_ttl_literal(flabel, 'zh')} ;")
                if fdesc:
                    lines.append(f"  rdfs:comment {_ttl_literal(fdesc, 'zh')} ;")
                # if output_desc:
                #     lines.append(f"  ex:expectedOutputDescription {_ttl_literal(output_desc, 'zh')} ;")
                if params:
                    # 组装参数空白节点，支持集合类型
                    bnodes: List[str] = []
                    for p in params:
                        p_name = p.get("name") or "param"
                        p_type = p.get("type") or "xsd:string"
                        # 可能为 ListType/DictType 描述
                        p_type_node = p.get("type_node")
                        p_opt = "true" if p.get("optional") else "false"
                        default = p.get("default")
                        parts = [
                            "a ex:Parameter",
                            f"ex:paramName {_ttl_literal(str(p_name))}",
                            f"ex:paramType {_ttl_literal(str(p_type))}",
                            f"ex:isOptional {p_opt}",
                        ]
                        if default not in (None, ""):
                            parts.append(
                                f"ex:defaultValue {_ttl_literal(str(default))}")
                        if isinstance(p_type_node, dict):
                            if p_type_node.get("kind") == "ListType":
                                item_type = p_type_node.get("itemType")
                                type_node_parts = ["a ex:ListType"]
                                if item_type:
                                    type_node_parts.append(
                                        f"ex:itemType {_ttl_literal(str(item_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                            elif p_type_node.get("kind") == "DictType":
                                key_type = p_type_node.get("keyType")
                                value_type = p_type_node.get("valueType")
                                type_node_parts = ["a ex:DictType"]
                                if key_type:
                                    type_node_parts.append(
                                        f"ex:keyType {_ttl_literal(str(key_type))}")
                                if value_type:
                                    type_node_parts.append(
                                        f"ex:valueType {_ttl_literal(str(value_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                        bnodes.append("[ " + " ; ".join(parts) + " ]")
                    lines.append(f"  ex:hasParameter {', '.join(bnodes)} .\n")
                else:
                    # 无参数，直接收尾
                    # 将最后一个分号替换为句点
                    if lines[-1].endswith(";"):
                        lines[-1] = lines[-1][:-1] + " .\n"

        # ============ 可用action定义 ============
        # 读取 action 定义（根据 ontology_id 和 sync_status <= 2）
        action_rows = await mysql.afetch_all(
            """
            SELECT
            id,
            object_type_id,
            action_name,
            action_label,
            action_desc,
            build_type,
            signature_detail,
            intput_param
            FROM ontology_object_type_action
            WHERE ontology_id = %s
            AND sync_status <= 2
            AND status <> 0
            ORDER BY action_name
            """,
            (str(ontology_id),),
        )

        if action_rows:
            lines.extend([
                "##################################",
                "# Action动作定义",
                "##################################",
            ])

            # 为每个action处理参数
            for action in action_rows:
                action_id = action.get("id")
                action_name_raw = action.get("action_name") or "UnnamedAction"
                action_name = _clean_local_token(
                    str(action_name_raw), "UnnamedAction")
                action_label = action.get("action_label") or action_name_raw
                action_desc = action.get("action_desc") or ""
                build_type = action.get("build_type") or "object"

                # 获取关联的对象类型名称
                object_type_id = action.get("object_type_id")
                obj_type_name = None
                if object_type_id:
                    obj_row = next(
                        (o for o in object_rows if o["id"] == object_type_id), None)
                    if obj_row:
                        obj_type_name = obj_row["object_type_name"]

                # 开始定义 Action
                lines.append(f"ex:{action_name} a ex:Action ;")
                lines.append(f"  rdfs:label {_ttl_literal(action_label, 'zh')} ;")
                if action_desc:
                    lines.append(
                        f"  rdfs:comment {_ttl_literal(action_desc, 'zh')} ;")

                # 处理参数
                params = []

                if build_type == "function":
                    # 优先使用 signature_detail 字段；若不存在则回退到 intput_param
                    sig_raw = action.get("signature_detail")
                    parsed = False
                    if sig_raw:
                        try:
                            sig = json.loads(str(sig_raw)) if isinstance(
                                sig_raw, str) else sig_raw
                            if isinstance(sig, dict):
                                # 解析集合类型（list/dict 或带括号形式）
                                def _map_action_type(t: Any) -> str:
                                    if t is None:
                                        return "xsd:string"
                                    v = str(t).strip()
                                    if v.startswith("xsd:"):
                                        return v
                                    low = v.lower()
                                    mapping = {
                                        "str": "xsd:string",
                                        "string": "xsd:string",
                                        "int": "xsd:integer",
                                        "integer": "xsd:integer",
                                        "float": "xsd:double",
                                        "double": "xsd:double",
                                        "decimal": "xsd:decimal",
                                        "bool": "xsd:boolean",
                                        "boolean": "xsd:boolean",
                                    }
                                    return mapping.get(low, v)

                                def _parse_col(t: Any) -> Optional[Dict[str, Any]]:
                                    if t is None:
                                        return None
                                    s = str(t).strip()
                                    low = s.lower()
                                    if low.startswith("list"):
                                        m = re.match(
                                            r"^list\s*(?:\[(.+)\])?$", low)
                                        item = None
                                        if m:
                                            inner = m.group(1)
                                            if inner:
                                                item = _map_action_type(
                                                    inner.strip())
                                        return {"kind": "ListType", "itemType": item}
                                    if low.startswith("dict"):
                                        m = re.match(
                                            r"^dict\s*(?:\[([^,\]]+)\s*,\s*([^\]]+)\])?$", low)
                                        kt = vt = None
                                        if m:
                                            kr = m.group(1)
                                            vr = m.group(2)
                                            if kr:
                                                kt = _map_action_type(kr.strip())
                                            if vr:
                                                vt = _map_action_type(vr.strip())
                                        return {"kind": "DictType", "keyType": kt, "valueType": vt}
                                    return None

                                def _hint(n: Dict[str, Any]) -> str:
                                    if not n:
                                        return ""
                                    if n.get("kind") == "ListType":
                                        it = n.get("itemType")
                                        return f"list[{it}]" if it else "list"
                                    if n.get("kind") == "DictType":
                                        kt = n.get("keyType")
                                        vt = n.get("valueType")
                                        if kt and vt:
                                            return f"dict[{kt},{vt}]"
                                        return "dict"
                                    return ""

                                for pname, detail in sig.items():
                                    if not isinstance(detail, dict):
                                        continue
                                    col = _parse_col(detail.get("type"))
                                    is_required = bool(
                                        detail.get("is_required", False))
                                    desc = detail.get("desc") or ""
                                    if col:
                                        params.append({
                                            "name": pname,
                                            "type": _hint(col),
                                            "type_node": col,
                                            "description": desc,
                                            "is_optional": (not is_required),
                                        })
                                    else:
                                        ptype = _map_action_type(
                                            detail.get("type"))
                                        params.append({
                                            "name": pname,
                                            "type": ptype,
                                            "description": desc,
                                            "is_optional": (not is_required),
                                        })
                                parsed = True
                        except Exception:
                            parsed = False

                    if not parsed:
                        # 回退：使用 intput_param（旧格式）
                        input_param = action.get("intput_param")
                        if input_param:
                            try:
                                param_data = json.loads(str(input_param)) if isinstance(
                                    input_param, str) else input_param
                                if isinstance(param_data, dict):
                                    # Skip first element（历史结构特殊处理）
                                    param_items = list(param_data.items())[1:]
                                    for param_key, param_value in param_items:
                                        params.append({
                                            "name": param_key,
                                            "type": param_value if param_value else "xsd:string",
                                            "description": param_key,
                                            "is_optional": False
                                        })
                            except Exception:
                                pass

                elif build_type == "object":
                    # 从 ontology_object_type_action_param 表读取参数
                    param_rows = await mysql.afetch_all(
                        """
                        SELECT
                        ootap.param_name,
                        ootap.param_required,
                        ootap.param_value,
                        oota.attribute_name,
                        oota.field_type
                        FROM ontology_object_type_action_param ootap
                        LEFT JOIN ontology_object_type_attribute oota
                        ON ootap.attribute_id = oota.id
                        WHERE ootap.action_id = %s
                        ORDER BY ootap.param_name
                        """,
                        (str(action_id),),
                    )

                    for pr in param_rows:
                        param_name = pr.get(
                            "attribute_name") or "unknown_param_name"
                        field_type = pr.get("field_type") or "string"
                        param_required = pr.get("param_required", 1)
                        param_value = pr.get("param_value")

                        params.append({
                            "name": param_name,
                            "type": f"xsd:{field_type}",
                            "description": param_name,
                            "is_optional": (param_required != 1)
                        })

                # 输出参数
                if params:
                    bnodes = []
                    for p in params:
                        p_name = p.get("name", "")
                        p_type = p.get("type", "xsd:string")
                        p_desc = p.get("description", "")
                        p_opt = "true" if p.get("is_optional", False) else "false"
                        p_type_node = p.get("type_node")

                        parts = [
                            "a ex:Parameter",
                            f"ex:paramName {_ttl_literal(str(p_name))}",
                            f"ex:paramType {_ttl_literal(str(p_type))}",
                        ]
                        # if p_desc:
                        #     parts.append(f"ex:paramDescription {_ttl_literal(str(p_desc), 'zh')}")
                        parts.append(f"ex:isOptional {p_opt}")
                        if isinstance(p_type_node, dict):
                            if p_type_node.get("kind") == "ListType":
                                item_type = p_type_node.get("itemType")
                                type_node_parts = ["a ex:ListType"]
                                if item_type:
                                    type_node_parts.append(
                                        f"ex:itemType {_ttl_literal(str(item_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                            elif p_type_node.get("kind") == "DictType":
                                key_type = p_type_node.get("keyType")
                                value_type = p_type_node.get("valueType")
                                type_node_parts = ["a ex:DictType"]
                                if key_type:
                                    type_node_parts.append(
                                        f"ex:keyType {_ttl_literal(str(key_type))}")
                                if value_type:
                                    type_node_parts.append(
                                        f"ex:valueType {_ttl_literal(str(value_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")

                        bnodes.append("[ " + " ; ".join(parts) + " ]")

                    if bnodes:
                        lines.append(
                            f"  ex:hasParameter {' ,\n                    '.join(bnodes)} .")
                    else:
                        # 将最后的分号改为句点
                        if lines[-1].endswith(";"):
                            lines[-1] = lines[-1][:-1] + " ."
                else:
                    # 没有参数,将最后的分号改为句点
                    if lines[-1].endswith(";"):
                        lines[-1] = lines[-1][:-1] + " ."

                lines.append("")

                # 添加对象与 Action 的绑定关系
                if obj_type_name:
                    lines.append(
                        f"ex:{obj_type_name} ex:bindAction ex:{action_name} .")
                    lines.append("")

        # ============ 逻辑函数关联关系（BindLogic） ============
        # 查询 logic_type <-> object_type 关联表
        logic_bind_rows = await mysql.afetch_all(
            """
            SELECT
            lto.logic_type_id,
            lto.object_type_id,
            lt.logic_type_name,
            ot.object_type_name
            FROM ontology_logic_type_object lto
            JOIN ontology_logic_type lt ON lt.id = lto.logic_type_id
            JOIN ontology_object_type ot ON ot.id = lto.object_type_id
            WHERE lto.ontology_id = %s
            AND lt.sync_status <= 2
            AND ot.sync_status < 3
            """,
            (str(ontology_id),),
        )
        
        # 过滤：只保留逻辑ID在有效逻辑列表中的绑定关系
        if logic_bind_rows:
            if valid_logic_ids:
                logic_bind_rows = [
                    row for row in logic_bind_rows 
                    if str(row.get("logic_type_id")) in valid_logic_ids
                ]
            else:
                # 如果没有有效逻辑，清空所有绑定关系
                logic_bind_rows = []

        if logic_bind_rows:
            lines.extend([
                "##################################",
                "# 逻辑函数关联定义 (bindLogic)",
                "##################################",
            ])
            # 去重集合 (object_name, logic_name)
            seen_logic_binds = set()
            for row in logic_bind_rows:
                l_name_raw = row.get("logic_type_name")
                o_name_raw = row.get("object_type_name")
                if not l_name_raw or not o_name_raw:
                    continue

                l_name = _clean_local_token(str(l_name_raw), "UnnamedFunction")
                o_name = _clean_local_token(str(o_name_raw), "UnnamedObject")

                key = (o_name, l_name)
                if key in seen_logic_binds:
                    continue
                seen_logic_binds.add(key)

                lines.append(f"ex:{o_name} ex:bindLogic ex:{l_name} .")
            
            lines.append("")

        # ============ 对象定义部分 ============
        lines.extend([
            "##################################",
            "# 对象定义(必须继承ex:Object)",
            "##################################",
        ])
        # 预先为每个对象收集主键/标题属性（按新规范：类级别）
        pk_attr_by_object: Dict[str, Optional[str]] = {}
        title_attr_by_object: Dict[str, Optional[str]] = {}
        # 首先按DB中标记推断（一个对象只能有一个主键/标题）
        for obj in object_rows:
            obj_id = obj["id"]
            obj_name = obj["object_type_name"]
            pk_attr = None
            title_attr = None
            for r in attrs_rows:
                if r.get("object_type_id") != obj_id:
                    continue
                if r.get("is_primary_key") and not pk_attr:
                    # 优先使用英文名（attribute_label），如果没有则使用中文名（attribute_name）
                    attr_label = r.get("attribute_label") or ""
                    pk_attr = attr_label.strip() if attr_label and attr_label.strip() else r.get("attribute_name")
                if r.get("is_title") and not title_attr:
                    # 优先使用英文名（attribute_label），如果没有则使用中文名（attribute_name）
                    attr_label = r.get("attribute_label") or ""
                    title_attr = attr_label.strip() if attr_label and attr_label.strip() else r.get("attribute_name")
            pk_attr_by_object[obj_name] = pk_attr
            title_attr_by_object[obj_name] = title_attr

        for obj in object_rows:
            en = obj["object_type_name"] or "UnnamedObject"
            zh = obj["object_type_label"] or en
            desc = (obj.get("object_type_desc") or "").replace('"', '\\"')
            lines.append(f"ex:{en} a owl:Class ;")
            lines.append(f"  rdfs:subClassOf ex:Object ;")
            # 输出中文label（优先级1）和英文label（兜底）
            lines.append(f"  rdfs:label {_ttl_literal(zh, 'zh')} ;")
            lines.append(f"  rdfs:label {_ttl_literal(en, 'en')} ;")
            # 新规范：类级别声明主键/标题属性（若有）
            pk_attr = pk_attr_by_object.get(en)
            title_attr = title_attr_by_object.get(en)
            if pk_attr:
                # 使用新的命名规则：{ObjectType}_{AttributeName}
                pk_attr_iri = f"{en}_{_clean_local_token(str(pk_attr), pk_attr)}"
                lines.append(f"  ex:hasPrimaryKey ex:{pk_attr_iri} ;")
            if title_attr:
                # 使用新的命名规则：{ObjectType}_{AttributeName}
                title_attr_iri = f"{en}_{_clean_local_token(str(title_attr), title_attr)}"
                lines.append(f"  ex:hasTitle ex:{title_attr_iri} ;")
            lines.append(f"  rdfs:comment {_ttl_literal(desc, 'zh')} .\n")

        # ============ 数据属性部分 ============
        lines.extend([
            "##################################",
            "# 数据属性定义",
            "# 每个对象的属性里，只能拥有一个primarykey",
            "# IRI命名规则：ex:{ObjectType}_{AttributeName}",
            "# AttributeName优先使用英文名(attribute_label)，如无则使用中文名(attribute_name)",
            "# 这样可以支持不同对象拥有同名但描述不同的属性",
            "##################################",
        ])

        # 不再按属性名分组，每个对象的每个属性都独立定义
        for attr in attrs_rows:
            obj_name = next((o["object_type_name"]
                            for o in object_rows if o["id"] == attr["object_type_id"]), None)
            if not obj_name:
                continue
                
            attr_name = attr["attribute_name"]  # 中文名（必填）
            attr_inst = attr.get("attribute_label") or ""  # 英文名（可选）
            attr_type = attr["field_type"]
            attr_desc = attr.get("attribute_desc") or ""
            
            # 构建新的IRI：{ObjectType}_{AttributeName}
            # 优先使用英文名，如果没有英文名则使用中文名
            attr_name_for_iri = attr_inst.strip() if attr_inst and attr_inst.strip() else attr_name
            # 使用 _clean_local_token 确保 IRI 合法性
            attr_iri = f"{obj_name}_{_clean_local_token(attr_name_for_iri, attr_name_for_iri)}"

            lines.append(f"ex:{attr_iri} a owl:DatatypeProperty ;")
            lines.append(f"  rdfs:domain ex:{obj_name} ;")
            lines.append(f"  rdfs:range xsd:{attr_type} ;")
            lines.append(f"  rdfs:comment {_ttl_literal(attr_desc, 'zh')} ;")
            lines.append(f'  rdfs:label "{attr_name}"@zh ;')
            
            # 如果有英文名，则输出 @en 的 label
            if attr_inst and attr_inst.strip():
                lines.append(f'  rdfs:label "{attr_inst}"@en .')
            else:
                # 没有英文名，直接结束（最后一行改为句点）
                lines[-1] = lines[-1].rstrip(' ;') + ' .'
            
            lines.append("")  # 空行

        # ============ 关系定义部分 ============
        lines.extend([
            "##################################",
            "# 关系定义",
            "# 必须继承ex:custom_relation",
            "# 有正向关系就需定义一个反向关系",
            "# IRI命名规则：ex:{domain}_{relationLabel}_{range}",
            "# 这样可以支持多组对象对使用相同的关系标签",
            "##################################",
        ])
        # 修改seen_pairs的键结构，使用完整的标识（domain, tag, range）来避免冲突
        seen_triples: set[tuple[str, str, str]] = set()
        for link in link_rows:
            link_id = link.get("id")
            # 优先从直接关联的对象类型获取名称，其次从属性所属对象获取
            source_obj = (
                link.get("source_direct_object_name") or 
                link.get("source_attr_object_name") or 
                link.get("source_name") or 
                "Source"
            )
            target_obj = (
                link.get("target_direct_object_name") or 
                link.get("target_attr_object_name") or 
                link.get("target_name") or 
                "Target"
            )
            # 端点属性名：优先用 SQL 中带出的属性名，兜底用属性ID去 attrs_rows 查到的 attribute_name
            # 同时获取英文名和中文名，优先使用英文名
            source_attr_name = link.get("source_attribute_name")
            source_attr_label = link.get("source_attribute_label")
            target_attr_name = link.get("target_attribute_name")
            target_attr_label = link.get("target_attribute_label")
            
            if not source_attr_name or not target_attr_name:
                # 构建一次性 id->name/label 的映射，避免重复扫描
                if '___attr_id_to_name_cache' not in locals():
                    ___attr_id_to_name_cache = {r.get("id"): r.get(
                        "attribute_name") for r in attrs_rows}
                    ___attr_id_to_label_cache = {r.get("id"): r.get(
                        "attribute_label") for r in attrs_rows}
                if not source_attr_name:
                    source_attr_name = ___attr_id_to_name_cache.get(
                        link.get("source_attribute_id"))
                    source_attr_label = ___attr_id_to_label_cache.get(
                        link.get("source_attribute_id"))
                if not target_attr_name:
                    target_attr_name = ___attr_id_to_name_cache.get(
                        link.get("target_attribute_id"))
                    target_attr_label = ___attr_id_to_label_cache.get(
                        link.get("target_attribute_id"))
            
            # 优先使用英文名，如果没有英文名则使用中文名
            source_attr_for_iri = source_attr_label.strip() if source_attr_label and source_attr_label.strip() else source_attr_name
            target_attr_for_iri = target_attr_label.strip() if target_attr_label and target_attr_label.strip() else target_attr_name

            for tag in tags_by_link.get(link_id, []):
                base_tag = _clean_local_token(
                    (tag.get("tag_name") or "relation").replace(" ", "_"), "relation")
                tag_name = (tag.get("tag_name") or "relation").replace(" ", "_")
                tag_label = (tag.get("tag_label") or tag_name).replace('"', '\\"')
                tag_desc = (tag.get("tag_desc") or "").replace('"', '\\"')
                direct = (tag.get("link_direct") or "source").lower()

                if direct == "target":
                    domain_name, range_name = target_obj, source_obj
                    domain_attr, range_attr = target_attr_for_iri, source_attr_for_iri
                else:
                    domain_name, range_name = source_obj, target_obj
                    domain_attr, range_attr = source_attr_for_iri, target_attr_for_iri

                # 使用三元组（domain, tag, range）作为键来去重
                triple_key = (domain_name, base_tag, range_name)
                if triple_key in seen_triples:
                    continue
                seen_triples.add(triple_key)

                # 构建新的IRI：{domain}_{relationLabel}_{range}
                relation_iri = f"{domain_name}_{base_tag}_{range_name}"

                lines.append(f"ex:{relation_iri} a owl:ObjectProperty ;")
                lines.append(f"  rdfs:subPropertyOf ex:custom_relation ;")
                lines.append(f"  rdfs:domain ex:{domain_name} ;")
                lines.append(f"  rdfs:range ex:{range_name} ;")
                lines.append(f"  rdfs:label {_ttl_literal(tag_label, 'zh')} ;")
                lines.append(f'  ex:relationLabel "{base_tag}"@zh ;')
                # 当能确定端点属性名时，输出 ex:domainAttribute / ex:rangeAttribute 注解
                # 使用新的命名规则：{ObjectType}_{AttributeName}（优先使用英文名）
                if domain_attr and range_attr:
                    # 使用 _clean_local_token 确保 IRI 合法性，与数据属性定义保持一致
                    domain_attr_iri = f"{domain_name}_{_clean_local_token(domain_attr, domain_attr)}"
                    range_attr_iri = f"{range_name}_{_clean_local_token(range_attr, range_attr)}"
                    lines.append(f"  ex:domainAttribute ex:{domain_attr_iri} ;")
                    lines.append(f"  ex:rangeAttribute ex:{range_attr_iri} ;")
                # 如果是多对多关系（link_type == 2），添加中间对象引用
                link_type = link.get("link_type")
                middle_obj_name = middle_object_by_link.get(str(link_id))
                if link_type == 2 and middle_obj_name:
                    lines.append(f"  ex:hasMiddleObject ex:{middle_obj_name} ;")
                # 输出 comment（注意最后一行需要句点结尾）
                lines.append(f"  rdfs:comment {_ttl_literal(tag_desc, 'zh')} .\n")

        # ============ 标签（可选） ============
        # if tag_rows:
        #     lines.extend([
        #         "##################################",
        #         "# 标签定义",
        #         "##################################",
        #     ])
        #     for tag in tag_rows:
        #         tag_name = tag["tag_name"]
        #         tag_label = (tag.get("tag_label", "") or "").replace('"', '\\"')
        #         tag_desc = (tag.get("tag_desc", "") or "").replace('"', '\\"')
        #         lines.append(f"ex:{tag_name} a owl:Class ;")
        #         lines.append(f'  rdfs:label "{tag_label}"@zh ;')
        #         lines.append(f'  rdfs:comment "{tag_desc}" .\n')

        owl_content = "\n".join(lines).strip() + "\n"

        # 构建统计信息
        stats = {
            "objects": len(object_rows),
            "attributes": len(attrs_rows),
            "relations": len(link_rows),
            "logic": len(logic_rows),
            "actions": len(action_rows),
            "interfaces": 0  # OWL导出不包含接口
        }

        logger.info(
            f"ontology_id={ontology_id} 导出 OWL 完成: 对象{len(object_rows)}, 属性{len(attrs_rows)}, "
            f"关联{len(link_rows)}, 标签{len(tag_rows)}, 逻辑{len(logic_rows)}, 动作{len(action_rows)}"
        )
        return owl_content, stats
    else:
        # print("使用特定version")
        mysql = await create_mysql_service()
        # print("使用特定version")
        version_row = await mysql.afetch_one(
            """
            SELECT latest_version 
            FROM ontology_manage
            WHERE id = %s
            """,
            (str(ontology_id),),
        )

        main_latest_version = version_row["latest_version"] if version_row else None


        if object_type_id is None:
            object_rows = await mysql.afetch_all(
                """
                SELECT id, object_type_name, object_type_label,object_type_id,ontology_id,object_type_desc,latest_version
                FROM ontology_object_type_his
                WHERE ontology_id = %s AND sync_status < 3 AND status <> 0 AND latest_version = %s

                ORDER BY id
                """,
                (str(ontology_id), main_latest_version),
            )
        else:
            sel_ids: List[str] = [str(x) for x in object_type_id]
            in_clause = ",".join(["%s"] * len(sel_ids))
            # 读取对象类型
            object_rows = await mysql.afetch_all(
                """
                SELECT id, object_type_name, object_type_label, object_type_id,ontology_id,object_type_desc,latest_version
                FROM ontology_object_type_his
                WHERE ontology_id = %s AND sync_status < 3 AND status <> 0 AND latest_version = %s
                AND object_type_id IN ({in_clause})
                ORDER BY object_type_name
                """,
                (str(ontology_id), main_latest_version,*sel_ids),
            )

        object_ids = [r["object_type_id"] for r in object_rows]
        allowed_object_ids = set(object_ids)
        # print("打印实际拿到的")
        # print(object_ids)
        # print(object_ids)
        # 如果有 object_type_id 限制，需要自动补充相关的中间对象
        if object_type_id and object_ids:
            # 查询涉及选中对象的多对多关系（link_type = 2）
            sel_ids_for_middle = [str(x) for x in object_ids]
            # print('chauxn choose ')
            # print(sel_ids_for_middle)
            in_clause_middle = ",".join(["%s"] * len(sel_ids_for_middle))
            # print(in_clause_middle)
            
            # 找出所有涉及选中对象的多对多关系
            many_to_many_links = await mysql.afetch_all(
                f"""
                SELECT DISTINCT id,latest_version
                FROM ontology_link_type_his
                WHERE ontology_id = %s 
                AND sync_status < 3
                AND status <> 0
                AND link_type = 2
                AND latest_version = %s
                AND (source_object_type_id IN ({in_clause_middle})
                    OR target_object_type_id IN ({in_clause_middle}))
                """,
                (str(ontology_id), main_latest_version,*sel_ids_for_middle, *sel_ids_for_middle),
            )
            # print("找出所有涉及选中对象的多对多关系,成功")
            
            many_to_many_link_ids = [link["object_type_id"] for link in many_to_many_links]
            
            # 查询这些多对多关系对应的中间对象
            if many_to_many_link_ids:
                middle_objects = await mysql.afetch_all(
                    f"""
                    SELECT id, object_type_name, object_type_label, object_type_desc,latest_version
                    FROM ontology_object_type_his
                    WHERE ontology_id = %s 
                    AND sync_status < 3 
                    AND status <> 0
                    AND latest_version = %s
                    AND link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                    """,
                    (str(ontology_id), main_latest_version,*many_to_many_link_ids),
                )
                
                # 将中间对象补充到 object_rows 和 allowed_object_ids
                for middle_obj in middle_objects:
                    if middle_obj["object_type_id"] not in allowed_object_ids:
                        object_rows.append(middle_obj)
                        object_ids.append(middle_obj["object_type_id"])
                        allowed_object_ids.add(middle_obj["object_type_id"])

        # 读取属性表
        attrs_rows: List[Dict] = []
        # if str(ontology_id) not in object_ids:
        #     object_ids.append(str(ontology_id))
            # print("加入ontology_id后的object_ids:", object_ids)

        if object_ids:
            params = tuple(object_ids) + (str(main_latest_version),)
            attrs_rows = await mysql.afetch_all(
                f"""
                SELECT object_type_id, field_name, attribute_desc, attribute_name, attribute_label, is_primary_key, is_title, id, field_type,latest_version,attribute_id 
                FROM ontology_object_type_attribute_his
                WHERE object_type_id IN ({','.join(['%s']*len(object_ids))}) AND sync_status < 3 AND status > 0 AND latest_version = %s
                ORDER BY field_name
                """,
                params
            )
            # print("打印attrs_rows 数据信息")
            # print(attrs_rows)
        if object_type_id:
            # 读取关联表（通过端点属性找到其所属对象，取对象英文名作为 domain/range）
            link_rows = await mysql.afetch_all(
                f"""
                SELECT
                lt.id,
                lt.source_name,
                lt.source_label,
                lt.target_name,
                lt.target_label,
                lt.link_type,
                lt.latest_version,
                sattr.attribute_name AS source_attribute_name,
                sattr.attribute_label AS source_attribute_label,
                tattr.attribute_name AS target_attribute_name,
                tattr.attribute_label AS target_attribute_label,
                lt.source_attribute_id,
                lt.target_attribute_id,
                lt.source_object_type_id,
                lt.target_object_type_id,
                sattr.object_type_id AS source_attr_object_type_id,
                tattr.object_type_id AS target_attr_object_type_id,
                sobj.object_type_name AS source_attr_object_name,
                tobj.object_type_name AS target_attr_object_name,
                src_direct.object_type_name AS source_direct_object_name,
                src_direct.object_type_label AS source_direct_object_label,
                tgt_direct.object_type_name AS target_direct_object_name,
                tgt_direct.object_type_label AS target_direct_object_label
                FROM ontology_link_type_his lt
                LEFT JOIN ontology_object_type_attribute_his sattr ON sattr.id = lt.source_attribute_id AND sattr.sync_status < 3
                AND sattr.latest_version = %s
                LEFT JOIN ontology_object_type_his sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                AND sobj.latest_version = %s
                LEFT JOIN ontology_object_type_attribute_his tattr ON tattr.id = lt.target_attribute_id AND tattr.sync_status < 3
                AND tattr.latest_version = %s
                LEFT JOIN ontology_object_type_his tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                AND tobj.latest_version = %s
                LEFT JOIN ontology_object_type_his src_direct ON src_direct.object_type_id = lt.source_object_type_id AND src_direct.sync_status < 3
                AND src_direct.latest_version = %s
                LEFT JOIN ontology_object_type_his tgt_direct ON tgt_direct.object_type_id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                AND tgt_direct.latest_version = %s
                WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                AND lt.latest_version = %s 
                AND (
                    lt.source_object_type_id IN ({in_clause})
                OR lt.target_object_type_id IN ({in_clause})
                )
                ORDER BY lt.source_name, lt.target_name
                """,
                (str(main_latest_version), str(main_latest_version), str(main_latest_version), str(main_latest_version), 
     str(main_latest_version), str(main_latest_version), str(ontology_id), str(main_latest_version), *sel_ids, *sel_ids),
)
            
        else:
            link_rows = await mysql.afetch_all(
                """
                SELECT
                lt.id,
                lt.source_name,
                lt.source_label,
                lt.target_name,
                lt.target_label,
                lt.link_type_id,
                lt.link_type,
                lt.ontology_id,
                sattr.attribute_name AS source_attribute_name,
                sattr.attribute_label AS source_attribute_label,
                tattr.attribute_name AS target_attribute_name,
                tattr.attribute_label AS target_attribute_label,
                lt.source_attribute_id,
                lt.target_attribute_id,
                lt.source_object_type_id,
                lt.target_object_type_id,
                sattr.object_type_id AS source_attr_object_type_id,
                tattr.object_type_id AS target_attr_object_type_id,
                sobj.object_type_name AS source_attr_object_name,
                tobj.object_type_name AS target_attr_object_name,
                src_direct.object_type_name AS source_direct_object_name,
                src_direct.object_type_label AS source_direct_object_label,
                tgt_direct.object_type_name AS target_direct_object_name,
                tgt_direct.object_type_label AS target_direct_object_label
                FROM ontology_link_type_his lt
                LEFT JOIN ontology_object_type_attribute_his sattr ON sattr.id = lt.source_attribute_id 
                    AND sattr.sync_status < 3 
                    AND sattr.latest_version = %s  
                LEFT JOIN ontology_object_type_his sobj ON sobj.id = sattr.object_type_id 
                    AND sobj.sync_status < 3 
                    AND sobj.latest_version = %s  
                LEFT JOIN ontology_object_type_attribute_his tattr ON tattr.id = lt.target_attribute_id 
                    AND tattr.sync_status < 3 
                    AND tattr.latest_version = %s  
                LEFT JOIN ontology_object_type_his tobj ON tobj.id = tattr.object_type_id 
                    AND tobj.sync_status < 3 
                    AND tobj.latest_version = %s  
                LEFT JOIN ontology_object_type_his src_direct ON src_direct.object_type_id = lt.source_object_type_id 
                    AND src_direct.sync_status < 3 
                    AND src_direct.latest_version = %s  
                LEFT JOIN ontology_object_type_his tgt_direct ON tgt_direct.object_type_id = lt.target_object_type_id 
                    AND tgt_direct.sync_status < 3 
                    AND tgt_direct.latest_version = %s  
                WHERE lt.ontology_id = %s 
                    AND lt.sync_status < 3 
                    AND lt.status <> 0
                    AND lt.latest_version = %s  
                ORDER BY lt.source_name, lt.target_name
                """,
                # 参数顺序：6个关联表版本 + ontology_id + lt.latest_version
                (str(main_latest_version), str(main_latest_version), str(main_latest_version), 
                str(main_latest_version), str(main_latest_version), str(main_latest_version), 
                str(ontology_id), str(main_latest_version)),
            )
        # 过滤掉涉及被排除对象类型（status == 0）的关系
        if not allowed_object_ids:
            link_rows = []
        else:
            _filtered_links = []
            for lr in link_rows:
                src_ot = lr.get("source_object_type_id") or lr.get("source_attr_object_type_id")
                tgt_ot = lr.get("target_object_type_id") or lr.get("target_attr_object_type_id")
                if src_ot in allowed_object_ids and tgt_ot in allowed_object_ids:
                    _filtered_links.append(lr)
            link_rows = _filtered_links
        
        # 查询多对多关系的中间对象
        middle_object_by_link: Dict[str, Optional[str]] = {}
        if link_rows:
            # 收集所有 link_type == 2 的 link_id
            many_to_many_link_ids = [lr["id"] for lr in link_rows if lr.get("link_type") == 2]
            if many_to_many_link_ids:
                # 查询这些 link 对应的中间对象
                middle_obj_rows = await mysql.afetch_all(
                    f"""
                    SELECT link_type_id, object_type_name
                    FROM ontology_object_type
                    WHERE link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                    AND sync_status < 3
                    AND status <> 0
                    """,
                    tuple(many_to_many_link_ids),
                )
                for mo in middle_obj_rows:
                    link_id = mo.get("link_type_id")
                    obj_name = mo.get("object_type_name")
                    if link_id and obj_name:
                        middle_object_by_link[str(link_id)] = obj_name
        
        # 读取每条连接对应的标签（含方向）
        link_tag_rows = await mysql.afetch_all(
            """
            SELECT
            ltt.link_type_id  AS link_id,
            ltt.link_direct   AS link_direct,
            t.tag_name        AS tag_name,
            t.tag_label       AS tag_label,
            t.tag_desc        AS tag_desc
            FROM ontology_link_type_tag ltt
            JOIN ontology_tag t ON t.id = ltt.tag_id
            JOIN ontology_link_type_his lt ON lt.link_type_id = ltt.link_type_id
            WHERE lt.ontology_id = %s
            AND lt.sync_status < 3
            AND t.sync_status < 3
            ORDER BY ltt.link_type_id
            """,
            (str(ontology_id),),
        )





        # 组装：每个 link_id -> [tags]
        tags_by_link: Dict[str, List[Dict]] = {}
        for r in link_tag_rows:
            tags_by_link.setdefault(r["link_id"], []).append(r)

        # 读取标签表（如果有）
        tag_rows = await mysql.afetch_all(
            """
            SELECT DISTINCT t.tag_name, t.tag_label, t.tag_desc
            FROM ontology_tag t
            JOIN ontology_link_type_tag ltt ON t.id = ltt.tag_id
            JOIN ontology_link_type lt ON ltt.link_type_id = lt.id
            WHERE lt.ontology_id = %s
            AND lt.sync_status < 3
            AND t.sync_status < 3
            ORDER BY t.tag_name
            """,
            (str(ontology_id),),
        )

        # 读取函数定义（仅导出待同步或已新建/修改的函数，且为 function 或 api 类型）
        logic_rows = await mysql.afetch_all(
            """
            SELECT
            logic_type_id,
            logic_type_name,
            logic_type_label,
            logic_type_desc,
            signature_detail,
            intput_param,
            output_param,
            build_type,
            api_id,
            latest_version
            FROM ontology_logic_type_his
            WHERE ontology_id = %s
            AND sync_status <= 2
            AND status <> 0
            AND build_type IN ('function', 'api')
            AND latest_version = %s
            ORDER BY logic_type_name
            """,

            (str(ontology_id), main_latest_version),
        )
        
        # 收集所有有效的逻辑ID，用于后续过滤绑定关系
        valid_logic_ids = set(str(row["logic_type_id"]) for row in logic_rows) if logic_rows else set()

        # 读取本体名称（ontology_manage.ontology_name）
        ontology_name = None
        try:
            ontology_row = await mysql.afetch_one(
                """
                SELECT ontology_name, ontology_label
                FROM ontology_manage
                WHERE id = %s
                """,
                (str(ontology_id),),
            )
            if ontology_row:
                ontology_name = ontology_row.get("ontology_name")
                ontology_label = ontology_row.get("ontology_label")
        except Exception:
            # 忽略异常，不影响导出主流程
            ontology_name = None
            ontology_label = None

        # ================= 构造输出 =================
        lines: List[str] = [
            "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
            "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
            "@prefix owl: <http://www.w3.org/2002/07/owl#> .",
            "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
            "@prefix prov: <http://www.w3.org/ns/prov#> .",
            "@prefix dcterms: <http://purl.org/dc/terms/> .",
            "@prefix ex: <http://asiainfo.com/example-owl#> .",
            "",
            "##################################",
            "# 基础抽象类与通用语义（禁止变动）",
            "##################################",
            'ex:Entity a owl:Class ; rdfs:subClassOf prov:Entity ; rdfs:label "实体"@zh .',
            'ex:Object a owl:Class ; rdfs:subClassOf ex:Entity ; rdfs:label "本体对象"@zh .',
            'ex:Action a owl:Class ; rdfs:subClassOf prov:Activity ; rdfs:label "行动"@zh .',
            'ex:Logic a owl:Class ; rdfs:subClassOf prov:Activity ; rdfs:label "决策/逻辑函数"@zh .',
            'ex:hasPrimaryKey a owl:AnnotationProperty ; rdfs:label "主键属性"@zh ; rdfs:comment "在类级别声明该对象的主键数据属性"@zh .',
            'ex:hasTitle a owl:AnnotationProperty ; rdfs:label "标题属性"@zh ; rdfs:comment "在类级别声明该对象的标题数据属性"@zh .',
            'ex:bindAction a owl:ObjectProperty ; rdfs:label "本体对象关联行动"@zh ; rdfs:domain ex:Object ; rdfs:range ex:Action .',
            'ex:bindLogic a owl:ObjectProperty ; rdfs:label "本体对象关联函数"@zh ; rdfs:domain ex:Object ; rdfs:range ex:Logic .',
            'ex:custom_relation a owl:ObjectProperty ; rdfs:label "自定义对象与对象之间的关系"@zh .',
            # === 函数与参数相关基础定义 ===
            'ex:Parameter a owl:Class ; rdfs:label "函数参数"@zh .',
            'ex:hasParameter a owl:ObjectProperty ; rdfs:label "有参数"@zh ; rdfs:domain ex:Logic ; rdfs:range ex:Parameter .',
            # 'ex:expectedOutputDescription a owl:DatatypeProperty ; rdfs:label "期望输出描述"@zh ; rdfs:domain ex:Logic ; rdfs:range xsd:string .',
            'ex:paramName a owl:DatatypeProperty ; rdfs:label "参数名"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:paramType a owl:DatatypeProperty ; rdfs:label "参数类型"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:paramTypeNode a owl:ObjectProperty ; rdfs:label "参数类型节点"@zh ; rdfs:domain ex:Parameter .',
            'ex:ListType a owl:Class ; rdfs:label "列表类型"@zh .',
            'ex:DictType a owl:Class ; rdfs:label "字典类型"@zh .',
            'ex:itemType a owl:DatatypeProperty ; rdfs:label "元素类型"@zh .',
            'ex:keyType a owl:DatatypeProperty ; rdfs:label "键类型"@zh .',
            'ex:valueType a owl:DatatypeProperty ; rdfs:label "值类型"@zh .',
            # 'ex:paramDescription a owl:DatatypeProperty ; rdfs:label "参数描述"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:isOptional a owl:DatatypeProperty ; rdfs:label "是否可选"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:boolean .',
            'ex:defaultValue a owl:DatatypeProperty ; rdfs:label "默认值"@zh ; rdfs:domain ex:Parameter ; rdfs:range xsd:string .',
            'ex:ontologyName a owl:Class ; rdfs:label "本体名称"@zh .',
            'ex:domainAttribute a owl:AnnotationProperty ; rdfs:label "域属性"@zh ; rdfs:comment "指定对象属性的域端使用哪个数据属性建立关联"@zh .',
            'ex:rangeAttribute a owl:AnnotationProperty ; rdfs:label "值域属性"@zh ; rdfs:comment "指定对象属性的值域端使用哪个数据属性建立关联"@zh .',
            'ex:relationLabel a owl:AnnotationProperty ; rdfs:label "关系标签"@zh ; rdfs:comment "表示关系的语义标签名称（如hasOrder、isPartOf等），用于标识关系类型"@zh .',
            'ex:hasMiddleObject a owl:ObjectProperty ; rdfs:label "中间对象"@zh ; rdfs:comment "用来描述多对多关系的情况下，两个对象所使用到的中间对象"@zh .',
        ]

        # ======== 本体名称定义（位于可用函数定义之前） ========
        if ontology_name:
            on_local = _clean_local_token(str(ontology_name), "OntologyName")
            lines.extend([
                "##################################",
                "# 本体名称",
                "##################################",
                f"ex:{on_local} a ex:ontologyName ;",
                f"  rdfs:label {_ttl_literal(ontology_label, 'zh')} .",
                "",
            ])

        # ============ 可用函数定义（来自 ontology_logic_type） ============
        def _parse_params(raw: Optional[Any]) -> List[Dict[str, Any]]:
            params: List[Dict[str, Any]] = []
            if raw is None or raw == "":
                return params

            def _map_type(t: Any) -> str:
                if t is None:
                    return "xsd:string"
                v = str(t).strip()
                v_low = v.lower()
                if v.startswith("xsd:"):
                    return v
                mapping = {
                    "str": "xsd:string",
                    "string": "xsd:string",
                    "int": "xsd:integer",
                    "integer": "xsd:integer",
                    "float": "xsd:double",
                    "double": "xsd:double",
                    "decimal": "xsd:decimal",
                    "bool": "xsd:boolean",
                    "boolean": "xsd:boolean",
                }
                return mapping.get(v_low, v)

            def _parse_collection_type(t: Any) -> Optional[Dict[str, Any]]:
                if t is None:
                    return None
                s = str(t).strip()
                if not s:
                    return None
                low = s.lower()
                # list or list[elem]
                if low.startswith("list"):
                    m = re.match(r"^list\s*(?:\[(.+)\])?$", low)
                    item = None
                    if m:
                        inner = m.group(1)
                        if inner:
                            item = _map_type(inner.strip())
                    return {"kind": "ListType", "itemType": item}
                # dict or dict[key,val]
                if low.startswith("dict"):
                    m = re.match(
                        r"^dict\s*(?:\[([^,\]]+)\s*,\s*([^\]]+)\])?$", low)
                    k = v = None
                    if m:
                        kraw = m.group(1)
                        vraw = m.group(2)
                        if kraw:
                            k = _map_type(kraw.strip())
                        if vraw:
                            v = _map_type(vraw.strip())
                    return {"kind": "DictType", "keyType": k, "valueType": v}
                return None

            def _build_type_hint(node: Dict[str, Any]) -> str:
                if not node:
                    return ""
                kind = node.get("kind")
                if kind == "ListType":
                    item = node.get("itemType")
                    return f"list[{item}]" if item else "list"
                if kind == "DictType":
                    kt = node.get("keyType")
                    vt = node.get("valueType")
                    if kt and vt:
                        return f"dict[{kt},{vt}]"
                    return "dict"
                return ""

            data: Any = None
            # 优先处理原生对象
            if isinstance(raw, (dict, list)):
                data = raw
            else:
                s = str(raw).strip()
                # 尝试 JSON
                try:
                    data = json.loads(s)
                except Exception:
                    data = None

            if data is not None:
                # 0) 新格式 signature_detail：{"p": {"type": "int", "is_required": true, "desc": "..."}}
                if isinstance(data, dict) and any(isinstance(v, dict) for v in data.values()):
                    for k, v in data.items():
                        if not isinstance(v, dict):
                            continue
                        name = str(k).strip()
                        if not name:
                            continue
                        # 支持集合类型
                        ct = _parse_collection_type(v.get("type"))
                        if ct:
                            ptype = _build_type_hint(ct)
                            params.append({
                                "name": name,
                                "type": ptype,
                                "type_node": ct,
                                "optional": (not bool(v.get("is_required", False))),
                                "default": None,
                            })
                            continue
                        ptype = _map_type(v.get("type"))
                        is_required = bool(v.get("is_required", False))
                        params.append({
                            "name": name,
                            "type": ptype,
                            "optional": (not is_required),
                            "default": None,
                        })
                    return params

                # 1) 旧格式：dict 映射格式：{"name":"str", ...}
                if isinstance(data, dict) and "parameters" not in data:
                    for k, v in data.items():
                        name = str(k).strip()
                        if not name:
                            continue
                        ptype = _map_type(v)
                        params.append({
                            "name": name,
                            "type": ptype,
                            "optional": False,
                            "default": None,
                        })
                    return params

                # 2) 结构化列表/对象格式：[{name,type,isOptional,default}] 或 {parameters:[...]}
                items = data.get("parameters") if isinstance(data, dict) else data
                items = items if isinstance(items, list) else []
                for it in items:
                    if not isinstance(it, dict):
                        continue
                    name = it.get("name") or it.get("paramName") or it.get("key")
                    ptype = it.get("type") or it.get(
                        "paramType") or it.get("datatype")
                    optional = it.get("optional") if it.get(
                        "optional") is not None else it.get("isOptional")
                    default = it.get("default") if it.get("default") not in (
                        None, "") else it.get("defaultValue")
                    if name:
                        # 强制转换 optional 为布尔
                        if isinstance(optional, str):
                            opt_bool = optional.strip().lower() in ("true", "1", "yes", "y")
                        else:
                            opt_bool = bool(
                                optional) if optional is not None else False
                        params.append({
                            "name": str(name),
                            "type": str(_map_type(ptype)) if ptype else "xsd:string",
                            "optional": opt_bool,
                            "default": default,
                        })
                return params

            # 非 JSON：尝试逗号分隔的 "name:type"，可选用 ?，默认值用 =
            # 例："prod_inst_id:xsd:string, used_stra_ids:xsd:string?=\"1,2\""
            try:
                s2 = str(raw).strip()
                items = [t.strip() for t in re.split(r"[,\n]", s2) if t.strip()]
                for token in items:
                    default_val = None
                    if "=" in token:
                        token, default_val = token.split("=", 1)
                        default_val = default_val.strip().strip('"')
                    optional = token.endswith("?")
                    token = token[:-1] if optional else token
                    name, ptype = (token.split(":", 1) + ["xsd:string"])[:2]
                    params.append({
                        "name": name.strip(),
                        "type": ptype.strip() or "xsd:string",
                        "optional": optional,
                        "default": default_val,
                    })
            except Exception:
                return params
            return params

        if logic_rows:
            lines.extend([
                "##################################",
                "# 可用函数",
                "##################################",
            ])
            for f in logic_rows:
                fname_raw = f.get("logic_type_name") or "UnnamedFunction"
                fname = _clean_local_token(str(fname_raw), "UnnamedFunction")
                flabel = f.get("logic_type_label") or fname_raw
                fdesc = (f.get("logic_type_desc") or "")
                build_type = f.get("build_type") or "function"
                # output_desc = (f.get("output_param") or "").strip()
                
                # 根据 build_type 获取参数
                params = []
                if build_type == "api":
                    # 从 ontology_api_param 表中查询参数
                    api_id = f.get("api_id")
                    if api_id:
                        api_param_rows = await mysql.afetch_all(
                            """
                            SELECT
                            param_name,
                            param_type,
                            param_method,
                            param_mode,
                            param_desc,
                            is_required,
                            default_value
                            FROM ontology_api_param
                            WHERE api_id = %s
                            AND param_mode = 'request'
                            ORDER BY param_name
                            """,
                            (str(api_id),),
                        )
                        # 将 API 参数转换为统一的参数格式
                        for ap in api_param_rows:
                            param_type = ap.get("param_type") or "string"
                            # 映射参数类型到 xsd 类型
                            type_mapping = {
                                "string": "xsd:string",
                                "integer": "xsd:integer",
                                "number": "xsd:double",
                                "boolean": "xsd:boolean",
                            }
                            xsd_type = type_mapping.get(param_type.lower(), "xsd:string")
                            is_required = ap.get("is_required") == "1"
                            params.append({
                                "name": ap.get("param_name"),
                                "type": xsd_type,
                                "optional": not is_required,
                                "default": ap.get("default_value"),
                            })
                else:
                    # 对于 function 类型，优先使用 signature_detail；如无则回退到 intput_param
                    params = _parse_params(
                        f.get("signature_detail") or f.get("intput_param"))

                # 与 csat 风格一致：函数个体 + 参数
                lines.append(f"ex:{fname} a ex:Logic ;")
                lines.append(f"  rdfs:label {_ttl_literal(flabel, 'zh')} ;")
                if fdesc:
                    lines.append(f"  rdfs:comment {_ttl_literal(fdesc, 'zh')} ;")
                # if output_desc:
                #     lines.append(f"  ex:expectedOutputDescription {_ttl_literal(output_desc, 'zh')} ;")
                if params:
                    # 组装参数空白节点，支持集合类型
                    bnodes: List[str] = []
                    for p in params:
                        p_name = p.get("name") or "param"
                        p_type = p.get("type") or "xsd:string"
                        # 可能为 ListType/DictType 描述
                        p_type_node = p.get("type_node")
                        p_opt = "true" if p.get("optional") else "false"
                        default = p.get("default")
                        parts = [
                            "a ex:Parameter",
                            f"ex:paramName {_ttl_literal(str(p_name))}",
                            f"ex:paramType {_ttl_literal(str(p_type))}",
                            f"ex:isOptional {p_opt}",
                        ]
                        if default not in (None, ""):
                            parts.append(
                                f"ex:defaultValue {_ttl_literal(str(default))}")
                        if isinstance(p_type_node, dict):
                            if p_type_node.get("kind") == "ListType":
                                item_type = p_type_node.get("itemType")
                                type_node_parts = ["a ex:ListType"]
                                if item_type:
                                    type_node_parts.append(
                                        f"ex:itemType {_ttl_literal(str(item_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                            elif p_type_node.get("kind") == "DictType":
                                key_type = p_type_node.get("keyType")
                                value_type = p_type_node.get("valueType")
                                type_node_parts = ["a ex:DictType"]
                                if key_type:
                                    type_node_parts.append(
                                        f"ex:keyType {_ttl_literal(str(key_type))}")
                                if value_type:
                                    type_node_parts.append(
                                        f"ex:valueType {_ttl_literal(str(value_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                        bnodes.append("[ " + " ; ".join(parts) + " ]")
                    lines.append(f"  ex:hasParameter {', '.join(bnodes)} .\n")
                else:
                    # 无参数，直接收尾
                    # 将最后一个分号替换为句点
                    if lines[-1].endswith(";"):
                        lines[-1] = lines[-1][:-1] + " .\n"

        # ============ 可用action定义 ============
        # 读取 action 定义（根据 ontology_id 和 sync_status <= 2）
        
        action_rows = await mysql.afetch_all(
            f"""
            SELECT
            id,
            object_type_id,
            action_name,
            action_label,
            action_desc,
            build_type,
            signature_detail,
            intput_param,
            latest_version
            FROM ontology_object_type_action_his
            WHERE object_type_id IN ({','.join(['%s']*len(object_ids))})
            AND sync_status <= 2
            AND status <> 0
            AND latest_version = %s
            ORDER BY action_name
            """,
            (*object_ids, main_latest_version),
        )

        if action_rows:
            lines.extend([
                "##################################",
                "# Action动作定义",
                "##################################",
            ])

            # 为每个action处理参数
            for action in action_rows:
                action_id = action.get("object_type_id")
                action_name_raw = action.get("action_name") or "UnnamedAction"
                action_name = _clean_local_token(
                    str(action_name_raw), "UnnamedAction")
                action_label = action.get("action_label") or action_name_raw
                action_desc = action.get("action_desc") or ""
                build_type = action.get("build_type") or "object"

                # 获取关联的对象类型名称
                object_type_id = action.get("object_type_id")
                obj_type_name = None
                if object_type_id:
                    obj_row = next(
                        (o for o in object_rows if o["object_type_id"] == object_type_id), None)
                    if obj_row:
                        obj_type_name = obj_row["object_type_name"]

                # 开始定义 Action
                lines.append(f"ex:{action_name} a ex:Action ;")
                lines.append(f"  rdfs:label {_ttl_literal(action_label, 'zh')} ;")
                if action_desc:
                    lines.append(
                        f"  rdfs:comment {_ttl_literal(action_desc, 'zh')} ;")

                # 处理参数
                params = []

                if build_type == "function":
                    # 优先使用 signature_detail 字段；若不存在则回退到 intput_param
                    sig_raw = action.get("signature_detail")
                    parsed = False
                    if sig_raw:
                        try:
                            sig = json.loads(str(sig_raw)) if isinstance(
                                sig_raw, str) else sig_raw
                            if isinstance(sig, dict):
                                # 解析集合类型（list/dict 或带括号形式）
                                def _map_action_type(t: Any) -> str:
                                    if t is None:
                                        return "xsd:string"
                                    v = str(t).strip()
                                    if v.startswith("xsd:"):
                                        return v
                                    low = v.lower()
                                    mapping = {
                                        "str": "xsd:string",
                                        "string": "xsd:string",
                                        "int": "xsd:integer",
                                        "integer": "xsd:integer",
                                        "float": "xsd:double",
                                        "double": "xsd:double",
                                        "decimal": "xsd:decimal",
                                        "bool": "xsd:boolean",
                                        "boolean": "xsd:boolean",
                                    }
                                    return mapping.get(low, v)

                                def _parse_col(t: Any) -> Optional[Dict[str, Any]]:
                                    if t is None:
                                        return None
                                    s = str(t).strip()
                                    low = s.lower()
                                    if low.startswith("list"):
                                        m = re.match(
                                            r"^list\s*(?:\[(.+)\])?$", low)
                                        item = None
                                        if m:
                                            inner = m.group(1)
                                            if inner:
                                                item = _map_action_type(
                                                    inner.strip())
                                        return {"kind": "ListType", "itemType": item}
                                    if low.startswith("dict"):
                                        m = re.match(
                                            r"^dict\s*(?:\[([^,\]]+)\s*,\s*([^\]]+)\])?$", low)
                                        kt = vt = None
                                        if m:
                                            kr = m.group(1)
                                            vr = m.group(2)
                                            if kr:
                                                kt = _map_action_type(kr.strip())
                                            if vr:
                                                vt = _map_action_type(vr.strip())
                                        return {"kind": "DictType", "keyType": kt, "valueType": vt}
                                    return None

                                def _hint(n: Dict[str, Any]) -> str:
                                    if not n:
                                        return ""
                                    if n.get("kind") == "ListType":
                                        it = n.get("itemType")
                                        return f"list[{it}]" if it else "list"
                                    if n.get("kind") == "DictType":
                                        kt = n.get("keyType")
                                        vt = n.get("valueType")
                                        if kt and vt:
                                            return f"dict[{kt},{vt}]"
                                        return "dict"
                                    return ""

                                for pname, detail in sig.items():
                                    if not isinstance(detail, dict):
                                        continue
                                    col = _parse_col(detail.get("type"))
                                    is_required = bool(
                                        detail.get("is_required", False))
                                    desc = detail.get("desc") or ""
                                    if col:
                                        params.append({
                                            "name": pname,
                                            "type": _hint(col),
                                            "type_node": col,
                                            "description": desc,
                                            "is_optional": (not is_required),
                                        })
                                    else:
                                        ptype = _map_action_type(
                                            detail.get("type"))
                                        params.append({
                                            "name": pname,
                                            "type": ptype,
                                            "description": desc,
                                            "is_optional": (not is_required),
                                        })
                                parsed = True
                        except Exception:
                            parsed = False

                    if not parsed:
                        # 回退：使用 intput_param（旧格式）
                        input_param = action.get("intput_param")
                        if input_param:
                            try:
                                param_data = json.loads(str(input_param)) if isinstance(
                                    input_param, str) else input_param
                                if isinstance(param_data, dict):
                                    # Skip first element（历史结构特殊处理）
                                    param_items = list(param_data.items())[1:]
                                    for param_key, param_value in param_items:
                                        params.append({
                                            "name": param_key,
                                            "type": param_value if param_value else "xsd:string",
                                            "description": param_key,
                                            "is_optional": False
                                        })
                            except Exception:
                                pass

                elif build_type == "object":
                    # 从 ontology_object_type_action_param 表读取参数
                    param_rows = await mysql.afetch_all(
                        """
                        SELECT
                        ootap.param_name,
                        ootap.param_required,
                        ootap.param_value,
                        oota.attribute_name,
                        oota.field_type
                        FROM ontology_object_type_action_param ootap
                        LEFT JOIN ontology_object_type_attribute_his oota
                        ON ootap.attribute_id = oota.id
                        WHERE ootap.action_id = %s
                        AND latest_version = %s
                        ORDER BY ootap.param_name
                        """,
                        (str(action_id),main_latest_version),
                    )

                    for pr in param_rows:
                        param_name = pr.get(
                            "attribute_name") or "unknown_param_name"
                        field_type = pr.get("field_type") or "string"
                        param_required = pr.get("param_required", 1)
                        param_value = pr.get("param_value")

                        params.append({
                            "name": param_name,
                            "type": f"xsd:{field_type}",
                            "description": param_name,
                            "is_optional": (param_required != 1)
                        })

                # 输出参数
                if params:
                    bnodes = []
                    for p in params:
                        p_name = p.get("name", "")
                        p_type = p.get("type", "xsd:string")
                        p_desc = p.get("description", "")
                        p_opt = "true" if p.get("is_optional", False) else "false"
                        p_type_node = p.get("type_node")

                        parts = [
                            "a ex:Parameter",
                            f"ex:paramName {_ttl_literal(str(p_name))}",
                            f"ex:paramType {_ttl_literal(str(p_type))}",
                        ]
                        # if p_desc:
                        #     parts.append(f"ex:paramDescription {_ttl_literal(str(p_desc), 'zh')}")
                        parts.append(f"ex:isOptional {p_opt}")
                        if isinstance(p_type_node, dict):
                            if p_type_node.get("kind") == "ListType":
                                item_type = p_type_node.get("itemType")
                                type_node_parts = ["a ex:ListType"]
                                if item_type:
                                    type_node_parts.append(
                                        f"ex:itemType {_ttl_literal(str(item_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")
                            elif p_type_node.get("kind") == "DictType":
                                key_type = p_type_node.get("keyType")
                                value_type = p_type_node.get("valueType")
                                type_node_parts = ["a ex:DictType"]
                                if key_type:
                                    type_node_parts.append(
                                        f"ex:keyType {_ttl_literal(str(key_type))}")
                                if value_type:
                                    type_node_parts.append(
                                        f"ex:valueType {_ttl_literal(str(value_type))}")
                                parts.append(
                                    "ex:paramTypeNode [ " + " ; ".join(type_node_parts) + " ]")

                        bnodes.append("[ " + " ; ".join(parts) + " ]")

                    if bnodes:
                        lines.append(
                            f"  ex:hasParameter {' ,\n                    '.join(bnodes)} .")
                    else:
                        # 将最后的分号改为句点
                        if lines[-1].endswith(";"):
                            lines[-1] = lines[-1][:-1] + " ."
                else:
                    # 没有参数,将最后的分号改为句点
                    if lines[-1].endswith(";"):
                        lines[-1] = lines[-1][:-1] + " ."

                lines.append("")

                # 添加对象与 Action 的绑定关系
                if obj_type_name:
                    lines.append(
                        f"ex:{obj_type_name} ex:bindAction ex:{action_name} .")
                    lines.append("")

        # ============ 逻辑函数关联关系（BindLogic） ============
        # 查询 logic_type <-> object_type 关联表
        logic_bind_rows = await mysql.afetch_all(
            """
            SELECT
            lto.logic_type_id,
            lto.object_type_id,
            lt.logic_type_name,
            ot.object_type_name
            FROM ontology_logic_type_object lto
            JOIN ontology_logic_type lt ON lt.id = lto.logic_type_id
            JOIN ontology_object_type ot ON ot.id = lto.object_type_id
            WHERE lto.ontology_id = %s
            AND lt.sync_status <= 2
            AND ot.sync_status < 3
            """,
            (str(ontology_id),),
        )
        
        # 过滤：只保留逻辑ID在有效逻辑列表中的绑定关系
        if logic_bind_rows:
            if valid_logic_ids:
                logic_bind_rows = [
                    row for row in logic_bind_rows 
                    if str(row.get("logic_type_id")) in valid_logic_ids
                ]
            else:
                # 如果没有有效逻辑，清空所有绑定关系
                logic_bind_rows = []

        if logic_bind_rows:
            lines.extend([
                "##################################",
                "# 逻辑函数关联定义 (bindLogic)",
                "##################################",
            ])
            # 去重集合 (object_name, logic_name)
            seen_logic_binds = set()
            for row in logic_bind_rows:
                l_name_raw = row.get("logic_type_name")
                o_name_raw = row.get("object_type_name")
                if not l_name_raw or not o_name_raw:
                    continue

                l_name = _clean_local_token(str(l_name_raw), "UnnamedFunction")
                o_name = _clean_local_token(str(o_name_raw), "UnnamedObject")

                key = (o_name, l_name)
                if key in seen_logic_binds:
                    continue
                seen_logic_binds.add(key)

                lines.append(f"ex:{o_name} ex:bindLogic ex:{l_name} .")
            
            lines.append("")

        # ============ 对象定义部分 ============
        lines.extend([
            "##################################",
            "# 对象定义(必须继承ex:Object)",
            "##################################",
        ])
        # 预先为每个对象收集主键/标题属性（按新规范：类级别）
        pk_attr_by_object: Dict[str, Optional[str]] = {}
        title_attr_by_object: Dict[str, Optional[str]] = {}
        # 首先按DB中标记推断（一个对象只能有一个主键/标题）
        for obj in object_rows:
            obj_id = obj["id"]
            obj_name = obj["object_type_name"]
            pk_attr = None
            title_attr = None
            for r in attrs_rows:
                if r.get("object_type_id") != obj_id:
                    continue
                if r.get("is_primary_key") and not pk_attr:
                    # 优先使用英文名（attribute_label），如果没有则使用中文名（attribute_name）
                    attr_label = r.get("attribute_label") or ""
                    pk_attr = attr_label.strip() if attr_label and attr_label.strip() else r.get("attribute_name")
                if r.get("is_title") and not title_attr:
                    # 优先使用英文名（attribute_label），如果没有则使用中文名（attribute_name）
                    attr_label = r.get("attribute_label") or ""
                    title_attr = attr_label.strip() if attr_label and attr_label.strip() else r.get("attribute_name")
            pk_attr_by_object[obj_name] = pk_attr
            title_attr_by_object[obj_name] = title_attr

        for obj in object_rows:
            en = obj["object_type_name"] or "UnnamedObject"
            zh = obj["object_type_label"] or en
            desc = (obj.get("object_type_desc") or "").replace('"', '\\"')
            lines.append(f"ex:{en} a owl:Class ;")
            lines.append(f"  rdfs:subClassOf ex:Object ;")
            # 输出中文label（优先级1）和英文label（兜底）
            lines.append(f"  rdfs:label {_ttl_literal(zh, 'zh')} ;")
            lines.append(f"  rdfs:label {_ttl_literal(en, 'en')} ;")
            # 新规范：类级别声明主键/标题属性（若有）
            pk_attr = pk_attr_by_object.get(en)
            title_attr = title_attr_by_object.get(en)
            if pk_attr:
                # 使用新的命名规则：{ObjectType}_{AttributeName}
                pk_attr_iri = f"{en}_{_clean_local_token(str(pk_attr), pk_attr)}"
                lines.append(f"  ex:hasPrimaryKey ex:{pk_attr_iri} ;")
            if title_attr:
                # 使用新的命名规则：{ObjectType}_{AttributeName}
                title_attr_iri = f"{en}_{_clean_local_token(str(title_attr), title_attr)}"
                lines.append(f"  ex:hasTitle ex:{title_attr_iri} ;")
            lines.append(f"  rdfs:comment {_ttl_literal(desc, 'zh')} .\n")

        # ============ 数据属性部分 ============
        lines.extend([
            "##################################",
            "# 数据属性定义",
            "# 每个对象的属性里，只能拥有一个primarykey",
            "# IRI命名规则：ex:{ObjectType}_{AttributeName}",
            "# AttributeName优先使用英文名(attribute_label)，如无则使用中文名(attribute_name)",
            "# 这样可以支持不同对象拥有同名但描述不同的属性",
            "##################################",
        ])

        # 不再按属性名分组，每个对象的每个属性都独立定义
        for attr in attrs_rows:
            obj_name = next((o["object_type_name"]
                            for o in object_rows if o["object_type_id"] == attr["object_type_id"]), None)
            if not obj_name:
                continue
                
            attr_name = attr["attribute_name"]  # 中文名（必填）
            attr_inst = attr.get("attribute_label") or ""  # 英文名（可选）
            attr_type = attr["field_type"]
            attr_desc = attr.get("attribute_desc") or ""
            
            # 构建新的IRI：{ObjectType}_{AttributeName}
            # 优先使用英文名，如果没有英文名则使用中文名
            attr_name_for_iri = attr_inst.strip() if attr_inst and attr_inst.strip() else attr_name
            # 使用 _clean_local_token 确保 IRI 合法性
            attr_iri = f"{obj_name}_{_clean_local_token(attr_name_for_iri, attr_name_for_iri)}"

            lines.append(f"ex:{attr_iri} a owl:DatatypeProperty ;")
            lines.append(f"  rdfs:domain ex:{obj_name} ;")
            lines.append(f"  rdfs:range xsd:{attr_type} ;")
            lines.append(f"  rdfs:comment {_ttl_literal(attr_desc, 'zh')} ;")
            lines.append(f'  rdfs:label "{attr_name}"@zh ;')
            
            # 如果有英文名，则输出 @en 的 label
            if attr_inst and attr_inst.strip():
                lines.append(f'  rdfs:label "{attr_inst}"@en .')
            else:
                # 没有英文名，直接结束（最后一行改为句点）
                lines[-1] = lines[-1].rstrip(' ;') + ' .'
            
            lines.append("")  # 空行

        # ============ 关系定义部分 ============
        lines.extend([
            "##################################",
            "# 关系定义",
            "# 必须继承ex:custom_relation",
            "# 有正向关系就需定义一个反向关系",
            "# IRI命名规则：ex:{domain}_{relationLabel}_{range}",
            "# 这样可以支持多组对象对使用相同的关系标签",
            "##################################",
        ])

        # desc
        # 修改seen_pairs的键结构，使用完整的标识（domain, tag, range）来避免冲突
        seen_triples: set[tuple[str, str, str]] = set()
        for link in link_rows:
            link_id = link.get("link_type_id")
            # 优先从直接关联的对象类型获取名称，其次从属性所属对象获取
            source_obj = (
                link.get("source_direct_object_name") or 
                link.get("source_attr_object_name") or 
                link.get("source_name") or 
                "Source"
            )
            target_obj = (
                link.get("target_direct_object_name") or 
                link.get("target_attr_object_name") or 
                link.get("target_name") or 
                "Target"
            )
            
            # 端点属性名：优先用 SQL 中带出的属性名，兜底用属性ID去 attrs_rows 查到的 attribute_name
            # 同时获取英文名和中文名，优先使用英文名
            source_attr_name = link.get("source_attribute_name")
            source_attr_label = link.get("source_attribute_label")
            target_attr_name = link.get("target_attribute_name")
            target_attr_label = link.get("target_attribute_label")
            
            if not source_attr_name or not target_attr_name:
                # 构建一次性 id->name/label 的映射，避免重复扫描
                if '___attr_id_to_name_cache' not in locals():
                    ___attr_id_to_name_cache = {r.get("attribute_id"): r.get("attribute_name") for r in attrs_rows}
                    ___attr_id_to_label_cache = {r.get("attribute_id"): r.get("attribute_label") for r in attrs_rows}
                
                if not source_attr_name:
                    source_attr_name = ___attr_id_to_name_cache.get(link.get("source_attribute_id"))
                    source_attr_label = ___attr_id_to_label_cache.get(link.get("source_attribute_id"))
                
                if not target_attr_name:
                    target_attr_name = ___attr_id_to_name_cache.get(link.get("target_attribute_id"))
                    target_attr_label = ___attr_id_to_label_cache.get(link.get("target_attribute_id"))
            
            # 优先使用英文名，如果没有英文名则使用中文名
            source_attr_for_iri = source_attr_label.strip() if source_attr_label and source_attr_label.strip() else source_attr_name
            target_attr_for_iri = target_attr_label.strip() if target_attr_label and target_attr_label.strip() else target_attr_name

            for tag in tags_by_link.get(link_id, []):
                base_tag = _clean_local_token(
                    (tag.get("tag_name") or "relation").replace(" ", "_"), "relation")
                tag_name = (tag.get("tag_name") or "relation").replace(" ", "_")
                tag_label = (tag.get("tag_label") or tag_name).replace('"', '\\"')
                tag_desc = (tag.get("tag_desc") or "").replace('"', '\\"')
                direct = (tag.get("link_direct") or "source").lower()

                if direct == "target":
                    domain_name, range_name = target_obj, source_obj
                    domain_attr, range_attr = target_attr_for_iri, source_attr_for_iri
                else:
                    domain_name, range_name = source_obj, target_obj
                    domain_attr, range_attr = source_attr_for_iri, target_attr_for_iri

                # 使用三元组（domain, tag, range）作为键来去重
                triple_key = (domain_name, 
                              base_tag, 
                              range_name
                              )
                if triple_key in seen_triples:
                    continue
                seen_triples.add(triple_key)

                # 构建新的IRI：{domain}_{relationLabel}_{range}
                relation_iri = f"{domain_name}_{base_tag}_{range_name}"

                lines.append(f"ex:{relation_iri} a owl:ObjectProperty ;")
                lines.append(f"  rdfs:subPropertyOf ex:custom_relation ;")
                lines.append(f"  rdfs:domain ex:{domain_name} ;")
                lines.append(f"  rdfs:range ex:{range_name} ;")
                lines.append(f"  rdfs:label {_ttl_literal(tag_label, 'zh')} ;")
                lines.append(f'  ex:relationLabel "{base_tag}"@zh ;')
                # 当能确定端点属性名时，输出 ex:domainAttribute / ex:rangeAttribute 注解
                # 使用新的命名规则：{ObjectType}_{AttributeName}（优先使用英文名）
                if domain_attr and range_attr:
                    # 使用 _clean_local_token 确保 IRI 合法性，与数据属性定义保持一致
                    domain_attr_iri = f"{domain_name}_{_clean_local_token(domain_attr, domain_attr)}"
                    range_attr_iri = f"{range_name}_{_clean_local_token(range_attr, range_attr)}"
                    lines.append(f"  ex:domainAttribute ex:{domain_attr_iri} ;")
                    lines.append(f"  ex:rangeAttribute ex:{range_attr_iri} ;")
                # 如果是多对多关系（link_type == 2），添加中间对象引用
                link_type = link.get("link_type")
                middle_obj_name = middle_object_by_link.get(str(link_id))
                if link_type == 2 and middle_obj_name:
                    lines.append(f"  ex:hasMiddleObject ex:{middle_obj_name} ;")
                # 输出 comment（注意最后一行需要句点结尾）
                lines.append(f"  rdfs:comment {_ttl_literal(tag_desc, 'zh')} .\n")

        # ============ 标签（可选） ============
        # if tag_rows:
        #     lines.extend([
        #         "##################################",
        #         "# 标签定义",
        #         "##################################",
        #     ])
        #     for tag in tag_rows:
        #         tag_name = tag["tag_name"]
        #         tag_label = (tag.get("tag_label", "") or "").replace('"', '\\"')
        #         tag_desc = (tag.get("tag_desc", "") or "").replace('"', '\\"')
        #         lines.append(f"ex:{tag_name} a owl:Class ;")
        #         lines.append(f'  rdfs:label "{tag_label}"@zh ;')
        #         lines.append(f'  rdfs:comment "{tag_desc}" .\n')

        owl_content = "\n".join(lines).strip() + "\n"

        # 构建统计信息
        stats = {
            "objects": len(object_rows),
            "attributes": len(attrs_rows),
            "relations": len(link_rows),
            "logic": len(logic_rows),
            "actions": len(action_rows),
            "interfaces": 0  # OWL导出不包含接口
        }

        logger.info(
            f"ontology_id={ontology_id} 导出 OWL 完成: 对象{len(object_rows)}, 属性{len(attrs_rows)}, "
            f"关联{len(link_rows)}, 标签{len(tag_rows)}, 逻辑{len(logic_rows)}, 动作{len(action_rows)}"
        )
        return owl_content, stats


# ==================================================================================
# Part 3: OWL/Turtle 解析与导入（纯RDF到JSON转换，无数据库依赖）
# ==================================================================================

# Part 3.1: 辅助函数（格式检测、字段提取、命名空间处理等）
# ==================================================================================

# 额外的 AnnotationProperty 命名空间候选（用于识别 isPrimaryKey / isTitle）
EX_NS_CANDIDATES = {
    "http://asiainfo.com/example-owl#",
    "http://asiainfo.com/example-owl",
}


def _guess_format(s: str) -> str:
    """猜测RDF内容的格式（Turtle或RDF/XML）

    Args:
        s: RDF内容字符串

    Returns:
        str: "turtle" 或 "xml"
    """
    head = s.lstrip()[:200].lower()
    if head.startswith("<") or "<rdf:rdf" in head:
        return "xml"
    if head.startswith("@prefix") or " a owl:" in head or " a rdfs:" in head:
        return "turtle"
    return "xml"  # 默认按 RDF/XML


def _local_name(uri) -> str:
    """从完整URI中提取局部名称

    Args:
        uri: RDF URI对象或字符串

    Returns:
        str: URI的局部名称部分

    Example:
        _local_name("http://example.com#User") -> "User"
        _local_name("http://example.com/User") -> "User"
    """
    u = str(uri)
    if "#" in u:
        return u.rsplit("#", 1)[-1]
    u2 = u.rstrip("/")
    if "/" in u2:
        return u2.rsplit("/", 1)[-1]
    # 无分隔符，直接返回整体作为本地名（例如空白节点字符串化或短标识符）
    return u


def _collect_label_map(g: rdflib.Graph, node) -> dict[Optional[str], str]:
    """收集节点的 rdfs:label，并按语言去重。"""
    labels: dict[Optional[str], str] = {}
    for lit in g.objects(node, RDFS.label):
        lang_raw = getattr(lit, "language", None)
        lang = lang_raw.lower() if isinstance(lang_raw, str) else None
        text_val = str(lit).strip()
        if text_val and lang not in labels:
            labels[lang] = text_val
    return labels


def _label_with_priority(
    label_map: dict[Optional[str], str],
    priority: List[Optional[str]],
    fallback: Optional[str] = None,
) -> Optional[str]:
    """根据语言优先级返回首个匹配的标签。"""
    for lang in priority:
        key = lang.lower() if isinstance(lang, str) else None
        value = label_map.get(key)
        if value:
            return value
    return fallback


def _preferred_label(
    g: rdflib.Graph,
    node,
    priority: List[Optional[str]],
    fallback: Optional[str] = None,
) -> Optional[str]:
    """按优先级获取节点标签，未命中返回回退值。"""
    labels = _collect_label_map(g, node)
    return _label_with_priority(labels, priority, fallback=fallback)


def _label_zh(g, node) -> Optional[str]:
    """获取节点的中文标签（rdfs:label@zh）。"""
    return _preferred_label(g, node, ["zh"])


def _first_literal(g, s, p) -> Optional[str]:
    """获取指定谓词的第一个字面量值

    Args:
        g: rdflib.Graph对象
        s: 主语节点
        p: 谓词

    Returns:
        Optional[str]: 字面量值的字符串表示，如果不存在则返回None
    """
    v = next(g.objects(s, p), None)
    return str(v) if v is not None else None


def _normalize_param_type(raw_type: Optional[str]) -> str:
    """标准化参数类型字符串，去除命名空间前缀

    Args:
        raw_type: 原始类型字符串（可能包含xsd:前缀或完整URI）

    Returns:
        str: 标准化后的类型名称（如 "string", "integer"）

    Example:
        _normalize_param_type("xsd:string") -> "string"
        _normalize_param_type("http://www.w3.org/2001/XMLSchema#integer") -> "integer"
        _normalize_param_type(None) -> "string"
    """
    if raw_type is None:
        return "string"
    text = str(raw_type).strip()
    if not text:
        return "string"
    lowered = text.lower()
    if lowered.startswith("xsd:"):
        return text.split(":", 1)[1].lower()
    if "xmlschema#" in lowered:
        return text.rsplit("#", 1)[-1].lower()
    return text


def _fun_params_normalize(params: dict[str, Any] | None) -> dict[str, Any]:
    """统一规范化 fun_params：
    - None -> {}
    - 非 dict -> {"value": str(value)}（容错）
    - dict 原样返回
    """
    if not params:
        return {}
    if isinstance(params, dict):
        return params
    return {"value": str(params)}

def _fun_params_to_json_str(params: dict[str, Any] | None) -> str:
    """fun_params -> JSON 字符串（仅序列化）。"""
    import json
    norm = _fun_params_normalize(params)
    return json.dumps(norm, ensure_ascii=False)
def _bool_ann(g: rdflib.Graph, s, key: str) -> int:
    """读取布尔型注解属性（如isPrimaryKey, isTitle）

    通过多个候选命名空间尝试查找注解属性，支持不同格式的OWL文件。

    Args:
        g: rdflib.Graph对象
        s: 主语节点（通常是数据属性）
        key: 注解属性的局部名（如 "isPrimaryKey", "isTitle"）

    Returns:
        int: 1表示true，0表示false

    Note:
        会在以下位置查找注解属性：
        1. 节点自身的命名空间 + key
        2. EX_NS_CANDIDATES中的所有候选命名空间 + key
    """
    base = str(s)
    # 构造候选注解属性命名空间前缀
    if "#" in base:
        base_prefix = base.rsplit("#", 1)[0] + "#"
    else:
        b2 = base.rstrip("/")
        base_prefix = (b2.rsplit("/", 1)[0] + "/") if "/" in b2 else None
    candidates = []
    if base_prefix:
        candidates.append(rdflib.URIRef(base_prefix + key))
    for ex in EX_NS_CANDIDATES:
        ex2 = ex if ex.endswith(("#", "/")) else (ex + "#")
        candidates.append(rdflib.URIRef(ex2 + key))
    for p in candidates:
        for o in g.objects(s, p):
            v = str(o).strip().lower()
            if v in ("true", "1", "yes"):
                return 1
            if v in ("false", "0", "no"):
                return 0
            if isinstance(o, rdflib.Literal) and o.datatype == XSD.boolean:
                try:
                    return 1 if bool(o.toPython()) else 0
                except Exception:
                    pass
    return 0


def _split_ns_and_local(u: str) -> tuple[str, str]:
    """将完整URI切分为命名空间基址和局部名

    支持两种URI格式：
    1. 哈希片段格式：http://example.com/ontology#ClassName
    2. 斜杠路径格式：http://example.com/ontology/ClassName

    Args:
        u: 完整的URI字符串

    Returns:
        tuple[str, str]: (命名空间基址, 局部名)，基址末尾保留 # 或 /

    Example:
        _split_ns_and_local("http://example.com#User") -> ("http://example.com#", "User")
        _split_ns_and_local("http://example.com/User") -> ("http://example.com/", "User")
    """
    if not u:
        return "", ""
    if "#" in u:
        base, local = u.rsplit("#", 1)
        return base + "#", local
    u2 = u.rstrip("/")
    if "/" in u2:
        base, local = u2.rsplit("/", 1)
        return base + "/", local
    # 无命名空间分隔符，交由上层忽略该节点
    raise ValueError(f"URI has no namespace delimiter: {u}")


def _detect_ex_base(g: rdflib.Graph) -> Optional[str]:
    """
    自动探测"示例本体"命名空间基址（与前缀名无关）。
    依据常见本体局部名(Object / Entity / custom_relation 等)出现的位置来判断。
    """
    TARGET_LOCALS = {"Entity", "Object", "Action", "Function", "Logic",
                     "bindAction", "bindFunction", "bindLogic", "custom_relation",
                     # support both legacy property-level and new class-level annotations
                     "isPrimaryKey", "isTitle", "hasPrimaryKey", "hasTitle"}
    base_counter: Dict[str, int] = {}

    # 扫 class / object property / annotation property
    for s in g.subjects(RDF.type, OWL.Class):
        if not isinstance(s, rdflib.URIRef):
            continue
        try:
            base, local = _split_ns_and_local(str(s))
        except ValueError:
            continue
        if local in TARGET_LOCALS:
            base_counter[base] = base_counter.get(base, 0) + 3  # 类权重稍高
    for s in g.subjects(RDF.type, OWL.ObjectProperty):
        if not isinstance(s, rdflib.URIRef):
            continue
        try:
            base, local = _split_ns_and_local(str(s))
        except ValueError:
            continue
        if local in TARGET_LOCALS:
            base_counter[base] = base_counter.get(base, 0) + 2
    for s in g.subjects(RDF.type, OWL.AnnotationProperty):
        if not isinstance(s, rdflib.URIRef):
            continue
        try:
            base, local = _split_ns_and_local(str(s))
        except ValueError:
            continue
        if local in TARGET_LOCALS:
            base_counter[base] = base_counter.get(base, 0) + 1

    if not base_counter:
        # 兜底：找名为 Object 的类
        for s in set(g.subjects(RDF.type, OWL.Class)):
            if not isinstance(s, rdflib.URIRef):
                continue
            try:
                base, local = _split_ns_and_local(str(s))
            except ValueError:
                continue
            if local == "Object":
                base_counter[base] = base_counter.get(base, 0) + 1

    if not base_counter:
        return None

    # 返回出现最多的基址
    return max(base_counter.items(), key=lambda kv: kv[1])[0]


def _ann_uri_local(g: rdflib.Graph, s, key: str) -> Optional[str]:
    """Return local name of the first URI object of annotation 'key' on subject 's'.
    It searches using flexible namespace candidates similar to _bool_ann.
    """
    base = str(s)
    if "#" in base:
        base_prefix = base.rsplit("#", 1)[0] + "#"
    else:
        b2 = base.rstrip("/")
        base_prefix = (b2.rsplit("/", 1)[0] + "/") if "/" in b2 else None
    candidates = []
    if base_prefix:
        candidates.append(rdflib.URIRef(base_prefix + key))
    for ex in EX_NS_CANDIDATES:
        ex2 = ex if ex.endswith(("#", "/")) else (ex + "#")
        candidates.append(rdflib.URIRef(ex2 + key))
    for p in candidates:
        for o in g.objects(s, p):
            try:
                if isinstance(o, rdflib.term.Identifier):
                    return _local_name(o)
            except Exception:
                pass
    return None


def _ann_uri_locals(g: rdflib.Graph, s, key: str) -> set[str]:
    """Return a set of local names of all URI objects of annotation 'key' on subject 's'.

    This reads annotation properties whose objects are IRIs (e.g., ex:hasPrimaryKey ex:OrderID),
    returning their local names (e.g., "OrderID"). Namespace matching is flexible like _bool_ann.
    """
    base = str(s)
    if "#" in base:
        base_prefix = base.rsplit("#", 1)[0] + "#"
    else:
        b2 = base.rstrip("/")
        base_prefix = (b2.rsplit("/", 1)[0] + "/") if "/" in b2 else None
    candidates = []
    if base_prefix:
        candidates.append(rdflib.URIRef(base_prefix + key))
    for ex in EX_NS_CANDIDATES:
        ex2 = ex if ex.endswith(("#", "/")) else (ex + "#")
        candidates.append(rdflib.URIRef(ex2 + key))
    locals_set: set[str] = set()
    for p in candidates:
        for o in g.objects(s, p):
            try:
                if isinstance(o, rdflib.term.Identifier):
                    locals_set.add(_local_name(o))
            except Exception:
                pass
    return locals_set


def _iter_domain_classes(g: rdflib.Graph, domain_node):
    """解析rdfs:domain为一个或多个类（支持owl:unionOf）

    处理两种情况：
    1. domain直接指向一个类URI
    2. domain指向一个unionOf列表（表示多个可能的domain类）

    Args:
        g: rdflib.Graph对象
        domain_node: rdfs:domain的对象节点

    Yields:
        rdflib.URIRef: domain中的每个类URI

    Example:
        # 单个domain
        ex:hasName rdfs:domain ex:User .

        # unionOf多个domain
        ex:hasID rdfs:domain [ owl:unionOf ( ex:User ex:Product ) ] .
    """
    # 直接就是类 URI
    if isinstance(domain_node, rdflib.URIRef):
        yield domain_node
        return
    # 处理 unionOf 列表
    for lst in g.objects(domain_node, OWL.unionOf):
        cur = lst
        while cur and cur != RDF.nil:
            first = g.value(cur, RDF.first)
            if isinstance(first, rdflib.URIRef):
                yield first
            cur = g.value(cur, RDF.rest)


# ==================================================================================
# Part 3.2: RDF解析函数（OWL/Turtle → Python字典结构）
# ==================================================================================


def parse_owl_to_payloads(owl_content: str):
    """
    解析 OWL，仅产出"业务对象/属性/关系"的 payload。
       过滤掉基础抽象类与通用语义（ex:Entity/Object/Action/Function 及基类关系/注解）。
    """
    error_list = []
    global EX_NS_CANDIDATES
    EX_DEFAULT_BASE = "http://asiainfo.com/example-owl#"

    g = rdflib.Graph()
    fmt = _guess_format(owl_content)
    # 仅当是 Turtle 时，对 ex:局部名做预清洗（删特殊字符、避免数字开头、处理重名）
    # if fmt == "turtle":
    #     owl_content, _ = _sanitize_ex_local_names_collision_safe(owl_content)
    first_err_meta = None
    try:
        g.parse(data=owl_content, format=fmt)
    except Exception as e:
        logger.error(f"Failed to parse OWL ({fmt}): {e}")
        first_err_meta = _extract_parse_error(e, owl_content)
        # 兜底再试一次：xml<->turtle 对调
        try:
            g.parse(data=owl_content, format=("turtle" if fmt == "xml" else "xml"))
        except Exception as e2:
            logger.error(f"Fallback parse failed: {e2}")
            # 若首轮已有行信息，则返回该信息；否则抽取二次错误
            if not first_err_meta:
                first_err_meta = _extract_parse_error(e2, owl_content)
                # print(first_err_meta)
            return {
                "status": "failed",
                "message": f"OWL 解析失败: 第{first_err_meta['line']}行出错 - 错误信息如下: {first_err_meta['original_error']}",
                "data": {},
                "code": "500"
            }

    # === 关键：动态命名空间（最小改动）===
    ex_base = _detect_ex_base(g)
    if not ex_base:
        # 兜底：按所有 owl:Class 的命名空间出现频次选一个"主命名空间"
        base_counter: Dict[str, int] = {}
        for c in g.subjects(RDF.type, OWL.Class):
            if not isinstance(c, rdflib.URIRef):
                continue
            try:
                b, _ = _split_ns_and_local(str(c))
            except ValueError:
                continue
            base_counter[b] = base_counter.get(b, 0) + 1
        # 如果一个都没有，直接用默认
        if base_counter:
            ex_base = max(base_counter.items(), key=lambda x: x[1])[0]
        else:
            ex_base = EX_DEFAULT_BASE

    EX = rdflib.Namespace(ex_base)
    EX_NS = str(EX)
    # 非法命名分组：{category: [local1, local2, ...]}
    illegal_map: Dict[str, List[str]] = {}
    # 数据属性（DatatypeProperty）允许中文；其它类型限定英文+数字+下划线
    RE_OP = re.compile(r"^[A-Za-z0-9_\u4E00-\u9FFF]+$")

    # 其它类型不允许中文
    RE_NORMAL = re.compile(r"^[A-Za-z0-9_]+$")

    def get_category(node):
        # 1）对象属性：允许中文
        if (node, RDF.type, OWL.ObjectProperty) in g:
            return "relation"
        # 1.1）Action / Function / Logic 个体：a ex:Action / a ex:Function / a ex:Logic
        if (node, RDF.type, EX.Action) in g:
            return "action"
        if (node, RDF.type, EX.Function) in g:
            return "function"
        if (node, RDF.type, EX.Logic) in g:
            return "logic"
        # 2）Action / Function / Logic 类：属于业务类
        if (node, RDF.type, OWL.Class) in g and (node, RDFS.subClassOf, EX.Action) in g:
            return "action"
        if (node, RDF.type, OWL.Class) in g and (node, RDFS.subClassOf, EX.Function) in g:
            return "function"
        if (node, RDF.type, OWL.Class) in g and (node, RDFS.subClassOf, EX.Logic) in g:
            return "logic"
        # 3）普通类
        if (node, RDF.type, OWL.Class) in g:
            if (node, RDFS.subClassOf, EX.Object) in g:
                return "object"
            return "class"
        # 4）数据属性
        if (node, RDF.type, OWL.DatatypeProperty) in g:
            return "property"
        return "unknown"


    # 找出所有节点
    all_nodes = set(g.subjects()) | set(g.predicates()) | set(g.objects())

    for node in all_nodes:
        if isinstance(node, rdflib.URIRef) and str(node).startswith(EX_NS):
            local = _local_name(node)

            # 名称必须是 A-Za-z0-9_
            category = get_category(node)
            # 仅数据属性允许中文，其它类别使用严格英文+数字+下划线
            if category == "property":
                if not RE_OP.match(local):
                    illegal_map.setdefault(category, []).append(local)
            else:
                # 包含：class、object、action、function、property
                if not RE_NORMAL.match(local):
                    illegal_map.setdefault(category, []).append(local)
    if illegal_map:
        parts = []
        for k, lst in illegal_map.items():
            if not lst:
                continue
            parts.append(f"{k}({len(lst)}): {', '.join(lst)}")
        error_list = "非法命名 -> " + "; ".join(parts)
        return {
            "status": "failed",
            "message": error_list,      # 更友好的字符串
            "data": {},      # 原始映射；若需空对象改成 {}
            "code": "500"
        }

    # === 对象属性（owl:ObjectProperty）块级行号映射 ===
    # rdflib 默认不保留每条 triple 的源文件行号；这里用 Turtle 文本块起始行作为定位。
    # key: op_local（如 ex:hasOrder -> hasOrder）; value: 1-based line number
    op_block_line_map: dict[str, int] = {}
    if fmt == "turtle":
        try:
            _op_block_re = re.compile(
                r"(?P<full>\b(?P<prefix>\w+):(?P<op>[\w\-]+)\s+(?:a|(?:\w+):type)\s+owl:ObjectProperty\s*;(?P<body>.*?)\.)",
                re.DOTALL,
            )
            for m in _op_block_re.finditer(owl_content):
                op_local = m.group("op")
                if not op_local:
                    continue
                # 取首次出现的块起始行号
                if op_local not in op_block_line_map:
                    op_block_line_map[op_local] = owl_content.count("\n", 0, m.start()) + 1
        except Exception:
            op_block_line_map = {}

    def _fuzzy_find_line(text: str, token: str) -> Optional[int]:
        if not text or not token:
            return None
        idx = text.find(token)
        if idx < 0:
            return None
        return text.count("\n", 0, idx) + 1

    def _is_framework_op(uri) -> bool:
        """判断是否为框架内部使用的对象属性（ObjectProperty）"""
        return str(uri) in (
            str(EX.bindAction), 
            str(EX.bindFunction), 
            str(EX.bindLogic), 
            str(EX.custom_relation), 
            str(EX.hasParameter),
            str(EX.paramTypeNode),
            str(EX.hasMiddleObject)
        )
    
    def _is_framework_dp(uri) -> bool:
        """判断是否为框架内部使用的数据属性（DatatypeProperty）"""
        return str(uri) in (
            str(EX.paramName),      # 参数名
            str(EX.paramType),      # 参数类型
            str(EX.itemType),       # 列表元素类型
            str(EX.keyType),        # 字典键类型
            str(EX.valueType),      # 字典值类型
            str(EX.isOptional),     # 是否可选
            str(EX.defaultValue)    # 默认值
        )

    # —— 先收集"全量的对象属性（ObjectProperty）" ——
    ops_all = []
    op_label_map: dict[str, dict[str, Any]] = {}
    relation_label_map: dict[str, str] = {}  # 新增：IRI -> relationLabel 的映射
    for op in g.subjects(RDF.type, OWL.ObjectProperty):
        if _is_framework_op(op):
            continue
        op_local = _local_name(op)
        labels_map = _collect_label_map(g, op)

        # 对象属性英文名：优先使用 @en label，否则使用局部名（可选）
        op_name_en = (_label_with_priority(labels_map, ["en"]) or "").strip()
        
        # 对象属性中文名/标签：优先 @zh label，其次无语言标签，最后 @en label 或局部名
        op_label = _label_with_priority(labels_map, ["zh", None, "en"]) or op_name_en or op_local
        comment = _first_literal(g, op, RDFS.comment)
        
        # 新格式：尝试读取 ex:relationLabel 属性作为标签名
        relation_label = None
        try:
            # 遍历所有可能的ex命名空间候选
            for ex_candidate in EX_NS_CANDIDATES:
                relation_label_uri = rdflib.URIRef(ex_candidate + "relationLabel")
                relation_label_value = g.value(op, relation_label_uri)
                if relation_label_value:
                    relation_label = str(relation_label_value)
                    break
        except Exception:
            pass
        
        # 关系标识（tag_name）保持与历史逻辑一致：优先 relationLabel，否则用局部名。
        # rdfs:label@en 仅做“英文名必填”校验，不作为关系标识来源，避免改变导入/导出稳定性。
        tag_name = relation_label if relation_label else op_local
        relation_label_map[op_local] = tag_name
        
        ops_all.append({
            "op_name": tag_name,  # 使用relationLabel或局部名作为标签名
            "label_zh": op_label,
            "comment": comment,
        })
        op_label_map[op_local] = {
            "label": op_label,
            "labels_map": labels_map,
        }
    # 让注解解析能识别动态 ex 基址（确保是 set）
    try:
        EX_NS_CANDIDATES.add(ex_base)
    except AttributeError:
        EX_NS_CANDIDATES = set(EX_NS_CANDIDATES)
        EX_NS_CANDIDATES.add(ex_base)

    # 现在再定义依赖 EX 的函数（避免未定义）
    def _is_business_class(g: rdflib.Graph, cls) -> bool:
        """业务对象：必须是 ex:Object 的子类，且不是 ex:Object/Entity/Action/Function 本身。"""
        if str(cls) in (str(EX.Entity), str(EX.Object), str(EX.Action), str(EX.Function)):
            return False
        return (cls, RDFS.subClassOf, EX.Object) in g

    # ---------- 业务对象 ----------
    all_classes = set(g.subjects(RDF.type, OWL.Class))

    # 严格模式：必须是 EX:Object 的子类，且排除骨架类和辅助类
    # 骨架基础类：Entity, Object, Action, Function, Logic
    # 辅助工具类：Parameter, ListType, DictType, ontologyName
    base_excludes = {
        "Entity", "Object", "Action", "Function", "Logic",
        "Parameter", "ListType", "DictType", "ontologyName"
    }
    biz_classes = {
        c for c in all_classes
        if _is_business_class(g, c) and _local_name(c) not in base_excludes
    }

    # 兜底：如果没有骨架（没有任何 Object 子类），
    #      就取"当前业务命名空间下的所有类"，仍然排除骨架类和辅助类
    if not biz_classes:
        biz_classes = {
            c for c in all_classes
            if str(c).startswith(ex_base) and _local_name(c) not in base_excludes
        }

    biz_names = {_local_name(c) for c in biz_classes}

    class_infos: dict[str, dict[str, Any]] = {}
    used_object_type_names: set[str] = set()
    for cls in sorted(biz_classes, key=_local_name):
        local_name = _local_name(cls)
        if not local_name:
            continue
        if not re.match(r"^[A-Za-z0-9_]+$", local_name):
            error_list.append({
                "type": "invalid_local_name",
                "value": local_name
            })
            continue    # 不终止程序，继续解析下一个对象
        labels_map = _collect_label_map(g, cls)
        # 对象英文名优先级：1. 局部名（prefix 后的内容）  2. @en label
        name_en = (local_name or (_label_with_priority(labels_map, ["en"]) or "").strip())
        # 校验局部名是否合法：仅允许大小写英文、数字、下划线
        if name_en in used_object_type_names and name_en != local_name:
            base = local_name
            candidate = base
            idx = 2
            while candidate in used_object_type_names:
                candidate = f"{base}_{idx}"
                idx += 1
            name_en = candidate
        used_object_type_names.add(name_en)
        # 对象中文名优先级：1. @zh label  2. 无语言标签label  3. @en label  4. 英文名
        label_cn = _label_with_priority(
            labels_map, ["zh", None, "en"]) or name_en
        desc = _first_literal(g, cls, RDFS.comment)
        class_infos[local_name] = {
            "node": cls,
            "name_en": name_en,
            "label_cn": label_cn,
            "desc": desc,
            "labels_map": labels_map,
        }
    biz_names = set(class_infos.keys())

    # 预解析：类级别主键/标题声明（hasPrimaryKey / hasTitle）
    # 结果：映射到局部名集合，后续按属性局部名匹配
    class_pk_locals: dict[str, set[str]] = {}
    class_title_locals: dict[str, set[str]] = {}
    for local_name, info in class_infos.items():
        cls_node = info["node"]
        pk_set = _ann_uri_locals(g, cls_node, "hasPrimaryKey") or set()
        title_set = _ann_uri_locals(g, cls_node, "hasTitle") or set()
        if pk_set:
            class_pk_locals[local_name] = pk_set
        if title_set:
            class_title_locals[local_name] = title_set

    # 1) 类 -> 对象类型（仅业务对象）
    objects = []
    for local_name, info in class_infos.items():
        objects.append({
            "object_type_name": info["name_en"],
            "object_type_label": info["label_cn"],
            "object_type_desc": info["desc"],
            "object_type_local_name": local_name,
        })

    # 2) 数据属性 -> 属性表（支持 domain 为单类或 unionOf 多类）
    attributes = []
    _seen_attr_keys = set()  # 去重：(对象英文名, 属性英文名)
    for prop in g.subjects(RDF.type, OWL.DatatypeProperty):
        # 跳过框架内部使用的数据属性
        if _is_framework_dp(prop):
            continue
        
        domains = list(g.objects(prop, RDFS.domain))
        if not domains:
            continue
        for d0 in domains:
            for cls in _iter_domain_classes(g, d0):
                cls_local = _local_name(cls)
                owner_info = class_infos.get(cls_local)
                if not owner_info:
                    continue
                attr_local = _local_name(prop)
                labels_map = _collect_label_map(g, prop)
                
                # 从局部名中提取属性名部分
                # 新格式局部名：ObjectType_AttributeName，需要提取 AttributeName 部分
                if "_" in attr_local and attr_local.split("_", 1)[0] == cls_local:
                    # 新格式：ex:Customer_客户ID -> 提取"客户ID"
                    extracted_attr_name = attr_local.split("_", 1)[1]
                else:
                    # 旧格式：直接使用局部名
                    extracted_attr_name = attr_local
                
                # 属性中文名优先级：1. @zh label  2. 无语言标签label  3. 提取的属性名
                attr_name_cn = _label_with_priority(
                    labels_map, ["zh", None]) or extracted_attr_name
                
                # 校验中文名格式：不允许空格和特殊字符（只允许中文、英文、数字、下划线）
                if attr_name_cn:
                    # 检查长度限制
                    if len(attr_name_cn) > 100:
                        line_no = _fuzzy_find_line(owl_content, f":{attr_local}") or _fuzzy_find_line(owl_content, attr_local)
                        line_text = f"第{line_no}行" if line_no else "未知行号"
                        error_list.append({
                            "type": "datatype_property_zh_label_too_long",
                            "dp_local": attr_local,
                            "owner_class": cls_local,
                            "line": line_no,
                            "attr_name_cn": attr_name_cn,
                            "length": len(attr_name_cn),
                            "message": f"数据属性中文名过长：RDF {line_text} 的数据属性 '{attr_local}' 的中文名 '{attr_name_cn[:30]}...' 长度为 {len(attr_name_cn)} 字符，超过 100 字符限制",
                        })
                        continue
                    
                    # 检查是否包含非法字符（不允许空格和特殊字符）
                    if not re.match(r'^[A-Za-z0-9_\u4E00-\u9FFF]+$', attr_name_cn):
                        line_no = _fuzzy_find_line(owl_content, f":{attr_local}") or _fuzzy_find_line(owl_content, attr_local)
                        line_text = f"第{line_no}行" if line_no else "未知行号"
                        # 找出非法字符
                        illegal_chars = set(re.findall(r'[^A-Za-z0-9_\u4E00-\u9FFF]', attr_name_cn))
                        illegal_chars_str = ', '.join(f"'{c}'" for c in sorted(illegal_chars))
                        error_list.append({
                            "type": "datatype_property_zh_label_invalid_chars",
                            "dp_local": attr_local,
                            "owner_class": cls_local,
                            "line": line_no,
                            "attr_name_cn": attr_name_cn,
                            "illegal_chars": list(illegal_chars),
                            "message": f"数据属性中文名包含非法字符：RDF {line_text} 的数据属性 '{attr_local}' 的中文名 '{attr_name_cn}' 包含非法字符 {illegal_chars_str}。仅允许中文、英文、数字、下划线，不允许空格和其他特殊字符",
                        })
                        continue
                
                # 属性英文名：必须提供 rdfs:label@en 且不能为空
                field_name_en = (_label_with_priority(
                    labels_map, ["en"]) or "").strip()
                if not field_name_en:
                    line_no = _fuzzy_find_line(owl_content, f":{attr_local}") or _fuzzy_find_line(owl_content, attr_local)
                    line_text = f"第{line_no}行" if line_no else "未知行号"
                    error_list.append({
                        "type": "missing_datatype_property_en_label",
                        "dp_local": attr_local,
                        "owner_class": cls_local,
                        "line": line_no,
                        "message": f"数据属性缺失英文名：RDF {line_text} 的数据属性 '{attr_local}' 缺失 rdfs:label@en（英文名不能为空）",
                    })
                    continue
                # 属性描述优先级：1. rdfs:comment@zh  2. rdfs:comment@en  3. None
                _comment_zh = None
                _comment_en = None
                for c in g.objects(prop, RDFS.comment):
                    try:
                        lang = getattr(c, "language", None)
                        text = str(c)
                    except Exception:
                        lang = None
                        text = str(c)
                    if lang == "zh" and _comment_zh is None and text:
                        _comment_zh = text
                    elif lang == "en" and _comment_en is None and text:
                        _comment_en = text
                attr_desc = _comment_zh or _comment_en or None
                # 去重键：使用对象名和属性中文名，避免英文名为空时误去重
                key = (owner_info["name_en"], attr_name_cn)
                if key in _seen_attr_keys:
                    continue
                _seen_attr_keys.add(key)
                # 先按新规范：类级别 hasPrimaryKey/hasTitle 指定的数据属性局部名
                # 兼容新旧两种格式的匹配
                pk_set = class_pk_locals.get(cls_local) or set()
                title_set = class_title_locals.get(cls_local) or set()
                
                # 新格式：完整的属性IRI（如 Customer_客户ID）
                # 旧格式：仅属性名（如 客户ID）
                is_pk_new = 1 if (attr_local in pk_set or extracted_attr_name in pk_set) else 0
                is_title_new = 1 if (attr_local in title_set or extracted_attr_name in title_set) else 0

                # 兼容旧规范：属性自身 isPrimaryKey / isTitle 布尔注解
                is_pk_old = _bool_ann(g, prop, "isPrimaryKey")
                is_title_old = _bool_ann(g, prop, "isTitle")

                # 优先采用类级别声明，若未声明则退回旧注解
                is_pk_final = is_pk_new if is_pk_new in (0, 1) and is_pk_new == 1 else is_pk_old
                is_title_final = is_title_new if is_title_new in (0, 1) and is_title_new == 1 else is_title_old

                attributes.append({
                    "belong_object_type_name": owner_info["name_en"],
                    "belong_object_type_local_name": cls_local,
                    "attribute_name": attr_name_cn,  # 中文名
                    "attribute_en_name": field_name_en,  # 英文名（可能为空）
                    "attribute_desc": attr_desc,
                    "attribute_local_name": attr_local,
                    "is_primary_key": is_pk_final,
                    "is_title": is_title_final,
                })

    # 3) 对象属性 -> 连接表
    links = []
    op2label_zh = {}
    
    # ==== 收集中间对象信息 ====
    middle_object_names = set()  # 存储中间对象的名称
    try:
        EX = rdflib.Namespace(ex_base)
        # 查找所有使用 ex:hasMiddleObject 的关系
        for s, p, o in g.triples((None, EX.hasMiddleObject, None)):
            if isinstance(o, rdflib.URIRef):
                middle_obj_local = _local_name(o)
                if middle_obj_local:
                    middle_object_names.add(middle_obj_local)
    except Exception as e:
        logger.warning(f"Failed to parse middle objects: {e}")

    # ==== 公共映射：根据局部名找回图里的节点（用于拿中文 label）====
    op_node_by_local = {
        _local_name(op): op
        for op in g.subjects(RDF.type, OWL.ObjectProperty)
    }
    class_node_by_local = {
        _local_name(c): c
        for c in g.subjects(RDF.type, OWL.Class)
    }

    # ========= Turtle 文本块解析（按块一一配对，避免笛卡尔积/顺序丢失）=========
    def _parse_pairs_from_turtle_blocks(ttl: str):
        """
        从 Turtle 文本按"对象属性定义块"提取 (op_local, [domains], [ranges]) 的列表。
        每个块内按出现顺序一一配对（zip），多余的截断。
        支持 [ owl:unionOf ( ex:A ex:B ... ) ] 展开，保持文本顺序。
        """
        pairs = []

        # 形如：ex:Prop a owl:ObjectProperty ; 或 ex:Prop rdf:type owl:ObjectProperty ; ... .
        # 注意：\w+ 支持Unicode字符（包括中文、日文等），确保ObjectProperty局部名可以使用中文
        block_re = re.compile(
            r"(?P<full>\b(?P<prefix>\w+):(?P<op>[\w\-]+)\s+(?:a|(?:\w+):type)\s+owl:ObjectProperty\s*;(?P<body>.*?)\.)",
            re.DOTALL
        )

        # rdfs:domain ex:Foo ;  / rdfs:range ex:Bar ;
        # 支持Unicode字符作为类名和属性名
        dom_single_re = re.compile(
            r"rdfs:domain\s+(\w+:[\w\-]+)\s*;?")
        rng_single_re = re.compile(
            r"rdfs:range\s+(\w+:[\w\-]+)\s*;?")

        # unionOf: rdfs:domain [ a owl:Class ; owl:unionOf ( ex:A ex:B ... ) ]
        # 兼容两种写法：
        # - [ owl:unionOf (...) ]
        # - [ a owl:Class ; owl:unionOf (...) ]
        dom_union_re = re.compile(
            r"rdfs:domain\s+\[\s*(?:a\s+owl:Class\s*;\s*)?owl:unionOf\s*\(\s*([^)]+?)\s*\)\s*\]\s*;?",
            re.DOTALL,
        )
        rng_union_re = re.compile(
            r"rdfs:range\s+\[\s*(?:a\s+owl:Class\s*;\s*)?owl:unionOf\s*\(\s*([^)]+?)\s*\)\s*\]\s*;?",
            re.DOTALL,
        )

        # 从 "( ex:A ex:B ex:C )" 捕出 token 列表（保持文本顺序）
        # 支持Unicode字符
        def _split_union_items(s: str):
            return [tok.strip() for tok in re.findall(r"\w+:[\w\-]+", s)]

        for m in block_re.finditer(ttl):
            op_local = m.group("op")
            body = m.group("body")

            domains: list[str] = []
            ranges:  list[str] = []

            # 先 union 再单值，保持作者文本顺序
            for um in dom_union_re.finditer(body):
                domains.extend(_split_union_items(um.group(1)))
            for sm in dom_single_re.finditer(body):
                domains.append(sm.group(1))

            for um in rng_union_re.finditer(body):
                ranges.extend(_split_union_items(um.group(1)))
            for sm in rng_single_re.finditer(body):
                ranges.append(sm.group(1))

            if domains and ranges:
                # 配对策略：
                # - domain/range 数量一致：保持作者“顺序一一配对”（兼容旧行为）
                # - 一边为 1、另一边为 N（常见于 unionOf）：做 1xN 扩展，避免丢关系
                # - 其它不一致：退化为笛卡尔积，并给出 warning
                if len(domains) == len(ranges):
                    chosen_pairs = zip(domains, ranges)
                elif len(domains) == 1:
                    chosen_pairs = ((domains[0], r) for r in ranges)
                elif len(ranges) == 1:
                    chosen_pairs = ((d, ranges[0]) for d in domains)
                else:
                    logger.warning(
                        f"[pairing@ttl-block] {op_local}: domain={len(domains)} range={len(ranges)}; cartesian product")
                    chosen_pairs = ((d, r) for d in domains for r in ranges)

                for d, r in chosen_pairs:
                    # 只取局部名（前缀无关）
                    pairs.append((op_local, d.split(":")[-1], r.split(":")[-1]))

        return pairs
    # =========================================================================

    op_declarations = []

    if fmt == "turtle":
        # 直接按 Turtle 文本块提取配对；保持作者顺序 & 多块声明
        for op_local, d_local, r_local in _parse_pairs_from_turtle_blocks(owl_content):
            if d_local not in biz_names or r_local not in biz_names:
                continue

            # 获取关系的真实标签名（relationLabel）
            tag_name = relation_label_map.get(op_local, op_local)
            
            # 记录关系声明（使用relationLabel作为op_name）
            op_declarations.append({
                "op_name": tag_name,
                "source_name": d_local,
                "target_name": r_local,
                "source_class": class_node_by_local.get(d_local),
                "target_class": class_node_by_local.get(r_local),
            })

            # 维护标签字典（用图里节点取中文 label；取不到就 None，但也要建键）
            if tag_name not in op2label_zh:
                op2label_zh[tag_name] = op_label_map.get(
                    op_local, {}).get("label")

    else:
        # 非 Turtle（如 RDF/XML）保留图法，但做稳定排序再 zip，避免随机顺序
        def _expand_classes(node):
            cs = list(_iter_domain_classes(g, node))
            if cs:
                return cs
            return [node] if isinstance(node, rdflib.URIRef) else []

        for op in g.subjects(RDF.type, OWL.ObjectProperty):
            if str(op) in (str(EX.bindAction), str(EX.bindFunction), str(EX.bindLogic), str(EX.custom_relation)):
                continue
            op_local = _local_name(op)
            # 获取关系的真实标签名（relationLabel）
            tag_name = relation_label_map.get(op_local, op_local)
            op2label_zh[tag_name] = op_label_map.get(op_local, {}).get("label")

            d_nodes = [obj for _, _, obj in g.triples((op, RDFS.domain, None))]
            r_nodes = [obj for _, _, obj in g.triples((op, RDFS.range,  None))]

            d_classes = [c for n in d_nodes for c in _expand_classes(n)]
            r_classes = [c for n in r_nodes for c in _expand_classes(n)]

            # 稳定性：按局部名排序后 zip（避免遍历顺序漂移）
            d_classes = sorted(
                (c for c in d_classes if isinstance(c, rdflib.URIRef)),
                key=lambda x: _local_name(x)
            )
            r_classes = sorted(
                (c for c in r_classes if isinstance(c, rdflib.URIRef)),
                key=lambda x: _local_name(x)
            )

            if len(d_classes) != len(r_classes):
                logger.warning(
                    f"[pairing@xml-zip] {op_local}: domain={len(d_classes)} range={len(r_classes)}; zip(min)")

            for s_cls, t_cls in zip(d_classes, r_classes):
                s_name, t_name = _local_name(s_cls), _local_name(t_cls)
                if s_name in biz_names and t_name in biz_names:
                    op_declarations.append({
                        "op_name": tag_name,  # 使用relationLabel而不是op_local
                        "source_name": s_name,
                        "target_name": t_name,
                        "source_class": s_cls,
                        "target_class": t_cls
                    })

    # 去重：相同 (op_name, source_name, target_name) 只保留一个
    seen_declarations = set()
    for decl in op_declarations:
        key = (decl["op_name"], decl["source_name"], decl["target_name"])
        if key in seen_declarations:
            continue
        seen_declarations.add(key)

        # 保留 op_name 以便后续关联标签
        source_local = decl["source_name"]
        target_local = decl["target_name"]
        source_info = class_infos.get(source_local)
        target_info = class_infos.get(target_local)
        if not source_info or not target_info:
            continue
        links.append({
            "op_name": decl["op_name"],  # 新增：对象属性名称，用于关联标签
            "source_name": source_info["name_en"],
            "source_label": source_info["label_cn"] or source_info["name_en"],
            "target_name": target_info["name_en"],
            "target_label": target_info["label_cn"] or target_info["name_en"],
        })

    # === 无向去重（A?B 只保留先出现的一条,但收集双向标签）===
    filtered_links = []
    seen_undirected = set()  # 元素形如：frozenset({A,B})
    # 用于收集反向关系的标签: {frozenset({A,B}): {"A->B": "tag1", "B->A": "tag2"}}
    undirected_tags = {}

    for l in links:
        key = frozenset({l["source_name"], l["target_name"]})
        direction_key = f"{l['source_name']}->{l['target_name']}"

        if key not in undirected_tags:
            undirected_tags[key] = {}
        undirected_tags[key][direction_key] = l["op_name"]

        if key in seen_undirected:
            continue
        seen_undirected.add(key)

        # 保留第一个方向的关系,但后续会补充反向标签
        filtered_links.append(l)

    # 补充反向标签信息
    for l in filtered_links:
        key = frozenset({l["source_name"], l["target_name"]})
        direction_key = f"{l['source_name']}->{l['target_name']}"
        reverse_direction_key = f"{l['target_name']}->{l['source_name']}"

        tags_dict = undirected_tags.get(key, {})
        l["op_name_source"] = tags_dict.get(direction_key)  # source 方向的标签
        l["op_name_target"] = tags_dict.get(
            reverse_direction_key)  # target 方向的标签(反向)

    links = filtered_links

    # 4) 标签（与 link 过滤解耦；带上描述）
    tags = [{
        "tag_name":  op["op_name"],
        "tag_label": op["label_zh"],
        "tag_desc":  op["comment"],
    } for op in ops_all]

    # 5) 解析本体名称（ex:ontologyName 的个体）
    ontology_name_val: Optional[str] = None
    try:
        EX = rdflib.Namespace(ex_base)
        for s in g.subjects(RDF.type, EX.ontologyName):
            # 优先 label@zh，否则取局部名
            ontology_name_val = _label_zh(g, s) or _local_name(s)
            if ontology_name_val:
                break
    except Exception:
        ontology_name_val = None

    # 7) 解析 Function/Logic 个体与其参数、绑定对象
    # 同时支持旧的 ex:Function/ex:bindFunction 和新的 ex:Logic/ex:bindLogic
    functions: list[dict[str, Any]] = []
    function_used_objects: dict[str, list[str]] = {}
    try:
        EX = rdflib.Namespace(ex_base)
        
        # 收集函数绑定对象：支持两种方式
        # 旧方式：(?obj, ex:bindFunction, ?func)
        for obj, _, func in g.triples((None, EX.bindFunction, None)):
            if not isinstance(func, rdflib.URIRef) or not isinstance(obj, rdflib.URIRef):
                continue
            fn = _local_name(func)
            on_local = _local_name(obj)
            owner_info = class_infos.get(on_local)
            if owner_info:
                lst = function_used_objects.setdefault(fn, [])
                if owner_info["name_en"] not in lst:
                    lst.append(owner_info["name_en"])
        
        # 新方式：(?obj, ex:bindLogic, ?logic)
        for obj, _, logic in g.triples((None, EX.bindLogic, None)):
            if not isinstance(logic, rdflib.URIRef) or not isinstance(obj, rdflib.URIRef):
                continue
            ln = _local_name(logic)
            on_local = _local_name(obj)
            owner_info = class_infos.get(on_local)
            if owner_info:
                lst = function_used_objects.setdefault(ln, [])
                if owner_info["name_en"] not in lst:
                    lst.append(owner_info["name_en"])

        # 收集已处理的逻辑/函数名称（避免重复）
        processed_logic_names: set[str] = set()
        
        # 解析函数/逻辑个体：同时支持 ex:Function 和 ex:Logic
        for fnode in list(g.subjects(RDF.type, EX.Function)) + list(g.subjects(RDF.type, EX.Logic)):
            if not isinstance(fnode, rdflib.URIRef):
                continue
            fname = _local_name(fnode)
            
            # 避免重复处理（如果同时定义了 Function 和 Logic）
            if fname in processed_logic_names:
                continue
            processed_logic_names.add(fname)
            
            flabel = _preferred_label(
                g, fnode, ["zh", None, "en"], fallback=fname)
            fdesc = _first_literal(g, fnode, RDFS.comment)

            # 提取参数：ex:hasParameter/[ex:paramName, ex:paramType, ex:isOptional]
            params_map: dict[str, dict[str, Any]] = {}
            for pnode in g.objects(fnode, EX.hasParameter):
                if pnode is None:
                    continue
                pname = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "paramName"))
                ptype = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "paramType"))
                is_optional_raw = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "isOptional"))
                is_optional = False
                if is_optional_raw is not None:
                    v = str(is_optional_raw).strip().lower()
                    is_optional = v in ("true", "1", "yes", "y")
                if pname:
                    params_map[str(pname)] = {
                        "type": _normalize_param_type(ptype),
                        "is_required": (not is_optional),
                    }

            functions.append({
                "ontology_name": ontology_name_val,
                "used_objects": function_used_objects.get(fname, []) or None,
                "function_name": fname,
                "fun_params": params_map or None,
                "fun_desc": fdesc,
                "function_label": flabel,
                "build_type": "function",
            })
    except Exception:
        # 不阻断主流程
        pass

    # 8) 解析 Action 个体与其绑定对象
    actions: list[dict[str, Any]] = []
    try:
        EX = rdflib.Namespace(ex_base)
        # 先收集 action -> label/desc
        action_info: dict[str, dict[str, Optional[str]]] = {}
        for anode in g.subjects(RDF.type, EX.Action):
            if not isinstance(anode, rdflib.URIRef):
                continue
            an = _local_name(anode)
            action_info[an] = {
                "action_label": _preferred_label(g, anode, ["zh", None, "en"]),
                "action_desc": _first_literal(g, anode, RDFS.comment),
            }
        # 解析 action 参数：与 Function 一致，使用 ex:hasParameter/[ex:paramName, ex:paramType, ex:isOptional]；desc 用 rdfs:comment
        action_params_map: dict[str, dict[str, dict[str, Any]]] = {}
        for anode in g.subjects(RDF.type, EX.Action):
            if not isinstance(anode, rdflib.URIRef):
                continue
            an = _local_name(anode)
            params_for_action: dict[str, dict[str, Any]] = {}
            for pnode in g.objects(anode, EX.hasParameter):
                if pnode is None:
                    continue
                pname = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "paramName"))
                ptype = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "paramType"))
                # optional 读取并转为 bool；缺省视为必填
                is_optional_raw = _first_literal(
                    g, pnode, rdflib.URIRef(str(EX) + "isOptional"))
                is_optional = False
                if is_optional_raw is not None:
                    v = str(is_optional_raw).strip().lower()
                    is_optional = v in ("true", "1", "yes", "y")
                if pname:
                    params_for_action[str(pname)] = {
                        "type": _normalize_param_type(ptype),
                        "is_required": not is_optional,
                    }
            if params_for_action:
                action_params_map[an] = params_for_action
        # 收集绑定：(?obj, ex:bindAction, ?action)
        for obj, _, act in g.triples((None, EX.bindAction, None)):
            if not isinstance(obj, rdflib.URIRef) or not isinstance(act, rdflib.URIRef):
                continue
            on_local = _local_name(obj)
            an = _local_name(act)
            owner_info = class_infos.get(on_local)
            if not owner_info:
                continue
            info = action_info.get(
                an, {"action_label": None, "action_desc": None})
            actions.append({
                "object_name": owner_info["name_en"],
                "action_name": an,
                "action_label": info.get("action_label"),
                "action_desc": info.get("action_desc"),
                "fun_params": action_params_map.get(an) or None,
                "build_type": "function",
            })
    except Exception:
        pass
    
    if error_list:
        return {
            "status": "failed",
            "message": f"OWL 校验失败：共 {len(error_list)} 处错误: {error_list}",
            "data": {"error_list": error_list},
            "code": "500"
        }

    return {
        "objects": objects,
        "attributes": attributes,
        "links": links,
        "tags": tags,
        "ontology_name": ontology_name_val,
        "functions": functions,
        "actions": actions,
        "middle_object_names": list(middle_object_names),  # 添加中间对象名称列表
    }


async def export_ontology(
    ontology_id: str,
    format: Literal["owl", "compact"] = "owl",
    object_type_id: Optional[List[str]] = None,
    is_public:bool = True
) -> Dict[str, Any]:
    """统一的本体导出接口
    
    Args:
        ontology_id: 本体ID
        format: 导出格式
            - "owl": 标准OWL/Turtle格式（默认）
            - "compact": 超简化Markdown格式（适合大模型理解）
        object_type_id: 可选，指定导出的对象类型ID列表
    
    Returns:
        字典包含:
            - content: 格式化的本体定义字符串
            - stats: 统计信息字典
    """
    if not is_public:
        if format == "owl":
            content, stats = await export_ontology_to_owl(ontology_id, object_type_id,is_public)
            return {"content": content, "stats": stats}
        
        elif format == "compact":
            # 获取数据
            mysql = await create_mysql_service()
            
            # 查询对象类型
            if object_type_id is None:
                object_rows = await mysql.afetch_all(
                    """
                    SELECT id, object_type_name, object_type_label, object_type_desc
                    FROM ontology_object_type
                    WHERE ontology_id = %s AND sync_status < 3 AND status <> 0
                    ORDER BY id
                    """,
                    (str(ontology_id),),
                )
            else:
                sel_ids: List[str] = [str(x) for x in object_type_id]
                in_clause = ",".join(["%s"] * len(sel_ids))
                object_rows = await mysql.afetch_all(
                    f"""
                    SELECT id, object_type_name, object_type_label, object_type_desc
                    FROM ontology_object_type
                    WHERE ontology_id = %s AND sync_status < 3 AND status <> 0
                    AND id IN ({in_clause})
                    ORDER BY object_type_name
                    """,
                    (str(ontology_id), *sel_ids),
                )
            
            object_ids = [r["id"] for r in object_rows]
            allowed_object_ids = set(object_ids)
            
            # 如果有 object_type_id 限制，需要自动补充相关的中间对象
            if object_type_id and object_ids:
                sel_ids_for_middle = [str(x) for x in object_ids]
                in_clause_middle = ",".join(["%s"] * len(sel_ids_for_middle))
                
                many_to_many_links = await mysql.afetch_all(
                    f"""
                    SELECT DISTINCT id
                    FROM ontology_link_type
                    WHERE ontology_id = %s 
                    AND sync_status < 3
                    AND status <> 0
                    AND link_type = 2
                    AND (source_object_type_id IN ({in_clause_middle})
                        OR target_object_type_id IN ({in_clause_middle}))
                    """,
                    (str(ontology_id), *sel_ids_for_middle, *sel_ids_for_middle),
                )
                
                many_to_many_link_ids = [link["id"] for link in many_to_many_links]
                
                if many_to_many_link_ids:
                    middle_objects = await mysql.afetch_all(
                        f"""
                        SELECT id, object_type_name, object_type_label, object_type_desc
                        FROM ontology_object_type
                        WHERE ontology_id = %s 
                        AND sync_status < 3 
                        AND status <> 0
                        AND link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                        """,
                        (str(ontology_id), *many_to_many_link_ids),
                    )
                    
                    for middle_obj in middle_objects:
                        if middle_obj["id"] not in allowed_object_ids:
                            object_rows.append(middle_obj)
                            object_ids.append(middle_obj["id"])
                            allowed_object_ids.add(middle_obj["id"])
            
            # 读取属性表
            attrs_rows: List[Dict] = []
            if object_ids:
                attrs_rows = await mysql.afetch_all(
                    f"""
                    SELECT object_type_id, field_name, attribute_desc, attribute_name, 
                        attribute_label, is_primary_key, is_title, id, field_type
                    FROM ontology_object_type_attribute
                    WHERE object_type_id IN ({','.join(['%s']*len(object_ids))}) 
                    AND sync_status < 3 AND status > 0
                    ORDER BY field_name
                    """,
                    tuple(object_ids),
                )
            
            # 读取关联表
            if object_type_id:
                sel_ids = [str(x) for x in object_type_id]
                in_clause = ",".join(["%s"] * len(sel_ids))
                link_rows = await mysql.afetch_all(
                    f"""
                    SELECT
                    lt.id,
                    lt.source_name,
                    lt.source_label,
                    lt.target_name,
                    lt.target_label,
                    lt.link_type,
                    sattr.attribute_name AS source_attribute_name,
                    tattr.attribute_name AS target_attribute_name,
                    lt.source_attribute_id,
                    lt.target_attribute_id,
                    lt.source_object_type_id,
                    lt.target_object_type_id,
                    sattr.object_type_id AS source_attr_object_type_id,
                    tattr.object_type_id AS target_attr_object_type_id,
                    sobj.object_type_name AS source_attr_object_name,
                    tobj.object_type_name AS target_attr_object_name,
                    src_direct.object_type_name AS source_direct_object_name,
                    src_direct.object_type_label AS source_direct_object_label,
                    tgt_direct.object_type_name AS target_direct_object_name,
                    tgt_direct.object_type_label AS target_direct_object_label
                    FROM ontology_link_type lt
                    LEFT JOIN ontology_object_type_attribute sattr ON sattr.id = lt.source_attribute_id AND sattr.sync_status < 3
                    LEFT JOIN ontology_object_type sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                    LEFT JOIN ontology_object_type_attribute tattr ON tattr.id = lt.target_attribute_id AND tattr.sync_status < 3
                    LEFT JOIN ontology_object_type tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                    LEFT JOIN ontology_object_type src_direct ON src_direct.id = lt.source_object_type_id AND src_direct.sync_status < 3
                    LEFT JOIN ontology_object_type tgt_direct ON tgt_direct.id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                    WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                    AND (
                        lt.source_object_type_id IN ({in_clause})
                    OR lt.target_object_type_id IN ({in_clause})
                    )
                    ORDER BY lt.source_name, lt.target_name
                    """,
                    (str(ontology_id), *sel_ids, *sel_ids),
                )
            else:
                link_rows = await mysql.afetch_all(
                    """
                    SELECT
                    lt.id,
                    lt.source_name,
                    lt.source_label,
                    lt.target_name,
                    lt.target_label,
                    lt.link_type,
                    sattr.attribute_name AS source_attribute_name,
                    tattr.attribute_name AS target_attribute_name,
                    lt.source_attribute_id,
                    lt.target_attribute_id,
                    lt.source_object_type_id,
                    lt.target_object_type_id,
                    sattr.object_type_id AS source_attr_object_type_id,
                    tattr.object_type_id AS target_attr_object_type_id,
                    sobj.object_type_name AS source_attr_object_name,
                    tobj.object_type_name AS target_attr_object_name,
                    src_direct.object_type_name AS source_direct_object_name,
                    src_direct.object_type_label AS source_direct_object_label,
                    tgt_direct.object_type_name AS target_direct_object_name,
                    tgt_direct.object_type_label AS target_direct_object_label
                    FROM ontology_link_type lt
                    LEFT JOIN ontology_object_type_attribute sattr ON sattr.id = lt.source_attribute_id AND sattr.sync_status < 3
                    LEFT JOIN ontology_object_type sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                    LEFT JOIN ontology_object_type_attribute tattr ON tattr.id = lt.target_attribute_id AND tattr.sync_status < 3
                    LEFT JOIN ontology_object_type tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                    LEFT JOIN ontology_object_type src_direct ON src_direct.id = lt.source_object_type_id AND src_direct.sync_status < 3
                    LEFT JOIN ontology_object_type tgt_direct ON tgt_direct.id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                    WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                    ORDER BY lt.source_name, lt.target_name
                    """,
                    (str(ontology_id),),
                )
            
            # 过滤关系
            if not allowed_object_ids:
                link_rows = []
            else:
                _filtered_links = []
                for lr in link_rows:
                    src_ot = lr.get("source_object_type_id") or lr.get("source_attr_object_type_id")
                    tgt_ot = lr.get("target_object_type_id") or lr.get("target_attr_object_type_id")
                    if src_ot in allowed_object_ids and tgt_ot in allowed_object_ids:
                        _filtered_links.append(lr)
                link_rows = _filtered_links
            
            # 读取函数定义
            logic_rows = await mysql.afetch_all(
                """
                SELECT
                id,
                logic_type_name,
                logic_type_label,
                logic_type_desc,
                signature_detail,
                intput_param,
                output_param,
                build_type,
                api_id
                FROM ontology_logic_type
                WHERE ontology_id = %s
                AND sync_status <= 2
                AND status <> 0
                AND build_type IN ('function', 'api')
                ORDER BY logic_type_name
                """,
                (str(ontology_id),),
            )
            
            # 收集所有有效的逻辑ID，用于后续过滤绑定关系
            valid_logic_ids = set(str(row["id"]) for row in logic_rows) if logic_rows else set()
            
            # 读取action定义
            action_rows = await mysql.afetch_all(
                """
                SELECT
                id,
                object_type_id,
                action_name,
                action_label,
                action_desc,
                build_type,
                signature_detail,
                intput_param
                FROM ontology_object_type_action
                WHERE ontology_id = %s
                AND sync_status <= 2
                AND status <> 0
                ORDER BY action_name
                """,
                (str(ontology_id),),
            )
            
            # 读取logic绑定关系
            logic_bind_rows = await mysql.afetch_all(
                """
                SELECT
                lto.logic_type_id,
                lto.object_type_id,
                lt.logic_type_name,
                ot.object_type_name
                FROM ontology_logic_type_object lto
                JOIN ontology_logic_type lt ON lt.id = lto.logic_type_id
                JOIN ontology_object_type ot ON ot.id = lto.object_type_id
                WHERE lto.ontology_id = %s
                AND lt.sync_status <= 2
                AND ot.sync_status < 3
                """,
                (str(ontology_id),),
            )
            
            # 过滤：只保留逻辑ID在有效逻辑列表中的绑定关系
            if logic_bind_rows:
                if valid_logic_ids:
                    logic_bind_rows = [
                        row for row in logic_bind_rows 
                        if str(row.get("logic_type_id")) in valid_logic_ids
                    ]
                else:
                    # 如果没有有效逻辑，清空所有绑定关系
                    logic_bind_rows = []
            
            # 读取本体名称
            ontology_name = None
            ontology_label = None
            try:
                ontology_row = await mysql.afetch_one(
                    """
                    SELECT ontology_name, ontology_label
                    FROM ontology_manage
                    WHERE id = %s
                    """,
                    (str(ontology_id),),
                )
                if ontology_row:
                    ontology_name = ontology_row.get("ontology_name")
                    ontology_label = ontology_row.get("ontology_label")
            except Exception:
                pass
            
            # 构建compact markdown (已返回包含content和stats的字典)
            return await _build_compact_markdown(
                ontology_name,
                ontology_label,
                object_rows,
                attrs_rows,
                link_rows,
                logic_rows,
                action_rows,
                logic_bind_rows,
                is_public,
            )
        
        else:
            raise ValueError(f"Unsupported format: {format}. Use 'owl' or 'compact'.")
    
    else:
        if format == "owl":
            content, stats = await export_ontology_to_owl(ontology_id, object_type_id,is_public)
            return {"content": content, "stats": stats}
        
        elif format == "compact":
            # 获取数据
            mysql = await create_mysql_service()

            version_row = await mysql.afetch_one(
                """
                SELECT latest_version 
                FROM ontology_manage
                WHERE id = %s
                """,
                (str(ontology_id),),
            )

            main_latest_version = version_row["latest_version"] if version_row else None

            
            # 查询对象类型
            if object_type_id is None:
                # print("查询对象，object_type_id不存在，对应对象类型没有")
                object_rows = await mysql.afetch_all(
                    """
                    SELECT id, object_type_name, object_type_label, object_type_id,object_type_desc,latest_version
                    FROM ontology_object_type_his
                    WHERE ontology_id = %s AND sync_status < 3 AND status <> 0 AND latest_version = %s
                    ORDER BY id
                    """,
                    (str(ontology_id), main_latest_version),
                )
                # print("打印com对象")
                # print(object_rows)
            else:
                # print("查询对象，object_type_id不存在！！！！！！")
                sel_ids: List[str] = [str(x) for x in object_type_id]
                in_clause = ",".join(["%s"] * len(sel_ids))
                object_rows = await mysql.afetch_all(
                    """
                    SELECT id, object_type_name, object_type_id,object_type_label, object_type_desc,latest_version
                    FROM ontology_object_type_his
                    WHERE ontology_id = %s AND sync_status < 3 AND status <> 0 AND latest_version = %s
                    AND id IN ({in_clause})
                    ORDER BY object_type_name
                    """,
                    (str(ontology_id), main_latest_version,*sel_ids),
                    
                )

            
            object_ids = [r["object_type_id"] for r in object_rows]
            allowed_object_ids = set(object_ids)
            
            # 如果有 object_type_id 限制，需要自动补充相关的中间对象
            if object_type_id and object_ids:
                sel_ids_for_middle = [str(x) for x in object_ids]
                in_clause_middle = ",".join(["%s"] * len(sel_ids_for_middle))
                
                many_to_many_links = await mysql.afetch_all(
                    f"""
                    SELECT DISTINCT id,latest_version
                    FROM ontology_link_type_his
                    WHERE ontology_id = %s 
                    AND sync_status < 3
                    AND status <> 0
                    AND link_type = 2
                    AND latest_version = %s
                    AND (source_object_type_id IN ({in_clause_middle})
                        OR target_object_type_id IN ({in_clause_middle}))
                    """,
                    (str(ontology_id),main_latest_version, *sel_ids_for_middle, *sel_ids_for_middle),
                )
                
                many_to_many_link_ids = [link["object_type_id"] for link in many_to_many_links]
                
                if many_to_many_link_ids:
                    middle_objects = await mysql.afetch_all(
                        f"""
                        SELECT id, object_type_name, object_type_label, object_type_desc,latest_version
                        FROM ontology_object_type_his
                        WHERE ontology_id = %s 
                        AND sync_status < 3 
                        AND status <> 0
                        AND latest_version = %s
                        AND link_type_id IN ({','.join(['%s']*len(many_to_many_link_ids))})
                        """,
                        (str(ontology_id), main_latest_version,*many_to_many_link_ids),
                    )
                    
                    for middle_obj in middle_objects:
                        if middle_obj["object_type_id"] not in allowed_object_ids:
                            object_rows.append(middle_obj)
                            object_ids.append(middle_obj["object_type_id"])
                            allowed_object_ids.add(middle_obj["object_type_id"])
            
            # 读取属性表
            # 测试属性表
            attrs_rows: List[Dict] = []
            if object_ids:
                params = tuple(object_ids) + (str(main_latest_version),)
                attrs_rows = await mysql.afetch_all(
                    f"""
                    SELECT object_type_id, field_name, attribute_desc, attribute_name, 
                        attribute_label, is_primary_key, is_title, id, field_type,latest_version
                    FROM ontology_object_type_attribute_his
                    WHERE object_type_id IN ({','.join(['%s']*len(object_ids))}) 
                    AND sync_status < 3 AND status > 0
                    AND latest_version = %s
                    ORDER BY field_name
                    """,
                    params
                )
                # print(object_ids)
                # print(main_latest_version)
                # print("打印属性")
                # print(attrs_rows)
            
            # 读取关联表
            if object_type_id:
                # print("关联表，存在object_type_id的时候")
                sel_ids = [str(x) for x in object_type_id]
                in_clause = ",".join(["%s"] * len(sel_ids))
                link_rows = await mysql.afetch_all(
                    f"""
                    SELECT
                    lt.id,
                    lt.source_name,
                    lt.source_label,
                    lt.target_name,
                    lt.target_label,
                    lt.link_type,
                    lt.latest_version,
                    sattr.attribute_name AS source_attribute_name,
                    tattr.attribute_name AS target_attribute_name,
                    lt.source_attribute_id,
                    lt.target_attribute_id,
                    lt.source_object_type_id,
                    lt.target_object_type_id,
                    sattr.object_type_id AS source_attr_object_type_id,
                    tattr.object_type_id AS target_attr_object_type_id,
                    sobj.object_type_name AS source_attr_object_name,
                    tobj.object_type_name AS target_attr_object_name,
                    src_direct.object_type_name AS source_direct_object_name,
                    src_direct.object_type_label AS source_direct_object_label,
                    tgt_direct.object_type_name AS target_direct_object_name,
                    tgt_direct.object_type_label AS target_direct_object_label
                    FROM ontology_link_type_his lt
                    LEFT JOIN ontology_object_type_attribute_his sattr ON sattr.attribute_id = lt.source_attribute_id AND sattr.sync_status < 3
                    AND sattr.latest_version = %s
                    LEFT JOIN ontology_object_type_his sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                    AND sobj.latest_version = %s
                    LEFT JOIN ontology_object_type_attribute_his tattr ON tattr.attribute_id = lt.target_attribute_id AND tattr.sync_status < 3
                    AND tattr.latest_version = %s
                    LEFT JOIN ontology_object_type_his tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                    AND tobj.latest_version = %s
                    LEFT JOIN ontology_object_type_his src_direct ON src_direct.object_type_id = lt.source_object_type_id AND src_direct.sync_status < 3
                    AND src_direct.latest_version = %s
                    LEFT JOIN ontology_object_type_his tgt_direct ON tgt_direct.object_type_id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                    AND tgt_direct.latest_version = %s
                    WHERE lt.ontology_id = %s AND lt.sync_status < 3 AND lt.status <> 0
                    AND lt.latest_version = %s
                    AND (
                        lt.source_object_type_id IN ({in_clause})
                    OR lt.target_object_type_id IN ({in_clause})
                    )
                    ORDER BY lt.source_name, lt.target_name
                    """,
                    (str(main_latest_version), str(main_latest_version), str(main_latest_version), str(main_latest_version), 
     str(main_latest_version), str(main_latest_version), str(ontology_id), str(main_latest_version), *sel_ids, *sel_ids),
)
                
                # print("打印link函数中替quwn的信息")
                # print(link_rows)
            else:
                link_rows = await mysql.afetch_all(
                    """
                    SELECT
                    lt.id,
                    lt.source_name,
                    lt.source_label,
                    lt.target_name,
                    lt.target_label,
                    lt.link_type,
                    lt.latest_version,
                    sattr.attribute_name AS source_attribute_name,
                    tattr.attribute_name AS target_attribute_name,
                    lt.source_attribute_id,
                    lt.target_attribute_id,
                    lt.source_object_type_id,
                    lt.target_object_type_id,
                    sattr.object_type_id AS source_attr_object_type_id,
                    tattr.object_type_id AS target_attr_object_type_id,
                    sobj.object_type_name AS source_attr_object_name,
                    tobj.object_type_name AS target_attr_object_name,
                    src_direct.object_type_name AS source_direct_object_name,
                    src_direct.object_type_label AS source_direct_object_label,
                    tgt_direct.object_type_name AS target_direct_object_name,
                    tgt_direct.object_type_label AS target_direct_object_label
                    FROM ontology_link_type_his lt
                    LEFT JOIN ontology_object_type_attribute_his sattr ON sattr.attribute_id = lt.source_attribute_id 
                    AND sattr.sync_status < 3
                    AND sattr.latest_version = %s
                    LEFT JOIN ontology_object_type_his sobj ON sobj.id = sattr.object_type_id AND sobj.sync_status < 3
                    AND sobj.latest_version = %s
                    LEFT JOIN ontology_object_type_attribute_his tattr ON tattr.attribute_id = lt.target_attribute_id 
                    AND tattr.sync_status < 3
                    AND tattr.latest_version = %s
                    LEFT JOIN ontology_object_type_his tobj ON tobj.id = tattr.object_type_id AND tobj.sync_status < 3
                    AND tobj.latest_version = %s
                    LEFT JOIN ontology_object_type_his src_direct ON src_direct.object_type_id = lt.source_object_type_id AND src_direct.sync_status < 3
                    AND src_direct.latest_version = %s
                    LEFT JOIN ontology_object_type_his tgt_direct ON tgt_direct.object_type_id = lt.target_object_type_id AND tgt_direct.sync_status < 3
                    AND tgt_direct.latest_version = %s
                    WHERE lt.ontology_id = %s AND lt.sync_status < 3 
                    AND lt.status <> 0
                    AND lt.latest_version = %s
                    ORDER BY lt.source_name, lt.target_name
                    """,
                     (str(main_latest_version), str(main_latest_version), str(main_latest_version), 
     str(main_latest_version), str(main_latest_version), str(main_latest_version), str(ontology_id), str(main_latest_version)),
)
                # print("打印link函数中替quwn的信息")
                # print(link_rows)
            
            # 过滤关系
            if not allowed_object_ids:
                link_rows = []
            else:
                _filtered_links = []
                for lr in link_rows:
                    src_ot = lr.get("source_object_type_id") or lr.get("source_attr_object_type_id")
                    tgt_ot = lr.get("target_object_type_id") or lr.get("target_attr_object_type_id")
                    if src_ot in allowed_object_ids and tgt_ot in allowed_object_ids:
                        _filtered_links.append(lr)
                link_rows = _filtered_links
            
            # 读取函数定义
            logic_rows = await mysql.afetch_all(
                """
                SELECT
                logic_type_id,
                logic_type_name,
                logic_type_label,
                logic_type_desc,
                signature_detail,
                intput_param,
                output_param,
                build_type,
                latest_version,
                api_id
                FROM ontology_logic_type_his
                WHERE ontology_id = %s
                AND sync_status <= 2
                AND status <> 0
                AND build_type IN ('function', 'api')
                AND latest_version = %s
                ORDER BY logic_type_name
                """,
                (str(ontology_id), main_latest_version),
        )
            # print("读取logic_rows")
            # print(len(logic_rows))
            
            # 收集所有有效的逻辑ID，用于后续过滤绑定关系
            valid_logic_ids = set(str(row["logic_type_id"]) for row in logic_rows) if logic_rows else set()
            
            # 读取action定义
            action_rows = await mysql.afetch_all(
                """
                SELECT
                id,
                object_type_id,
                action_name,
                action_label,
                action_desc,
                build_type,
                signature_detail,
                latest_version,
                intput_param
                FROM ontology_object_type_action_his
                WHERE ontology_id = %s
                AND sync_status <= 2
                AND status <> 0
                AND latest_version = %s
                ORDER BY action_name
                """,
                (str(ontology_id), main_latest_version),
        )
            # print("读取action_rows")
            # print(len(action_rows))
            
            # 读取logic绑定关系
            logic_bind_rows = await mysql.afetch_all(
                """
                SELECT
                lto.logic_type_id,
                lto.object_type_id,
                lt.logic_type_name,
                ot.object_type_name
                FROM ontology_logic_type_object lto
                JOIN ontology_logic_type lt ON lt.id = lto.logic_type_id
                JOIN ontology_object_type ot ON ot.id = lto.object_type_id
                WHERE lto.ontology_id = %s
                AND lt.sync_status <= 2
                AND ot.sync_status < 3
                """,
                (str(ontology_id),),
            )
            
            # 过滤：只保留逻辑ID在有效逻辑列表中的绑定关系
            if logic_bind_rows:
                if valid_logic_ids:
                    logic_bind_rows = [
                        row for row in logic_bind_rows 
                        if str(row.get("logic_type_id")) in valid_logic_ids
                    ]
                else:
                    # 如果没有有效逻辑，清空所有绑定关系
                    logic_bind_rows = []
            
            # 读取本体名称
            ontology_name = None
            ontology_label = None
            try:
                ontology_row = await mysql.afetch_one(
                    """
                    SELECT ontology_name, ontology_label
                    FROM ontology_manage
                    WHERE id = %s
                    """,
                    (str(ontology_id),),
                )
                if ontology_row:
                    ontology_name = ontology_row.get("ontology_name")
                    ontology_label = ontology_row.get("ontology_label")
            except Exception:
                pass
            
            
            

            # 构建compact markdown (已返回包含content和stats的字典)
            return await _build_compact_markdown(
                ontology_name,
                ontology_label,
                object_rows,
                attrs_rows,
                link_rows,
                logic_rows,
                action_rows,
                logic_bind_rows,
                is_public,
            )
        
        else:
            raise ValueError(f"Unsupported format: {format}. Use 'owl' or 'compact'.")
    

# ==================================================================================
# Part 3.3: JSON转换函数（Python字典 → 标准分好类JSON输出格式）
# ==================================================================================


async def import_owl_with_classification(
    ontology_id: str,
    owner_id: str,
    owl_content: str,
    enable_write: bool = False,
    mode: str = "full",  # parse | classify | full
) -> dict[str, Any]:

    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service not configured")

    # 1) 解析为标准 JSON（内联 import_owl_to_ontology 逻辑）
    payloads = parse_owl_to_payloads(owl_content)
    # 若解析阶段已返回失败结构，直接短路返回
    if isinstance(payloads, dict) and payloads.get("status") == "failed":
        return payloads

    # 内部格式化：增强 fun_params 结构
    def _format_params(raw_params: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        for name, info in (raw_params or {}).items():
            if isinstance(info, dict):
                result[name] = info
            else:
                result[name] = {
                    "type": str(info),
                    "is_required": False,
                    "desc": name,
                }
        return result

    # 1.0 获取中间对象名称列表（在处理其他数据之前先获取，以便过滤）
    middle_object_names = set(payloads.get("middle_object_names") or [])
    if middle_object_names:
        logger.info(f"检测到 {len(middle_object_names)} 个中间对象，将在导入时跳过: {middle_object_names}")
    
    # 构建对象名称到local_name的映射，用于检查logic绑定的对象
    object_name_to_local_map = {}
    for obj in (payloads.get("objects") or []):
        obj_name = obj.get("object_type_name")
        obj_local = obj.get("object_type_local_name", obj_name)
        if obj_name:
            object_name_to_local_map[obj_name] = obj_local
    
    # 1.1 logic 去重与构建
    logic_items: list[dict[str, Any]] = []
    seen_funcs: set[str] = set()
    skipped_logics_due_to_middle_objects: list[str] = []
    
    for f in (payloads.get("functions") or []):
        fname = f.get("function_name")
        if not fname or fname in seen_funcs:
            continue
        seen_funcs.add(fname)
        
        # 检查used_objects：如果所有绑定的对象都是中间对象，则跳过此logic
        used_objects = f.get("used_objects") or []
        if used_objects:
            all_middle_objects = True
            for obj_name in used_objects:
                obj_local = object_name_to_local_map.get(obj_name, obj_name)
                if obj_local not in middle_object_names:
                    all_middle_objects = False
                    break
            
            if all_middle_objects:
                skipped_logics_due_to_middle_objects.append(fname)
                continue
            
            # 过滤掉中间对象，只保留非中间对象
            filtered_used_objects = [
                obj_name for obj_name in used_objects
                if object_name_to_local_map.get(obj_name, obj_name) not in middle_object_names
            ]
        else:
            filtered_used_objects = used_objects
        
        logic_items.append({
            "ontology_name": f.get("ontology_name"),
            "used_objects": filtered_used_objects if filtered_used_objects else None,
            "function_name": fname,
            "fun_desc": f.get("fun_desc"),
            "function_label": f.get("function_label"),
            "build_type": f.get("build_type", "function"),
            "file_name": "import_logic",
            "fun_params": _format_params(f.get("fun_params") or {}),
        })
    
    if skipped_logics_due_to_middle_objects:
        logger.info(f"跳过了 {len(skipped_logics_due_to_middle_objects)} 个仅绑定到中间对象的logics")

    # 1.2 获取中间对象名称列表（在处理其他数据之前先获取，以便过滤）
    middle_object_names = set(payloads.get("middle_object_names") or [])
    
    # 1.2.1 action 去重与构建
    actions_out: list[dict[str, Any]] = []
    seen_actions: set[tuple[str | None, str | None]] = set()
    skipped_actions_due_to_middle_objects: list[tuple[str, str]] = []
    
    for a in (payloads.get("actions") or []):
        object_name = a.get("object_name")
        action_name = a.get("action_name")
        
        # 需要检查object_name是否对应中间对象
        # 由于我们还没有构建objects_out，需要从payloads.objects中查找
        is_middle_object = False
        for obj in (payloads.get("objects") or []):
            if obj.get("object_type_name") == object_name:
                obj_local = obj.get("object_type_local_name", object_name)
                if obj_local in middle_object_names:
                    is_middle_object = True
                    break
        
        if is_middle_object:
            skipped_actions_due_to_middle_objects.append((object_name, action_name))
            continue
        
        key = (object_name, action_name)
        if key in seen_actions:
            continue
        seen_actions.add(key)
        actions_out.append({
            "object_name": object_name,
            "action_name": action_name,
            "action_label": a.get("action_label"),
            "action_desc": a.get("action_desc"),
            "build_type": a.get("build_type", "function"),
            "file_name": "import_action",
            "fun_params": _format_params(a.get("fun_params") or {}),
        })
    
    if skipped_actions_due_to_middle_objects:
        logger.info(f"跳过了 {len(skipped_actions_due_to_middle_objects)} 个绑定到中间对象的actions")

    # 1.3 object + attributes 去重与构建
    objects_out: list[dict[str, Any]] = []
    seen_objs: set[str] = set()
    skipped_middle_objects: list[str] = []
    for o in (payloads.get("objects") or []):
        oname = o.get("object_type_name")
        # 获取对象的local name，检查是否是中间对象
        oname_local = o.get("object_type_local_name", oname)
        if not oname or oname in seen_objs:
            continue
        # 跳过中间对象
        if oname_local in middle_object_names:
            skipped_middle_objects.append(oname)
            logger.info(f"跳过中间对象: {oname} (local_name: {oname_local})")
            continue
        seen_objs.add(oname)
        obj_item: dict[str, Any] = {
            "objectTypeName": oname,
            "objectTypeLabel": o.get("object_type_label"),
            "objectTypeDesc": o.get("object_type_desc"),
            "attributes": [],
        }
        seen_attr_keys: set[tuple[str, str]] = set()
        for attr in (payloads.get("attributes") or []):
            if attr.get("belong_object_type_name") != oname:
                continue
            attr_cn = attr.get("attribute_name") or ""
            field_name = (attr.get("attribute_en_name") or "").strip()
            key = (attr_cn, field_name)
            if key in seen_attr_keys:
                continue
            seen_attr_keys.add(key)
            obj_item["attributes"].append({
                "attributeName": attr_cn or field_name,
                "fieldName": field_name,
                "attributeDesc": attr.get("attribute_desc"),
                "isPrimaryKey": bool(attr.get("is_primary_key") or False),
                "isTitle": bool(attr.get("is_title") or False),
            })
        objects_out.append(obj_item)

    # 1.4 tags 去重与构建
    tags_out: list[dict[str, Any]] = []
    seen_tags: set[tuple[str | None, str | None]] = set()
    for t in (payloads.get("tags") or []):
        key = (t.get("tag_name"), t.get("tag_label"))
        if key in seen_tags:
            continue
        seen_tags.add(key)
        tags_out.append({
            "tagName": t.get("tag_name"),
            "tagLabel": t.get("tag_label"),
            "tagDesc": t.get("tag_desc"),
        })

    # 1.5 links 去重与构建
    # 构建已保留对象名称的集合（用于过滤涉及中间对象的关系）
    # 注意：这里需要使用对象的name_en（而不是local_name），因为link中使用的是name_en
    retained_object_names = seen_objs.copy()
    
    links_out: list[dict[str, Any]] = []
    seen_links: set[tuple[Any, Any, Any, Any]] = set()
    skipped_links_due_to_middle_objects: list[tuple[str, str]] = []
    
    for link in (payloads.get("links") or []):
        source_name = link.get("source_name")
        target_name = link.get("target_name")
        
        # 跳过涉及被过滤对象的关系
        if source_name not in retained_object_names or target_name not in retained_object_names:
            skipped_links_due_to_middle_objects.append((source_name, target_name))
            continue
        
        key = (source_name, target_name, link.get("domain_attr_name"), link.get("range_attr_name"))
        if key in seen_links:
            continue
        seen_links.add(key)
        links_out.append({
            "sourcename": source_name,
            "sourcelabel": link.get("source_label") or source_name,
            "targetname": target_name,
            "targetlabel": link.get("target_label") or target_name,
            "op_name_source": link.get("op_name_source"),
            "op_name_target": link.get("op_name_target"),
        })
    
    if skipped_links_due_to_middle_objects:
        logger.info(f"跳过了 {len(skipped_links_due_to_middle_objects)} 个涉及中间对象的关系")

    simple_json: dict[str, Any] = {
        "ontology_name": payloads.get("ontology_name"),
        "object": objects_out,
        "tag": tags_out,
        "link": links_out,
        "action": actions_out,
        "logic": logic_items,
    }

    # 2) 覆盖 ontology_name（若 DB 已有）
    try:
        row = await mysql.afetch_one(
            "SELECT ontology_name FROM ontology_manage WHERE id = %s",
            (str(ontology_id),),
        )
        if row:
            name_in_db = (row.get("ontology_name") or "").strip() or None
            if name_in_db:
                simple_json["ontology_name"] = name_in_db
    except Exception as _exc:  # pragma: no cover
        logger.warning(f"获取 ontology_manage.ontology_name 失败: {_exc}")

    # 解析模式直接返回
    if mode == "parse":
        return simple_json

    # 3) 分类（内联 classify_ontology_json 逻辑）
    # 3.1 现有数据映射
    exist_objs = await mysql.afetch_all(
        "SELECT id, object_type_name, object_type_label FROM ontology_object_type WHERE ontology_id=%s AND sync_status < 3",
        (str(ontology_id),)
    )
    exist_obj_map = {row["object_type_name"]: row for row in exist_objs}

    exist_attrs = await mysql.afetch_all(
        """
        SELECT oota.id, oota.attribute_name, oota.field_name, oot.object_type_name
        FROM ontology_object_type_attribute oota
        JOIN ontology_object_type oot ON oota.object_type_id = oot.id
        WHERE oot.ontology_id = %s AND oota.sync_status < 3
        """,
        (str(ontology_id),)
    )
    exist_attr_map: dict[tuple[str, str], dict[str, Any]] = {}
    for row in exist_attrs:
        k1 = (row["object_type_name"], row.get("attribute_name")) if row.get("attribute_name") else None
        k2 = (row["object_type_name"], row.get("field_name")) if row.get("field_name") else None
        if k1:
            exist_attr_map[k1] = row
        if k2:
            exist_attr_map[k2] = row

    exist_links = await mysql.afetch_all(
        "SELECT id, source_name, target_name FROM ontology_link_type WHERE ontology_id=%s AND sync_status < 3",
        (str(ontology_id),)
    )
    exist_link_map = {(row["source_name"], row["target_name"]): row for row in exist_links}

    exist_tags = await mysql.afetch_all(
        "SELECT id, tag_name, tag_label FROM ontology_tag WHERE sync_status < 3",
    )
    exist_tag_map = {row["tag_name"]: row for row in exist_tags}

    exist_actions = await mysql.afetch_all(
        """
        SELECT oota.id, oota.action_name, oot.object_type_name
        FROM ontology_object_type_action oota
        JOIN ontology_object_type oot ON oota.object_type_id = oot.id
        WHERE oota.ontology_id = %s AND oota.sync_status < 3
        """,
        (str(ontology_id),)
    )
    exist_action_map = {(row["object_type_name"], row["action_name"]): row for row in exist_actions}

    exist_funcs = await mysql.afetch_all(
        "SELECT id, logic_type_name FROM ontology_logic_type WHERE ontology_id=%s AND sync_status < 3",
        (str(ontology_id),)
    )
    exist_logic_map = {row["logic_type_name"]: row for row in exist_funcs}

    # 3.2 资源分类（使用 is_exist 字段标识）
    objects_list: list[dict[str, Any]] = []
    count_objs_new = 0
    count_objs_exist = 0
    
    for o in (simple_json.get("object") or []):
        name = o.get("objectTypeName")
        if not name:
            continue
        attrs = o.get("attributes") or []
        attrs_list = []
        for a in attrs:
            attr_cn = a.get("attributeName")
            field = (a.get("fieldName") or "").strip()
            k1 = (name, attr_cn) if attr_cn else None
            k2 = (name, field) if field else None
            # 检查属性是否已存在，并获取其ID
            existing_attr = None
            if k1 and k1 in exist_attr_map:
                existing_attr = exist_attr_map[k1]
            elif k2 and k2 in exist_attr_map:
                existing_attr = exist_attr_map[k2]
            
            attr_item = {
                "attributeName": attr_cn or field,
                "fieldName": field,
                "isPrimaryKey": bool(a.get("isPrimaryKey") or False),
                "isTitle": bool(a.get("isTitle") or False),
                "attributeDesc": a.get("attributeDesc"),
                "is_exist": existing_attr is not None,
            }
            # 如果属性已存在，添加其ID
            if existing_attr:
                attr_item["id"] = existing_attr["id"]
            attrs_list.append(attr_item)
        
        is_exist = name in exist_obj_map
        item = {
            "objectTypeName": name,
            "objectTypeLabel": o.get("objectTypeLabel"),
            "objectTypeDesc": o.get("objectTypeDesc"),
            "attributes": attrs_list,
            "is_exist": is_exist,
        }
        if is_exist:
            item["id"] = exist_obj_map[name]["id"]
            count_objs_exist += 1
        else:
            count_objs_new += 1
        objects_list.append(item)

    tags_list = []
    count_tags_new = 0
    count_tags_exist = 0
    for t in (simple_json.get("tag") or []):
        tname = t.get("tagName")
        if not tname:
            continue
        is_exist = tname in exist_tag_map
        item = {
            "tagName": tname, 
            "tagLabel": t.get("tagLabel"), 
            "tagDesc": t.get("tagDesc"),
            "is_exist": is_exist,
        }
        if is_exist:
            item["id"] = exist_tag_map[tname]["id"]
            count_tags_exist += 1
        else:
            count_tags_new += 1
        tags_list.append(item)

    links_list = []
    count_links_new = 0
    count_links_exist = 0
    for l in (simple_json.get("link") or []):
        sname, tname = l.get("sourcename"), l.get("targetname")
        if not sname or not tname:
            continue
        is_exist = (sname, tname) in exist_link_map
        item = {
            "op_name_source": l.get("op_name_source"),
            "op_name_target": l.get("op_name_target"),
            "sourcename": sname,
            "sourcelabel": l.get("sourcelabel") or sname,
            "targetname": tname,
            "targetlabel": l.get("targetlabel") or tname,
            "is_exist": is_exist,
        }
        if is_exist:
            item["id"] = exist_link_map[(sname, tname)]["id"]
            count_links_exist += 1
        else:
            count_links_new += 1
        links_list.append(item)

    actions_list = []
    count_actions_new = 0
    count_actions_exist = 0
    for a in (simple_json.get("action") or []):
        oname, aname = a.get("object_name"), a.get("action_name")
        if not oname or not aname:
            continue
        is_exist = (oname, aname) in exist_action_map
        item = {
            "object_name": oname,
            "action_name": aname,
            "action_label": a.get("action_label"),
            "action_desc": a.get("action_desc"),
            "build_type": a.get("build_type", "function"),
            "file_name": a.get("file_name", "import_action"),
            "fun_params": _fun_params_to_json_str(a.get("fun_params") or {}),
            "is_exist": is_exist,
        }
        if is_exist:
            item["id"] = exist_action_map[(oname, aname)]["id"]
            count_actions_exist += 1
        else:
            count_actions_new += 1
        actions_list.append(item)

    logic_list = []
    count_logic_new = 0
    count_logic_exist = 0
    for f in (simple_json.get("logic") or []):
        fname = f.get("function_name")
        if not fname:
            continue
        is_exist = fname in exist_logic_map
        item = {
            "ontology_name": f.get("ontology_name"),
            "used_objects": f.get("used_objects"),
            "function_name": fname,
            "fun_desc": f.get("fun_desc"),
            "function_label": f.get("function_label"),
            "build_type": f.get("build_type", "function"),
            "file_name": f.get("file_name", "import_logic"),
            "fun_params": _fun_params_to_json_str(f.get("fun_params") or {}),
            "is_exist": is_exist,
        }
        if is_exist:
            item["id"] = exist_logic_map[fname]["id"]
            count_logic_exist += 1
        else:
            count_logic_new += 1
        logic_list.append(item)

    result = {
        "ontology_name": simple_json.get("ontology_name"),
        "object": objects_list,
        "tag": tags_list,
        "link": links_list,
        "action": actions_list,
        "logic": logic_list,
    }

    # 初始化默认的统计信息（用于未写入的情况）
    default_stats = {
        "inserted_tags": 0,
        "skipped_tags": count_tags_exist,
        "inserted_objects": 0,
        "skipped_objects": count_objs_exist,
        "inserted_attrs": 0,
        "inserted_links": 0,
        "skipped_links": count_links_exist,
        "inserted_logic": 0,
        "skipped_logic": count_logic_exist,
        "inserted_actions": 0,
        "skipped_actions": count_actions_exist,
    }

    if mode == "classify":
        result["import_stats"] = default_stats
        return result
    if not enable_write:
        result["import_stats"] = default_stats
        return result

    # 4) 数据预写 + 外部 API（事务内保证一致性）
    try:
        validated_data = _normalize_and_validate(result)
        logger.info("数据规范化与校验完成")

        # 获取新增对象（is_exist=False）
        objects_new = [obj for obj in result.get("object", []) if not obj.get("is_exist")]
        ontology_name = result.get("ontology_name") or f"Ontology_{ontology_id}"
        if not result.get("ontology_name"):
            logger.warning(f"ontology_name 为空，使用默认值: {ontology_name}")

        ontology_json: List[Dict[str, Any]] = []
        for obj in objects_new:
            obj_name = obj.get("objectTypeName")
            if not obj_name:
                continue
            fields = []
            # 获取新增属性（is_exist=False）
            for attr in obj.get("attributes", []):
                if attr.get("is_exist"):
                    continue
                attr_name = attr.get("attributeName")
                field_name = attr.get("FieldName") or attr.get("fieldName") or attr_name
                if not field_name:
                    continue
                fields.append({
                    "name": field_name,
                    "property": attr_name or field_name,
                    "type": "str",
                    "primary_key": attr.get("isPrimaryKey", False),
                })
            ontology_json.append({
                "ontology_name": ontology_name,
                "name": obj_name,
                "label": obj.get("objectTypeLabel"),
                "table_name": None,
                "doc": obj.get("objectTypeDesc", ""),
                "fields": None,
                "status": 1,
            })

        async with mysql.atransaction() as conn:
            t_db = _tick()
            db_stats = await _write_all_data_pure(
                conn=conn,
                ontology_id=ontology_id,
                owner_id=owner_id,
                validated_data=validated_data,
            )
            _tock(t_db, "[transaction] 一次性落库准备完成")
            logger.info(f"数据库阶段完成（待提交）: {db_stats}")

            http_limits = httpx.Limits(max_connections=100, max_keepalive_connections=50)
            async with httpx.AsyncClient(timeout=30.0, limits=http_limits) as shared_client:
                resolved_net_gate = _resolve_net_gate()
                resolved_sandbox_server = _resolve_sandbox_server()

                def _parse_fun_params(raw: Any) -> dict[str, Any]:
                    if not raw:
                        return {}
                    if isinstance(raw, dict):
                        return raw
                    if isinstance(raw, str):
                        try:
                            return json.loads(raw)
                        except Exception:
                            logger.warning(f"解析 fun_params 失败: {raw}")
                            return {}
                    logger.warning(f"未知的 fun_params 类型: {type(raw)} -> {raw}")
                    return {}

                def _ensure_api_success(name: str, response: dict[str, Any] | Exception) -> None:
                    if isinstance(response, Exception):
                        raise RuntimeError(f"{name} 调用异常: {response}")

                    if response is None:
                        raise RuntimeError(f"{name} 调用失败: 空响应")

                    api_detail = response
                    success = False

                    if isinstance(response, dict) and "api" in response:
                        api_detail = response.get("api") or {}
                        success = bool(response.get("status") == "success" and api_detail.get("ok"))
                    else:
                        success = bool(response.get("ok")) if isinstance(response, dict) else False

                    if not success:
                        raise RuntimeError(f"{name} 调用失败: {api_detail}")

                if ontology_json:
                    url = _compose_external_api_url(resolved_net_gate, resolved_sandbox_server)
                    t_api = _tick()
                    obj_response = await _call_external_api_with_client(shared_client, url, ontology_json)
                    _tock(t_api, "[transaction] 对象更新 API 完成")
                    _ensure_api_success("对象更新", obj_response)

                # 处理新增逻辑（is_exist=False）
                for logic in result.get("logic", []):
                    if logic.get("is_exist"):
                        continue
                    fname = logic.get("function_name")
                    if not fname:
                        continue
                    fun_params = _parse_fun_params(logic.get("fun_params"))
                    logic_response = await create_logic_function_with_client(
                        shared_client,
                        ontology_name=ontology_name,
                        function_name=fname,
                        file_name="import_logic",
                        function_label=logic.get("function_label", fname),
                        fun_params=fun_params,
                        fun_desc=logic.get("fun_desc"),
                        net_gate=resolved_net_gate,
                        sandbox_server=resolved_sandbox_server,
                    )
                    _ensure_api_success(f"创建函数-{fname}", logic_response)

                # 处理新增动作（is_exist=False）
                for action in result.get("action", []):
                    if action.get("is_exist"):
                        continue
                    aname = action.get("action_name")
                    oname = action.get("object_name")
                    alabel = action.get("action_label")
                    if not aname or not oname or not alabel:
                        continue
                    fun_params = _parse_fun_params(action.get("fun_params"))
                    action_response = await create_action_function_with_client(
                        shared_client,
                        ontology_name=ontology_name,
                        used_objects=[oname],
                        function_name=aname,
                        file_name="import_action",
                        function_label=alabel,
                        fun_params=fun_params,
                        fun_desc=action.get("action_desc"),
                        net_gate=resolved_net_gate,
                        sandbox_server=resolved_sandbox_server,
                    )
                    _ensure_api_success(f"创建动作-{oname}.{aname}", action_response)

                logger.info("外部 API 调用全部顺序完成")

        # 添加数据库写入统计信息到返回结果
        result["import_stats"] = db_stats
        return result
    except Exception:
        logger.exception("OWL 导入失败，事务已回滚")
        raise


__all__ = ["export_ontology_to_owl", "import_owl_with_classification"]


# ==================================================================================
# Part 4: 导入读取上部分标准json（带新增/已存在分类，支持查询对比）
# ==================================================================================

# part 4.1 批量操作辅助函数

async def _bulk_insert(
    conn: aiomysql.Connection,
    table: str,
    cols: list[str],
    rows: list[tuple],
    chunk: int = 2000
) -> None:
    """批量插入数据（分批执行以避免 SQL 过长）

    设计说明：
    - 强制在事务连接内执行，确保事务一致性
    - 移除自动提交路径，避免并发问题

    Args:
        conn: 事务连接（必需）
        table: 表名
        cols: 列名列表
        rows: 数据行列表（每行是一个元组）
        chunk: 每批次的行数
    """
    if not rows:
        return

    for i in range(0, len(rows), chunk):
        batch = rows[i:i + chunk]
        placeholders = ", ".join(
            [f"({', '.join(['%s'] * len(cols))})" for _ in batch])
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES {placeholders}"

        # 展平数据
        flat_data = []
        for row in batch:
            flat_data.extend(row)

        # 在事务连接内执行
        async with conn.cursor() as cursor:
            await cursor.execute(sql, flat_data)

# part 4.2 落库操作
    
def _normalize_and_validate(result: dict[str, Any]) -> dict[str, Any]:
    """规范化和校验数据，为落库做准备

    职责：
    1. 填充默认值（label/desc/type）
    2. 生成 UUID
    3. 数据完整性检查
    4. 转换为落库友好的格式

    设计原则：
    - 不访问数据库（纯内存操作）
    - 所有校验逻辑集中在此处
    - 返回可直接用于 _write_all_data_pure 的数据

    Args:
        result: import_owl_with_classification 的原始返回结果（新结构：使用 is_exist 字段）

    Returns:
        dict: 规范化后的数据，格式：
            {
                "tags_new": [{id, tag_name, tag_label, tag_desc}, ...],
                "tags_exist": [{id, tag_name, tag_label, tag_desc}, ...],  # 将被跳过
                "objects_new": [{id, object_type_name, object_type_label, 
                                 object_type_desc, attributes: [...]}, ...],
                "objects_exist": [...],  # 将被跳过
            }
    """
    validated = {
        "tags_new": [],
        "tags_exist": [],
        "objects_new": [],
        "objects_exist": [],
        "links_new": [],
        "links_exist": [],
        "logic_new": [],
        "logic_exist": [],
        "actions_new": [],
        "actions_exist": [],
    }

    # 1-2. 处理标签（根据 is_exist 字段分类）
    for tag in result.get("tag", []):
        tag_data = {
            "tag_name": tag.get("tagName"),
            "tag_label": tag.get("tagLabel"),
            "tag_desc": tag.get("tagDesc")
        }
        if tag.get("is_exist"):
            # 已存在标签
            tag_data["id"] = tag["id"]
            tag_data["tag_label"] = tag_data["tag_label"] or tag_data["tag_name"]
            tag_data["tag_desc"] = tag_data["tag_desc"] or ""
            validated["tags_exist"].append(tag_data)
        else:
            # 新增标签
            tag_data["id"] = uuid4().hex
            validated["tags_new"].append(tag_data)

    # 3-4. 处理对象（根据 is_exist 字段分类）
    for obj in result.get("object", []):
        if obj.get("is_exist"):
            # 已存在对象
            if not obj.get("id") or not obj.get("objectTypeName"):
                logger.warning("跳过无效的已存在对象：缺少 id 或 objectTypeName")
                continue
            
            # 记录已存在对象（包含第一个属性ID，用于关系创建）
            attributes = obj.get("attributes", [])
            first_attr_id = None
            for attr in attributes:
                if attr.get("is_exist") and attr.get("id"):
                    first_attr_id = attr["id"]
                    break
            
            validated["objects_exist"].append({
                "id": obj["id"],
                "object_type_name": obj["objectTypeName"],
                "first_attribute_id": first_attr_id,  # 添加第一个属性ID
                "attributes": [attr for attr in attributes if attr.get("is_exist")],
            })
        else:
            # 新增对象
            normalized_obj = {
                "id": uuid4().hex,
                "object_type_name": obj.get("objectTypeName"),
                "object_type_label": obj.get("objectTypeLabel"),
                "object_type_desc": obj.get("objectTypeDesc"),
                "attributes": []
            }
            
            # 处理属性（只处理新增属性）
            for attr in obj.get("attributes", []):
                if not attr.get("is_exist"):
                    normalized_obj["attributes"].append({
                        "id": uuid4().hex,
                        "attribute_name": attr.get("attributeName"),
                        "attribute_en_name": (attr.get("fieldName") or "").strip(),
                        "attribute_desc": attr.get("attributeDesc"),
                        "is_primary_key": attr.get("isPrimaryKey"),
                        "is_title": attr.get("isTitle"),
                        "field_type": attr.get("fieldType")
                    })
            
            validated["objects_new"].append(normalized_obj)

    # 5-6. 处理关系（根据 is_exist 字段分类）
    for link in result.get("link", []):
        link_data = {
            "source_name": link.get("sourcename"),
            "source_label": link.get("sourcelabel"),
            "target_name": link.get("targetname"),
            "target_label": link.get("targetlabel"),
            "op_name_source": link.get("op_name_source"),
            "op_name_target": link.get("op_name_target"),
        }
        
        if link.get("is_exist"):
            # 已存在关系
            if not link.get("id") or not link.get("sourcename") or not link.get("targetname"):
                logger.warning("跳过无效的已存在关系：缺少 id、sourcename 或 targetname")
                continue
            link_data["id"] = link["id"]
            validated["links_exist"].append(link_data)
        else:
            # 新增关系
            link_data["id"] = uuid4().hex
            validated["links_new"].append(link_data)

    # 7. 处理逻辑（根据 is_exist 字段分类）
    for f in result.get("logic", []):
        # 规范化 file_name：确保以 .py 结尾
        _lfn = str(f.get("file_name") or "import_logic").strip()
        if _lfn and not _lfn.lower().endswith(".py"):
            _lfn = f"{_lfn}.py"
        
        logic_data = {
            "logic_type_name": f.get("function_name"),
            "logic_type_label": f.get("function_label"),
            "logic_type_desc": f.get("fun_desc") or "",
            "build_type": f.get("build_type") or "function",
            "file_name": _lfn,
            "intput_param": f.get("fun_params") or "",
            "output_param": "",
        }
        
        if f.get("is_exist"):
            # 已存在逻辑
            if not f.get("id") or not f.get("function_name"):
                logger.warning("无效的已存在逻辑（缺少 id/function_name）")
                continue
            logic_data["id"] = f["id"]
            validated["logic_exist"].append(logic_data)
        else:
            # 新增逻辑
            logic_data["id"] = uuid4().hex
            validated["logic_new"].append(logic_data)

    # 8. 处理动作（根据 is_exist 字段分类）
    for a in result.get("action", []):
        # 简单规范：file_name 以 .py 结尾
        _afn = str(a.get("file_name") or "import_action").strip()
        if _afn and not _afn.lower().endswith(".py"):
            _afn = f"{_afn}.py"
        
        action_data = {
            "object_type_name": a.get("object_name"),
            "action_name": a.get("action_name"),
            "action_label": a.get("action_label") or "",
            "action_desc": a.get("action_desc") or "",
            "build_type": a.get("build_type") or "function",
            "file_name": _afn,
            "intput_param": a.get("fun_params") or "",
        }
        
        if a.get("is_exist"):
            # 已存在动作
            if not a.get("id") or not a.get("action_name"):
                logger.warning("无效的已存在动作（缺少 id/action_name）")
                continue
            action_data["id"] = a["id"]
            validated["actions_exist"].append(action_data)
        else:
            # 新增动作
            action_data["id"] = uuid4().hex
            validated["actions_new"].append(action_data)

    return validated


async def _write_all_data_pure(
    conn: aiomysql.Connection,
    ontology_id: str,
    owner_id: str,
    validated_data: dict[str, Any]
) -> dict[str, Any]:
    """

    设计原则：
    1. 只新增，不更新（幂等性）
    2. 信任 JSON 分类结果，不查询数据库
    3. exist 数据跳过，只记录统计
    4. 所有写入在同一事务连接中执行

    Args:
        conn: 事务连接
        ontology_id: 本体ID
        owner_id: 所有者ID
        validated_data: 已完成校验和规范化的数据，由 _normalize_and_validate 生成

    Returns:
        dict: 统计信息
            {
                "inserted_tags": 新增标签数,
                "skipped_tags": 跳过标签数,
                "inserted_objects": 新增对象数,
                "skipped_objects": 跳过对象数,
                "inserted_attrs": 新增属性数,
                "inserted_links": 新增关系数,
                "skipped_links": 跳过关系数，
                "inserted_logic": 新增逻辑数,
                "skipped_logic": 跳过逻辑数,
                "inserted_actions": 新增动作数,
                "skipped_actions": 跳过动作数
            }
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    stats = {
        "inserted_tags": 0,
        "skipped_tags": 0,
        "inserted_objects": 0,
        "skipped_objects": 0,
        "inserted_attrs": 0,
        "inserted_links": 0,
        "skipped_links": 0,
        # 追加：逻辑/动作统计
        "inserted_logic": 0,
        "skipped_logic": 0,
        "inserted_actions": 0,
        "skipped_actions": 0,
    }

    # 1. 写入新增标签（批量）
    tags_new = validated_data.get("tags_new", [])
    if tags_new:
        logger.info(f"批量写入 {len(tags_new)} 个新标签")
        tag_rows = [
            (tag["id"], now_str, now_str, 1, tag["tag_name"],
             tag["tag_label"], tag["tag_desc"], 0)
            for tag in tags_new
        ]
        await _bulk_insert(
            conn=conn,
            table="ontology_tag",
            cols=["id", "create_time", "last_update", "sync_status",
                  "tag_name", "tag_label", "tag_desc", "oper_status"],
            rows=tag_rows
        )
        stats["inserted_tags"] = len(tag_rows)

    # 2. 跳过已存在标签（幂等性）
    tags_exist = validated_data.get("tags_exist", [])
    if tags_exist:
        stats["skipped_tags"] = len(tags_exist)
        logger.info(f"跳过 {len(tags_exist)} 个已存在的标签")

    # 3. 批量写入新增对象和属性
    objects_new = validated_data.get("objects_new", [])
    if objects_new:
        logger.info(f"批量写入 {len(objects_new)} 个新对象及其属性")
        
        # 3.1 批量插入所有对象（一次往返）
        obj_rows = [
            (obj["id"], now_str, now_str, obj["object_type_desc"],
             obj["object_type_label"], obj["object_type_name"],
             str(ontology_id), str(owner_id), "IconDockerHubColor-primary", 1, 1, 0)
            for obj in objects_new
        ]
        await _bulk_insert(
            conn=conn,
            table="ontology_object_type",
            cols=["id", "create_time", "last_update", "object_type_desc", "object_type_label",
                  "object_type_name", "ontology_id", "owner_id", "icon", "status", "sync_status", "oper_status"],
            rows=obj_rows
        )
        stats["inserted_objects"] = len(obj_rows)
        
        # 3.2 批量插入所有属性（一次往返）
        all_attr_rows = []
        for obj in objects_new:
            for attr in obj.get("attributes", []):
                all_attr_rows.append((
                    attr["id"], now_str, now_str, attr["attribute_name"],
                    attr["attribute_en_name"], attr["is_primary_key"], attr["is_title"],
                    obj["id"], None, attr["field_type"], 1, 1, attr.get("attribute_desc"), 0
                ))
        
        if all_attr_rows:
            await _bulk_insert(
                conn=conn,
                table="ontology_object_type_attribute",
                cols=["id", "create_time", "last_update", "attribute_name", "attribute_label",
                      "is_primary_key", "is_title", "object_type_id", "shared_attribute_id",
                      "field_type", "status", "sync_status", "attribute_desc",
                      "oper_status"],
                rows=all_attr_rows
            )
            stats["inserted_attrs"] = len(all_attr_rows)

    # 4. 跳过已存在对象（幂等性）
    objects_exist = validated_data.get("objects_exist", [])
    if objects_exist:
        stats["skipped_objects"] = len(objects_exist)
        logger.info(f"跳过 {len(objects_exist)} 个已存在的对象（幂等模式）")

    # 5. 写入新增关系（批量）
    links_new = validated_data.get("links_new", [])
    if links_new:
        logger.info(f"批量写入 {len(links_new)} 个新关系")

        # 从已验证数据中构建对象名称到ID和第一个属性ID的映射（无需查询数据库）
        obj_name_to_id = {}
        obj_name_to_first_attr_id = {}

        # 新增对象的映射（属性ID从validated_data直接获取）
        for obj in validated_data.get("objects_new", []):
            obj_name = obj["object_type_name"]
            obj_name_to_id[obj_name] = obj["id"]
            # 获取该对象的第一个属性ID
            attrs = obj.get("attributes", [])
            if attrs:
                obj_name_to_first_attr_id[obj_name] = attrs[0]["id"]

        # 已存在对象的映射（属性ID从validated_data直接获取，无需查询数据库）
        for obj in validated_data.get("objects_exist", []):
            obj_name = obj["object_type_name"]
            obj_name_to_id[obj_name] = obj["id"]
            # 从validated_data获取第一个属性ID（已在_normalize_and_validate中提取）
            first_attr_id = obj.get("first_attribute_id")
            if first_attr_id:
                obj_name_to_first_attr_id[obj_name] = first_attr_id

        link_rows = []
        for link in links_new:
            source_name = link["source_name"]
            target_name = link["target_name"]

            source_obj_id = obj_name_to_id.get(source_name)
            target_obj_id = obj_name_to_id.get(target_name)

            # 语义关系（link_type=4）不需要属性关联，属性ID设置为NULL
            source_attr_id = None
            target_attr_id = None

            logger.info(
                f"创建语义关系 {source_name}->{target_name}：link_type=4 (语义关系)，不关联属性")

            link_rows.append((
                link["id"], now_str, now_str, source_name,
                link["source_label"], target_name, link["target_label"],
                str(ontology_id), str(owner_id),
                source_obj_id, target_obj_id,  # 对象类型ID
                source_attr_id, target_attr_id,  # 属性ID为NULL（语义关系不需要）
                1, 4,  # link_method=1(一对一), link_type=4(语义关系)
                1, 1, 0
            ))

        await _bulk_insert(
            conn=conn,
            table="ontology_link_type",
            cols=["id", "create_time", "last_update", "source_name", "source_label",
                  "target_name", "target_label", "ontology_id", "owner_id",
                  "source_object_type_id", "target_object_type_id",  # 对象类型ID列
                  "source_attribute_id", "target_attribute_id",  # 属性ID列
                  "link_method", "link_type",  # 关系方法和类型
                  "status", "sync_status", "oper_status"],
            rows=link_rows
        )
        stats["inserted_links"] = len(link_rows)

        # 6. 写入关系-标签关联（基于 op_name_source/op_name_target，如存在）
        link_tag_rows: list[tuple] = []
        all_tag_names: set[str] = set()
        for link in links_new:
            op_src = link.get("op_name_source")
            op_tgt = link.get("op_name_target")
            if op_src:
                all_tag_names.add(op_src)
            if op_tgt:
                all_tag_names.add(op_tgt)

        # 基于规范化后的 tags_new/tags_exist 映射，避免再次查库
        tag_name_to_id: dict[str, str] = {}
        for t in (validated_data.get("tags_new") or []):
            name = t.get("tag_name")
            tid = t.get("id")
            if name and tid:
                tag_name_to_id[name] = tid
        for t in (validated_data.get("tags_exist") or []):
            name = t.get("tag_name")
            tid = t.get("id")
            if name and tid:
                tag_name_to_id[name] = tid

        for link in links_new:
            link_id = link["id"]
            op_src = link.get("op_name_source")
            op_tgt = link.get("op_name_target")
            if op_src and op_src in tag_name_to_id:
                link_tag_rows.append((uuid4().hex, link_id, tag_name_to_id[op_src], 'source'))
            if op_tgt and op_tgt in tag_name_to_id:
                link_tag_rows.append((uuid4().hex, link_id, tag_name_to_id[op_tgt], 'target'))

        if link_tag_rows:
            await _bulk_insert(
                conn=conn,
                table="ontology_link_type_tag",
                cols=["id", "link_type_id", "tag_id", "link_direct"],
                rows=link_tag_rows
            )


    # -- 扩展：写入 Logic 与 Actions 并统计 --
    # Logic（ontology_logic_type）
    logic_new = validated_data.get("logic_new", [])
    if logic_new:
        logger.info(f"准备写入 {len(logic_new)} 条逻辑（ontology_logic_type）")
        logic_rows = []
        for f in logic_new:
            #  file_name 以 .py 结尾
            file_name_val = str(f.get("file_name") or "import_logic").strip()
            if file_name_val and not file_name_val.lower().endswith(".py"):
                file_name_val = f"{file_name_val}.py"
            logic_rows.append((
                f["id"], now_str, now_str, 1,
                f.get("build_type", "function"),
                file_name_val,
                f.get("intput_param", ""),
                f.get("logic_type_desc", ""),
                f.get("logic_type_label") ,
                f.get("logic_type_name"),
                str(ontology_id),
                f.get("output_param", ""),
                1,
                0,
            ))
        await _bulk_insert(
            conn=conn,
            table="ontology_logic_type",
            cols=[
                "id", "create_time", "last_update", "sync_status",
                "build_type", "file_name", "intput_param",
                "logic_type_desc", "logic_type_label", "logic_type_name",
                "ontology_id", "output_param",
                "status", "oper_status",
            ],
            rows=logic_rows,
        )
        stats["inserted_logic"] = len(logic_rows)

    logic_exist = validated_data.get("logic_exist", [])
    if logic_exist:
        stats["skipped_logic"] = len(logic_exist)

    # Actions（ontology_object_type_action）
    actions_new = validated_data.get("actions_new", [])
    if actions_new:
        # 构建对象名->ID 映射（包含新增与已存在）
        obj_name_to_id: dict[str, str] = {}
        for obj in (validated_data.get("objects_new") or []):
            oname = obj.get("object_type_name")
            if oname:
                obj_name_to_id[oname] = obj.get("id")
        for obj in (validated_data.get("objects_exist") or []):
            oname = obj.get("object_type_name")
            if oname:
                obj_name_to_id[oname] = obj.get("id")

        action_rows = []
        for a in actions_new:
            oname = a.get("object_type_name")
            oid = obj_name_to_id.get(oname)
            if not oid:
                logger.warning(f"动作 {a.get('action_name')} 关联对象 {oname} 未定位到 ID，跳过写入")
                continue
            action_rows.append((
                a["id"], now_str, now_str, 1,
                oid,
                a.get("action_name"),
                a.get("action_label"),
                a.get("action_desc", ""),
                a.get("build_type", "function"),
                a.get("file_name"),
                None,
                1,
                str(ontology_id),
                a.get("intput_param", ""),
                0,
            ))

        if action_rows:
            await _bulk_insert(
                conn=conn,
                table="ontology_object_type_action",
                cols=[
                    "id", "create_time", "last_update", "sync_status",
                    "object_type_id", "action_name", "action_label", "action_desc", "build_type", "file_name",
                    "icon", "status", "ontology_id", "intput_param", "oper_status",
                ],
                rows=action_rows,
            )
            stats["inserted_actions"] = len(action_rows)

    actions_exist = validated_data.get("actions_exist", [])
    if actions_exist:
        stats["skipped_actions"] = len(actions_exist)

    logger.info(f"import summary: {stats}")
    return stats


# part 4.3 调用外部 API 的辅助函数

def _compose_external_api_url(
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> str:
    resolved_gate = _resolve_net_gate(net_gate)
    resolved_server = _resolve_sandbox_server(sandbox_server)
    base = _build_sandbox_base(resolved_gate, resolved_server)
    return f"{base}/api/v1/ontology/object/update"


def _build_sandbox_base(net_gate: str, sandbox_server: str) -> str:
    base = net_gate.rstrip("/")
    box = sandbox_server.strip("/")
    return f"{base}/{box}" if box else base


async def _call_external_api_with_client(
    client: httpx.AsyncClient,
    url: str,
    ontology_json: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """调用对象更新的外部接口，使用共用客户端，避免连接爆炸。"""
    await asyncio.sleep(0)
    t_api = _tick()
    logger.info(f"[db_perf] _call_external_api_with_client 开始调用: {url}")
    payload = {"ontology_json": ontology_json}
    result = await _post_json_api_with_client(client, url, payload)
    _tock(t_api, f"[db_perf] _call_external_api_with_client 结束")
    return result


async def _post_json_api_with_client(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, Any]
) -> dict[str, Any]:
    """通用 POST JSON 请求包装（复用共享客户端，避免连接池限制）

    返回统一结构：{ok, status_code, body|error}
    业务成功由 body.status == 'success' 判断（若 body 为 JSON 且含 status 字段）
    """
    try:
        resp = await client.post(url, json=payload)
        status_code = resp.status_code
        text = resp.text
        try:
            body = resp.json()
        except Exception:
            body = text
        ok = status_code == 200
        biz_ok = ok and isinstance(
            body, dict) and body.get("status") == "success"
        return {"ok": ok and biz_ok, "status_code": status_code, "body": body}
    except httpx.HTTPError as he:
        return {"ok": False, "error": f"HTTPError: {he}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _normalize_fun_params(
    fun_params: dict[str, Any] | None
) -> dict[str, Any]:
    """将多种入参风格规整为 {param_name: {type: str, is_required: bool}}

    支持：
    - 已经是期望结构
    - 简单 {name: type_str}
    - None/空 -> {}
    """
    if not fun_params:
        return {}
    result: dict[str, Any] = {}
    for k, v in fun_params.items():
        if isinstance(v, dict):
            p_type = v.get("type") or v.get("param_type") or "str"
            required = bool(v.get("is_required") or v.get("required"))
        else:
            p_type = str(v)
            required = False
        result[k] = {"type": p_type, "is_required": required}
    return result


async def create_logic_function_with_client(
    client: httpx.AsyncClient,
    ontology_name: str,
    function_name: str,
    file_name: str,
    function_label: str,
    fun_params: dict[str, Any] | None = None,
    fun_desc: str | None = None,
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> dict[str, Any]:
    """调用 sandbox /functions/create 生成或覆盖逻辑函数文件（复用共享客户端）。"""
    await asyncio.sleep(0)

    if not ontology_name:
        raise ValueError("ontology_name 不能为空")
    if not function_name:
        raise ValueError("function_name 不能为空")
    if not file_name:
        raise ValueError("file_name 不能为空")
    if not function_label:
        raise ValueError("function_label 不能为空")

    env = _resolve_sandbox_env(net_gate, sandbox_server)
    url = f"{env['base']}/functions/create"
    payload = {
        "ontology_name": ontology_name,
        "function_name": function_name,
        "file_name": file_name,
        "function_label": function_label,
        "fun_desc": fun_desc or "",
        "fun_params": _normalize_fun_params(fun_params),
    }
    api_res = await _post_json_api_with_client(client, url, payload)
    return {
        "status": "success" if api_res.get("ok") else "failed",
        "api": api_res,
        "payload": payload,
    }


async def create_action_function_with_client(
    client: httpx.AsyncClient,
    ontology_name: str,
    used_objects: list[str],
    function_name: str,
    file_name: str,
    function_label: str,
    fun_params: dict[str, Any] | None = None,
    fun_desc: str | None = None,
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> dict[str, Any]:
    """调用沙箱接口 /actions/create_fun 创建/覆盖 action 函数（复用共享客户端）。"""
    await asyncio.sleep(0)

    if not ontology_name:
        raise ValueError("ontology_name 不能为空")
    if not used_objects:
        raise ValueError("used_objects 不能为空")
    if not function_name:
        raise ValueError("function_name 不能为空")
    if not file_name:
        raise ValueError("file_name 不能为空")
    if not function_label:
        raise ValueError("function_label 不能为空")

    env = _resolve_sandbox_env(net_gate, sandbox_server)
    url = f"{env['base']}/actions/create_fun"
    payload = {
        "ontology_name": ontology_name,
        "used_objects": used_objects,
        "function_name": function_name,
        "fun_params": _normalize_fun_params(fun_params),
        "fun_desc": fun_desc,
        "file_name": file_name,
        "function_label": function_label,
    }
    api_res = await _post_json_api_with_client(client, url, payload)
    return {
        "status": "success" if api_res.get("ok") else "failed",
        "api": api_res,
        "payload": payload,
    }

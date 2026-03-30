"""
FastMCP server exposing ontology tools over Streamable HTTP.

Env:
- ONTOLOGY_API_BASE: Base URL of the ontology REST API (default http://localhost:5050/api/v1/ontology)
- MCP_HOST: Host to bind the MCP Streamable HTTP server (default 0.0.0.0)
- MCP_PORT: Port to bind (default 8001)
"""

import os
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import tempfile
import subprocess
import sys
import requests
import asyncio
import time
import threading
from mcp.server.fastmcp import FastMCP
from routers.service import ontology_service_impl
from public.public_variable import logger
from pathlib import Path
import re

mcp = FastMCP(
    name="Ontology Service Tools (Python)",
    instructions=(
        "Tools that call the ontology REST API and return structured results. Designed for LLM usage.\n"
        "This server runs via Streamable HTTP."
    ),
)


# async def _post_api(path: str, payload: Dict[str, Any]) -> Union[Dict[str, Any], List[Any], str]:
#     async with httpx.AsyncClient(timeout=60) as client:
#         resp = await client.post(f"{BASE}{path}", json=payload)
#         resp.raise_for_status()
#         api = resp.json()  # {"status":"success", "message":"<json-string>"}
#         message = api.get("message", "")
#         try:
#             return json.loads(message)
#         except Exception:
#             return message


# @mcp.tool()
# async def find_instance(
#     object_name: str,
#     condition: Dict[str, Any],
#     return_attrs: Optional[List[str]] = None,
# ) -> Union[Dict[str, Any], List[Any], str]:
#     """
#     Find an object instance by condition.
#     condition: structured object here; it will be stringified for the backend.
#     """
#     payload = {
#         "object_name": object_name,
#         "condition": json.dumps(condition, ensure_ascii=False),
#         "return_attrs": return_attrs,
#     }
#     return await _post_api("/object/find_instance", payload)


# @mcp.tool()
# async def list_instances(
#     object_name: str,
#     page_size: int = 50,
#     page_token: Optional[str] = None,
#     return_attrs: Optional[List[str]] = None,
#     order_by_column: Optional[str] = None,
# ) -> Union[Dict[str, Any], List[Any], str]:
#     """
#     List object instances with pagination.
#     """
#     payload = {
#         "object_name": object_name,
#         "page_size": page_size,
#         "page_token": page_token,
#         "return_attrs": return_attrs,
#         "order_by_column": order_by_column,
#     }
#     return await _post_api("/object/list_instances", payload)


# @mcp.tool()
# async def execute_function(
#     function_name: str,
#     params: Optional[Dict[str, Any]] = None,
# ) -> Union[Dict[str, Any], List[Any], str]:
#     """
#     Execute a registered ontology function.
#     """
#     payload = {
#         "function_name": function_name,
#         "params": json.dumps(params or {}, ensure_ascii=False) if params is not None else "",
#     }
#     return await _post_api("/function/execute", payload)


# @mcp.tool()
# async def execute_action(
#     object_name: str,
#     action_name: str,
#     params: Optional[Dict[str, Any]] = None,
# ) -> Union[Dict[str, Any], List[Any], str]:
#     """
#     Execute an action on a specific ontology object.
#     """
#     payload = {
#         "object_name": object_name,
#         "action_name": action_name,
#         "params": json.dumps(params or {}, ensure_ascii=False) if params is not None else "",
#     }
#     return await _post_api("/object/execute_action", payload)


@mcp.tool()
async def ontology_service_execute(
    ontology_name: str,
    code: str,
) -> Union[Dict[str, Any], List[Any], str]:
    """
ontology_service可以将你的入参代码转换为相应的函数或行动调用，或者查询对象的实例数据。注意，该工具的code入参的逻辑与ontology_python_exec不一致，请勿混淆。

## 执行行动
ttl中每个对象也可能会有绑定的action操作，参考bindAction的使用，来对实例数据进行增删改操作，action的调用方法为: <object>.<action_name>({...})。action允许的入参请参考rdf中的定义。注意！因为action涉及对数据的直接操作，属于高风险操作，所以用户在没有明确声明要执行某一个action之前，禁止自动调用任何的action。
示例："Device.add_device({"device_name":"test_device","device_type":"test_type"})"

## 执行函数
ttl中所有的logic也可被调用，logic的调用方法为: <logic_name>({...})。logic允许的入参请参考ttl中的定义。
示例："get_device_list({"device_name":"test_device","device_type":"test_type"})"

## 对象属性 -> 物理字段映射
执行 find 之前，请先通过 `check_attr_mapping({'object_names': ['A','B'...]})` 全局方法获取选择的所有对象的
"属性名 -> 物理字段名"映射关系（以及主键信息）。在查询语句中必须使用物理字段名；仅表名位置可使用"本体对象名"，系统会自动映射为实际表名。

示例：
'check_attr_mapping({"object_names": ["Device"]})'

## find 快速查询（使用物理字段名）
每一个本体对象在系统中被视为独立的对象类，可通过 `<object>.find({...})` 查询该对象下的实例数据。

find 的入参：
- where_sql: string
  - 使用 SQL 的 WHERE 子句（仅 WHERE 后面部分），其中列名必须为物理字段名（来自 check_attr_mapping）。
- where_params: any[]
  - 与 where_sql 中 %s 占位符一一对应；强烈建议参数化避免注入。
- return_attrs: string[]
  - 需要返回的物理字段名列表（不填则由后端决定返回列）。
- order_by / order_by_column: string
  - 排序表达式，列名必须为物理字段名，例如 "name DESC"。
- page_size: number
- page_token: number

find 返回格式：
- {"items": list[dict], "page_size": int, "next_page_token": int | None, "total_count": int}

示例：
'Device.find({"where_sql":"name = %s","where_params":["Alice"],"return_attrs":["id","name"],"order_by":"name DESC","page_size":50,"page_token":0})'

## 规则
- 如果工具返回的 next_page_token 为 None，说明没有下一页。
- 若结果数量非常多（可参考 total_count），请提示用户缩小查询范围或使用分页按需获取。
- code中禁止添加任何注释
    """
    logger.info(f"ontology_service_execute 执行: {ontology_name}, {code}")
    # payload = {
    #     "code": code,
    # }
    # Pre-validate ontology_name exists
    try:
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
    except Exception:
        # If FS check fails, continue to attempt execution; backend may provide better context
        pass

    # Basic validation for code string
    try:
        text = (code or "").strip()

        # Quick structure check: allow Object.method({...}) or method({...})
        call_match = re.match(r"^\s*([A-Za-z_][\w]*)\s*(?:\.\s*([A-Za-z_][\w]*))?\s*\(\s*(.*)\s*\)\s*$", text, re.DOTALL)
        if not call_match:
            return str({"error": "code 格式不正确，请使用 Object.method({...}) 或 method({...})，并确保括号/花括号成对出现"})

        # Balanced brackets validation ignoring quoted strings
        def _balanced(s: str) -> Optional[str]:
            stack: list[str] = []
            i = 0
            in_single = False
            in_double = False
            while i < len(s):
                ch = s[i]
                if ch == "\\":
                    i += 2
                    continue
                if not in_double and ch == "'":
                    in_single = not in_single
                elif not in_single and ch == '"':
                    in_double = not in_double
                elif not in_single and not in_double:
                    if ch in "([{":
                        stack.append(ch)
                    elif ch in ")]}":
                        if not stack:
                            return f"检测到多余的右括号 '{ch}'"
                        left = stack.pop()
                        pair = {')': '(', ']': '[', '}': '{'}
                        if pair.get(ch) != left:
                            return f"括号不匹配：'{left}' 与 '{ch}'"
                i += 1
            if stack:
                return "存在未闭合的括号，请检查括号/花括号/中括号是否成对"
            return None

        err = _balanced(text)
        if err:
            return str({"error": f"code 格式错误：{err}"})
    except Exception:
        # If validation itself fails, fall through to normal execution to preserve behavior
        pass
    try:
        return str(await ontology_service_impl(ontology_name, code, None))
    except ModuleNotFoundError as e:
        # Normalize ontology import errors to user-friendly message
        msg = str(e)
        # Check if it's the ontology module itself (not a sub-module like objects)
        # Pattern: "No module named 'core.ontology.{ontology_name}'" (exact match for base ontology)
        if msg.startswith("No module named") and f"'core.ontology.{ontology_name}'" in msg:
            # Check if it's specifically the ontology base module, not an object within it
            # If the error mentions something after ontology_name (like .objects or .SomeClass), it's an object error
            ontology_module_pattern = f"'core.ontology.{ontology_name}'"
            if ontology_module_pattern in msg and not re.search(rf"'core\.ontology\.{re.escape(ontology_name)}\.\w+", msg):
                return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
            # If there's a sub-path like core.ontology.{ontology_name}.SomeObject, it's an object import error
            object_match = re.search(rf"'core\.ontology\.{re.escape(ontology_name)}\.objects\.(\w+)'", msg)
            if object_match:
                object_name = object_match.group(1)
                return str({"error": f"未找到{object_name}对象，请检查对象名是否正确"})
        return str({"error": msg})
    except ImportError as e:
        msg = str(e)
        # Similar logic for ImportError: distinguish between ontology vs object import errors
        if f"core.ontology.{ontology_name}" in msg:
            # Check if it's an object-level import error by looking for a sub-path
            object_match = re.search(rf"core\.ontology\.{re.escape(ontology_name)}\.objects\.(\w+)", msg)
            if object_match:
                object_name = object_match.group(1)
                return str({"error": f"未找到{object_name}对象，请检查对象名是否正确"})
            # If no object sub-path found, assume it's ontology-level error
            return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
        return str({"error": msg})
    except Exception as e:
        return str({"error": str(e)})


def main() -> None:
    # Configure host/port if available
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port_str = os.getenv("MCP_PORT", "8002")
    try:
        mcp.settings.host = host
    except Exception:
        pass
    try:
        mcp.settings.port = int(port_str)
    except Exception:
        pass

    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()


# ---------------------------
# Complex SQL executor tool
# ---------------------------

@mcp.tool()
async def ontology_complex_sql_execute(
    ontology_name: str,
    sql: str,
    params: Optional[List[Any]] = None,
    page_size: Optional[int] = None,
    page_token: Optional[int] = None,
) -> Union[Dict[str, Any], List[Any], str]:
    """
执行复杂的原生 SQL 查询，用于更灵活、复杂的查询场景（WITH/CTE/子查询/窗口函数/多 JOIN 等）。

## 使用前提
执行 complex_sql 之前，请先通过 ontology_service_execute 工具调用 `check_attr_mapping({'object_names': ['A','B'...]})` 全局方法获取选择的所有对象的"属性名 -> 物理字段名"映射关系（以及主键信息）。

## SQL 规则
用于更灵活、复杂的查询（WITH/CTE/子查询/窗口函数/多 JOIN 等）。SQL 中：
- 表名位置可使用"本体对象名"（系统映射到物理表名）；
- 列名必须使用物理字段名（基于 check_attr_mapping 结果自行替换），不要使用本体属性名。
- 对于sql中查询的属性，需要带有对象前缀，避免解析错误。

## 入参说明
- ontology_name: 本体英文名
- sql: 完整 SQL（仅单条 SELECT；支持 WITH/CTE/子查询/窗口函数/多 JOIN；必须单行，无换行）
- params: 可选，与 SQL 中 %s 占位符一一对应的参数列表（建议参数化避免注入）
- page_size: 可选，分页大小
- page_token: 可选，分页标记

## 返回格式
{"items": list[dict], "page_size": int, "next_page_token": int | None, "total_count": int}

## 使用示例
ontology_name: "my_ontology"
sql: "WITH recent AS (SELECT orders.order_id, orders.customer_id FROM orders WHERE orders.order_date >= CURRENT_DATE - INTERVAL '30 days') SELECT customers.customer_id, customers.name, COUNT(recent.order_id) AS recent_30d_orders FROM customers LEFT JOIN recent ON customers.customer_id = recent.customer_id GROUP BY customers.customer_id, customers.name ORDER BY recent_30d_orders DESC"
page_size: 50
page_token: 0

## 规则
- 如果工具返回的 next_page_token 为 None，说明没有下一页。
- 若结果数量非常多（可参考 total_count），请提示用户缩小查询范围或使用分页按需获取。
    """
    logger.info(f"ontology_complex_sql_execute 执行: {ontology_name}, sql: {sql[:100]}...")
    
    # Pre-validate ontology_name exists
    try:
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
    except Exception:
        # If FS check fails, continue to attempt execution; backend may provide better context
        pass

    # Validate SQL
    if not sql or not sql.strip():
        return str({"error": "sql 不能为空"})
    
    # Build complex_sql call
    try:
        params_dict = {"sql": sql}
        if params is not None:
            params_dict["params"] = params
        if page_size is not None:
            params_dict["page_size"] = page_size
        if page_token is not None:
            params_dict["page_token"] = page_token
        
        # Convert to JSON string and construct the code
        params_json = json.dumps(params_dict, ensure_ascii=False)
        code = f"complex_sql({params_json})"
        
        logger.info(f"构造的调用代码: {code[:200]}...")
        
        return str(await ontology_service_impl(ontology_name, code, None))
    except ModuleNotFoundError as e:
        # Normalize ontology import errors to user-friendly message
        msg = str(e)
        # Check if it's the ontology module itself (not a sub-module like objects)
        # Pattern: "No module named 'core.ontology.{ontology_name}'" (exact match for base ontology)
        if msg.startswith("No module named") and f"'core.ontology.{ontology_name}'" in msg:
            # Check if it's specifically the ontology base module, not an object within it
            # If the error mentions something after ontology_name (like .objects or .SomeClass), it's an object error
            ontology_module_pattern = f"'core.ontology.{ontology_name}'"
            if ontology_module_pattern in msg and not re.search(rf"'core\.ontology\.{re.escape(ontology_name)}\.\w+", msg):
                return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
            # If there's a sub-path like core.ontology.{ontology_name}.SomeObject, it's an object import error
            object_match = re.search(rf"'core\.ontology\.{re.escape(ontology_name)}\.objects\.(\w+)'", msg)
            if object_match:
                object_name = object_match.group(1)
                return str({"error": f"未找到{object_name}对象，请检查对象名是否正确"})
        return str({"error": msg})
    except ImportError as e:
        msg = str(e)
        # Similar logic for ImportError: distinguish between ontology vs object import errors
        if f"core.ontology.{ontology_name}" in msg:
            # Check if it's an object-level import error by looking for a sub-path
            object_match = re.search(rf"core\.ontology\.{re.escape(ontology_name)}\.objects\.(\w+)", msg)
            if object_match:
                object_name = object_match.group(1)
                return str({"error": f"未找到{object_name}对象，请检查对象名是否正确"})
            # If no object sub-path found, assume it's ontology-level error
            return str({"error": f"未找到{ontology_name}本体，请检查本体英文名是否正确"})
        return str({"error": msg})
    except Exception as e:
        return str({"error": str(e)})


# ---------------------------
# Python file management and execution tools
# ---------------------------

import uuid
import shutil
from datetime import datetime

# 获取临时目录的根路径
def _get_temp_root():
    """获取或创建临时目录根路径"""
    temp_root = Path(tempfile.gettempdir()) / "ontology_python_workspace"
    temp_root.mkdir(exist_ok=True)
    return temp_root

def _get_ontology_workspace(ontology_name: str):
    """获取或创建指定本体的工作空间目录，并初始化运行时模块"""
    workspace = _get_temp_root() / ontology_name
    workspace.mkdir(exist_ok=True)
    
    # 创建或更新运行时模块文件，让所有用户文件都能导入辅助函数
    _create_runtime_module(workspace, ontology_name)
    
    return workspace

def _create_runtime_module(workspace: Path, ontology_name: str):
    """
    在工作空间创建运行时模块文件 __ontology_runtime__.py
    包含所有 prelude 中的辅助函数，供用户文件导入使用
    """
    runtime_file = workspace / "__ontology_runtime__.py"
    
    # 检查文件是否已存在且较新（避免每次都重写）
    # 使用版本号强制更新（当代码逻辑变更时增加此版本号）
    _RUNTIME_VERSION = "v2"  # 修复路径解析问题
    
    if runtime_file.exists():
        # 检查版本号
        try:
            content = runtime_file.read_text(encoding="utf-8")
            if f"# RUNTIME_VERSION: {_RUNTIME_VERSION}" in content:
                # 如果版本匹配且文件在最近1分钟内创建，跳过
                import time
                if time.time() - runtime_file.stat().st_mtime < 60:
                    return
        except Exception:
            pass
    
    runtime_code = '''# -*- coding: utf-8 -*-
# RUNTIME_VERSION: {runtime_version}
"""
本体运行时模块 - 自动生成
提供所有辅助函数供用户文件导入使用

使用示例：
    from __ontology_runtime__ import get_object, call_find, execute_action
    
    # 或导入所有
    from __ontology_runtime__ import *
"""
import os
import sys

# 查找项目根目录（包含 core/ontology 的目录）
_project_root = None
from pathlib import Path as _Path
for _p in sys.path:
    _test_path = _Path(_p) / "core" / "ontology"
    if _test_path.exists():
        _project_root = _Path(_p)
        break

# 确保项目根目录在 sys.path 中
if _project_root and str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from core.runtime.base import OntologyObject
import importlib
import asyncio as _asyncio
import inspect as _inspect

_ONTOLOGY_NAME = "{ontology_name}"

def _collect_ontology_maps(ontology_name: str):
    maps = {{"object_to_table": {{}}, "object_attr_to_col": {{}}, "attr_sets": {{}}}}
    
    if not _project_root:
        return maps
    
    obj_dir = _project_root / "core" / "ontology" / str(ontology_name) / "objects"
    if obj_dir.exists():
        for py in obj_dir.iterdir():
            if not py.is_file() or not py.name.endswith(".py") or py.stem.startswith("__"):
                continue
            try:
                module = importlib.import_module("core.ontology." + str(ontology_name) + ".objects." + str(py.stem))
                candidates = []
                for n in dir(module):
                    obj = getattr(module, n)
                    try:
                        if isinstance(obj, type) and issubclass(obj, OntologyObject):
                            candidates.append(obj)
                    except Exception:
                        continue
                for cls_obj in candidates:
                    try:
                        inst = cls_obj()
                        table = getattr(inst, "_table_name", None)
                        field_map = getattr(inst, "_field_map", None) or {{}}
                        if isinstance(table, str) and isinstance(field_map, dict) and field_map:
                            mod_name = str(py.stem)
                            cls_name = cls_obj.__name__
                            if mod_name not in maps["object_to_table"]:
                                maps["object_to_table"][mod_name] = table
                            maps["object_to_table"][cls_name] = table
                            maps["attr_sets"][mod_name] = set(field_map.keys())
                            maps["attr_sets"][cls_name] = set(field_map.keys())
                            for a, c in field_map.items():
                                maps["object_attr_to_col"][(mod_name, a)] = c
                                maps["object_attr_to_col"][(cls_name, a)] = c
                    except Exception:
                        continue
            except Exception:
                continue
    return maps

_ONT_MAPS = _collect_ontology_maps(_ONTOLOGY_NAME)

def get_object(class_name: str):
    """获取本体对象实例
    
    Args:
        class_name: 对象类名
        
    Returns:
        对象实例
        
    Example:
        o = get_object("orders")
    """
    module_path = "core.ontology." + _ONTOLOGY_NAME + ".objects." + str(class_name)
    mod = importlib.import_module(module_path)
    if hasattr(mod, class_name):
        cls = getattr(mod, class_name)
        return cls()
    raise ImportError("对象类 " + str(class_name) + " 未找到")

def _merge_args_kwargs(args, kwargs):
    if args and len(args) == 1 and isinstance(args[0], dict):
        merged = dict(args[0])
        merged.update(dict(kwargs))
        return merged
    return dict(kwargs)

def call_find(obj, *args, **kwargs):
    """执行对象查询
    
    Args:
        obj: 对象实例或对象名（字符串）
        **kwargs: 查询参数（where_sql, where_params, return_attrs等）
        
    Returns:
        查询结果
        
    Example:
        result = call_find("orders", where_sql="status = %s", where_params=["PAID"])
    """
    if isinstance(obj, str):
        obj = get_object(obj)
    params = _merge_args_kwargs(args, kwargs)
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return obj.find(**params)

def call_check_attr_mapping(object_names):
    """批量获取对象的属性映射信息（属性名->物理列名、主键信息等）
    
    Args:
        object_names: 对象名列表
        
    Returns:
        属性映射信息
        
    Example:
        mapping = call_check_attr_mapping(["orders", "customers"])
    """
    try:
        names = list(object_names or [])
    except Exception:
        names = []
    return OntologyObject().check_attr_mapping(object_names=names, ontology_name=_ONTOLOGY_NAME, ontology_maps=_ONT_MAPS)

def call_complex_sql(*args, **kwargs):
    """执行复杂SQL查询
    
    Args:
        sql: SQL语句（必需）
        **kwargs: 其他参数（params, page_size, page_token等）
        
    Returns:
        查询结果
        
    Example:
        result = call_complex_sql(sql="SELECT * FROM orders WHERE ...", params=[...])
    """
    sql = None
    if args:
        if isinstance(args[0], str):
            sql = args[0]
            params = dict(kwargs)
        elif isinstance(args[0], dict):
            cfg = dict(args[0])
            sql = cfg.pop("sql", None)
            params = cfg
        else:
            params = dict(kwargs)
    else:
        params = dict(kwargs)
        if "sql" in params:
            sql = params.pop("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise ValueError("call_complex_sql 需要提供 sql 字符串")
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return OntologyObject().complex_sql(sql=sql, **params)

# 加载逻辑函数和行动
try:
    from core.runtime.loader import refresh, refresh_actions
    from pathlib import Path as _PathLib
    
    # 获取项目根目录（sys.path[0] 已经包含了项目根目录）
    _project_root = None
    for path in sys.path:
        _test_path = _PathLib(path) / "core" / "ontology"
        if _test_path.exists():
            _project_root = _PathLib(path)
            break
    
    if _project_root:
        _logics_dir = _project_root / "core" / "ontology" / str(_ONTOLOGY_NAME) / "logics"
        if _logics_dir.exists():
            refresh(_ONTOLOGY_NAME, str(_logics_dir))
        _api_logics_dir = _project_root / "core" / "ontology_apis" / str(_ONTOLOGY_NAME) / "logics"
        if _api_logics_dir.exists():
            refresh(_ONTOLOGY_NAME, str(_api_logics_dir), merge=True)
        _actions_dir = _project_root / "core" / "ontology" / str(_ONTOLOGY_NAME) / "actions"
        if _actions_dir.exists():
            refresh_actions(_ONTOLOGY_NAME, str(_actions_dir))
        _api_actions_dir = _project_root / "core" / "ontology_apis" / str(_ONTOLOGY_NAME) / "actions"
        if _api_actions_dir.exists():
            refresh_actions(_ONTOLOGY_NAME, str(_api_actions_dir), merge=True)
except Exception:
    pass

def execute_logic(logic_name: str, params: dict | None = None):
    """执行逻辑函数
    
    Args:
        logic_name: 逻辑函数名
        params: 参数字典
        
    Returns:
        执行结果
        
    Example:
        result = execute_logic("get_order_summary", {{"order_id": "123"}})
    """
    try:
        from core.runtime.executor import execute as _exec
    except Exception as e:
        raise RuntimeError("无法导入逻辑执行器: " + str(e))
    result = _exec(_ONTOLOGY_NAME, logic_name, params or {{}}, None)
    if _inspect.iscoroutine(result):
        return _asyncio.run(result)
    return result

def execute_action(object_or_name, action_name: str, params: dict | None = None):
    """执行对象行动
    
    Args:
        object_or_name: 对象实例或对象名（字符串）
        action_name: 行动名
        params: 参数字典
        
    Returns:
        执行结果
        
    Example:
        result = execute_action("orders", "add_order", {{"order_id": "123"}})
    """
    if isinstance(object_or_name, OntologyObject):
        obj = object_or_name
        object_name = type(object_or_name).__name__
    else:
        obj = get_object(object_or_name)
        object_name = object_or_name
    if not hasattr(obj, action_name):
        raise AttributeError("对象 '" + object_name + "' 上未找到方法 '" + action_name + "'")
    method = getattr(obj, action_name)
    kwargs = dict(params or {{}})
    kwargs.setdefault("ontology_name", _ONTOLOGY_NAME)
    kwargs.setdefault("ontology_maps", _ONT_MAPS)
    try:
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)
    except TypeError:
        kwargs.pop("ontology_name", None)
        kwargs.pop("ontology_maps", None)
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)

# 导出到MinIO
from public.public_function import export_to_minio as _export_to_minio

def export_to_minio(data, filename=None):
    """将数据导出到MinIO并返回下载链接
    
    Args:
        data: 要导出的数据列表
        filename: 可选的文件名
        
    Returns:
        包含下载链接等信息的字典
        
    Example:
        result = export_to_minio(large_data)
        if result["success"]:
            print(result["download_url"])
    """
    return _export_to_minio(data, _ONTOLOGY_NAME, filename)

# 定义 __all__ 以支持 from __ontology_runtime__ import *
__all__ = [
    'get_object',
    'call_find', 
    'call_check_attr_mapping',
    'call_complex_sql',
    'execute_logic',
    'execute_action',
    'export_to_minio',
    'OntologyObject',
]
'''.format(ontology_name=ontology_name, runtime_version=_RUNTIME_VERSION)
    
    try:
        runtime_file.write_text(runtime_code, encoding="utf-8")
        logger.debug(f"已创建/更新运行时模块: {runtime_file}")
    except Exception as e:
        logger.warning(f"创建运行时模块失败: {e}")

# 文件生命周期管理
_FILE_LIFETIME_HOURS = 1  # 文件生命周期：1小时
_CLEANUP_INTERVAL_MINUTES = 10  # 清理任务执行间隔：10分钟

def _cleanup_expired_files(ontology_name: Optional[str] = None) -> Dict[str, Any]:
    """
    清理过期的Python文件
    
    Args:
        ontology_name: 如果指定，只清理该本体的文件；否则清理所有本体的过期文件
        
    Returns:
        清理统计信息
    """
    current_time = time.time()
    lifetime_seconds = _FILE_LIFETIME_HOURS * 3600
    deleted_count = 0
    deleted_files = []
    errors = []
    
    try:
        temp_root = _get_temp_root()
        
        # 确定要清理的目录列表
        if ontology_name:
            workspace = temp_root / ontology_name
            if workspace.exists():
                workspaces = [workspace]
            else:
                workspaces = []
        else:
            # 清理所有本体的工作空间
            workspaces = [d for d in temp_root.iterdir() if d.is_dir()]
        
        for workspace in workspaces:
            try:
                for py_file in workspace.glob("*.py"):
                    if not py_file.is_file():
                        continue
                    
                    try:
                        # 获取文件的修改时间
                        file_mtime = py_file.stat().st_mtime
                        file_age = current_time - file_mtime
                        
                        # 如果文件超过生命周期，删除它
                        if file_age > lifetime_seconds:
                            py_file.unlink()
                            deleted_count += 1
                            deleted_files.append({
                                "file": str(py_file),
                                "age_hours": round(file_age / 3600, 2)
                            })
                            logger.info(f"已删除过期文件: {py_file} (存在时长: {file_age/3600:.2f}小时)")
                    except Exception as e:
                        errors.append(f"删除文件 {py_file} 失败: {str(e)}")
                        logger.error(f"删除文件失败: {py_file}, 错误: {e}")
            except Exception as e:
                errors.append(f"扫描目录 {workspace} 失败: {str(e)}")
                logger.error(f"扫描目录失败: {workspace}, 错误: {e}")
        
        return {
            "deleted_count": deleted_count,
            "deleted_files": deleted_files[:10],  # 最多返回10个删除的文件示例
            "errors": errors,
            "lifetime_hours": _FILE_LIFETIME_HOURS
        }
    except Exception as e:
        logger.error(f"清理过期文件失败: {e}")
        return {
            "deleted_count": deleted_count,
            "deleted_files": deleted_files,
            "errors": errors + [f"清理任务异常: {str(e)}"],
            "lifetime_hours": _FILE_LIFETIME_HOURS
        }

def _background_cleanup_task():
    """后台定时清理任务"""
    while True:
        try:
            time.sleep(_CLEANUP_INTERVAL_MINUTES * 60)
            logger.info("开始执行后台文件清理任务...")
            result = _cleanup_expired_files()
            if result["deleted_count"] > 0:
                logger.info(f"后台清理完成: 删除了 {result['deleted_count']} 个过期文件")
            else:
                logger.debug("后台清理完成: 无过期文件")
        except Exception as e:
            logger.error(f"后台清理任务异常: {e}")

# 启动后台清理线程
_cleanup_thread = threading.Thread(target=_background_cleanup_task, daemon=True, name="FileCleanupThread")
_cleanup_thread.start()
logger.info(f"后台文件清理任务已启动 (间隔: {_CLEANUP_INTERVAL_MINUTES}分钟, 文件生命周期: {_FILE_LIFETIME_HOURS}小时)")

@mcp.tool()
async def write_python_file(
    ontology_name: str,
    python_code: str,
    filename: Optional[str] = None,
) -> Dict[str, Any]:
    """
将 Python 代码写入到本体工作空间中的文件（仅创建新文件）。

重要提示：
- 如果文件已存在，会返回错误，不会覆盖
- 如需更新已存在的文件，请使用 update_python_file
- 如需删除文件，请使用 delete_python_file

工作空间说明：
- 每个本体有独立的工作空间：/tmp/ontology_python_workspace/{ontology_name}/
- 自动创建运行时模块 `__ontology_runtime__.py`，包含所有辅助函数
- 文件生命周期为 1 小时，过期后自动清理

辅助函数使用指南：
1. 主运行文件（将被 run_python_file 直接执行的文件）：
   - 辅助函数已自动注入，可直接使用无需导入
   - 可以导入同工作空间的其他模块
   
2. 工具模块文件（被其他文件导入的文件）：
   - 需要显式导入：from __ontology_runtime__ import get_object, call_find, ...
   - 或导入所有：from __ontology_runtime__ import *
   
3. 可用的辅助函数：
   - get_object(class_name) - 获取本体对象
   
   - call_find(obj, **kwargs) - 执行查询
     返回格式：{"items": list, "page_size": int, "next_page_token": int|None, 
                "total_count": int, "is_long_result": bool, "message": str}
     * is_long_result=True 表示数据量大，数据已转存为CSV文件
     * 此时 items 只包含前几条样本数据，完整数据路径在 message 中
     * 需要通过 message 获取CSV文件路径来访问完整数据
   
   - call_check_attr_mapping(object_names) - 获取属性映射
   
   - call_complex_sql(sql, **kwargs) - 执行复杂SQL
     返回格式：{"items": list, "page_size": int, "next_page_token": int|None,
                "total_count": int, "is_long_result": bool, "message": str}
     * 与 call_find 相同，当 is_long_result=True 时数据已转存为CSV
   
   - execute_logic(logic_name, params) - 执行逻辑函数
   
   - execute_action(obj_name, action_name, params) - 执行行动
   
   - export_to_minio(data, filename) - 导出数据到MinIO并获取下载链接

重要行为说明：
- call_find 和 call_complex_sql 在返回大量数据时会自动处理：
  * 当结果数据量较大时，is_long_result 字段为 True
  * 完整数据会被保存为 CSV 文件，路径信息在 message 字段中
  * items 字段只包含前几条样本数据供预览
  * total_count 字段包含实际的总记录数
  * 需要根据 is_long_result 判断如何处理数据

约束：
- 必须调用 execute_logic(logic_name: str, params: dict | None = None) 方法来执行逻辑
- 必须调用 execute_action(object_name: str, action_name: str, params: dict | None = None) 方法来执行行动
- 可以调用 export_to_minio(data: list[dict], filename: str | None = None) 将大数据量导出到MinIO并获取下载链接
  返回格式：{"success": bool, "download_url": str, "filename": str, "records_count": int, "message": str}
- 禁止直接通过代码的方式自行保存结果到csv文件，用户无法管理和访问这些文件
  必须通过 export_to_minio 方法来导出才可以访问
- 必须使用 print 来输出结果，才会在最终的 stdout 返回中呈现

入参：
- ontology_name: 本体英文名
- python_code: 要写入的 Python 代码
- filename: 可选的文件名（不含路径），如果不提供则自动生成随机文件名

返回：
{
    "success": bool,
    "file_path": str,  # 完整文件路径
    "filename": str,   # 文件名
    "message": str
}

示例1 - 写入工具模块（需要显式导入辅助函数）：
write_python_file("my_ontology", \"\"\"
from __ontology_runtime__ import get_object, call_find, execute_action

def get_paid_orders():
    orders = get_object("orders")
    result = call_find(orders, where_sql="status = %s", where_params=["PAID"])
    return result["items"]

def create_order(order_data):
    return execute_action("orders", "add_order", order_data)
\"\"\", "order_utils.py")

示例2 - 写入主运行文件（辅助函数已注入，无需导入）：
write_python_file("my_ontology", \"\"\"
import order_utils

# 直接使用辅助函数（无需导入）
mapping = call_check_attr_mapping(["orders"])
print(f"Mapping: {mapping}")

# 使用工具模块
paid_orders = order_utils.get_paid_orders()
print(f"Found {len(paid_orders)} orders")
\"\"\", "main.py")

示例3 - 写入纯工具函数（不依赖辅助函数）：
write_python_file("my_ontology", \"\"\"
def calculate_total(items):
    return sum(item.get("amount", 0) for item in items)

def format_currency(amount):
    return f"${amount:.2f}"
\"\"\", "utils.py")

示例4 - 完整的模块化项目：
# 步骤1：写入数据处理模块
write_python_file("my_ontology", \"\"\"
from __ontology_runtime__ import get_object, call_find

def fetch_data(status):
    orders = get_object("orders")
    return call_find(orders, where_sql="status = %s", where_params=[status])
\"\"\", "data_service.py")

# 步骤2：写入业务逻辑模块
write_python_file("my_ontology", \"\"\"
import data_service

def calculate_summary(status):
    result = data_service.fetch_data(status)
    total = sum(item.get("amount", 0) for item in result["items"])
    return {"count": len(result["items"]), "total": total}
\"\"\", "business_logic.py")

# 步骤3：写入主文件
write_python_file("my_ontology", \"\"\"
import business_logic

summary = business_logic.calculate_summary("PAID")
print(f"Summary: {summary}")
\"\"\", "main.py")

# 步骤4：运行主文件
run_python_file("my_ontology", "main.py")

示例5 - 处理大数据结果（is_long_result）：
write_python_file("my_ontology", \"\"\"
from __ontology_runtime__ import get_object, call_find, export_to_minio

# 查询可能返回大量数据
orders = get_object("orders")
result = call_find(orders, where_sql="status = %s", where_params=["COMPLETED"])

# 检查是否为大数据结果
if result.get("is_long_result"):
    print(f"数据量较大，已转存为CSV文件")
    print(f"CSV文件信息: {result.get('message')}")
    print(f"样本数据（前几条）: {result['items'][:3]}")
    print(f"总记录数: {result['total_count']}")
    
    # 如果需要进一步处理，可以读取CSV文件或导出到MinIO
    # 注意：CSV文件路径在 message 中
else:
    # 正常处理数据
    print(f"找到 {len(result['items'])} 条记录")
    for item in result['items']:
        print(item)

# 如果需要导出大数据到MinIO获取下载链接
if result.get("is_long_result") or len(result['items']) > 1000:
    export_result = export_to_minio(result['items'])
    if export_result['success']:
        print(f"数据已导出到MinIO: {export_result['download_url']}")
\"\"\", "handle_large_data.py")
    """
    try:
        # 懒删除：写入新文件时顺便清理过期文件
        try:
            _cleanup_expired_files(ontology_name)
        except Exception as e:
            logger.warning(f"懒删除失败: {e}")
        
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "success": False,
                "file_path": "",
                "filename": "",
                "message": f"未找到{ontology_name}本体，请检查本体英文名是否正确"
            }
        
        # 验证代码不为空
        if not isinstance(python_code, str) or not python_code.strip():
            return {
                "success": False,
                "file_path": "",
                "filename": "",
                "message": "python_code 不能为空"
            }
        
        # 获取工作空间
        workspace = _get_ontology_workspace(ontology_name)
        
        # 生成文件名
        if filename:
            # 验证文件名安全性
            if "/" in filename or "\\" in filename or ".." in filename:
                return {
                    "success": False,
                    "file_path": "",
                    "filename": "",
                    "message": "文件名不能包含路径分隔符"
                }
            if not filename.endswith(".py"):
                filename = filename + ".py"
        else:
            # 生成随机文件名
            filename = f"module_{uuid.uuid4().hex[:8]}.py"
        
        # 检查文件是否已存在
        file_path = workspace / filename
        if file_path.exists():
            return {
                "success": False,
                "file_path": str(file_path),
                "filename": filename,
                "message": f"文件 {filename} 已存在，请使用不同的文件名或先删除已存在的文件"
            }
        
        # 写入文件
        file_path.write_text(python_code, encoding="utf-8")
        
        logger.info(f"成功写入Python文件: {file_path}")
        return {
            "success": True,
            "file_path": str(file_path),
            "filename": filename,
            "message": f"成功写入文件 {filename}"
        }
    except Exception as e:
        logger.error(f"写入Python文件失败: {e}")
        return {
            "success": False,
            "file_path": "",
            "filename": "",
            "message": f"写入文件失败: {str(e)}"
        }

@mcp.tool()
async def update_python_file(
    ontology_name: str,
    file_path: str,
    python_code: str,
) -> Dict[str, Any]:
    """
更新本体工作空间中已存在的 Python 文件（覆盖写入）。

如果文件不存在，会返回错误。如果需要创建新文件，请使用 write_python_file。

入参：
- ontology_name: 本体英文名
- file_path: 文件路径（可以是完整路径，也可以是文件名）
- python_code: 要写入的新 Python 代码

返回：
{
    "success": bool,
    "file_path": str,  # 完整文件路径
    "filename": str,   # 文件名
    "message": str
}

示例：
update_python_file("my_ontology", "utils.py", "def new_function():\\n    pass")
    """
    try:
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "success": False,
                "file_path": "",
                "filename": "",
                "message": f"未找到{ontology_name}本体，请检查本体英文名是否正确"
            }
        
        # 验证代码不为空
        if not isinstance(python_code, str) or not python_code.strip():
            return {
                "success": False,
                "file_path": "",
                "filename": "",
                "message": "python_code 不能为空"
            }
        
        # 解析文件路径
        workspace = _get_ontology_workspace(ontology_name)
        file_obj = Path(file_path)
        
        # 如果是完整路径，验证是否在工作空间内
        if file_obj.is_absolute():
            target_path = file_obj
            # 安全检查：确保文件在工作空间内
            try:
                target_path.resolve().relative_to(workspace.resolve())
            except ValueError:
                return {
                    "success": False,
                    "file_path": str(file_path),
                    "filename": "",
                    "message": "文件路径必须在本体工作空间内"
                }
        else:
            # 相对路径，直接在工作空间内查找
            target_path = workspace / file_obj.name
        
        # 检查文件是否存在
        if not target_path.exists():
            return {
                "success": False,
                "file_path": str(target_path),
                "filename": target_path.name,
                "message": f"文件 {target_path.name} 不存在，请先使用 write_python_file 创建文件"
            }
        
        # 更新文件
        target_path.write_text(python_code, encoding="utf-8")
        
        logger.info(f"成功更新Python文件: {target_path}")
        return {
            "success": True,
            "file_path": str(target_path),
            "filename": target_path.name,
            "message": f"成功更新文件 {target_path.name}"
        }
    except Exception as e:
        logger.error(f"更新Python文件失败: {e}")
        return {
            "success": False,
            "file_path": str(file_path),
            "filename": "",
            "message": f"更新文件失败: {str(e)}"
        }

@mcp.tool()
async def read_python_file(
    ontology_name: str,
    file_path: str,
) -> Dict[str, Any]:
    """
读取本体工作空间中的 Python 文件内容。

入参：
- ontology_name: 本体英文名
- file_path: 文件路径（可以是完整路径，也可以是文件名）

返回：
{
    "success": bool,
    "content": str,    # 文件内容
    "file_path": str,  # 完整文件路径
    "message": str
}

示例：
read_python_file("my_ontology", "utils.py")
read_python_file("my_ontology", "/tmp/ontology_python_workspace/my_ontology/utils.py")
    """
    try:
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "success": False,
                "content": "",
                "file_path": "",
                "message": f"未找到{ontology_name}本体，请检查本体英文名是否正确"
            }
        
        # 解析文件路径
        workspace = _get_ontology_workspace(ontology_name)
        file_obj = Path(file_path)
        
        # 如果是完整路径，验证是否在工作空间内
        if file_obj.is_absolute():
            target_path = file_obj
            # 安全检查：确保文件在工作空间内
            try:
                target_path.resolve().relative_to(workspace.resolve())
            except ValueError:
                return {
                    "success": False,
                    "content": "",
                    "file_path": str(file_path),
                    "message": "文件路径必须在本体工作空间内"
                }
        else:
            # 相对路径，直接在工作空间内查找
            target_path = workspace / file_obj.name
        
        # 读取文件
        if not target_path.exists():
            return {
                "success": False,
                "content": "",
                "file_path": str(target_path),
                "message": f"文件不存在: {target_path}"
            }
        
        content = target_path.read_text(encoding="utf-8")
        logger.info(f"成功读取Python文件: {target_path}")
        return {
            "success": True,
            "content": content,
            "file_path": str(target_path),
            "message": "成功读取文件"
        }
    except Exception as e:
        logger.error(f"读取Python文件失败: {e}")
        return {
            "success": False,
            "content": "",
            "file_path": str(file_path),
            "message": f"读取文件失败: {str(e)}"
        }

@mcp.tool()
async def delete_python_file(
    ontology_name: str,
    file_path: str,
) -> Dict[str, Any]:
    """
删除本体工作空间中的 Python 文件。

入参：
- ontology_name: 本体英文名
- file_path: 文件路径（可以是完整路径，也可以是文件名）

返回：
{
    "success": bool,
    "file_path": str,  # 被删除的文件路径
    "filename": str,   # 文件名
    "message": str
}

示例：
delete_python_file("my_ontology", "old_utils.py")
delete_python_file("my_ontology", "/tmp/ontology_python_workspace/my_ontology/old_utils.py")
    """
    try:
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "success": False,
                "file_path": "",
                "filename": "",
                "message": f"未找到{ontology_name}本体，请检查本体英文名是否正确"
            }
        
        # 解析文件路径
        workspace = _get_ontology_workspace(ontology_name)
        file_obj = Path(file_path)
        
        # 如果是完整路径，验证是否在工作空间内
        if file_obj.is_absolute():
            target_path = file_obj
            # 安全检查：确保文件在工作空间内
            try:
                target_path.resolve().relative_to(workspace.resolve())
            except ValueError:
                return {
                    "success": False,
                    "file_path": str(file_path),
                    "filename": "",
                    "message": "文件路径必须在本体工作空间内"
                }
        else:
            # 相对路径，直接在工作空间内查找
            target_path = workspace / file_obj.name
        
        # 检查文件是否存在
        if not target_path.exists():
            return {
                "success": False,
                "file_path": str(target_path),
                "filename": target_path.name,
                "message": f"文件 {target_path.name} 不存在"
            }
        
        # 防止删除运行时模块
        if target_path.name == "__ontology_runtime__.py":
            return {
                "success": False,
                "file_path": str(target_path),
                "filename": target_path.name,
                "message": "不能删除运行时模块 __ontology_runtime__.py"
            }
        
        # 删除文件
        filename = target_path.name
        target_path.unlink()
        
        logger.info(f"成功删除Python文件: {target_path}")
        return {
            "success": True,
            "file_path": str(target_path),
            "filename": filename,
            "message": f"成功删除文件 {filename}"
        }
    except Exception as e:
        logger.error(f"删除Python文件失败: {e}")
        return {
            "success": False,
            "file_path": str(file_path),
            "filename": "",
            "message": f"删除文件失败: {str(e)}"
        }

@mcp.tool()
async def list_python_files(
    ontology_name: str,
) -> Dict[str, Any]:
    """
列出本体工作空间中的所有 Python 文件。

入参：
- ontology_name: 本体英文名

返回：
{
    "success": bool,
    "files": [
        {
            "filename": str,
            "file_path": str,
            "size_bytes": int,
            "modified_time": str
        },
        ...
    ],
    "workspace_path": str,
    "message": str
}

示例：
list_python_files("my_ontology")
    """
    try:
        # 懒删除：列出文件前先清理过期文件
        try:
            _cleanup_expired_files(ontology_name)
        except Exception as e:
            logger.warning(f"懒删除失败: {e}")
        
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "success": False,
                "files": [],
                "workspace_path": "",
                "message": f"未找到{ontology_name}本体，请检查本体英文名是否正确"
            }
        
        # 获取工作空间
        workspace = _get_ontology_workspace(ontology_name)
        
        # 列出所有.py文件
        files = []
        for py_file in workspace.glob("*.py"):
            if py_file.is_file():
                stat = py_file.stat()
                files.append({
                    "filename": py_file.name,
                    "file_path": str(py_file),
                    "size_bytes": stat.st_size,
                    "modified_time": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                })
        
        # 按修改时间排序
        files.sort(key=lambda x: x["modified_time"], reverse=True)
        
        logger.info(f"列出Python文件: {len(files)} 个文件在 {workspace}")
        return {
            "success": True,
            "files": files,
            "workspace_path": str(workspace),
            "message": f"找到 {len(files)} 个Python文件"
        }
    except Exception as e:
        logger.error(f"列出Python文件失败: {e}")
        return {
            "success": False,
            "files": [],
            "workspace_path": "",
            "message": f"列出文件失败: {str(e)}"
        }

# @mcp.tool()
# async def cleanup_python_files(
#     ontology_name: Optional[str] = None,
# ) -> Dict[str, Any]:
#     """
# 手动清理过期的 Python 文件。

# 文件生命周期规则：
# - 每个 Python 文件在创建后只保留 1 小时
# - 系统会自动在后台每 10 分钟执行一次清理
# - 也可以使用此工具手动触发清理

# 入参：
# - ontology_name: 可选，如果指定则只清理该本体的过期文件；否则清理所有本体的过期文件

# 返回：
# {
#     "success": bool,
#     "deleted_count": int,         # 删除的文件数量
#     "deleted_files": [            # 被删除的文件示例（最多10个）
#         {
#             "file": str,
#             "age_hours": float
#         },
#         ...
#     ],
#     "errors": [str],              # 清理过程中的错误
#     "lifetime_hours": int,        # 文件生命周期（小时）
#     "message": str
# }

# 示例：
# # 清理指定本体的过期文件
# cleanup_python_files("my_ontology")

# # 清理所有本体的过期文件
# cleanup_python_files()
#     """
#     try:
#         result = _cleanup_expired_files(ontology_name)
        
#         if result["deleted_count"] > 0:
#             message = f"成功清理 {result['deleted_count']} 个过期文件"
#         else:
#             message = "没有过期文件需要清理"
        
#         if result["errors"]:
#             message += f"，但有 {len(result['errors'])} 个错误"
        
#         return {
#             "success": True,
#             **result,
#             "message": message
#         }
#     except Exception as e:
#         logger.error(f"手动清理文件失败: {e}")
#         return {
#             "success": False,
#             "deleted_count": 0,
#             "deleted_files": [],
#             "errors": [str(e)],
#             "lifetime_hours": _FILE_LIFETIME_HOURS,
#             "message": f"清理失败: {str(e)}"
        # }

@mcp.tool()
async def run_python_file(
    ontology_name: str,
    file_path: str,
    timeout_sec: int = 60,
    memory_mb: Optional[int] = None,
) -> Dict[str, Any]:
    """
运行本体工作空间中的 Python 文件。

运行环境特性：
- 代码在独立子进程中运行
- 可以导入同一工作空间中的其他 .py 文件
- 可以导入 `core.ontology.{ontology_name}.objects` 下的本体对象
- 可以使用已安装的第三方库（如 pandas, numpy 等）
- 辅助函数已自动注入，无需导入即可直接使用
- 设置了运行超时（timeout_sec，默认 60s）

入参：
- ontology_name: 本体英文名
- file_path: 文件路径（可以是完整路径，也可以是文件名）
- timeout_sec: 超时时间（秒），默认60秒
- memory_mb: 可选的内存限制（MB）

返回：
{
    "stdout": str,      # 标准输出
    "stderr": str,      # 标准错误
    "exit_code": int,   # 退出码（0表示成功）
    "file_path": str    # 实际执行的文件路径
}

示例：
run_python_file("my_ontology", "main.py")
run_python_file("my_ontology", "main.py", timeout_sec=120)
run_python_file("my_ontology", "/tmp/ontology_python_workspace/my_ontology/main.py")
    """
    try:
        # 验证本体是否存在
        if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
            return {
                "stdout": "",
                "stderr": f"未找到{ontology_name}本体，请检查本体英文名是否正确",
                "exit_code": 2,
                "file_path": str(file_path)
            }
        
        # 解析文件路径
        workspace = _get_ontology_workspace(ontology_name)
        file_obj = Path(file_path)
        
        # 如果是完整路径，验证是否在工作空间内
        if file_obj.is_absolute():
            target_path = file_obj
            # 安全检查：确保文件在工作空间内
            try:
                target_path.resolve().relative_to(workspace.resolve())
            except ValueError:
                return {
                    "stdout": "",
                    "stderr": "文件路径必须在本体工作空间内",
                    "exit_code": 3,
                    "file_path": str(file_path)
                }
        else:
            # 相对路径，直接在工作空间内查找
            target_path = workspace / file_obj.name
        
        # 验证文件存在
        if not target_path.exists():
            return {
                "stdout": "",
                "stderr": f"文件不存在: {target_path}",
                "exit_code": 4,
                "file_path": str(target_path)
            }
        
        # 读取用户代码
        user_code = target_path.read_text(encoding="utf-8")
        
        # 构建运行环境（使用原有的 prelude）
        prelude = """# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.getcwd())

# Add workspace to sys.path to allow importing other modules
_workspace_path = "{WORKSPACE_PATH}"
if _workspace_path not in sys.path:
    sys.path.insert(0, _workspace_path)

# Override print to limit output length
_builtin_print = print
_PRINT_CHAR_LIMIT = 20000

def print(*args, **kwargs):
    \"\"\"Custom print that limits output to avoid overwhelming the agent with large data.\"\"\"
    import io
    buffer = io.StringIO()
    _builtin_print(*args, file=buffer, **kwargs)
    content = buffer.getvalue()
    if len(content) > _PRINT_CHAR_LIMIT:
        truncated_msg = f"[输出内容过长，共{{len(content)}}字符，超过{{_PRINT_CHAR_LIMIT}}字符限制。请考虑：1) 只打印部分数据（如 data[:10]）；2) 使用聚合/统计而非打印全部；3) 将结果写入文件后告知文件路径。]"
        _builtin_print(truncated_msg, **{{k: v for k, v in kwargs.items() if k != 'file'}})
    else:
        _builtin_print(content, end='', **{{k: v for k, v in kwargs.items() if k != 'file'}})

try:
    import resource  # type: ignore[attr-defined]
    # CPU time limit ~ timeout_sec + 1
    try:
        resource.setrlimit(resource.RLIMIT_CPU, ({TIMEOUT}, {TIMEOUT}))
    except Exception:
        pass
    # Memory limit if provided
    try:
        mem_bytes = int({MEM_LIMIT}) * 1024 * 1024
        if mem_bytes > 0:
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
    except Exception:
        pass
except Exception:
    pass

try:
    from loguru import logger as _LG
    _LG.remove()
    _LG.add(sys.stderr, level="ERROR")
except Exception:
    pass

from core.runtime.base import OntologyObject
import importlib
from pathlib import Path as _Path

_ONTOLOGY_NAME = "{ONTOLOGY_NAME}"

def _collect_ontology_maps(ontology_name: str):
    maps = {{"object_to_table": {{}}, "object_attr_to_col": {{}}, "attr_sets": {{}}}}
    obj_dir = _Path("core/ontology/" + str(ontology_name) + "/objects")
    if obj_dir.exists():
        for py in obj_dir.iterdir():
            if not py.is_file() or not py.name.endswith(".py") or py.stem.startswith("__"):
                continue
            try:
                module = importlib.import_module("core.ontology." + str(ontology_name) + ".objects." + str(py.stem))
                candidates = []
                for n in dir(module):
                    obj = getattr(module, n)
                    try:
                        if isinstance(obj, type) and issubclass(obj, OntologyObject):
                            candidates.append(obj)
                    except Exception:
                        continue
                for cls_obj in candidates:
                    try:
                        inst = cls_obj()
                        table = getattr(inst, "_table_name", None)
                        field_map = getattr(inst, "_field_map", None) or {{}}
                        if isinstance(table, str) and isinstance(field_map, dict) and field_map:
                            mod_name = str(py.stem)
                            cls_name = cls_obj.__name__
                            # Map both module name and class name to table
                            if mod_name not in maps["object_to_table"]:
                                maps["object_to_table"][mod_name] = table
                            maps["object_to_table"][cls_name] = table
                            maps["attr_sets"][mod_name] = set(field_map.keys())
                            maps["attr_sets"][cls_name] = set(field_map.keys())
                            for a, c in field_map.items():
                                maps["object_attr_to_col"][(mod_name, a)] = c
                                maps["object_attr_to_col"][(cls_name, a)] = c
                    except Exception:
                        continue
            except Exception:
                continue
    return maps

_ONT_MAPS = _collect_ontology_maps(_ONTOLOGY_NAME)

def get_object(class_name: str):
    module_path = "core.ontology." + _ONTOLOGY_NAME + ".objects." + str(class_name)
    mod = importlib.import_module(module_path)
    if hasattr(mod, class_name):
        cls = getattr(mod, class_name)
        return cls()
    raise ImportError("对象类 " + str(class_name) + " 未找到")

def _merge_args_kwargs(args, kwargs):
    if args and len(args) == 1 and isinstance(args[0], dict):
        merged = dict(args[0])
        merged.update(dict(kwargs))
        return merged
    return dict(kwargs)

def call_find(obj, *args, **kwargs):
    # 如果传入的是字符串（对象名），自动获取对象实例
    if isinstance(obj, str):
        obj = get_object(obj)
    params = _merge_args_kwargs(args, kwargs)
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return obj.find(**params)

def call_check_attr_mapping(object_names):
    \"\"\"批量获取对象的属性映射信息（属性名->物理列名、主键信息等）。
    用法：call_check_attr_mapping([\"A\",\"B\"])
    \"\"\"
    try:
        names = list(object_names or [])
    except Exception:
        names = []
    return OntologyObject().check_attr_mapping(object_names=names, ontology_name=_ONTOLOGY_NAME, ontology_maps=_ONT_MAPS)

def call_complex_sql(*args, **kwargs):
    sql = None
    if args:
        if isinstance(args[0], str):
            sql = args[0]
            params = dict(kwargs)
        elif isinstance(args[0], dict):
            cfg = dict(args[0])
            sql = cfg.pop("sql", None)
            params = cfg
        else:
            params = dict(kwargs)
    else:
        params = dict(kwargs)
        if "sql" in params:
            sql = params.pop("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise ValueError("call_complex_sql 需要提供 sql 字符串，或在配置字典中包含 'sql'")
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return OntologyObject().complex_sql(sql=sql, **params)
    
import asyncio as _asyncio
import inspect as _inspect

# Load and register functions and actions from the ontology's directories
try:
    from core.runtime.loader import refresh, refresh_actions
    from pathlib import Path as _PathLib
    # Load logics (functions) from regular ontology directory
    _logics_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/logics")
    if _logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_logics_dir))
    # Load API type functions from ontology_apis/logics (merge mode to avoid overwriting)
    _api_logics_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/logics")
    if _api_logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_api_logics_dir), merge=True)
    # Load actions from regular ontology directory
    _actions_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/actions")
    if _actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_actions_dir))
    # Load API type actions from ontology_apis/actions (merge mode to avoid overwriting)
    _api_actions_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/actions")
    if _api_actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_api_actions_dir), merge=True)
except Exception as _e:
    import sys
    print("Warning: Failed to load functions/actions for " + str(_ONTOLOGY_NAME) + ": " + str(_e), file=sys.stderr)

def execute_logic(logic_name: str, params: dict | None = None):
    try:
        from core.runtime.executor import execute as _exec
    except Exception as e:
        raise RuntimeError("无法导入逻辑执行器: " + str(e))
    result = _exec(_ONTOLOGY_NAME, logic_name, params or {{}}, None)
    if _inspect.iscoroutine(result):
        return _asyncio.run(result)
    return result

def execute_action(object_or_name: str | OntologyObject, action_name: str, params: dict | None = None):
    if isinstance(object_or_name, OntologyObject):
        obj = object_or_name
    else:
        obj = get_object(object_or_name)
    object_name = object_or_name if isinstance(object_or_name, str) else type(object_or_name).__name__
    if not hasattr(obj, action_name):
        raise AttributeError("对象 '" + object_name + "' 上未找到方法 '" + action_name + "'")
    method = getattr(obj, action_name)
    kwargs = dict(params or {{}})
    # 尝试自动注入本体参数
    kwargs.setdefault("ontology_name", _ONTOLOGY_NAME)
    kwargs.setdefault("ontology_maps", _ONT_MAPS)
    try:
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)
    except TypeError:
        # 兼容某些不接受注入参数的方法
        kwargs.pop("ontology_name", None)
        kwargs.pop("ontology_maps", None)
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)

# 导入公共函数：export_to_minio
from public.public_function import export_to_minio as _export_to_minio

def export_to_minio(data, filename=None):
    \"\"\"
    将数据导出到MinIO并返回下载链接。
    
    Args:
        data: 要导出的数据列表，每个元素为字典
        filename: 可选的文件名，如果不提供则自动生成
        
    Returns:
        包含导出结果的字典：
        {{
            "success": bool,
            "download_url": str,
            "filename": str,
            "records_count": int,
            "message": str
        }}
        
    Example:
        result = export_to_minio(data)
        if result["success"]:
            print(f"下载链接: {{result['download_url']}}")
    \"\"\"
    return _export_to_minio(data, _ONTOLOGY_NAME, filename)

# 用户代码开始
"""
        
        prelude_formatted = prelude.format(
            WORKSPACE_PATH=str(workspace),
            TIMEOUT=max(1, int(timeout_sec)),
            MEM_LIMIT=int(memory_mb) if memory_mb else 0,
            ONTOLOGY_NAME=ontology_name,
        )
        runner_code = prelude_formatted + "\n" + user_code + "\n"
        
        # 写入临时运行文件
        with tempfile.NamedTemporaryFile("w", suffix="_runner.py", delete=False, encoding="utf-8") as tf:
            tf.write(runner_code)
            tf.flush()
            runner_path = tf.name
        
        # 准备子进程环境
        env = {k: v for k, v in os.environ.items()}
        # 移除代理设置
        for k in list(env.keys()):
            if k.upper().endswith("_PROXY") or k.upper() in {"HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"}:
                env.pop(k, None)
        
        # 将项目根目录和工作空间添加到 PYTHONPATH
        root = os.getcwd()
        env["PYTHONPATH"] = f"{root}:{workspace}:{env.get('PYTHONPATH','')}"
        
        try:
            proc = subprocess.run(
                [sys.executable, "-u", runner_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=max(1, int(timeout_sec)),
                env=env,
                cwd=str(workspace),  # 在工作空间目录中运行
            )
            stdout = proc.stdout.decode("utf-8", errors="replace")
            stderr = proc.stderr.decode("utf-8", errors="replace")
            logger.info(f"成功运行Python文件: {target_path}, exit_code={proc.returncode}")
            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": int(proc.returncode),
                "file_path": str(target_path)
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"执行超时（>{timeout_sec}s）",
                "exit_code": 124,
                "file_path": str(target_path)
            }
        finally:
            # 清理临时运行文件
            try:
                os.unlink(runner_path)
            except Exception:
                pass
                
    except Exception as e:
        logger.error(f"运行Python文件失败: {e}")
        return {
            "stdout": "",
            "stderr": f"运行文件失败: {str(e)}",
            "exit_code": 1,
            "file_path": str(file_path)
        }


# ---------------------------
# Optional: sandboxed Python executor tool (保留原有工具以便向后兼容)
# ---------------------------

@mcp.tool()
async def ontology_python_exec(
    ontology_name: str,
    python_code: str,
    timeout_sec: int = 60,
    memory_mb: Optional[int] = None,
) -> Dict[str, Any]:
    """
在指定本体的上下文中执行一个独立的 Python 代码片段（沙箱子进程中运行）。

约束与行为：
- 代码在独立子进程中运行（不会污染主服务的解释器状态）。
- 会将项目根目录加入 PYTHONPATH，可导入 `core.ontology.{ontology_name}.objects` 下的对象；
  提供 `get_object(class_name: str)` 方法用于按类名获取对象实例。
- 已预导入：`from core.runtime.base import OntologyObject`。
- 可使用已安装的第三方库（如 pandas）；未安装则会 ImportError。
- 设置了运行超时（timeout_sec，默认 60s）。
- 可以调用call_check_attr_mapping(object_names=[...]) 获取"属性名->物理字段名"映射及主键信息（批量）。
- 可以调用call_find(obj, *args, **kwargs)、call_complex_sql(*args, **kwargs)方法来执行查询。这些方法支持传统 kwargs 传参方式，也支持使用字典传参方式。
- call_find和call_complex_sql方法都是统一的返回格式，为{"items": list, "page_size": int, "next_page_token": int, "total_count": int, "is_long_result": bool}, is_long_result为True表示结果数据较大，数据会转存为csv，并且items只会包含前三条数据作为样本数据。
- 必须调用execute_logic(logic_name: str, params: dict | None = None)方法来执行逻辑。
- 必须调用execute_action(object_name: str, action_name: str, params: dict | None = None)方法来执行行动。
- 可以调用export_to_minio(data, filename=None)将大数据量导出到MinIO并获取下载链接，返回格式为{"success": bool, "download_url": str, "filename": str, "records_count": int, "message": str}。
- 禁止直接通过代码的方式自行保存结果到csv文件，因为无法用户无法管理和访问这些你生成的文件。必须通过export_to_minio方法来导出才可以访问。如果调不通就放弃保存。
- 必须使用print来输出结果，才会在最终的stdout返回中呈现
- 如果不确定某些方法的返回格式，可以先执行一遍并查看返回结果后再做后续的代码编写。

入参：
- ontology_name: 本体英文名
- python_code: 要执行的完整 Python 代码字符串（可多行）


示例代码：
```python
o = get_object("orders")
r1 = call_find(o, where_sql="状态 = %s", where_params=["PAID"], return_attrs=["订单ID","总金额"])
map_info = call_check_attr_mapping(["orders","customers"])
print(map_info)
execute_action(o, "add_order", {"订单ID": "123456", "总金额": 100})
print(r1)

# 如果查询结果数据量大，可以导出到MinIO
if r1.get("is_long_result"):
    result = export_to_minio(r1["items"])
    if result["success"]:
        print(f"数据已导出，下载链接: {result['download_url']}")
```
返回：
{ "stdout": str, "stderr": str, "exit_code": int }

预定义代码如下：
```python
# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.getcwd())

# Override print to limit output length
_builtin_print = print
_PRINT_CHAR_LIMIT = 20000

def print(*args, **kwargs):
    \"\"\"Custom print that limits output to avoid overwhelming the agent with large data.\"\"\"
    import io
    buffer = io.StringIO()
    _builtin_print(*args, file=buffer, **kwargs)
    content = buffer.getvalue()
    if len(content) > _PRINT_CHAR_LIMIT:
        truncated_msg = f"[输出内容过长，共{{len(content)}}字符，超过{{_PRINT_CHAR_LIMIT}}字符限制。请考虑：1) 只打印部分数据（如 data[:10]）；2) 使用聚合/统计而非打印全部；3) 将结果写入文件后告知文件路径。]"
        _builtin_print(truncated_msg, **{{k: v for k, v in kwargs.items() if k != 'file'}})
    else:
        _builtin_print(content, end='', **{{k: v for k, v in kwargs.items() if k != 'file'}})

try:
    import resource  # type: ignore[attr-defined]
    # CPU time limit ~ timeout_sec + 1
    try:
        resource.setrlimit(resource.RLIMIT_CPU, ({TIMEOUT}, {TIMEOUT}))
    except Exception:
        pass
    # Memory limit if provided
    try:
        mem_bytes = int({MEM_LIMIT}) * 1024 * 1024
        if mem_bytes > 0:
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
    except Exception:
        pass
except Exception:
    pass

try:
    from loguru import logger as _LG
    _LG.remove()
    _LG.add(sys.stderr, level="ERROR")
except Exception:
    pass

from core.runtime.base import OntologyObject
import importlib
from pathlib import Path as _Path

_ONTOLOGY_NAME = "{ONTOLOGY_NAME}"

def _collect_ontology_maps(ontology_name: str):
    maps = {{"object_to_table": {{}}, "object_attr_to_col": {{}}, "attr_sets": {{}}}}
    obj_dir = _Path("core/ontology/" + str(ontology_name) + "/objects")
    if obj_dir.exists():
        for py in obj_dir.iterdir():
            if not py.is_file() or not py.name.endswith(".py") or py.stem.startswith("__"):
                continue
            try:
                module = importlib.import_module("core.ontology." + str(ontology_name) + ".objects." + str(py.stem))
                candidates = []
                for n in dir(module):
                    obj = getattr(module, n)
                    try:
                        if isinstance(obj, type) and issubclass(obj, OntologyObject):
                            candidates.append(obj)
                    except Exception:
                        continue
                for cls_obj in candidates:
                    try:
                        inst = cls_obj()
                        table = getattr(inst, "_table_name", None)
                        field_map = getattr(inst, "_field_map", None) or {{}}
                        if isinstance(table, str) and isinstance(field_map, dict) and field_map:
                            mod_name = str(py.stem)
                            cls_name = cls_obj.__name__
                            # Map both module name and class name to table
                            if mod_name not in maps["object_to_table"]:
                                maps["object_to_table"][mod_name] = table
                            maps["object_to_table"][cls_name] = table
                            maps["attr_sets"][mod_name] = set(field_map.keys())
                            maps["attr_sets"][cls_name] = set(field_map.keys())
                            for a, c in field_map.items():
                                maps["object_attr_to_col"][(mod_name, a)] = c
                                maps["object_attr_to_col"][(cls_name, a)] = c
                    except Exception:
                        continue
            except Exception:
                continue
    return maps

_ONT_MAPS = _collect_ontology_maps(_ONTOLOGY_NAME)

def get_object(class_name: str):
    module_path = "core.ontology." + _ONTOLOGY_NAME + ".objects." + str(class_name)
    mod = importlib.import_module(module_path)
    if hasattr(mod, class_name):
        cls = getattr(mod, class_name)
        return cls()
    raise ImportError("对象类 " + str(class_name) + " 未找到")

def _merge_args_kwargs(args, kwargs):
    if args and len(args) == 1 and isinstance(args[0], dict):
        merged = dict(args[0])
        merged.update(dict(kwargs))
        return merged
    return dict(kwargs)

def call_find(obj, *args, **kwargs):
    # 如果传入的是字符串（对象名），自动获取对象实例
    if isinstance(obj, str):
        obj = get_object(obj)
    params = _merge_args_kwargs(args, kwargs)
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return obj.find(**params)

def call_check_attr_mapping(object_names):
    \"\"\"批量获取对象的属性映射信息（属性名->物理列名、主键信息等）。
    用法：call_check_attr_mapping([\"A\",\"B\"])
    \"\"\"
    try:
        names = list(object_names or [])
    except Exception:
        names = []
    return OntologyObject().check_attr_mapping(object_names=names, ontology_name=_ONTOLOGY_NAME, ontology_maps=_ONT_MAPS)

def call_complex_sql(*args, **kwargs):
    sql = None
    if args:
        if isinstance(args[0], str):
            sql = args[0]
            params = dict(kwargs)
        elif isinstance(args[0], dict):
            cfg = dict(args[0])
            sql = cfg.pop("sql", None)
            params = cfg
        else:
            params = dict(kwargs)
    else:
        params = dict(kwargs)
        if "sql" in params:
            sql = params.pop("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise ValueError("call_complex_sql 需要提供 sql 字符串，或在配置字典中包含 'sql'")
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return OntologyObject().complex_sql(sql=sql, **params)
    
import asyncio as _asyncio
import inspect as _inspect

# Load and register functions and actions from the ontology's directories
try:
    from core.runtime.loader import refresh, refresh_actions
    from pathlib import Path as _PathLib
    # Load logics (functions) from regular ontology directory
    _logics_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/logics")
    if _logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_logics_dir))
    # Load API type functions from ontology_apis/logics (merge mode to avoid overwriting)
    _api_logics_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/logics")
    if _api_logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_api_logics_dir), merge=True)
    # Load actions from regular ontology directory
    _actions_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/actions")
    if _actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_actions_dir))
    # Load API type actions from ontology_apis/actions (merge mode to avoid overwriting)
    _api_actions_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/actions")
    if _api_actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_api_actions_dir), merge=True)
except Exception as _e:
    import sys
    print("Warning: Failed to load functions/actions for " + str(_ONTOLOGY_NAME) + ": " + str(_e), file=sys.stderr)

def execute_logic(logic_name: str, params: dict | None = None):
    try:
        from core.runtime.executor import execute as _exec
    except Exception as e:
        raise RuntimeError("无法导入逻辑执行器: " + str(e))
    result = _exec(_ONTOLOGY_NAME, logic_name, params or {{}}, None)
    if _inspect.iscoroutine(result):
        return _asyncio.run(result)
    return result

def execute_action(object_or_name: str | OntologyObject, action_name: str, params: dict | None = None):
    if isinstance(object_or_name, OntologyObject):
        obj = object_or_name
    else:
        obj = get_object(object_or_name)
    if not hasattr(obj, action_name):
        raise AttributeError("对象 '" + object_name + "' 上未找到方法 '" + action_name + "'")
    method = getattr(obj, action_name)
    kwargs = dict(params or {{}})
    # 尝试自动注入本体参数
    kwargs.setdefault("ontology_name", _ONTOLOGY_NAME)
    kwargs.setdefault("ontology_maps", _ONT_MAPS)
    try:
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)
    except TypeError:
        # 兼容某些不接受注入参数的方法
        kwargs.pop("ontology_name", None)
        kwargs.pop("ontology_maps", None)
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)

# 导入公共函数：export_to_minio
from public.public_function import export_to_minio as _export_to_minio

def export_to_minio(data, filename=None):
    \"\"\"
    将数据导出到MinIO并返回下载链接。
    
    Args:
        data: 要导出的数据列表，每个元素为字典
        filename: 可选的文件名，如果不提供则自动生成
        
    Returns:
        包含导出结果的字典：
        {{
            "success": bool,
            "download_url": str,
            "filename": str,
            "records_count": int,
            "message": str
        }}
        
    Example:
        result = export_to_minio(data)
        if result["success"]:
            print(f"下载链接: {{result['download_url']}}")
    \"\"\"
    return _export_to_minio(data, _ONTOLOGY_NAME, filename)
# 用户代码开始
```
    """
    # Basic validation
    if not ontology_name or not Path(f"core/ontology/{ontology_name}/objects").exists():
        return {"stdout": "", "stderr": f"未找到{ontology_name}本体，请检查本体英文名是否正确", "exit_code": 2}
    if not isinstance(python_code, str) or not python_code.strip():
        return {"stdout": "", "stderr": "python_code 不能为空", "exit_code": 3}

    # Build runner script (use .format; escape literal braces with double {{ }})
    prelude = """# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.getcwd())

# Override print to limit output length
_builtin_print = print
_PRINT_CHAR_LIMIT = 20000

def print(*args, **kwargs):
    \"\"\"Custom print that limits output to avoid overwhelming the agent with large data.\"\"\"
    import io
    buffer = io.StringIO()
    _builtin_print(*args, file=buffer, **kwargs)
    content = buffer.getvalue()
    if len(content) > _PRINT_CHAR_LIMIT:
        truncated_msg = f"[输出内容过长，共{{len(content)}}字符，超过{{_PRINT_CHAR_LIMIT}}字符限制。请考虑：1) 只打印部分数据（如 data[:10]）；2) 使用聚合/统计而非打印全部；3) 将结果写入文件后告知文件路径。]"
        _builtin_print(truncated_msg, **{{k: v for k, v in kwargs.items() if k != 'file'}})
    else:
        _builtin_print(content, end='', **{{k: v for k, v in kwargs.items() if k != 'file'}})

try:
    import resource  # type: ignore[attr-defined]
    # CPU time limit ~ timeout_sec + 1
    try:
        resource.setrlimit(resource.RLIMIT_CPU, ({TIMEOUT}, {TIMEOUT}))
    except Exception:
        pass
    # Memory limit if provided
    try:
        mem_bytes = int({MEM_LIMIT}) * 1024 * 1024
        if mem_bytes > 0:
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
    except Exception:
        pass
except Exception:
    pass

try:
    from loguru import logger as _LG
    _LG.remove()
    _LG.add(sys.stderr, level="ERROR")
except Exception:
    pass

from core.runtime.base import OntologyObject
import importlib
from pathlib import Path as _Path

_ONTOLOGY_NAME = "{ONTOLOGY_NAME}"

def _collect_ontology_maps(ontology_name: str):
    maps = {{"object_to_table": {{}}, "object_attr_to_col": {{}}, "attr_sets": {{}}}}
    obj_dir = _Path("core/ontology/" + str(ontology_name) + "/objects")
    if obj_dir.exists():
        for py in obj_dir.iterdir():
            if not py.is_file() or not py.name.endswith(".py") or py.stem.startswith("__"):
                continue
            try:
                module = importlib.import_module("core.ontology." + str(ontology_name) + ".objects." + str(py.stem))
                candidates = []
                for n in dir(module):
                    obj = getattr(module, n)
                    try:
                        if isinstance(obj, type) and issubclass(obj, OntologyObject):
                            candidates.append(obj)
                    except Exception:
                        continue
                for cls_obj in candidates:
                    try:
                        inst = cls_obj()
                        table = getattr(inst, "_table_name", None)
                        field_map = getattr(inst, "_field_map", None) or {{}}
                        if isinstance(table, str) and isinstance(field_map, dict) and field_map:
                            mod_name = str(py.stem)
                            cls_name = cls_obj.__name__
                            # Map both module name and class name to table
                            if mod_name not in maps["object_to_table"]:
                                maps["object_to_table"][mod_name] = table
                            maps["object_to_table"][cls_name] = table
                            maps["attr_sets"][mod_name] = set(field_map.keys())
                            maps["attr_sets"][cls_name] = set(field_map.keys())
                            for a, c in field_map.items():
                                maps["object_attr_to_col"][(mod_name, a)] = c
                                maps["object_attr_to_col"][(cls_name, a)] = c
                    except Exception:
                        continue
            except Exception:
                continue
    return maps

_ONT_MAPS = _collect_ontology_maps(_ONTOLOGY_NAME)

def get_object(class_name: str):
    module_path = "core.ontology." + _ONTOLOGY_NAME + ".objects." + str(class_name)
    mod = importlib.import_module(module_path)
    if hasattr(mod, class_name):
        cls = getattr(mod, class_name)
        return cls()
    raise ImportError("对象类 " + str(class_name) + " 未找到")

def _merge_args_kwargs(args, kwargs):
    if args and len(args) == 1 and isinstance(args[0], dict):
        merged = dict(args[0])
        merged.update(dict(kwargs))
        return merged
    return dict(kwargs)

def call_find(obj, *args, **kwargs):
    # 如果传入的是字符串（对象名），自动获取对象实例
    if isinstance(obj, str):
        obj = get_object(obj)
    params = _merge_args_kwargs(args, kwargs)
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return obj.find(**params)

def call_check_attr_mapping(object_names):
    \"\"\"批量获取对象的属性映射信息（属性名->物理列名、主键信息等）。
    用法：call_check_attr_mapping([\"A\",\"B\"])
    \"\"\"
    try:
        names = list(object_names or [])
    except Exception:
        names = []
    return OntologyObject().check_attr_mapping(object_names=names, ontology_name=_ONTOLOGY_NAME, ontology_maps=_ONT_MAPS)

def call_complex_sql(*args, **kwargs):
    sql = None
    if args:
        if isinstance(args[0], str):
            sql = args[0]
            params = dict(kwargs)
        elif isinstance(args[0], dict):
            cfg = dict(args[0])
            sql = cfg.pop("sql", None)
            params = cfg
        else:
            params = dict(kwargs)
    else:
        params = dict(kwargs)
        if "sql" in params:
            sql = params.pop("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise ValueError("call_complex_sql 需要提供 sql 字符串，或在配置字典中包含 'sql'")
    params.setdefault("ontology_name", _ONTOLOGY_NAME)
    params.setdefault("ontology_maps", _ONT_MAPS)
    return OntologyObject().complex_sql(sql=sql, **params)
    
import asyncio as _asyncio
import inspect as _inspect

# Load and register functions and actions from the ontology's directories
try:
    from core.runtime.loader import refresh, refresh_actions
    from pathlib import Path as _PathLib
    # Load logics (functions) from regular ontology directory
    _logics_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/logics")
    if _logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_logics_dir))
    # Load API type functions from ontology_apis/logics (merge mode to avoid overwriting)
    _api_logics_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/logics")
    if _api_logics_dir.exists():
        refresh(_ONTOLOGY_NAME, str(_api_logics_dir), merge=True)
    # Load actions from regular ontology directory
    _actions_dir = _PathLib("core/ontology/" + str(_ONTOLOGY_NAME) + "/actions")
    if _actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_actions_dir))
    # Load API type actions from ontology_apis/actions (merge mode to avoid overwriting)
    _api_actions_dir = _PathLib("core/ontology_apis/" + str(_ONTOLOGY_NAME) + "/actions")
    if _api_actions_dir.exists():
        refresh_actions(_ONTOLOGY_NAME, str(_api_actions_dir), merge=True)
except Exception as _e:
    import sys
    print("Warning: Failed to load functions/actions for " + str(_ONTOLOGY_NAME) + ": " + str(_e), file=sys.stderr)

def execute_logic(logic_name: str, params: dict | None = None):
    try:
        from core.runtime.executor import execute as _exec
    except Exception as e:
        raise RuntimeError("无法导入逻辑执行器: " + str(e))
    result = _exec(_ONTOLOGY_NAME, logic_name, params or {{}}, None)
    if _inspect.iscoroutine(result):
        return _asyncio.run(result)
    return result

def execute_action(object_or_name: str | OntologyObject, action_name: str, params: dict | None = None):
    if isinstance(object_or_name, OntologyObject):
        obj = object_or_name
    else:
        obj = get_object(object_or_name)
    if not hasattr(obj, action_name):
        raise AttributeError("对象 '" + object_name + "' 上未找到方法 '" + action_name + "'")
    method = getattr(obj, action_name)
    kwargs = dict(params or {{}})
    # 尝试自动注入本体参数
    kwargs.setdefault("ontology_name", _ONTOLOGY_NAME)
    kwargs.setdefault("ontology_maps", _ONT_MAPS)
    try:
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)
    except TypeError:
        # 兼容某些不接受注入参数的方法
        kwargs.pop("ontology_name", None)
        kwargs.pop("ontology_maps", None)
        if _inspect.iscoroutinefunction(method):
            return _asyncio.run(method(**kwargs))
        return method(**kwargs)

# 导入公共函数：export_to_minio
from public.public_function import export_to_minio as _export_to_minio

def export_to_minio(data, filename=None):
    \"\"\"
    将数据导出到MinIO并返回下载链接。
    
    Args:
        data: 要导出的数据列表，每个元素为字典
        filename: 可选的文件名，如果不提供则自动生成
        
    Returns:
        包含导出结果的字典：
        {{
            "success": bool,
            "download_url": str,
            "filename": str,
            "records_count": int,
            "message": str
        }}
        
    Example:
        result = export_to_minio(data)
        if result["success"]:
            print(f"下载链接: {{result['download_url']}}")
    \"\"\"
    return _export_to_minio(data, _ONTOLOGY_NAME, filename)

# 用户代码开始
"""

    prelude_formatted = prelude.format(
        TIMEOUT=max(1, int(timeout_sec)),
        MEM_LIMIT=int(memory_mb) if memory_mb else 0,
        ONTOLOGY_NAME=ontology_name,
    )
    runner_code = prelude_formatted + "\n" + python_code + "\n"

    # Write to temp file
    with tempfile.NamedTemporaryFile("w", suffix="_exec.py", delete=False, encoding="utf-8") as tf:
        tf.write(runner_code)
        tf.flush()
        runner_path = tf.name

    # Prepare subprocess environment
    env = {k: v for k, v in os.environ.items()}
    # Avoid leaking proxies/secrets if any
    for k in list(env.keys()):
        if k.upper().endswith("_PROXY") or k.upper() in {"HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"}:
            env.pop(k, None)

    # Ensure project root on PYTHONPATH
    root = os.getcwd()
    env["PYTHONPATH"] = f"{root}:{env.get('PYTHONPATH','')}"

    try:
        proc = subprocess.run(
            [sys.executable, "-u", runner_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=max(1, int(timeout_sec)),
            env=env,
            cwd=root,
        )
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")
        return {"stdout": stdout, "stderr": stderr, "exit_code": int(proc.returncode)}
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"执行超时（>{timeout_sec}s）", "exit_code": 124}
    except Exception as e:
        return {"stdout": "", "stderr": f"执行异常: {e}", "exit_code": 1}

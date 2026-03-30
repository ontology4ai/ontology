import asyncio
import json
import os
import shutil
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Body, HTTPException, Path, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any, Dict

from config import get_minio_config_sync, get_dify_config_sync, get_aap_config
from core.ontology.csv_to_ontology_json import CSVOntologyConverter
from apis.models import (
    GetGraphDataRequest,
    ApiResponse,
    ExportTTLRequest,
    ImportOwlFromURLRequest,
    MigrateOutRequest,
    MigrateInRequest,
    UnifiedImportRequest,
    TaskSubmitResponse,
    CancelTaskRequest,
)
from core.ontology.rdf_services import export_ontology, import_owl_with_classification
from core.task_manager import task_manager, TaskType, TaskInfo
from core.import_task_service import get_import_task_service
from core.import_exceptions import OwlValidationError
import traceback
from public.public_variable import logger, DifyAgentMode
from minio import Minio
from minio.error import S3Error
from utils.ontology_helpers import (
    parse_mcp_tool_input,
    convert_action_data_to_graph_detail,
    convert_logic_data_to_graph_detail
)

router = APIRouter()


def _build_minio_download_client():
    """根据配置构建 MinIO 客户端（用于迁入下载）"""
    try:
        cfg = get_minio_config_sync()
    except Exception as exc:
        logger.error(f"[minio] 读取配置失败: {exc}")
        return None, None, None

    if not cfg or not getattr(cfg, "host", None):
        return None, None, None

    host = cfg.host.strip()
    parsed = urlparse(host if "//" in host else f"http://{host}")
    endpoint = parsed.netloc or parsed.path
    secure = cfg.secure if cfg.secure is not None else parsed.scheme == "https"
    scheme = parsed.scheme or ("https" if secure else "http")
    base_url = f"{scheme}://{endpoint}".rstrip("/")

    try:
        client = Minio(
            endpoint,
            access_key=cfg.access_key,
            secret_key=cfg.secret_key,
            secure=secure,
            region=cfg.region,
        )
    except Exception as exc:
        logger.error(f"[minio] 创建客户端失败: {exc}")
        return None, None, None

    return cfg, client, base_url


'''自动生成英文字段名的中文名接口'''
@router.post("/object/get_zh_name")
async def get_zh_name(field_names: list[str]) -> ApiResponse:
    """
    接收一个英文字段名数组，返回 {english: chinese} 的字典。
    通过第三方 AAP 平台调用已配置的 Agent（SSE 流），在 `workflow_succeed` 事件中解析 outputs.text。
    """
    # 局部导入以避免启动时循环依赖
    import aiohttp
    import json
    import re

    logger.info(f"get_zh_name: {field_names}")

    async def _generate_chinese_map(names: list[str]) -> dict:
        # Fetch AAP config lazily - use 'auto_complete' agent
        aap_config = await get_aap_config("auto_complete")
        
        if not aap_config:
            logger.error("AAP 配置缺失 (ontology_aap_info.agents.auto_complete)")
            return {}

        aap_url = aap_config.get("base_url", "").rstrip("/")
        agent_id = aap_config.get("agent_id")
        version = aap_config.get("version")
        api_key = aap_config.get("api_key")

        if not (aap_url and agent_id and version and api_key):
            logger.error("AAP 配置不完整，请检查 ontology_aap_info")
            return {}

        url = f"{aap_url}/engine/api/v1/assistants/run"
        headers = {
            "accept": "text/event-stream",
            "content-type": "application/json",
        }
        payload = {
            "messages": [
                {"role": "user", "content": "开始"}
            ],
            "inputs": {"names": names},
            "chatmeta": {},
            "agent_run": {
                "id": agent_id,
                "version": version,
                "auth_type": "api-key",
                "auth_data": {"api-key": api_key},
            },
        }

        current_event = None
        outputs_text = None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"AAP 请求失败: HTTP {response.status}, {error_text}")
                        return {}

                    async for raw in response.content:
                        line = raw.decode("utf-8").strip()
                        if not line:
                            continue
                        if line.startswith("event:"):
                            current_event = line.split(":", 1)[1].strip()
                            continue
                        if line.startswith("data:"):
                            data_str = line.split(":", 1)[1].strip()
                            try:
                                data_obj = json.loads(data_str)
                            except Exception:
                                continue
                            if current_event == "workflow_succeed":
                                outputs = data_obj.get("outputs")
                                if isinstance(outputs, dict):
                                    outputs_text = outputs.get("text")
                                # 拿到成功事件即可结束读取
                                break

        except aiohttp.ClientError as ce:
            logger.error(f"AAP 客户端错误: {ce}")
            raise Exception(f"AAP 客户端错误: {ce}")
        except Exception as e:
            logger.error(f"AAP 流处理异常: {e}")
            raise Exception(f"AAP 流处理异常: {e}")

        if not outputs_text:
            raise Exception("AAP 流处理异常: 没有输出文本")
        from public.public_function import extract_json
        try:
            json_data = extract_json(outputs_text)[0]
        except Exception as e:
            logger.error(f"提取JSON失败: {e}")
            raise Exception(f"提取JSON失败: {e}")
        return json_data

    async def _generate_chinese_map_dify(query_str: list[str]) -> dict:
        # Fetch Dify config lazily - use 'auto_complete' agent
        from config import get_dify_config
        dify_config = await get_dify_config("auto_complete")
        
        if not dify_config:
            logger.error("Dify 配置缺失 (ontology_dify_info.agents.auto_complete)")
            return {}

        dify_url = dify_config.get("base_url", "").rstrip("/")
        api_key = dify_config.get("api_key")

        if not (dify_url and api_key):
            logger.error("Dify 配置不完整，请检查 ontology_dify_info")
            return {}

        url = f"{dify_url}/v1/chat-messages"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "query": str(query_str),
            "inputs": {},
            "response_mode": "blocking",
            "user": "test-user"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Dify 请求失败: HTTP {response.status}, {error_text}")
                        return {}

                    # 直接读取完整响应并解析为 JSON（回退到 text 再解析）
                    resp_json = None
                    try:
                        resp_json = await response.json()
                    except Exception:
                        try:
                            resp_text = await response.text()
                            resp_json = json.loads(resp_text)
                        except Exception:
                            logger.error("无法解析响应为 JSON")
                            return {}

                    # 尝试从常见字段中获取结果
                    answer_raw = None
                    # 1) outputs.text 结构
                    outputs = resp_json.get("outputs") if isinstance(resp_json, dict) else None
                    if isinstance(outputs, dict):
                        answer_raw = outputs.get("text")
                    # 2) answer 字段
                    if not answer_raw and isinstance(resp_json, dict):
                        answer_raw = resp_json.get("answer")
                    # 3) 某些实现把结果放在 data.answer 或 data.outputs
                    if not answer_raw and isinstance(resp_json, dict):
                        data_field = resp_json.get("data")
                        if isinstance(data_field, dict):
                            answer_raw = data_field.get("answer") or (data_field.get("outputs") or {}).get("text")

                    if not answer_raw:
                        logger.error("未找到 answer 字段或 outputs.text")
                        return {}

                    # answer_raw 可能是字符串形式的 JSON，也可能是 dict
                    logger.info(f"answer_raw: {answer_raw}")
                    from public.public_function import extract_json
                    try:
                        if isinstance(answer_raw, dict):
                            answer_dict = answer_raw
                        elif isinstance(answer_raw, str):
                            json_results = extract_json(answer_raw)
                            answer_dict = json_results[0] if json_results else json.loads(answer_raw)
                        else:
                            answer_dict = {"raw": answer_raw}
                    except Exception:
                        logger.error("解析 answer 字符串为 JSON 失败")
                        return {}
                    
                    return answer_dict

        except Exception as e:
            # 重新抛出异常，以便外层捕获
            logger.exception("Dify 请求过程发生异常")
            raise e

    try:
        mapping = await _generate_chinese_map(field_names)
        logger.info(f"get_zh_name mapping: {mapping}")
        if mapping:
            return ApiResponse(status="success", data={"mapping": mapping}, code="200")
        else:
            try:
                logger.info("AAP 未返回有效结果，尝试使用 Dify 生成中文名")
                mapping = await _generate_chinese_map_dify(field_names)
                if mapping == {}:
                    return ApiResponse(status="failed", message="Dify 未返回有效结果", code="500")
                logger.info(f"get_zh_name mapping_dify: {mapping}")
                return ApiResponse(status="success", data={"mapping": mapping}, code="200")
            except Exception as e:
                return ApiResponse(status="failed", message=str(e), code="500")
    except Exception as e:
        try:
            logger.info(f"AAP 未返回有效结果{e}，尝试使用 Dify 生成中文名")
            mapping = await _generate_chinese_map_dify(field_names)
            if mapping == {}:
                return ApiResponse(status="failed", message="Dify 未返回有效结果", code="500")
            logger.info(f"get_zh_name mapping_dify: {mapping}")
            return ApiResponse(status="success", data={"mapping": mapping}, code="200")
        except Exception as e:
            return ApiResponse(status="failed", message=str(e), code="500")
        


# RDF 导入导出接口

'''本体对象通过ttl文件导出'''
@router.post("/object/export_owl", response_model=ApiResponse)
async def export_owl_api(payload: ExportTTLRequest) -> ApiResponse:
    logger.info(f"Export OWL from ontology_id: {payload.ontology_id}")
    try:
        result = await export_ontology(
            payload.ontology_id, 
            format=payload.format,
            object_type_id=payload.object_type_id,
            is_public=payload.is_public
        )
        # is_public ： True调用输入id 的对应版本
        # result 是包含 content 和 stats 的字典
        content = result.get("content", "")
        stats = result.get("stats", {})
        
        # 根据格式返回不同的键名
        data_key = "ttl"
        return ApiResponse(
            status="success", 
            data={
                data_key: content,
                "stats": stats
            }, 
            code="200"
        )
    except Exception as e:
        logger.error(f"Export OWL failed: {e}")
        return ApiResponse(status="failed", message=str(e), code="500")

    
    
'''
本体对象通过ttl文件导入（旧接口 - 已废弃）

注意：此接口已废弃，建议使用新的异步任务接口 POST /task/import
新接口支持：
  1. 异步任务处理，立即返回task_id
  2. 任务队列管理和并发控制
  3. 任务状态回调通知
  4. 支持多种导入方式（OWL/文档/代码）

为了向后兼容，本接口保留但改为同步阻塞方式执行
如果需要异步任务功能，请迁移到新接口
'''
@router.post("/object/import_owl", response_model=ApiResponse)
async def import_owl_api(payload: ImportOwlFromURLRequest) -> ApiResponse:
    logger.warning(
        f"使用了旧的导入接口 /object/import_owl，建议迁移到新接口 /task/import。"
        f"OWL URL: {payload.owl_url}"
    )
    try:
        # 1) 下载 OWL 文本（RDF/XML 或 Turtle 都可以）
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(str(payload.owl_url), follow_redirects=True)
            resp.raise_for_status()
            owl_content = resp.text.strip()

        if not owl_content:
            logger.error("OWL 内容为空（从 owl_url 拉取到的内容为空）")
            return ApiResponse(status="failed", message="OWL 内容为空（从 owl_url 拉取到的内容为空）", code="500")

        # 2) 调用增强版导入函数：带分类功能（new/exist）
        # 默认 enable_write=False，仅返回分类数据，不写入数据库
        result_json = await import_owl_with_classification(
            ontology_id=payload.ontology_id,
            owner_id=payload.owner_id,
            owl_content=owl_content,
            enable_write=True  # 可根据需求改为 True（需实现写入逻辑）
        )

        # 若解析层返回失败结构，直接透传（不再外层包 success）
        if isinstance(result_json, dict) and result_json.get("status") == "failed":
            # 保证 code 为 500（若未设置则补充）
            if not result_json.get("code"):
                result_json["code"] = "500"
            return ApiResponse(**result_json)

        return ApiResponse(status="success", data=result_json, code="200")
    except httpx.HTTPError as he:
        return ApiResponse(status="failed", message=f"下载 OWL 失败：{he}", code="500")
    except Exception as e:
        logger.error(f"Import OWL from URL: {payload.owl_url} failed: {e}")
        logger.error(traceback.format_exc())
        return ApiResponse(status="failed", message=str(e), code="500")    

@router.get("/prompt/{prompt_type}")
async def get_prompt(
    prompt_type: str = Path(..., description="Prompt类型，允许值: 'common' 或 'oag'"),
    ontology_id: Optional[str] = Query(None, description="本体ID，当prompt_type为'oag'时必填")
) -> ApiResponse:
    from utils.component.prompt_templates.prompts import PromptTemplates
    
    # 验证 prompt_type 参数
    if prompt_type not in ['common', 'oag']:
        raise HTTPException(status_code=400, detail=f"无效的prompt_type: {prompt_type}，仅支持 'common' 或 'oag'")
    
    # 处理 common 类型
    if prompt_type == 'common':
        prompt = PromptTemplates.COMMON_PROMPT.value
        return ApiResponse(status="success", data={"prompt": prompt}, code="200")
    
    # 处理 oag 类型
    if prompt_type == 'oag':
        # 验证 ontology_id 参数
        if not ontology_id:
            raise HTTPException(status_code=400, detail="当prompt_type为'oag'时，ontology_id参数必填")
        
        oag_prompt = PromptTemplates.OAG_PROMPT.value
        # 替换模板中的 ontology_id 占位符
        # prompt = oag_prompt.format(ontology_id=ontology_id)
        return ApiResponse(status="success", data={"prompt": oag_prompt}, code="200")

@router.post("/get_graph_data")
async def get_graph_data(payload: GetGraphDataRequest) -> ApiResponse:
    from core.ontology.api_services import get_graph_data as gpd
    res = await gpd(payload.ontology_id, payload.nodes_amount, payload.node_names, payload.pub_version)
    return ApiResponse(status="success", data=res.data, code="200")

@router.get("/expand_node")
async def expand_node(object_type_id: str, pub_version: bool = False) -> ApiResponse:
    from core.ontology.api_services import get_related_graph_data
    res = await get_related_graph_data(object_type_id, pub_version)
    return ApiResponse(status="success", data=res.data, code="200")

@router.get("/expand_node_by_name")
async def expand_node_by_name(
    ontology_name: str, 
    object_type_name: str, 
    workspace_id: str, 
    pub_version: bool = False
) -> ApiResponse:
    from core.ontology.api_services import get_related_graph_data_by_name
    logger.info(f"expand_node_by_name: {ontology_name}, {object_type_name}, {workspace_id}, {pub_version}")
    res = await get_related_graph_data_by_name(ontology_name, object_type_name, workspace_id, pub_version)
    return ApiResponse(status="success", data=res.data, code="200", message=res.message)

@router.get("/get_objects_by_action")
async def get_objects_by_action(
    ontology_name: str,
    action_name: str,
    workspace_id: str,
    pub_version: bool = False
) -> ApiResponse:
    from core.ontology.api_services import get_objects_by_action_name
    res = await get_objects_by_action_name(ontology_name, action_name, workspace_id, pub_version)
    return ApiResponse(status="success", data=res.data, code="200")

@router.get("/get_objects_by_logic")
async def get_objects_by_logic(
    ontology_name: str,
    logic_name: str,
    workspace_id: str,
    pub_version: bool = False
) -> ApiResponse:
    from core.ontology.api_services import get_objects_by_logic_name
    res = await get_objects_by_logic_name(ontology_name, logic_name, workspace_id, pub_version)
    return ApiResponse(status="success", data=res.data, code="200")

######################### 迁出 / 迁入 API #################################

@router.post("/ontology/migrate_out", response_model=ApiResponse)
async def migrate_out(payload: MigrateOutRequest) -> ApiResponse:
    """本体内容迁出

    步骤：
      1. 校验 ontology_id 是否存在
      2. 调用 export_ontology_data 生成目录 + JSON + tar
      3. 返回 tar 路径与统计信息
    """
    try:
        from utils.databases import create_mysql_service
        from core.ontology.ontology_migrate import OntologyExporter
        
        # 创建MySQL服务实例
        mysql_service = await create_mysql_service()
        exporter = OntologyExporter(mysql_service)
        
        result = await exporter.export(payload.ontology_id)
        return ApiResponse(status="success", data=result, code="200")
    except Exception as e:
        logger.error(f"migrate_out failed: {e}")
        return ApiResponse(status="failed", message=str(e), code="500")


@router.post("/ontology/migrate_in", response_model=ApiResponse)
async def migrate_in(payload: MigrateInRequest) -> ApiResponse:
    """本体内容迁入

    支持通过 HTTP/HTTPS URL 或 MinIO 对象路径下载 tar 包再解析。
    """
    from core.ontology.ontology_migrate import OntologyImporter
    from utils.databases import create_mysql_service
    
    tar_url = payload.tar_url
    cleanup_dir: Optional[str] = None
    local_tar_path = tar_url
    _, minio_client, minio_base_url = _build_minio_download_client()

    try:
        if tar_url.startswith(("http://", "https://")):
            parsed_url = urlparse(tar_url)
            minio_netloc = urlparse(minio_base_url).netloc if minio_base_url else ""
            if minio_client and parsed_url.netloc == minio_netloc:
                path = parsed_url.path.lstrip('/')
                if not path or '/' not in path:
                    raise ValueError("MinIO URL 缺少 bucket/object 信息")
                bucket, object_name = path.split('/', 1)
                cleanup_dir = tempfile.mkdtemp(prefix="ontology_import_")
                local_tar_path = os.path.join(cleanup_dir, f"download_{uuid.uuid4().hex}.tar")

                def _download_from_minio() -> None:
                    minio_client.fget_object(bucket, object_name, local_tar_path)

                await asyncio.to_thread(_download_from_minio)
            else:
                cleanup_dir = tempfile.mkdtemp(prefix="ontology_import_")
                local_tar_path = os.path.join(cleanup_dir, f"download_{uuid.uuid4().hex}.tar")
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.get(tar_url, follow_redirects=True)
                    resp.raise_for_status()
                    with open(local_tar_path, 'wb') as f:
                        f.write(resp.content)
        mysql_service = await create_mysql_service()
        importer = OntologyImporter(mysql_service)
        result = await importer.import_from_tar(
            tar_path=local_tar_path,
            owner_id=payload.owner_id,
            workspace_id=payload.workspace_id,
            ontology_name=payload.ontology_name,
            ontology_label=payload.ontology_label,
            ontology_desc=payload.ontology_desc,
        )
        summary = {
            "ontology_id": result.get("new_ontology_id"),
            "ontology_name": result.get("ontology_name"),
            "source_url": tar_url,
            "message": result.get("message"),
        }
        api_errors = result.get("api_results", {}).get("api_errors") if isinstance(result.get("api_results"), dict) else None
        if api_errors:
            summary["api_errors"] = api_errors
        return ApiResponse(status="success", data=summary, code="200")
    except S3Error as se:
        return ApiResponse(status="failed", message=f"MinIO 下载失败: {se}", code="500")
    except httpx.HTTPError as he:
        return ApiResponse(status="failed", message=f"下载失败: {he}", code="500")
    except ValueError as ve:
        return ApiResponse(status="failed", message=str(ve), code="500")
    except Exception as e:
        logger.error(f"migrate_in failed: {e}")
        return ApiResponse(status="failed", message=str(e), code="500")
    finally:
        if cleanup_dir:
            shutil.rmtree(cleanup_dir, ignore_errors=True)

# ========== 异步任务导入相关接口 ==========

async def _owl_import_handler(task_info: TaskInfo) -> Dict[str, Any]:
    """OWL导入任务处理器"""
    payload = task_info.payload
    owl_url = payload.get("owl_url")
    enable_write = payload.get("enable_write", True)
    
    logger.info(f"[Task {task_info.task_id}] Starting OWL import from: {owl_url}")
    
    # 检查是否被取消
    if task_info.cancel_event.is_set():
        raise asyncio.CancelledError("Task cancelled before download")
    
    # 下载OWL文件
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(owl_url, follow_redirects=True)
        resp.raise_for_status()
        owl_content = resp.text.strip()
    
    if not owl_content:
        raise ValueError("OWL内容为空（从owl_url拉取到的内容为空）")
    
    # 检查是否被取消
    if task_info.cancel_event.is_set():
        raise asyncio.CancelledError("Task cancelled after download")
    
    # 调用导入函数
    result_json = await import_owl_with_classification(
        ontology_id=task_info.ontology_id,
        owner_id=task_info.owner_id,
        owl_content=owl_content,
        enable_write=enable_write
    )
    
    # 检查结果
    if isinstance(result_json, dict) and result_json.get("status") == "failed":
        raise OwlValidationError(result_json)
    
    logger.info(f"[Task {task_info.task_id}] OWL import completed successfully")
    return result_json

async def _csv_import_handler(task_info: TaskInfo) -> Dict[str, Any]:
    """CSV/XLSX导入任务处理器（与rdf_services.py的import_owl_with_classification完全一致）"""
    payload = task_info.payload
    data_url = payload.get("data_url")
    enable_write = payload.get("enable_write", True)

    ontology_name: Optional[str] = None
    
    # 验证 ontology_id 是否存在且状态有效（与 rdf_services.py 对齐：仅 sync_status < 3 的数据有效）
    try:
        from utils.databases.service_factory import create_mysql_service
        mysql = await create_mysql_service()
        row = await mysql.afetch_one(
            "SELECT ontology_name, sync_status FROM ontology_manage WHERE id = %s",
            (str(task_info.ontology_id),)
        )
        if not row:
            raise ValueError(f"本体不存在：ontology_id={task_info.ontology_id}")
        
        sync_status = row.get("sync_status", 0)
        if sync_status >= 3:
            raise ValueError(
                f"本体状态无效（sync_status={sync_status}），无法导入数据。"
                f"只有 sync_status < 3 的本体才能进行数据导入操作。"
            )
        
        name_in_db = (row.get("ontology_name") or "").strip() or None
        if name_in_db:
            ontology_name = name_in_db
    except ValueError:
        raise
    except Exception as exc:
        logger.warning(f"[Task {task_info.task_id}] 获取 ontology_name 失败: {exc}")
        raise ValueError(f"查询本体信息失败: {exc}")
    
    logger.info(
        f"[Task {task_info.task_id}] Starting CSV/XLSX import. "
    )
    
    temp_object_csv = None
    temp_relation_csv = None
    temp_xlsx = None
    
    try:
        # 检查是否被取消
        if task_info.cancel_event.is_set():
            raise asyncio.CancelledError("Task cancelled before download")
        
        # 判断 data_url 是单个XLSX文件还是两个CSV文件
        if isinstance(data_url, str):
            # 单个XLSX文件：下载并解析成两个CSV
            logger.info(f"[Task {task_info.task_id}] Downloading XLSX file from: {data_url}")
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(data_url, follow_redirects=True)
                resp.raise_for_status()
                xlsx_content = resp.content
            
            if not xlsx_content:
                raise ValueError("XLSX内容为空（从data_url拉取到的内容为空）")
            
            # 保存到临时XLSX文件
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.xlsx', delete=False) as f:
                f.write(xlsx_content)
                temp_xlsx = f.name
            
            # 解析XLSX，提取"对象信息"和"对象关系信息"两个sheet
            import pandas as pd
            
            try:
                xlsx_file = pd.ExcelFile(temp_xlsx)
                
                # 智能匹配sheet名称（支持带.csv后缀和不带后缀两种情况）
                object_sheet_name = None
                relation_sheet_name = None
                
                for sheet_name in xlsx_file.sheet_names:
                    if sheet_name in ["对象信息", "对象信息.csv"]:
                        object_sheet_name = sheet_name
                    elif sheet_name in ["对象关系信息", "对象关系信息.csv"]:
                        relation_sheet_name = sheet_name
                
                # 验证sheet名称
                if not object_sheet_name:
                    raise ValueError(f"XLSX文件缺少'对象信息'工作表，当前sheet: {xlsx_file.sheet_names}")
                if not relation_sheet_name:
                    raise ValueError(f"XLSX文件缺少'对象关系信息'工作表，当前sheet: {xlsx_file.sheet_names}")
                
                # 读取两个sheet并保存为CSV
                object_df = pd.read_excel(xlsx_file, sheet_name=object_sheet_name)
                relation_df = pd.read_excel(xlsx_file, sheet_name=relation_sheet_name)
                
                # 保存为临时CSV文件
                with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
                    object_df.to_csv(f, index=False)
                    temp_object_csv = f.name
                
                with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
                    relation_df.to_csv(f, index=False)
                    temp_relation_csv = f.name
                
                logger.info(
                    f"[Task {task_info.task_id}] XLSX parsed successfully: "
                    f"对象信息={temp_object_csv}, 对象关系信息={temp_relation_csv}"
                )
                
            except Exception as e:
                raise ValueError(f"解析XLSX文件失败: {e}")
        
        elif isinstance(data_url, dict):
            # 两个CSV文件：分别下载
            object_csv_url = data_url.get("对象信息")
            relation_csv_url = data_url.get("对象关系信息")
            
            logger.info(
                f"[Task {task_info.task_id}] Downloading CSV files: "
                f"对象信息={object_csv_url}, 对象关系信息={relation_csv_url}"
            )
            
            # 下载对象信息CSV
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(object_csv_url, follow_redirects=True)
                resp.raise_for_status()
                object_csv_content = resp.content
            
            if not object_csv_content:
                raise ValueError("对象信息CSV内容为空")
            
            # 下载对象关系信息CSV
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(relation_csv_url, follow_redirects=True)
                resp.raise_for_status()
                relation_csv_content = resp.content
            
            if not relation_csv_content:
                raise ValueError("对象关系信息CSV内容为空")
            
            # 保存到临时文件
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as f:
                f.write(object_csv_content)
                temp_object_csv = f.name
            
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as f:
                f.write(relation_csv_content)
                temp_relation_csv = f.name
            
            logger.info(
                f"[Task {task_info.task_id}] CSV files downloaded: "
                f"对象信息={temp_object_csv}, 对象关系信息={temp_relation_csv}"
            )
        
        else:
            raise ValueError(f"data_url格式错误，必须是字符串（XLSX URL）或字典（两个CSV URL）")
        
        # 检查是否被取消
        if task_info.cancel_event.is_set():
            raise asyncio.CancelledError("Task cancelled after download")
        
        # 使用CSV转换器进行解析和分类（查询数据库进行new/exist分类）
        converter = CSVOntologyConverter(
            object_csv_path=temp_object_csv,
            relation_csv_path=temp_relation_csv
        )
        
        result_json = await converter.convert_to_standard_json_with_classify(
            ontology_id=task_info.ontology_id,
            ontology_name=ontology_name
        )
        
        # 检查是否被取消
        if task_info.cancel_event.is_set():
            raise asyncio.CancelledError("Task cancelled before write")
        
        # 如果enable_write=True，调用CSV专用写库逻辑（流程与rdf_services一致）
        if enable_write:
            if task_info.cancel_event.is_set():
                raise asyncio.CancelledError("Task cancelled before database write")

            write_stats = await converter.write_to_database(
                ontology_id=task_info.ontology_id,
                owner_id=task_info.owner_id,
                result_json=result_json,
            )

            # 计算新增和已存在的链接数量（使用 is_exist 字段）
            links = result_json.get("link", [])
            link_new_count = len([l for l in links if not l.get("is_exist")])
            link_exist_count = len([l for l in links if l.get("is_exist")])
            write_stats["link_new_count"] = link_new_count
            write_stats["link_exist_count"] = link_exist_count

            result_json["import_stats"] = write_stats

            parse_stats = result_json.get("parse_stats") or {}
            parsed_rel_success = int(parse_stats.get("success_relation_count", 0) or 0)
            # 注意：统一幂等行为后，不再更新已存在关系，只插入新关系
            inserted_rel = int(write_stats.get("inserted_links", 0) or 0)
            parse_stats["success_relation_count"] = inserted_rel
            failed_rel = max(0, parsed_rel_success - inserted_rel)
            error_list = result_json.get("error_list") or []
            middle_fail = sum(1 for e in error_list if e.get("type") == "middle_dataset")
            rel_insert_fail = sum(1 for e in error_list if e.get("type") == "relation_insert_failed")
            parse_stats["failed_relation_count"] = max(failed_rel, middle_fail + rel_insert_fail)
            result_json["parse_stats"] = parse_stats

            if parsed_rel_success and inserted_rel == 0:
                error_list = result_json.get("error_list") or []
                # 获取所有对象名称（使用 is_exist 字段）
                obj_names = {
                    o.get("objectTypeName")
                    for o in result_json.get("object", [])
                    if o.get("objectTypeName")
                }
                # 获取新增关系（is_exist=False）
                for rel in [l for l in result_json.get("link", []) if not l.get("is_exist")]:
                    reason = "unknown"
                    if write_stats.get("links_new_len", 0) == 0:
                        reason = "links_new_empty_at_write"
                    if rel.get("sourcename") not in obj_names or rel.get("targetname") not in obj_names:
                        reason = "object_missing"
                    elif rel.get("link_type") == 2 and not rel.get("middle_ds_id"):
                        reason = "middle_dataset_unmatched"
                    error_list.append({
                        "type": "relation_insert_failed",
                        "line": rel.get("row_num"),
                        "middle_dataset": rel.get("middle_dataset"),
                        "message": (
                            "关系未写入数据库（可能对象被跳过、关系被过滤或写库条件不满足）"
                        ),
                        "reason": reason,
                        "sourcename": rel.get("sourcename"),
                        "targetname": rel.get("targetname"),
                        "source_attribute_name": rel.get("source_attribute_name"),
                        "target_attribute_name": rel.get("target_attribute_name"),
                        "link_type": rel.get("link_type"),
                        "link_method": rel.get("link_method"),
                        "middle_ds_id": rel.get("middle_ds_id"),
                        "middle_ds_schema": rel.get("middle_ds_schema"),
                        "middle_table_name": rel.get("middle_table_name"),
                    })
                error_list.append({
                    "type": "relation_insert",
                    "parsed_success": parsed_rel_success,
                    "inserted": inserted_rel,
                    "message": (
                        "关系解析成功但未写入数据库，请检查对象是否被跳过、"
                        "关系是否被过滤或写库条件不满足"
                    ),
                })
                result_json["error_list"] = error_list
            
            logger.info(f"[Task {task_info.task_id}] CSV import completed successfully and written to database")
        else:
            logger.info(f"[Task {task_info.task_id}] CSV import completed successfully (classification only, not written)")
        
        return result_json
        
    except asyncio.CancelledError:
        raise
    except httpx.HTTPError as he:
        raise ValueError(f"下载文件失败: {he}")
    except ValueError as ve:
        # CSV验证错误（中英文缺失等）
        raise ValueError(f"CSV验证失败: {ve}")
    except Exception as e:
        logger.error(f"[Task {task_info.task_id}] CSV import failed: {e}")
        logger.error(traceback.format_exc())
        raise ValueError(f"CSV导入失败: {e}")
    
    finally:
        # 清理临时文件
        for temp_file in [temp_object_csv, temp_relation_csv, temp_xlsx]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception as e:
                    logger.warning(f"清理临时文件失败: {temp_file}, {e}")


# 注册任务处理器
task_manager.register_handler(TaskType.OWL_IMPORT, _owl_import_handler)
task_manager.register_handler(TaskType.CSV_IMPORT, _csv_import_handler)


async def _test_callback_availability(callback_url: str) -> tuple[bool, str]:
    """
    测试回调接口的可用性
    
    Args:
        callback_url: 回调接口URL
        
    Returns:
        (是否可用, 错误消息)
    """
    try:
        # 发送ping请求到回调接口
        ping_payload = {
            "type": "ping",
            "message": "测试回调接口连通性"
        }
        
        # 注意：httpx 默认不跟随重定向（follow_redirects=False），
        # 而 requests 默认会跟随 301/302/...，因此同一 URL 可能出现：
        # - httpx 看到 302 并直接返回
        # - requests 跟随后最终拿到 200
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.post(callback_url, json=ping_payload)
            if response.history:
                try:
                    redirect_chain = " -> ".join(str(r.status_code) for r in response.history)
                except Exception:
                    redirect_chain = "<unavailable>"
                logger.info(
                    f"Callback ping followed redirects: {redirect_chain} -> {response.status_code}; "
                    f"final_url={response.url}"
                )
            
            # 检查响应状态码
            if response.status_code not in [200, 201, 204]:
                location = response.headers.get("location")
                if location:
                    return False, f"回调接口返回错误状态码: {response.status_code} (Location: {location})"
                return False, f"回调接口返回错误状态码: {response.status_code}"
            
            # 尝试解析响应（期望是JSON）
            try:
                result = response.json()
                # 可以根据约定检查响应内容
                # 例如：期望返回 {"status": "pong"} 或类似的确认消息
                logger.info(f"Callback ping response: {result}")
            except Exception:
                # 如果不是JSON，只要状态码正确也认为是成功的
                pass
            
            return True, "回调接口可用"
            
    except httpx.TimeoutException:
        return False, "回调接口超时（5秒），请检查网络连接和接口响应速度"
    except httpx.ConnectError:
        return False, "无法连接到回调接口，请检查URL是否正确以及网络连通性"
    except Exception as e:
        return False, f"测试回调接口时发生错误: {str(e)}"


@router.post("/task/import", response_model=TaskSubmitResponse)
async def unified_import_api(payload: UnifiedImportRequest) -> TaskSubmitResponse:
    """
    统一的导入接口（Redis队列版本），支持两种导入方式：
    1. owl_import: OWL文件导入
    2. csv_import: CSV/XLSX文件导入（与rdf_services.py的import_owl_with_classification完全一致）
    
    CSV导入支持两种数据格式：
    - 单个XLSX文件URL（字符串）：文件内包含"对象信息"和"对象关系信息"两个sheet
    - 两个CSV文件URL（JSON对象）：格式为 {"对象信息": "url1", "对象关系信息": "url2"}
    
    所有导入都以异步任务形式执行，立即返回task_id和排队信息
    任务状态变化会通过回调接口通知Java后端
    
    使用Redis队列实现，支持多worker部署，串行执行（一次只处理一个任务）
    
    在提交任务前会先测试回调接口的可用性，
    只有在回调接口可用的情况下才会提交任务
    """
    logger.info(
        f"[ImportTask] Unified import request received. Type: {payload.task_type}, "
        f"Ontology: {payload.ontology_id}, Owner: {payload.owner_id}, "
        f"Callback URL: {payload.callback_url}"
    )
    
    try:
        # 获取导入任务服务（Redis队列版本）
        import_service = get_import_task_service()
        
        # 使用请求中的回调URL
        callback_url = payload.callback_url
        
        # 测试回调接口可用性
        logger.info(f"[ImportTask] Testing callback URL availability: {callback_url}")
        is_available, error_msg = await _test_callback_availability(callback_url)
        
        if not is_available:
            logger.error(f"[ImportTask] Callback URL test failed: {error_msg}")
            return TaskSubmitResponse(
                status="failed",
                message=f"回调接口不可用: {error_msg}",
                code="503"  # Service Unavailable
            )
        
        logger.info(f"[ImportTask] Callback URL test passed: {callback_url}")
        
        # 验证 ontology_id 是否存在且状态有效（与 rdf_services.py 对齐：仅 sync_status < 3 的数据有效）
        try:
            from utils.databases.service_factory import create_mysql_service
            mysql = await create_mysql_service()
            row = await mysql.afetch_one(
                "SELECT ontology_name, sync_status FROM ontology_manage WHERE id = %s",
                (str(payload.ontology_id),)
            )
            if not row:
                return TaskSubmitResponse(
                    status="failed",
                    message=f"本体不存在：ontology_id={payload.ontology_id}",
                    code="404"
                )
            
            sync_status = row.get("sync_status", 0)
            if sync_status >= 3:
                return TaskSubmitResponse(
                    status="failed",
                    message=f"本体状态无效（sync_status={sync_status}），无法导入数据。只有 sync_status < 3 的本体才能进行数据导入操作。",
                    code="400"
                )
            
            logger.info(f"[ImportTask] Ontology validation passed: ontology_id={payload.ontology_id}, sync_status={sync_status}")
        except Exception as exc:
            logger.error(f"[ImportTask] Failed to validate ontology_id: {exc}")
            return TaskSubmitResponse(
                status="failed",
                message=f"查询本体信息失败: {exc}",
                code="500"
            )
        
        # 构建任务payload
        task_payload = {
            "task_type": payload.task_type,
            "enable_write": payload.enable_write,
        }
        
        # 添加特定任务类型的参数
        if payload.task_type == "owl_import":
            task_payload["owl_url"] = payload.owl_url
        elif payload.task_type == "csv_import":
            task_payload["data_url"] = payload.data_url
        
        # 添加额外参数
        if payload.extra_params:
            task_payload["extra_params"] = payload.extra_params
        
        # 提交任务到Redis队列
        result = await import_service.submit_import_task(
            task_id=payload.task_id,
            task_type=payload.task_type,
            ontology_id=payload.ontology_id,
            owner_id=payload.owner_id,
            payload=task_payload,
            callback_url=callback_url
        )
        
        if result["status"] == "failed":
            return TaskSubmitResponse(
                status="failed",
                message=result.get("message", "提交任务失败"),
                code="500"
            )
        
        return TaskSubmitResponse(
            status="success",
            task_id=result["task_id"],
            message=f"任务已提交，排队位置: {result['queue_position']}，前面还有 {result['tasks_ahead']} 个任务",
            queue_position=result["queue_position"],
            tasks_ahead=result["tasks_ahead"],
            code="200"
        )
        
    except Exception as e:
        logger.error(f"Failed to submit import task: {e}")
        logger.error(traceback.format_exc())
        return TaskSubmitResponse(
            status="failed",
            message=f"提交任务失败: {str(e)}",
            code="500"
        )


@router.post("/task/cancel", response_model=ApiResponse)
async def cancel_task_api(payload: CancelTaskRequest) -> ApiResponse:
    """
    取消指定的导入任务（Redis队列版本）
    - 如果任务在队列中等待，将立即取消
    - 如果任务正在执行，需要设置 force=True 来强制取消
    """
    logger.info(f"[ImportTask] Cancel task request received for task_id: {payload.task_id}, force: {payload.force}")
    
    try:
        import_service = get_import_task_service()
        result = await import_service.cancel_import_task(payload.task_id, force=payload.force)
        
        if result["status"] == "success":
            return ApiResponse(
                status="success",
                message=result.get("message", f"任务 {payload.task_id} 已取消"),
                code="200"
            )
        else:
            return ApiResponse(
                status="failed",
                message=result.get("message", "取消任务失败"),
                code="400"
            )
    except Exception as e:
        logger.error(f"[ImportTask] Failed to cancel task {payload.task_id}: {e}")
        logger.error(traceback.format_exc())
        return ApiResponse(
            status="failed",
            message=f"取消任务失败: {str(e)}",
            code="500"
        )


@router.get("/task/queue_status", response_model=ApiResponse)
async def get_queue_status_api() -> ApiResponse:
    """
    获取任务队列状态（Redis队列版本，用于监控和调试）
    包含任务详细信息、运行时长和超时倒计时
    """
    try:
        import_service = get_import_task_service()
        status = await import_service.get_queue_status()
        return ApiResponse(
            status="success",
            data=status,
            code="200"
        )
    except Exception as e:
        logger.error(f"Failed to get queue status: {e}")
        return ApiResponse(
            status="failed",
            message=f"获取队列状态失败: {str(e)}",
            code="500"
        )


@router.post("/task/cleanup_orphaned", response_model=ApiResponse)
async def cleanup_orphaned_tasks_api() -> ApiResponse:
    """
    手动清理孤儿任务和超时任务
    - 孤儿任务：服务重启后残留在Redis中的running状态任务
    - 超时任务：运行时间超过限制的任务
    """
    try:
        import_service = get_import_task_service()
        
        # Cleanup orphaned tasks
        await import_service.cleanup_orphaned_tasks()
        
        # Check timeout tasks
        await import_service._check_timeout_tasks()
        
        # Get updated status
        status = await import_service.get_queue_status()
        
        return ApiResponse(
            status="success",
            message="孤儿任务和超时任务清理完成",
            data=status,
            code="200"
        )
    except Exception as e:
        logger.error(f"Failed to cleanup orphaned tasks: {e}")
        logger.error(traceback.format_exc())
        return ApiResponse(
            status="failed",
            message=f"清理孤儿任务失败: {str(e)}",
            code="500"
        )


# ========== 模拟回调接口（用于测试） ==========

@router.post("/task/mock_callback", response_model=ApiResponse)
async def mock_callback(payload: Dict[str, Any] = Body(...)) -> ApiResponse:
    """
    模拟回调接口，用于接收任务状态变化通知
    
    这个接口会记录所有接收到的回调请求，包括：
    - ping测试请求 (type: "ping")
    - 任务状态变化通知 (包含 task_id, status 字段)
    
    任务管理器回调格式：
    {
        "task_id": "xxx",
        "task_type": "owl_import",
        "status": "running/completed/failed/cancelled",
        "message": "xxx",
        "ontology_id": "xxx",
        "owner_id": "xxx",
        "result": {...},  // 可选
        "error_message": "xxx"  // 可选
    }
    
    Ping测试格式：
    {
        "type": "ping",
        "message": "测试回调接口连通性"
    }
    """
    logger.info("=" * 80)
    logger.info("[模拟回调接口] 收到回调请求")
    logger.info(f"[模拟回调接口] 完整payload:")
    logger.info(json.dumps(payload, ensure_ascii=False, indent=2))
    logger.info("=" * 80)
    
    try:
        # 判断是ping请求还是任务状态回调
        # ping请求有 "type": "ping"
        # 任务状态回调有 "task_id" 和 "status"
        
        if payload.get("type") == "ping":
            # 处理ping测试请求
            logger.info("[模拟回调接口] ✓ Ping请求处理成功")
            return ApiResponse(
                status="success",
                message="pong",
                data={"received": True},
                code="200"
            )
        
        elif "task_id" in payload and "status" in payload:
            # 处理任务状态变化通知
            task_id = payload.get("task_id", "unknown")
            task_type = payload.get("task_type", "unknown")
            status = payload.get("status", "unknown")
            message = payload.get("message", "")
            ontology_id = payload.get("ontology_id", "unknown")
            owner_id = payload.get("owner_id", "unknown")
            
            logger.info(f"[模拟回调接口] ✓ 任务状态回调:")
            logger.info(f"  - Task ID: {task_id}")
            logger.info(f"  - Task Type: {task_type}")
            logger.info(f"  - Status: {status}")
            logger.info(f"  - Message: {message}")
            logger.info(f"  - Ontology ID: {ontology_id}")
            logger.info(f"  - Owner ID: {owner_id}")
            
            if "queue_position" in payload:
                logger.info(f"  - Queue Position: {payload['queue_position']}")
            
            if "result" in payload:
                logger.info(f"  - Result: {json.dumps(payload['result'], ensure_ascii=False, indent=2)}")
            
            if "error_message" in payload:
                logger.warning(f"  - Error Message: {payload['error_message']}")
            
            # 返回成功响应
            return ApiResponse(
                status="success",
                message="任务状态回调接收成功",
                data={"task_id": task_id, "acknowledged": True},
                code="200"
            )
        
        else:
            # 未知格式
            logger.warning(f"[模拟回调接口] ⚠ 未知的回调格式，payload keys: {list(payload.keys())}")
            return ApiResponse(
                status="success",
                message="收到未知格式的回调",
                data={"received": True},
                code="200"
            )
    
    except Exception as e:
        logger.error(f"[模拟回调接口] ✗ 处理回调请求时发生错误: {e}")
        logger.error(traceback.format_exc())
        return ApiResponse(
            status="failed",
            message=f"处理回调请求失败: {str(e)}",
            code="500"
        )


class ChatRequest(BaseModel):
    # inputs: Dict[str, Any] = {}
    sys_prompt: Optional[str] = ""
    query: str
    response_mode: str = "streaming"
    conversation_id: str = ""
    user: str
    parent_message_id: Optional[str] = None
    workspace_id: Optional[str] = None
    ontology_name: Optional[str] = None
    agent_mode: Optional[int] = 0  # 提示词类型: 0-普通提示词, 1-OAG提示词


class MessagesResponse(BaseModel):
    """Response model for message history"""
    limit: int
    has_more: bool
    data: List[Dict[str, Any]]


class ConversationsResponse(BaseModel):
    """Response model for conversation list"""
    limit: int
    has_more: bool
    data: List[Dict[str, Any]]


async def _transform_agent_thought_with_timeout(
    event_data: Dict[str, Any],
    workspace_id: Optional[str] = None,
    ontology_name: Optional[str] = None,
    pub_version: bool = False,
    timeout: float = 2.0
) -> Optional[Dict[str, Any]]:
    """
    Transform agent_thought event with timeout control.
    If graph fetching takes too long, return event without graph_detail.
    """
    try:
        # 使用 asyncio.wait_for 添加超时控制
        return await asyncio.wait_for(
            _transform_agent_thought(
                event_data,
                workspace_id=workspace_id,
                ontology_name=ontology_name,
                pub_version=pub_version
            ),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.warning(f"Graph detail fetch timed out after {timeout}s, returning event without graph_detail")
        # 超时时返回不带 graph_detail 的事件
        return await _transform_agent_thought_no_graph(event_data)


async def _transform_agent_thought_no_graph(event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Transform agent_thought event without fetching graph details.
    Fast version for timeout fallback.
    """
    tool = event_data.get("tool", "")
    observation = event_data.get("observation", "")
    tool_input = event_data.get("tool_input", "")
    
    # Skip if both tool and observation are empty
    if not tool and not observation:
        return None
    
    # Determine mcp_status
    mcp_status = None
    if tool and not observation:
        mcp_status = "start"
    elif tool and observation:
        mcp_status = "end"
    
    # Parse tool input to get running details
    mcp_details = parse_mcp_tool_input(tool, tool_input) if tool else {}
    
    # Build transformed event
    transformed = {
        "event": "agent_thought",
        "conversation_id": event_data.get("conversation_id"),
        "message_id": event_data.get("message_id"),
        "created_at": event_data.get("created_at"),
        "task_id": event_data.get("task_id"),
        "id": event_data.get("id"),
        "position": event_data.get("position"),
        "thought": event_data.get("thought", ""),
        "observation": observation,
        "mcp_status": mcp_status,
        "tool": tool,  # 保留dify返回的原始tool字段
        "tool_input": tool_input,  # 保留dify返回的原始tool_input字段
    }
    
    # Add parsed MCP details
    if mcp_details:
        running_type = mcp_details.get("running_type")
        running_detail = mcp_details.get("running_detail", {})
        
        # Generate running_label
        from utils.ontology_helpers import get_running_label
        running_label = get_running_label(running_type, running_detail)
        
        transformed.update({
            "running_type": running_type,
            "running_detail": running_detail,
            "running_label": running_label,
            "mcp_info": mcp_details.get("mcp_info")
        })
    
    # Always include graph_detail field, even if empty
    transformed["graph_detail"] = {"nodes": [], "edges": []}
    
    return transformed


async def _transform_agent_thought(
    event_data: Dict[str, Any],
    workspace_id: Optional[str] = None,
    ontology_name: Optional[str] = None,
    pub_version: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Transform agent_thought event from Dify format to custom format.
    
    Returns None if the event should be skipped.
    """
    tool = event_data.get("tool", "")
    observation = event_data.get("observation", "")
    tool_input = event_data.get("tool_input", "")
    
    # Skip if both tool and observation are empty
    if not tool and not observation:
        return None
    
    # Determine mcp_status
    mcp_status = None
    if tool and not observation:
        mcp_status = "start"
        # Debug log for start events
        logger.debug(f"MCP Start - Tool: {tool}, Input length: {len(tool_input)}")
    elif tool and observation:
        mcp_status = "end"
        logger.debug(f"MCP End - Tool: {tool}, Observation length: {len(observation)}")
    
    # Parse tool input to get running details
    mcp_details = parse_mcp_tool_input(tool, tool_input) if tool else {}
    
    # Log if parsing failed to identify type
    if mcp_details.get("running_type") == "unknown":
        logger.warning(f"Unknown running type for tool: {tool}, tool_input preview: {tool_input[:200]}")
    
    # Build transformed event
    transformed = {
        "event": "agent_thought",
        "conversation_id": event_data.get("conversation_id"),
        "message_id": event_data.get("message_id"),
        "created_at": event_data.get("created_at"),
        "task_id": event_data.get("task_id"),
        "id": event_data.get("id"),
        "position": event_data.get("position"),
        "thought": event_data.get("thought", ""),
        "observation": observation,
        "mcp_status": mcp_status,
        "tool": tool,  # 保留dify返回的原始tool字段
        "tool_input": tool_input,  # 保留dify返回的原始tool_input字段
    }
    
    # Add parsed MCP details
    if mcp_details:
        running_type = mcp_details.get("running_type")
        running_detail = mcp_details.get("running_detail", {})
        
        # Generate running_label
        from utils.ontology_helpers import get_running_label
        running_label = get_running_label(running_type, running_detail)
        
        transformed.update({
            "running_type": running_type,
            "running_detail": running_detail,
            "running_label": running_label,
            "mcp_info": mcp_details.get("mcp_info")
        })
    
    # Fetch graph details if workspace_id and ontology_name are provided
    graph_detail = None
    if workspace_id and ontology_name and mcp_status == "start":
        running_type = mcp_details.get("running_type")
        running_detail = mcp_details.get("running_detail", {})
        
        try:
            if running_type == "object":
                # Get graph data for object
                object_name = running_detail.get("object_name")
                if object_name:
                    from core.ontology.api_services import get_related_graph_data_by_name
                    result = await get_related_graph_data_by_name(
                        ontology_name=ontology_name,
                        object_type_name=object_name,
                        workspace_id=workspace_id,
                        pub_version=pub_version
                    )
                    if result.status == "success" and result.data:
                        graph_detail = result.data
                        logger.debug(f"Fetched graph detail for object: {object_name}")
            
            elif running_type == "action":
                # Get graph data for action
                action_name = running_detail.get("action_name")
                if action_name:
                    from core.ontology.api_services import get_objects_by_action_name
                    result = await get_objects_by_action_name(
                        ontology_name=ontology_name,
                        action_name=action_name,
                        workspace_id=workspace_id,
                        pub_version=pub_version
                    )
                    if result.status == "success" and result.data:
                        # Convert action data to graph_detail format
                        graph_detail = convert_action_data_to_graph_detail(result.data)
                        logger.debug(f"Fetched graph detail for action: {action_name}")
            
            elif running_type == "logic":
                # Get graph data for logic
                logic_name = running_detail.get("logic_name")
                if logic_name:
                    from core.ontology.api_services import get_objects_by_logic_name
                    result = await get_objects_by_logic_name(
                        ontology_name=ontology_name,
                        logic_name=logic_name,
                        workspace_id=workspace_id,
                        pub_version=pub_version
                    )
                    if result.status == "success" and result.data:
                        # Convert logic data to graph_detail format
                        graph_detail = convert_logic_data_to_graph_detail(result.data)
                        logger.debug(f"Fetched graph detail for logic: {logic_name}")
        
        except Exception as e:
            logger.error(f"Failed to fetch graph detail for {running_type}: {e}")
            # Continue without graph_detail
    
    # Always include graph_detail field
    # If graph_detail is None, use empty structure
    if graph_detail:
        transformed["graph_detail"] = graph_detail
    else:
        transformed["graph_detail"] = {"nodes": [], "edges": []}
    
    return transformed


@router.post("/agent/chat")
async def agent_chat(payload: ChatRequest):
    """
    Forward chat request to Dify agent API.
    Supports both streaming and blocking response modes.
    """
    import httpx
    
    logger.info(f"agent_chat request from user: {payload.user}, query: {payload.query}")
    
    try:
        # Read Dify configuration - select agent based on agent_mode
        # agent_mode: 0-普通提示词(dev agent), 1-OAG提示词(oag agent)
        if payload.agent_mode == 0:
            agent_mode = DifyAgentMode.COMMON
        elif payload.agent_mode == 1:
            agent_mode = DifyAgentMode.OAG
        else:
            logger.error(f"Invalid agent mode: {payload.agent_mode}")
            return ApiResponse(status="failed", message="Invalid agent mode, must be 0 or 1", code="500")
        
        dify_config = get_dify_config_sync(agent_mode.value)
        if not dify_config:
            logger.error(f"Dify configuration ({agent_mode.value} agent) not found in settings")
            return ApiResponse(status="failed", message=f"Dify configuration ({agent_mode.value} agent) not found in settings", code="500")
        
        base_url = dify_config.get("base_url")
        api_key = dify_config.get("api_key")
        
        logger.debug(f"Dify base_url: {base_url}, api_key: {'***' if api_key else None}")
        
        if not base_url or not api_key:
            logger.error(f"Dify base_url or api_key not configured. base_url={base_url}, api_key exists={bool(api_key)}")
            return ApiResponse(status="failed", message="Dify base_url or api_key not configured", code="500")
        
        # Construct Dify API URL
        dify_url = f"{base_url.rstrip('/')}/v1/chat-messages"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        inputs = {}
        if payload.sys_prompt:
            # 获取当前北京时间（UTC+8）
            beijing_time = datetime.now(timezone.utc) + timedelta(hours=8)
            beijing_time_str = beijing_time.strftime("%Y-%m-%d %H:%M")
            # 在 sys_prompt 后拼接北京时间
            inputs["sys_prompt"] = payload.sys_prompt + f"\n # 当前北京时间\n{beijing_time_str}"
        # Prepare request body
        request_body = {
            "inputs": inputs,
            "query": payload.query,
            "response_mode": payload.response_mode,
            "conversation_id": payload.conversation_id,
            "user": payload.user,
            "auto_generate_name": False
        }
        
        # Add parent_message_id if provided
        if payload.parent_message_id:
            request_body["parent_message_id"] = payload.parent_message_id
        
        # Handle streaming response
        if payload.response_mode == "streaming":
            async def stream_generator():
                async with httpx.AsyncClient(timeout=300.0, verify=False) as client:
                    async with client.stream("POST", dify_url, headers=headers, json=request_body) as response:
                        if response.status_code != 200:
                            error_text = await response.aread()
                            logger.error(f"Dify API error: {response.status_code}, {error_text}")
                            yield f"data: {json.dumps({'error': f'Dify API error: {response.status_code}'})}\n\n"
                            return
                        
                        # Process streaming response and transform events
                        async for line in response.aiter_lines():
                            if not line:
                                # yield "\n"
                                continue
                            
                            # Handle SSE format
                            if line.startswith("event:"):
                                # Pass through event lines as-is
                                yield f"{line}\n"
                                continue
                            
                            if line.startswith("data:"):
                                data_str = line[5:].strip()
                                
                                try:
                                    data_obj = json.loads(data_str)
                                    event_type = data_obj.get("event")
                                    
                                    # Transform agent_thought events
                                    if event_type == "agent_thought":
                                        # 使用超时控制的图谱查询（避免长时间阻塞）
                                        transformed = await _transform_agent_thought_with_timeout(
                                            data_obj,
                                            workspace_id=payload.workspace_id,
                                            ontology_name=payload.ontology_name,
                                            pub_version=False,
                                            timeout=2.0  # 2秒超时，避免阻塞过久
                                        )
                                        if transformed:
                                            yield f"data: {json.dumps(transformed, ensure_ascii=False)}\n\n"
                                        # Skip if transformed is None
                                        continue
                                    
                                    # Filter agent_message events with empty answer
                                    elif event_type == "agent_message":
                                        if not data_obj.get("answer"):
                                            continue
                                    
                                    # Pass through other events as-is
                                    yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"
                                    
                                except json.JSONDecodeError:
                                    # Not JSON, pass through as-is
                                    yield f"{line}\n"
                            else:
                                # Pass through other lines
                                yield f"{line}\n"
            
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
        # Handle blocking response
        else:
            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.post(dify_url, headers=headers, json=request_body)
                response.raise_for_status()
                result = response.json()
                return ApiResponse(status="success", data=result)
                
    except httpx.HTTPError as he:
        logger.error(f"Dify API request failed: {he}")
        return ApiResponse(status="failed", message=f"Dify API request failed: {str(he)}", code="500")
    except Exception as e:
        logger.error(f"agent_chat failed: {e}")
        return ApiResponse(status="failed", message=f"Error processing chat request: {str(e)}", code="500")


class GetMessagesRequest(BaseModel):
    """Request model for getting messages"""
    user: str
    conversation_id: str = ""
    limit: int = 20
    first_id: Optional[str] = None
    agent_mode: Optional[int] = 0  # 提示词类型: 0-普通提示词, 1-OAG提示词


class GetConversationsRequest(BaseModel):
    """Request model for getting conversations"""
    user: str
    last_id: Optional[str] = None
    limit: int = 20
    pinned: Optional[bool] = None
    agent_mode: Optional[int] = 0  # 提示词类型: 0-普通提示词, 1-OAG提示词


@router.post("/agent/messages")
async def get_messages(
    request: GetMessagesRequest = Body(...)
) -> ApiResponse:
    """
    Get message history for a user and optionally a specific conversation.
    
    Args:
        request: Request body containing user, conversation_id, limit, and first_id
    
    Returns:
        ApiResponse containing message history
    """
    import httpx
    
    logger.info(f"get_messages request from user: {request.user}, conversation_id: {request.conversation_id}")
    
    try:
        # Read Dify configuration - select agent based on agent_mode
        # agent_mode: 0-普通提示词(dev agent), 1-OAG提示词(oag agent)
        if request.agent_mode == 0:
            agent_mode = DifyAgentMode.COMMON
        elif request.agent_mode == 1:
            agent_mode = DifyAgentMode.OAG
        else:
            logger.error(f"Invalid agent mode: {request.agent_mode}")
            return ApiResponse(status="failed", message="Invalid agent mode, must be 0 or 1", code="500")
        
        dify_config = get_dify_config_sync(agent_mode.value)
        if not dify_config:
            return ApiResponse(status="failed", message="Dify configuration not found in settings", code="500")
        
        base_url = dify_config.get("base_url")
        api_key = dify_config.get("api_key")
        
        # Construct Dify API URL
        dify_url = f"{base_url.rstrip('/')}/v1/messages"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
        }
        
        # Prepare query parameters
        params = {
            "user": request.user,
            "limit": request.limit,
        }
        
        if request.conversation_id:
            params["conversation_id"] = request.conversation_id
        
        if request.first_id:
            params["first_id"] = request.first_id
        
        # Make GET request to Dify
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.get(dify_url, headers=headers, params=params)
            response.raise_for_status()
            result = response.json()
            
            # Process agent_thoughts to add running_label and running_type
            messages = result.get('data', [])
            for message in messages:
                agent_thoughts = message.get('agent_thoughts', [])
                for thought in agent_thoughts:
                    # Parse tool and tool_input to get running_label and running_type
                    tool = thought.get('tool', '')
                    tool_input = thought.get('tool_input', '')
                    
                    if tool and tool_input:
                        from utils.ontology_helpers import parse_mcp_tool_input, get_running_label
                        
                        # Parse MCP tool input to extract running type and details
                        mcp_details = parse_mcp_tool_input(tool, tool_input)
                        running_type = mcp_details.get("running_type")
                        running_detail = mcp_details.get("running_detail", {})
                        
                        # Generate running_label
                        running_label = get_running_label(running_type, running_detail)
                        
                        # Add running_label and running_type to the thought
                        thought['running_label'] = running_label
                        thought['running_type'] = running_type
                    else:
                        # No tool or tool_input, set default values
                        thought['running_label'] = ""
                        thought['running_type'] = ""
            
            logger.info(f"Successfully retrieved {len(messages)} messages")
            return ApiResponse(status="success", data=result, code="200")
                
    except httpx.HTTPError as he:
        logger.error(f"Dify API request failed: {he}")
        return ApiResponse(status="failed", message=f"Dify API request failed: {str(he)}", code="500")
    except Exception as e:
        logger.error(f"get_messages failed: {e}")
        return ApiResponse(status="failed", message=f"Error retrieving messages: {str(e)}", code="500")


@router.post("/agent/conversations")
async def get_conversations(
    request: GetConversationsRequest = Body(...)
) -> ApiResponse:
    """
    Get conversation list for a user.
    
    Args:
        request: Request body containing user, last_id, limit, and pinned
    
    Returns:
        ApiResponse containing conversation list
    """
    import httpx
    
    logger.info(f"get_conversations request from user: {request.user}, last_id: {request.last_id}, limit: {request.limit}")
    
    try:
        # Read Dify configuration - select agent based on agent_mode
        # agent_mode: 0-普通提示词(common), 1-OAG提示词(oag)
        if request.agent_mode == 0:
            agent_mode = DifyAgentMode.COMMON
        elif request.agent_mode == 1:
            agent_mode = DifyAgentMode.OAG
        else:
            logger.error(f"Invalid agent mode: {request.agent_mode}")
            return ApiResponse(status="failed", message="Invalid agent mode, must be 0 or 1", code="500")

        dify_config = get_dify_config_sync(agent_mode.value)
        if not dify_config:
            logger.error("Dify configuration not found in settings")
            return ApiResponse(status="failed", message="Dify configuration not found in settings", code="500")
        
        base_url = dify_config.get("base_url")
        api_key = dify_config.get("api_key")
        
        # Construct Dify API URL
        dify_url = f"{base_url.rstrip('/')}/v1/conversations"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
        }
        
        # Prepare query parameters
        params = {
            "user": request.user,
            "limit": request.limit,
        }
        
        if request.last_id:
            params["last_id"] = request.last_id
        
        if request.pinned is not None:
            params["pinned"] = str(request.pinned).lower()
        
        # Make GET request to Dify
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.get(dify_url, headers=headers, params=params)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Successfully retrieved {len(result.get('data', []))} conversations")
            return ApiResponse(status="success", data=result, code="200")
                
    except httpx.HTTPError as he:
        logger.error(f"Dify API request failed: {he}")
        return ApiResponse(status="failed", message=f"Dify API request failed: {str(he)}", code="500")
    except Exception as e:
        logger.error(f"get_conversations failed: {e}")
        return ApiResponse(status="failed", message=f"Error retrieving conversations: {str(e)}", code="500")


class StopChatRequest(BaseModel):
    """Request model for stopping a chat message task"""
    user: str
    agent_mode: Optional[int] = 0  # 提示词类型: 0-普通提示词, 1-OAG提示词


@router.post("/agent/chat/{task_id}/stop")
async def stop_chat(
    task_id: str,
    request: StopChatRequest = Body(...)
) -> ApiResponse:
    """
    Stop a running chat message task.
    
    Args:
        task_id: Task ID from streaming response chunk
        request: Request body containing user identifier
    
    Returns:
        ApiResponse containing result status
    """
    import httpx
    
    logger.info(f"stop_chat request for task_id: {task_id}, user: {request.user}")
    
    try:
        # Read Dify configuration - select agent based on agent_mode
        # agent_mode: 0-普通提示词(dev agent), 1-OAG提示词(oag agent)
        if request.agent_mode == 0:
            agent_mode = DifyAgentMode.COMMON
        elif request.agent_mode == 1:
            agent_mode = DifyAgentMode.OAG
        else:
            logger.error(f"Invalid agent mode: {request.agent_mode}")
            return ApiResponse(status="failed", message="Invalid agent mode, must be 0 or 1", code="500")
        
        dify_config = get_dify_config_sync(agent_mode.value)
        if not dify_config:
            return ApiResponse(status="failed", message="Dify configuration not found in settings", code="500")
        
        base_url = dify_config.get("base_url")
        api_key = dify_config.get("api_key")
        
        # Construct Dify API URL
        dify_url = f"{base_url.rstrip('/')}/v1/chat-messages/{task_id}/stop"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare request body
        request_body = {
            "user": request.user
        }
        
        # Make POST request to Dify
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.post(dify_url, headers=headers, json=request_body)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Successfully stopped task {task_id}, result: {result}")
            return ApiResponse(status="success", data=result, code="200")
                
    except httpx.HTTPError as he:
        logger.error(f"Dify API request failed: {he}")
        return ApiResponse(status="failed", message=f"Dify API request failed: {str(he)}", code="500")
    except Exception as e:
        logger.error(f"stop_chat failed: {e}")
        return ApiResponse(status="failed", message=f"Error stopping chat: {str(e)}", code="500")


class DeleteConversationRequest(BaseModel):
    """Request model for deleting a conversation"""
    conversation_id: str
    user: str
    agent_mode: Optional[int] = 0  # 提示词类型: 0-普通提示词, 1-OAG提示词


@router.post("/agent/conversations/delete")
async def delete_conversation(
    request: DeleteConversationRequest = Body(...)
) -> ApiResponse:
    """
    Delete a conversation.
    
    Args:
        request: Request body containing conversation_id and user identifier
    
    Returns:
        ApiResponse containing result status
    """
    import httpx
    
    logger.info(f"delete_conversation request for conversation_id: {request.conversation_id}, user: {request.user}")
    
    try:
        # Read Dify configuration - select agent based on agent_mode
        # agent_mode: 0-普通提示词(dev agent), 1-OAG提示词(oag agent)
        if request.agent_mode == 0:
            agent_mode = DifyAgentMode.COMMON
        elif request.agent_mode == 1:
            agent_mode = DifyAgentMode.OAG
        else:
            logger.error(f"Invalid agent mode: {request.agent_mode}")
            return ApiResponse(status="failed", message="Invalid agent mode, must be 0 or 1", code="500")
        
        dify_config = get_dify_config_sync(agent_mode.value)
        if not dify_config:
            return ApiResponse(status="failed", message="Dify configuration not found in settings", code="500")
        
        base_url = dify_config.get("base_url")
        api_key = dify_config.get("api_key")
        
        # Construct Dify API URL
        dify_url = f"{base_url.rstrip('/')}/v1/conversations/{request.conversation_id}"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare request body
        import json
        request_body = {
            "user": request.user
        }
        
        # Make DELETE request to Dify
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.request("DELETE", dify_url, headers=headers, json=request_body)
            response.raise_for_status()
            result = response.text
            
            logger.info(f"Successfully deleted conversation {request.conversation_id}, result: {result}")
            return ApiResponse(status="success", data=result, code="200")
                
    except httpx.HTTPError as he:
        logger.error(f"Dify API request failed: {he}")
        return ApiResponse(status="failed", message=f"Dify API request failed: {str(he)}", code="500")
    except Exception as e:
        logger.error(f"delete_conversation failed: {e}")
        return ApiResponse(status="failed", message=f"Error deleting conversation: {str(e)}", code="500")

class BatchTestSubmitRequest(BaseModel):
    """Request model for submitting batch test"""
    task_ids: List[str]  # List of task IDs from ontology_dify_task table


class BatchTestStopRequest(BaseModel):
    """Request model for stopping batch test tasks"""
    task_ids: List[str]  # List of task IDs (business IDs) from ontology_dify_task table


@router.post("/agent/batch_test/submit")
async def submit_batch_test(request: BatchTestSubmitRequest) -> ApiResponse:
    """
    Submit a batch test request.
    
    This endpoint accepts a list of task IDs and submits them to a Redis-based queue
    for asynchronous execution. The queue processes test cases with FIFO order
    and limits concurrent execution to 5 test cases.
    
    All required information (exec_user, workspace_id, ontology_name, system_prompt)
    is queried from the database tables rather than passed via API parameters.
    
    The execution flow:
    1. Query task details from ontology_dify_task table
    2. Query use case details from ontology_use_case table  
    3. Update task status to queued (0)
    4. Push tasks to Redis queue
    5. Background worker processes queue with concurrency control
    6. Each task calls Dify API in streaming mode
    7. Graph data is collected and saved to ontology_dify_graph
    8. Final answer is saved to ontology_dify_task.last_exec_result
    """
    try:
        logger.info(f"[BatchTest] Received batch test submit request with task_ids: {request.task_ids}, count: {len(request.task_ids)}")
        from core.batch_test_service import get_batch_test_service
        
        service = get_batch_test_service()
        result = await service.submit_batch_test(task_ids=request.task_ids)
        
        if result.get("status") == "failed":
            return ApiResponse(status="failed", message=result.get("message"), code="500")
        
        return ApiResponse(status="success", data=result, code="200")
        
    except Exception as e:
        logger.error(f"submit_batch_test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return ApiResponse(status="failed", message=f"Failed to submit batch test: {str(e)}", code="500")


@router.post("/agent/batch_test/stop")
async def stop_batch_test(request: BatchTestStopRequest) -> ApiResponse:
    """
    Stop running or queued batch test tasks.
    
    This endpoint allows stopping test tasks that are either:
    1. Currently running - will call Dify stop API and remove from running set
    2. Queued and waiting - will remove from queue
    3. Already completed - will skip (no action needed)
    
    The endpoint accepts only task IDs (business IDs) and will:
    - Query database to get exec_user and dify_task_id for each task
    - Skip tasks that are already completed or in error state
    - Handle tasks where dify_task_id is still NULL (not yet assigned)
    
    Args:
        request: Request containing list of task_ids (business IDs from ontology_dify_task table)
    
    Returns:
        ApiResponse containing stop results for each task
    """
    try:
        from core.batch_test_service import get_batch_test_service
        
        service = get_batch_test_service()
        result = await service.stop_tasks(task_ids=request.task_ids)
        
        if result.get("status") == "failed":
            return ApiResponse(status="failed", message=result.get("message"), code="500")
        
        return ApiResponse(status="success", data=result, code="200")
        
    except Exception as e:
        logger.error(f"stop_batch_test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return ApiResponse(status="failed", message=f"Failed to stop batch test: {str(e)}", code="500")

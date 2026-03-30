from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Union, Dict, Any, Optional
import os
from core.runtime.loader import refresh_objects, refresh, refresh_actions
from apis.models import ApiResponse
import shutil
from public.public_variable import logger
from public.public_function import get_config
import requests
import zipfile
from io import BytesIO
import tempfile
import json
import asyncio



# -----------------------------
# Data Models
# -----------------------------
class FieldModel(BaseModel):
    """Field definition model for ontology fields"""
    name: str
    # type: str
    primary_key: bool = False
    property: str | None = None   # ✅ 支持 property

class OntologyModel(BaseModel):
    """Ontology definition model"""
    ontology_name :str
    name: str
    table_name: Optional[str] = None
    doc: Optional[str] = ""
    fields: Optional[List[FieldModel]] = None
    status: int = 0   # 1=生成，0=删除
    pre_sql: Optional[str] = None

class GenerateRequest(BaseModel):
    """Main request model for generating ontology classes"""
    ontology_json: List[OntologyModel]


class DeleteOntologyModel(BaseModel):
    """Minimal model for delete API items"""
    ontology_name: Optional[str] = None
    name: str


class DeleteRequest(BaseModel):
    """Request model for object delete API"""
    ontology_json: List[DeleteOntologyModel]


class FunParamSpec(BaseModel):
    """Parameter spec for function/action generation (new schema)"""
    type: Optional[str] = None
    is_required: Optional[bool] = None
    desc: Optional[str] = ""

    class Config:
        extra = "allow"


class GenerateFunctionRequest(BaseModel):
    """Request model for generating ontology function files"""
    ontology_name: Optional[str] = None
    used_objects: Optional[List[str]] = None
    function_name: str
    fun_params: Optional[Dict[str, Union[str, FunParamSpec]]] = None
    outputs: Optional[Dict[str, str]] = None
    fun_desc: Optional[str] = None
    file_name: Optional[str] = None
    function_label: str
    code: Optional[str] = None

class FunctionDeleteRequest(BaseModel):
    """Request model for deleting specific functions from ontology function files"""
    ontology_name: Optional[str] = None
    file_name: str
    function_name: str

# -----------------------------
# Code Generation Functions
# -----------------------------
def generate_class_code(ontology: Dict[str, Any]) -> str:
    """Generate single Python class code"""
    class_name = ontology["name"]
    table_name = ontology["table_name"]
    doc_string = ontology["doc"]
    fields = ontology["fields"]
    pre_sql = ontology.get("pre_sql")

    field_map = {}
    primary_key_attr = None
    if fields:
        for field in fields:
            field_name = field["name"]
            field_property = field.get("property", field_name)  # ✅ property 为 key
            if field.get("primary_key", False):
                primary_key_attr = field_property
            field_map[field_property] = field_name   # ✅ property -> name

    # Header and __init__
    code = f'''class {class_name}(OntologyObject):
    """{doc_string}"""

    def __init__(self) -> None:
'''

    # If table_name is None, emit None assignments for runtime to handle gracefully
    if table_name is None or table_name == "":
        code += (
            "        self._table_name = None\n"
            "        self._field_map = None\n"
            "        self._primary_key_attr = None\n"
            "        self._pre_sql = None\n"
        )
        return code

    # Otherwise, emit mapped fields and primary key as usual
    code += f'        self._table_name = "{table_name}"\n'
    code += '        self._field_map = {\n'
    for prop_name, mapped_name in field_map.items():
        code += f'            "{prop_name}": "{mapped_name}",\n'
    code += '        }\n'
    
    # Handle primary_key_attr - if None, output None without quotes
    if primary_key_attr is None:
        code += '        self._primary_key_attr = None\n'
    else:
        code += f'        self._primary_key_attr = "{primary_key_attr}"\n'
    
    # Add pre_sql field
    if pre_sql:
        # Use triple quotes to handle multi-line SQL
        code += f'        self._pre_sql = """{pre_sql}"""\n'
    else:
        code += '        self._pre_sql = None\n'
    
    return code

# class SyncRequest(BaseModel):
#     folder_name:str
class SyncRequest(BaseModel):
    folder_name: Union[str, List[str]]  # 支持字符串或字符串列表

# --------------------
# 配置
# --------------------
ROLE = os.getenv("ROLE", "dev")  # dev / pro

# 动态获取服务器配置的辅助函数
async def get_user_server_url() -> str:
    """
    通过 get_config 动态获取用户服务器地址
    
    Returns:
        str: 完整的服务器 URL，例如: http://localhost:9080/sandbox_pro
    """
    try:
        # 网关地址从环境变量获取（因为 get_config 本身依赖网关地址）
        netgate = os.getenv('NET_GATE', 'http://localhost:9080')
        netgate = netgate.rstrip("/")  # 去除末尾的 /
        
        # 获取路由配置
        route_config_str = await get_config("ontology_route_url_python")
        route_config = json.loads(route_config_str)
        
        # 选择 sandbox_pro 路由
        route = route_config.get("sandbox_pro", "sandbox_pro")
        
        # 构建完整 URL
        server_url = f"{netgate}/{route}"
        logger.info(f"动态获取服务器地址: {server_url}")
        return server_url
        
    except Exception as e:
        # 如果配置获取失败，抛出异常
        logger.error(f"无法获取动态配置: {e}")
        raise e

# 兼容旧代码：保留 USER_SERVER 环境变量作为备用
USER_SERVER = os.getenv("USER_SERVER", "http://localhost:8000")  # 默认备用地址

# 项目目录结构，目标目录同步
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # 父目录
CORE_ONTOLOGY_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # __file__ 指向 apis/.py
    "core", 
    "ontology",
    "objects"
)
router = APIRouter()

# --------------------
# 工具函数
# --------------------
def collect_files_recursively(base_path: str) -> dict:
    """
    递归遍历目录，读取所有文件内容，返回嵌套字典
    """
    result = {}
    if not os.path.exists(base_path):
        logger.warning(f"{base_path} 不存在")
        return result

    for entry in os.listdir(base_path):
        entry_path = os.path.join(base_path, entry)
        # 跳过缓存目录与二进制缓存文件
        if os.path.isdir(entry_path):
            if entry == "__pycache__":
                continue
            result[entry] = collect_files_recursively(entry_path)
        elif os.path.isfile(entry_path):
            if entry.endswith(".pyc"):
                continue
            try:
                with open(entry_path, "r", encoding="utf-8") as f:
                    content = f.read()
                result[entry] = content
            except UnicodeDecodeError as e:
                # 非UTF-8/二进制文件，忽略
                logger.warning(f"跳过非UTF-8文件 {entry_path}: {str(e)}")
            except Exception as e:
                logger.error(f"读取文件 {entry_path} 失败: {str(e)}")
    return result


def write_files_recursively(base_path: str, data: dict):
    """
    根据 JSON 数据递归写入文件和目录
    """
    for name, content in data.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            write_files_recursively(path, content)
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)






# --------------------
# 接口：开发环境(dev)同步文件
# --------------------
@router.post("/object/sync_to_user")
async def sync_to_user_api(req: SyncRequest):
    """
    开发环境(dev)：将 core/ontology 下指定文件夹内容发送到生产环境(pro)
    支持单个文件夹或批量同步多个文件夹
    生产环境(pro)：不发送，只接收
    """
    try:
        # 支持字符串或列表类型的 folder_name
        if isinstance(req.folder_name, str):
            folder_names = [req.folder_name]
        elif isinstance(req.folder_name, list):
            folder_names = req.folder_name
        else:
            return ApiResponse(status="failed", message="folder_name must be string or list of strings", code="500")

        # 验证文件夹列表不能为空
        if not folder_names:
            return ApiResponse(status="failed", message="folder_name list cannot be empty", code="500")

        # 验证每个文件夹名都是字符串
        for folder_name in folder_names:
            if not isinstance(folder_name, str):
                return ApiResponse(status="failed", message="All folder names must be strings", code="500")

        if ROLE == "dev":
            # 动态获取服务器地址
            user_server = await get_user_server_url()
            
            sync_results = {}
            
            for folder_name in folder_names:
                target_dir = os.path.join(BASE_DIR, "core", "ontology", folder_name)
                if not os.path.exists(target_dir):
                    sync_results[folder_name] = {"status": "error", "message": f"Folder {folder_name} does not exist"}
                    continue

                # 收集指定目录文件
                ontology_data = collect_files_recursively(target_dir)
                if not ontology_data:
                    sync_results[folder_name] = {"status": "warning", "message": f"No files found in {folder_name}"}
                    continue

                # 发送到生产环境 - 使用动态获取的服务器地址
                target_url = f"{user_server}/api/v1/ontology/object/receive"
                logger.info(f"[Dev] 开始同步 {folder_name} 到生成环境 {target_url} ...")
                
                try:
                    resp = requests.post(
                        target_url,
                        json={"folder_name": folder_name, "ontology_data": ontology_data},
                        timeout=60,
                        headers={"X-ROLE": "dev"}
                    )

                    logger.info(f"[Dev] 同步 {folder_name} 完成, HTTP 状态码: {resp.status_code}")
                    sync_results[folder_name] = {
                        "status": "success" if resp.ok else "failed",
                        "http_status": resp.status_code,
                        "files_count": len(ontology_data),
                        "response_text": resp.text[:500]  # 限制响应文本长度
                    }
                    
                except requests.exceptions.RequestException as e:
                    logger.error(f"[Dev] 同步 {folder_name} 请求失败: {str(e)}")
                    sync_results[folder_name] = {
                        "status": "error", 
                        "message": f"Request failed: {str(e)}"
                    }

            # 汇总结果
            total_folders = len(folder_names)
            successful = sum(1 for result in sync_results.values() if result.get("status") == "success")
            failed = total_folders - successful

            return {
                "status": "completed",
                "summary": {
                    "total_folders": total_folders,
                    "successful": successful,
                    "failed": failed
                },
                "details": sync_results,
                "code": "200"
            }

        elif ROLE == "pro":
            return {
                "status": "info", 
                "message": "Pro role does not send files",
                "requested_folders": folder_names,
                "code": "200"
            }

        else:
            return ApiResponse(status="failed", message=f"Unknown ROLE={ROLE}", code="500")

    except Exception as e:
        logger.exception("同步过程出错")
        return ApiResponse(status="failed", message=str(e), code="500")
# --------------------
# 接口：生产环境(pro)接收文件
# --------------------
@router.post("/object/receive")
async def receive_ontology(request: Request):
    logger.info("==== [Receive] 请求进入 /object/receive ====")

    # 1. 校验调用方身份
    caller_role = request.headers.get("X-ROLE")
    logger.info(f"[Receive] 请求头 X-ROLE = {caller_role}")
    if caller_role != "dev":
        logger.warning("[Receive] 非 dev 调用，拒绝")
        return ApiResponse(status="failed", message="Only dev environment can push files", code="500")

    # 2. 获取请求体
    try:
        payload = await request.json()
        logger.info(f"[Receive] 请求体 payload keys = {list(payload.keys())}")
    except Exception as e:
        logger.error(f"[Receive] 解析 JSON 出错: {e}")
        return ApiResponse(status="failed", message="Invalid JSON body", code="500")

    # 3. 处理批量接收逻辑
    if isinstance(payload, list):
        # 批量接收模式
        logger.info(f"[Receive] 批量接收模式，共 {len(payload)} 个文件夹")
        return await handle_batch_receive(payload)
    else:
        # 单个接收模式（保持原有逻辑）
        logger.info("[Receive] 单个接收模式")
        return await handle_single_receive(payload)


async def handle_single_receive(payload: Dict[str, Any]):
    """处理单个文件夹接收"""
    # 提取参数
    folder_name = payload.get("folder_name")
    ontology_data = payload.get("ontology_data", {})

    logger.info(f"[Receive] folder_name = {folder_name}")
    logger.info(f"[Receive] ontology_data keys = {list(ontology_data.keys()) if isinstance(ontology_data, dict) else type(ontology_data)}")

    # 校验参数
    if not folder_name:
        logger.error("[Receive] 缺少 folder_name 参数")
        return ApiResponse(status="failed", message="Missing folder_name", code="500")
    if not ontology_data:
        logger.warning(f"[Receive] folder_name={folder_name} 的数据为空")
        return ApiResponse(status="warning", message="No data received", code="500")

    # 目标目录
    target_dir = os.path.join(BASE_DIR, "core", "ontology", folder_name)
    logger.info(f"[Receive] 写入目标目录 = {target_dir}")

    # 清空目标目录后再执行写入（以开发态为准进行全量覆盖）
    try:
        if os.path.exists(target_dir):
            for entry in os.listdir(target_dir):
                entry_path = os.path.join(target_dir, entry)
                try:
                    if os.path.isdir(entry_path) and not os.path.islink(entry_path):
                        shutil.rmtree(entry_path)
                    else:
                        os.unlink(entry_path)
                except Exception as e:
                    logger.warning(f"[Receive] 删除目录项失败: {entry_path}, 错误: {e}")
        else:
            os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        logger.exception(f"[Receive] 清空目标目录失败: {e}")
        return ApiResponse(status="failed", message=f"Failed to clean target directory: {str(e)}", code="500")

    # 执行写入
    try:
        write_files_recursively(target_dir, ontology_data)
        logger.info(f"[Receive] 写入完成 folder_name={folder_name}")
    except Exception as e:
        logger.exception(f"[Receive] 写文件失败: {e}")
        return ApiResponse(status="failed", message=f"Failed to write files: {str(e)}", code="500")

    # 触发刷新逻辑
    await trigger_refresh(folder_name, ontology_data, full_replace=True)

    logger.info("==== [Receive] 单个接收处理完成 ====")
    return ApiResponse(status="success", message=f"Files updated in {folder_name}", code="200")


async def handle_batch_receive(payload_list: List[Dict[str, Any]]):
    """处理批量文件夹接收"""
    results = {}
    
    for i, payload in enumerate(payload_list):
        folder_name = payload.get("folder_name", f"unknown_{i}")
        logger.info(f"[Receive] 处理第 {i+1} 个文件夹: {folder_name}")
        
        try:
            result = await handle_single_receive(payload)
            results[folder_name] = result
        except Exception as e:
            logger.error(f"[Receive] 处理文件夹 {folder_name} 时出错: {e}")
            results[folder_name] = {
                "status": "error", 
                "message": f"Processing failed: {str(e)}"
            }

    # 汇总结果
    total_folders = len(payload_list)
    successful = sum(1 for result in results.values() if result.get("status") == "success")
    failed = total_folders - successful

    logger.info(f"==== [Receive] 批量接收完成: 成功 {successful}/{total_folders} ====")
    
    return {
        "status": "batch_completed",
        "summary": {
            "total_folders": total_folders,
            "successful": successful,
            "failed": failed
        },
        "details": results,
        "code": "200"
    }


async def trigger_refresh(folder_name: str, ontology_data: Dict[str, Any], full_replace: bool = False) -> None:
    """触发刷新逻辑"""
    try:
        changed_objects = isinstance(ontology_data, dict) and ("objects" in ontology_data)
        changed_functions = isinstance(ontology_data, dict) and ("logics" in ontology_data)
        changed_actions = isinstance(ontology_data, dict) and ("actions" in ontology_data)

        if full_replace or changed_objects:
            try:
                refresh_objects(folder_name)
                logger.info(f"[Receive] 已刷新对象: {folder_name}")
            except Exception as e:
                logger.error(f"[Receive] 刷新对象失败: {e}")

        # 对象或动作有变更，或全量覆盖时，刷新 actions（以保证绑定和注册更新）
        if full_replace or changed_objects or changed_actions:
            try:
                actions_dir = os.path.join(
                    BASE_DIR, "core", "ontology", folder_name, "actions"
                )
                refresh_actions(folder_name, actions_dir)
                logger.info(f"[Receive] 已刷新动作: {folder_name}")
            except Exception as e:
                logger.error(f"[Receive] 刷新动作失败: {e}")

        # 逻辑有变更，或全量覆盖时，刷新 logics
        if full_replace or changed_functions:
            try:
                functions_dir = os.path.join(
                    BASE_DIR, "core", "ontology", folder_name, "logics"
                )
                refresh(folder_name, functions_dir)
                logger.info(f"[Receive] 已刷新函数: {folder_name}")
            except Exception as e:
                logger.error(f"[Receive] 刷新函数失败: {e}")
    except Exception as e:
        logger.error(f"[Receive] 触发刷新时出错: {e}")


@router.post("/object/exchange")
async def object_exchange_api(payload: GenerateRequest) -> Dict[str, Any]:


    """
    - status == 1: 生成/覆盖类文件
    - status == 0: 删除已有类文件（优先级高于生成）
    - 不同 ontology_name 的类文件会归类到不同文件夹
    """
    logger.info(f"object_exchange_api 请求进入: {payload}")
    try:
        

        ontology_json_list = [o.dict() for o in payload.ontology_json]
        results = []

        # 先分组：生成 & 删除
        to_generate = [o for o in ontology_json_list if o.get("status") == 1]
        to_delete = [o for o in ontology_json_list if o.get("status") == 0]

        # ✅ 先处理生成
        touched_ontologies: set[str] = set()
        for ontology in to_generate:
            class_name = ontology["name"]
            ontology_name = ontology.get("ontology_name", "default")

            # 每个 ontology_name 单独一个子文件夹
            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name
            )
            os.makedirs(output_dir, exist_ok=True)

            function_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "logics"
            )
            os.makedirs(function_dir, exist_ok=True)

            # Ensure setup.py exists in the functions directory
            setup_py_path = os.path.join(function_dir, "setup.py")
            if not os.path.exists(setup_py_path):
                # Prefer copying from template file if available
                template_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology", "test_ontology", "logics", "setup.py"
                )
                setup_content = None
                try:
                    if os.path.exists(template_path):
                        with open(template_path, "r", encoding="utf-8") as tf:
                            setup_content = tf.read()
                except Exception:
                    setup_content = None
                if not setup_content:
                    # Fallback to built-in template if template file not found
                    setup_content = (
                        '"""\n'
                        '路径设置模块 - 用于在functions目录作为工作空间时正确设置Python路径\n'
                        '在任何其他导入之前导入此模块\n'
                        '"""\n'
                        '\n'
                        'import sys\n'
                        'import os\n'
                        '\n'
                        '# 获取项目根目录（从当前文件向上3级）\n'
                        'current_dir = os.path.dirname(os.path.abspath(__file__))\n'
                        "project_root = os.path.abspath(os.path.join(current_dir, '../../../..'))\n"
                        '\n'
                        '# 将项目根目录添加到Python路径的开头\n'
                        'if project_root not in sys.path:\n'
                        '    sys.path.insert(0, project_root)\n'
                        '\n'
                    )

                with open(setup_py_path, "w", encoding="utf-8") as sf:
                    sf.write(setup_content)
            output_filename = os.path.join(output_dir, f"{class_name}.py")
            class_code = generate_class_code(ontology)
            file_exists = os.path.exists(output_filename)

            with open(output_filename, "w", encoding="utf-8") as f:
                f.write("# Auto-generated Ontology class\n")
                f.write("# -*- coding: utf-8 -*-\n\n")
                f.write("from core.runtime.base import OntologyObject\n\n")
                f.write(class_code)

            message = (
                f"Class code updated (overwritten) at {output_filename}"
                if file_exists else
                f"Class code saved to {output_filename}"
            )

            results.append({
                "action": "generated",
                "ontology_name": ontology_name,
                "class_name": class_name,
                "filename": output_filename,
                "message": message,
                "class_code": class_code
            })
            touched_ontologies.add(ontology_name)

        # ✅ 再处理删除
        for ontology in to_delete:
            class_name = ontology["name"]
            ontology_name = ontology.get("ontology_name", "default")

            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "objects", 
            )
            output_filename = os.path.join(output_dir, f"{class_name}.py")

            if os.path.exists(output_filename):
                os.remove(output_filename)
                results.append({
                    "action": "deleted",
                    "ontology_name": ontology_name,
                    "class_name": class_name,
                    "filename": output_filename,
                    "message": f"File {output_filename} deleted"
                })
                touched_ontologies.add(ontology_name)
            else:
                results.append({
                    "action": "delete_skipped",
                    "ontology_name": ontology_name,
                    "class_name": class_name,
                    "filename": output_filename,
                    "message": f"No file found for {class_name}, nothing to delete"
                })

        # ✅ 对所有受影响的 ontology 执行一次对象刷新（清缓存并重建别名）
        for oid in touched_ontologies:
            try:
                refresh_objects(oid)
            except Exception:
                # 避免生成流程失败；将错误附加到结果中
                results.append({
                    "action": "refresh_objects_failed",
                    "ontology_name": oid,
                    "message": "refresh_objects raised an exception"
                })

        return {"status": "success", "results": results}

    except Exception as e:
        return {"status": "error", "message": f"Operation failed: {str(e)}"}
    
@router.post("/object/update")
async def object_update_api(payload: GenerateRequest):
    """
    更新类文件（无论 status 值是多少，都会执行生成/覆盖）
    """
    logger.info(f"object_update_api 请求进入: {payload}")
    try:
       
        ontology_json_list = [o.dict() for o in payload.ontology_json]
        results = []

        touched_ontologies: set[str] = set()

        for ontology in ontology_json_list:
            class_name = ontology["name"]
            ontology_name = ontology.get("ontology_name", "default")

            # 统一处理 doc 字段：当为 None 时转为空字符串，便于后续使用
            if ontology.get("doc") is None:
                ontology["doc"] = ""

            # 每个 ontology_name 单独一个子文件夹
            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "objects"
            )
            os.makedirs(output_dir, exist_ok=True)

            output_filename = os.path.join(output_dir, f"{class_name}.py")
            class_code = generate_class_code(ontology)
            file_exists = os.path.exists(output_filename)

            with open(output_filename, "w", encoding="utf-8") as f:
                f.write("# Auto-generated Ontology class\n")
                f.write("# -*- coding: utf-8 -*-\n\n")
                f.write("from core.runtime.base import OntologyObject\n\n")
                f.write(class_code)

            message = (
                f"Class code updated (overwritten) at {output_filename}"
                if file_exists else
                f"Class code saved to {output_filename}"
            )

            results.append({
                "action": "generated",
                "ontology_name": ontology_name,
                "class_name": class_name,
                "filename": output_filename,
                "message": message,
                "class_code": class_code
            })
            touched_ontologies.add(ontology_name)

        # 变更对象后刷新：对象 -> 行为/函数（保证绑定与注册不失效）
        for oid in touched_ontologies:
            try:
                refresh_objects(oid)
            except Exception:
                pass
            # 刷新 actions（重建注册并重新绑定到对象类）
            try:
                actions_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology", oid, "actions"
                )
                refresh_actions(oid, actions_dir)
            except Exception:
                pass
            # 刷新 functions（重建注册，确保依赖对象别名可用）
            try:
                functions_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology", oid, "logics"
                )
                refresh(oid, functions_dir)
            except Exception:
                pass

        return ApiResponse(status="success", data=results, code="200")

    except Exception as e:
        logger.error(f"object_update_api 请求失败: {e}")
        return ApiResponse(status="failed", message=f"Operation failed: {str(e)}", code="500")


@router.post("/object/delete")
async def object_delete_api(payload: DeleteRequest):
    """
    删除类文件（仅当文件存在时才会删除）
    """
    try:
        ontology_json_list = [o.dict() for o in payload.ontology_json]
        results = []

        touched_ontologies: set[str] = set()

        for ontology in ontology_json_list:
            class_name = ontology["name"]
            ontology_name = ontology.get("ontology_name", "default")

            output_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology",  ontology_name, "objects"
            )
            output_filename = os.path.join(output_dir, f"{class_name}.py")

            if os.path.exists(output_filename):
                os.remove(output_filename)
                results.append({
                    "action": "deleted",
                    "ontology_name": ontology_name,
                    "class_name": class_name,
                    "filename": output_filename,
                    "message": f"File {output_filename} deleted"
                })
                touched_ontologies.add(ontology_name)
            else:
                results.append({
                    "action": "delete_skipped",
                    "ontology_name": ontology_name,
                    "class_name": class_name,
                    "filename": output_filename,
                    "message": f"File {output_filename} not found, nothing to delete"
                })

        # 变更对象后刷新对象模块缓存与别名
        for oid in touched_ontologies:
            try:
                refresh_objects(oid)
            except Exception:
                pass

        return ApiResponse(status="success", data=results, code="200")

    except Exception as e:
        return ApiResponse(status="failed", message=f"Delete operation failed: {str(e)}", code="500")

class DeleteRequest(BaseModel):
    ontology_name: str


@router.post("/object/delete_ontology")
async def object_delete_folder_api(payload: DeleteRequest) -> Dict[str, Any]:
    """
    删除 ontology 下的文件夹（仅当文件夹存在时才会删除）
    """
    try:
        ontology_name = payload.ontology_name

        # 拼接目录路径
        target_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name
        )

        if os.path.exists(target_dir) and os.path.isdir(target_dir):
            shutil.rmtree(target_dir)  # 递归删除整个文件夹
            result = {
                "action": "deleted",
                "ontology_name": ontology_name,
                "path": target_dir,
                "message": f"Folder {target_dir} deleted"
            }
        else:
            result = {
                "action": "delete_skipped",
                "ontology_name": ontology_name,
                "path": target_dir,
                "message": f"Folder {target_dir} not found, nothing to delete"
            }

        # 尝试刷新对象与函数注册，确保缓存清理
        try:
            refresh_objects(ontology_name)
        except Exception:
            pass
        try:
            functions_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "logics"
            )
            refresh(ontology_name, functions_dir)
        except Exception:
            pass

        return {"status": "success", "result": result}

    except Exception as e:
        return {"status": "error", "message": f"Delete operation failed: {str(e)}"}


@router.get("/download/{ontology_name}")
async def download_ontology_api(ontology_name: str):
    """
    下载指定 ontology 的所有内容，包括：
    - core/ontology/{ontology_name} 目录下的所有内容
    - core/ontology_apis/{ontology_name} 目录下的所有内容（如果存在）
    
    返回一个 ZIP 文件供客户端下载
    """
    try:
        # 安全检查：防止路径遍历攻击
        if ".." in ontology_name or "/" in ontology_name or "\\" in ontology_name:
            return ApiResponse(
                status="failed",
                message="Invalid ontology_name: path traversal not allowed",
                code="400"
            )
        
        base_dir = os.path.dirname(os.path.dirname(__file__))
        
        # 两个目录路径
        ontology_dir = os.path.join(base_dir, "core", "ontology", ontology_name)
        ontology_apis_dir = os.path.join(base_dir, "core", "ontology_apis", ontology_name)
        
        # 检查至少有一个目录存在
        if not os.path.exists(ontology_dir) and not os.path.exists(ontology_apis_dir):
            return ApiResponse(
                status="failed",
                message=f"Ontology '{ontology_name}' not found",
                code="404"
            )
        
        # 创建内存中的 ZIP 文件
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 添加 core/ontology/{ontology_name} 目录内容
            if os.path.exists(ontology_dir):
                for root, dirs, files in os.walk(ontology_dir):
                    # 跳过 __pycache__ 目录
                    dirs[:] = [d for d in dirs if d != '__pycache__']
                    
                    for file in files:
                        # 跳过 .pyc 文件
                        if file.endswith('.pyc'):
                            continue
                        
                        file_path = os.path.join(root, file)
                        # 计算相对路径（相对于 ontology_name 的父目录）
                        arcname = os.path.join(
                            "ontology",
                            ontology_name,
                            os.path.relpath(file_path, ontology_dir)
                        )
                        zip_file.write(file_path, arcname)
            
            # 添加 core/ontology_apis/{ontology_name} 目录内容
            if os.path.exists(ontology_apis_dir):
                for root, dirs, files in os.walk(ontology_apis_dir):
                    # 跳过 __pycache__ 目录
                    dirs[:] = [d for d in dirs if d != '__pycache__']
                    
                    for file in files:
                        # 跳过 .pyc 文件
                        if file.endswith('.pyc'):
                            continue
                        
                        file_path = os.path.join(root, file)
                        # 计算相对路径
                        arcname = os.path.join(
                            "ontology_apis",
                            ontology_name,
                            os.path.relpath(file_path, ontology_apis_dir)
                        )
                        zip_file.write(file_path, arcname)
        
        # 将指针移到缓冲区开始位置
        zip_buffer.seek(0)
        
        # 返回 ZIP 文件流
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={ontology_name}.zip"
            }
        )
    
    except Exception as e:
        logger.exception(f"下载 ontology {ontology_name} 失败")
        return ApiResponse(
            status="failed",
            message=f"Download failed: {str(e)}",
            code="500"
        )


@router.post("/upload/{ontology_name}")
async def upload_ontology_api(
    ontology_name: str,
    file: UploadFile = File(...)
):
    """
    接收客户端上传的 ontology 压缩包，解压并导入到服务端
    
    步骤：
    1. 接收并验证 ZIP 文件
    2. 删除现有的 core/ontology/{ontology_name} 和 core/ontology_apis/{ontology_name} 目录
    3. 解压上传的文件到对应目录
    4. 刷新对象、动作、逻辑（包括 ontology 和 ontology_apis）
    
    参数：
    - ontology_name: 本体名称
    - file: 上传的 ZIP 文件
    """
    temp_dir = None
    try:
        # 安全检查：防止路径遍历攻击
        if ".." in ontology_name or "/" in ontology_name or "\\" in ontology_name:
            return ApiResponse(
                status="failed",
                message="Invalid ontology_name: path traversal not allowed",
                code="400"
            )
        
        # 验证文件类型
        if not file.filename.endswith('.zip'):
            return ApiResponse(
                status="failed",
                message="Only ZIP files are allowed",
                code="400"
            )
        
        logger.info(f"[Upload] 开始导入 ontology: {ontology_name}, 文件: {file.filename}")
        
        base_dir = os.path.dirname(os.path.dirname(__file__))
        
        # 目标目录
        ontology_dir = os.path.join(base_dir, "core", "ontology", ontology_name)
        ontology_apis_dir = os.path.join(base_dir, "core", "ontology_apis", ontology_name)
        
        # 步骤1: 创建临时目录用于解压
        temp_dir = tempfile.mkdtemp()
        temp_zip_path = os.path.join(temp_dir, file.filename)
        
        # 保存上传的文件
        logger.info(f"[Upload] 保存上传文件到临时目录: {temp_zip_path}")
        with open(temp_zip_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 解压到临时目录
        extract_dir = os.path.join(temp_dir, "extracted")
        logger.info(f"[Upload] 解压文件到: {extract_dir}")
        try:
            with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
        except zipfile.BadZipFile:
            return ApiResponse(
                status="failed",
                message="Invalid ZIP file",
                code="400"
            )
        
        # 步骤2: 删除现有目录内容（如果存在）
        logger.info(f"[Upload] 准备清理现有目录")
        
        # 删除 core/ontology/{ontology_name}
        if os.path.exists(ontology_dir):
            logger.info(f"[Upload] 删除现有目录: {ontology_dir}")
            shutil.rmtree(ontology_dir)
        else:
            logger.info(f"[Upload] 目录不存在（新环境）: {ontology_dir}")
        
        # 删除 core/ontology_apis/{ontology_name}
        if os.path.exists(ontology_apis_dir):
            logger.info(f"[Upload] 删除现有目录: {ontology_apis_dir}")
            shutil.rmtree(ontology_apis_dir)
        else:
            logger.info(f"[Upload] 目录不存在（新环境）: {ontology_apis_dir}")
        
        # 步骤3: 将解压的内容复制到目标位置
        logger.info(f"[Upload] 开始复制文件到目标位置")
        
        # 确保父目录存在
        ontology_parent = os.path.join(base_dir, "core", "ontology")
        ontology_apis_parent = os.path.join(base_dir, "core", "ontology_apis")
        os.makedirs(ontology_parent, exist_ok=True)
        os.makedirs(ontology_apis_parent, exist_ok=True)
        logger.info(f"[Upload] 已确保父目录存在")
        
        # 查找解压后的 ontology 目录
        extracted_ontology = os.path.join(extract_dir, "ontology", ontology_name)
        if os.path.exists(extracted_ontology):
            logger.info(f"[Upload] 复制 ontology 目录: {extracted_ontology} -> {ontology_dir}")
            # 使用 copytree，目标目录不存在时会自动创建
            shutil.copytree(extracted_ontology, ontology_dir)
            logger.info(f"[Upload] ontology 目录复制完成")
        else:
            logger.warning(f"[Upload] 解压后未找到 ontology/{ontology_name} 目录")
        
        # 查找解压后的 ontology_apis 目录
        extracted_ontology_apis = os.path.join(extract_dir, "ontology_apis", ontology_name)
        if os.path.exists(extracted_ontology_apis):
            logger.info(f"[Upload] 复制 ontology_apis 目录: {extracted_ontology_apis} -> {ontology_apis_dir}")
            # 使用 copytree，目标目录不存在时会自动创建
            shutil.copytree(extracted_ontology_apis, ontology_apis_dir)
            logger.info(f"[Upload] ontology_apis 目录复制完成")
        else:
            logger.warning(f"[Upload] 解压后未找到 ontology_apis/{ontology_name} 目录")
        
        # 检查是否至少有一个目录被导入
        if not os.path.exists(ontology_dir) and not os.path.exists(ontology_apis_dir):
            return ApiResponse(
                status="failed",
                message=f"No valid ontology content found in ZIP file. Expected structure: ontology/{ontology_name}/ or ontology_apis/{ontology_name}/",
                code="500"
            )
        
        # 步骤4: 刷新对象、动作、逻辑
        logger.info(f"[Upload] 开始刷新注册信息")
        refresh_results = {
            "ontology_objects": "not_attempted",
            "ontology_actions": "not_attempted",
            "ontology_logics": "not_attempted",
            "ontology_apis_actions": "not_attempted",
            "ontology_apis_logics": "not_attempted"
        }
        
        # 刷新 core/ontology/{ontology_name} 下的内容
        if os.path.exists(ontology_dir):
            # 刷新对象
            try:
                refresh_objects(ontology_name)
                refresh_results["ontology_objects"] = "success"
                logger.info(f"[Upload] 已刷新对象: {ontology_name}")
            except Exception as e:
                refresh_results["ontology_objects"] = f"failed: {str(e)}"
                logger.error(f"[Upload] 刷新对象失败: {e}")
            
            # 刷新动作
            actions_dir = os.path.join(ontology_dir, "actions")
            if os.path.exists(actions_dir):
                try:
                    refresh_actions(ontology_name, actions_dir)
                    refresh_results["ontology_actions"] = "success"
                    logger.info(f"[Upload] 已刷新动作: {ontology_name}")
                except Exception as e:
                    refresh_results["ontology_actions"] = f"failed: {str(e)}"
                    logger.error(f"[Upload] 刷新动作失败: {e}")
            
            # 刷新逻辑
            logics_dir = os.path.join(ontology_dir, "logics")
            if os.path.exists(logics_dir):
                try:
                    refresh(ontology_name, logics_dir)
                    refresh_results["ontology_logics"] = "success"
                    logger.info(f"[Upload] 已刷新逻辑: {ontology_name}")
                except Exception as e:
                    refresh_results["ontology_logics"] = f"failed: {str(e)}"
                    logger.error(f"[Upload] 刷新逻辑失败: {e}")
        
        # 刷新 core/ontology_apis/{ontology_name} 下的内容
        if os.path.exists(ontology_apis_dir):
            # 对 ontology_apis 使用不同的命名空间来刷新
            ontology_apis_name = f"{ontology_name}_apis"
            
            # 刷新 ontology_apis 下的动作
            apis_actions_dir = os.path.join(ontology_apis_dir, "actions")
            if os.path.exists(apis_actions_dir):
                try:
                    refresh_actions(ontology_apis_name, apis_actions_dir)
                    refresh_results["ontology_apis_actions"] = "success"
                    logger.info(f"[Upload] 已刷新 ontology_apis 动作: {ontology_apis_name}")
                except Exception as e:
                    refresh_results["ontology_apis_actions"] = f"failed: {str(e)}"
                    logger.error(f"[Upload] 刷新 ontology_apis 动作失败: {e}")
            
            # 刷新 ontology_apis 下的逻辑
            apis_logics_dir = os.path.join(ontology_apis_dir, "logics")
            if os.path.exists(apis_logics_dir):
                try:
                    refresh(ontology_apis_name, apis_logics_dir)
                    refresh_results["ontology_apis_logics"] = "success"
                    logger.info(f"[Upload] 已刷新 ontology_apis 逻辑: {ontology_apis_name}")
                except Exception as e:
                    refresh_results["ontology_apis_logics"] = f"failed: {str(e)}"
                    logger.error(f"[Upload] 刷新 ontology_apis 逻辑失败: {e}")
        
        logger.info(f"[Upload] 导入完成: {ontology_name}")
        
        return ApiResponse(
            status="success",
            message=f"Ontology '{ontology_name}' imported successfully",
            data={
                "ontology_name": ontology_name,
                "ontology_dir_created": os.path.exists(ontology_dir),
                "ontology_apis_dir_created": os.path.exists(ontology_apis_dir),
                "refresh_results": refresh_results
            },
            code="200"
        )
    
    except Exception as e:
        logger.exception(f"[Upload] 导入 ontology {ontology_name} 失败")
        return ApiResponse(
            status="failed",
            message=f"Upload failed: {str(e)}",
            code="500"
        )
    
    finally:
        # 清理临时目录
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.info(f"[Upload] 已清理临时目录: {temp_dir}")
            except Exception as e:
                logger.warning(f"[Upload] 清理临时目录失败: {e}")

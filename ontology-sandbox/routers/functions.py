from __future__ import annotations

import inspect
from pathlib import Path
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
from routers.models import ApiInfoModel, GenerateFunctionRequest
from core.runtime.loader import refresh, activate_published
from core.runtime.executor import execute, FunctionNotFound, InvalidPayload
from core.runtime.registry import list_functions
import os
from apis.models import ApiResponse
from public.public_variable import logger

FUNCTIONS_DIR = "core/ontology/functions"


router = APIRouter(prefix="/functions", tags=["functions"])


class ExecReq(BaseModel):
    ontology_id: str
    function: str
    params: dict = {}

class FunParamSpec(BaseModel):
    """Parameter spec for function generation (new schema)"""
    type: Optional[str] = None
    is_required: Optional[bool] = None
    desc: Optional[str] = ""

    class Config:
        extra = "allow"

# class ApiParamModel(BaseModel):
#     """API parameter definition model"""
#     param_name: str
#     param_type: str  # string/integer/number
#     param_method: str  # path/query/body/header/cookie
#     param_desc: Optional[str] = None
#     is_required: bool = False
#     default_value: Optional[str] = None

# class ApiInfoModel(BaseModel):
#     """API information model based on ontology_api and ontology_api_param tables"""
#     api_name: str
#     api_desc: Optional[str] = None
#     api_method: str  # GET/POST/PUT/DELETE/PATCH, etc.
#     url: str
#     request_params: Optional[List[ApiParamModel]] = None
#     # response_params: Optional[List[ApiParamModel]] = None
#     timeout: Optional[int] = 30  # Timeout in seconds for API requests (default: 30)

# class GenerateFunctionRequest(BaseModel):
#     """Request model for generating ontology function files"""
#     ontology_name: Optional[str] = None
#     used_objects: Optional[List[str]] = None
#     function_name: str
#     fun_params: Optional[Dict[str, Union[str, FunParamSpec]]] = None
#     outputs: Optional[Dict[str, str]] = None
#     fun_desc: Optional[str] = None
#     file_name: Optional[str] = None
#     function_label: str
#     code: Optional[str] = None
#     function_type: Optional[str] = "function"  # 'function' or 'api'
#     api_info: Optional[ApiInfoModel] = None  # Required when function_type is 'api'

class FunctionUpdateRequest(BaseModel):
    """Request model for updating API functions"""
    ontology_name: str
    function_name: str
    function_label: str
    fun_desc: Optional[str] = None
    api_info: ApiInfoModel  # Updated API info

class ApiDefinitionUpdateRequest(BaseModel):
    """Request model for updating all functions that reference a specific API"""
    api_name: str  # The unique API name to find and update
    api_info: ApiInfoModel  # Updated API info (must have matching api_name)

class FunctionDeleteRequest(BaseModel):
    """Request model for deleting specific functions from ontology function files"""
    ontology_name: Optional[str] = None
    file_name: Optional[str] = None
    function_name: str
    function_type: Optional[str] = "function"  # 'function' or 'api'

def get_objects():
    # TODO: Inject platform objects here
    return None


def _annotation_to_str(tp) -> str:
    try:
        name = getattr(tp, "__name__", None)
        if isinstance(name, str):
            return name
        n2 = getattr(tp, "_name", None)
        if isinstance(n2, str) and n2:
            return n2
        text = str(tp)
        return text.replace("typing.", "")
    except Exception:
        return "unknown"


def _param_types_json(fn) -> dict:
    sig = inspect.signature(fn)
    mapping: dict = {}
    for p in sig.parameters.values():
        if p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue
        if p.name == "objects":
            continue
        if p.annotation is inspect._empty:
            mapping[p.name] = "unknown"
        else:
            mapping[p.name] = _annotation_to_str(p.annotation)
    return mapping


class InitReq(BaseModel):
    ontology_id: str
    strict: bool = True


@router.get("/refresh")
async def refresh_functions(ontology_id: str) -> ApiResponse:
    """
    刷新指定本体的函数注册（包括普通logics和API logics）
    """
    try:
        from pathlib import Path
        
        # 1) 刷新 core/ontology/{ontology_id}/logics（替换模式）
        functions_dir = f"core/ontology/{ontology_id}/logics"
        registered_normal = []
        
        if os.path.exists(functions_dir):
            registered_normal = refresh(ontology_id, functions_dir, merge=False)
        
        # 2) 刷新 core/ontology_apis/{ontology_id}/logics（合并模式）
        api_functions_dir = f"core/ontology_apis/{ontology_id}/logics"
        registered_api = []
        
        if Path(api_functions_dir).exists():
            registered_api = refresh(ontology_id, api_functions_dir, merge=True)
        
        # 合并结果统计
        all_registered = registered_normal + registered_api
        total_count = len(all_registered)
        
        if total_count == 0:
            return ApiResponse(
                status="failed",
                message=f"No functions directory found for ontology: {ontology_id}",
                code="200"
            )
        
        return ApiResponse(
            status="success",
            data={
                "registered": registered_normal,  # 只返回普通logics
                "count": len(registered_normal),
                "total_count": total_count,  # 总数包含API logics
                "api_logics_count": len(registered_api)
            },
            message=f"Successfully refreshed {len(registered_normal)} function(s) (total with API: {total_count})",
            code="200"
        )
        
    except SyntaxError as e:
        # 语法错误 - 用户代码存在语法问题
        error_file = getattr(e, 'filename', 'unknown file')
        error_line = getattr(e, 'lineno', 'unknown line')
        error_msg = getattr(e, 'msg', str(e))
        return ApiResponse(
            status="failed",
            message=f"Syntax error in {error_file} at line {error_line}: {error_msg}",
            code="500"
        )
        
    except ImportError as e:
        # Import 错误 - 用户代码的导入问题
        error_msg = str(e)
        # 尝试从错误消息中提取模块名
        import re
        module_match = re.search(r"No module named '([^']+)'", error_msg)
        if module_match:
            module_name = module_match.group(1)
            return ApiResponse(
                status="failed",
                message=f"Import error: Cannot import module '{module_name}'. Please check if the module is installed or the import path is correct.",
                code="500"
            )
        else:
            return ApiResponse(
                status="failed",
                message=f"Import error: {error_msg}",
                code="500"
            )
        
    except TypeError as e:
        # 类型错误 - 函数参数缺少类型注解或其他类型问题
        error_msg = str(e)
        if "missing type annotation" in error_msg:
            return ApiResponse(
                status="failed",
                message=error_msg,
                code="500"
            )
        else:
            return ApiResponse(
                status="failed",
                message=f"Type error in user function: {error_msg}",
                code="500"
            )
        
    except Exception as e:
        # 其他错误 - 尽可能提供详细信息
        import traceback
        error_trace = traceback.format_exc()
        
        # 尝试从堆栈跟踪中提取文件和行号信息
        lines = error_trace.split('\n')
        user_file_info = None
        for i, line in enumerate(lines):
            if 'File "' in line and functions_dir in line:
                # 找到用户函数文件的错误位置
                import re
                file_match = re.search(r'File "([^"]+)", line (\d+)', line)
                if file_match:
                    file_path = file_match.group(1)
                    line_num = file_match.group(2)
                    file_name = os.path.basename(file_path)
                    # 获取下一行的错误详情
                    error_detail = lines[i+1].strip() if i+1 < len(lines) else ""
                    user_file_info = f"Error in {file_name} at line {line_num}: {error_detail}"
                    break
        
        if user_file_info:
            return ApiResponse(
                status="failed",
                message=f"{user_file_info}. {type(e).__name__}: {str(e)}",
                code="500"
            )
        else:
            return ApiResponse(
                status="failed",
                message=f"Failed to refresh functions: {type(e).__name__}: {str(e)}",
                code="500"
            )
        
    except BaseException as e:
        # 捕获所有其他异常（包括系统异常）
        return ApiResponse(
            status="failed",
            message=f"Unexpected error during refresh: {type(e).__name__}: {str(e)}",
            code="500"
        )


@router.get("")
def list_registered(ontology_id: str):
    return {"functions": [
        {
            "name": f.name,
            "desc": f.description,
            "signature": _param_types_json(f.func),
            "filename": Path(f.module_path).name,
        }
        for f in list_functions(ontology_id)
    ]}

@router.get("/by-api/{ontology_name}/{api_name}")
async def list_functions_by_api(ontology_name: str, api_name: str) -> ApiResponse:
    """
    列出所有引用指定 API 的函数
    """
    try:
        # 确定目标文件路径
        target_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology_apis", ontology_name, "logics", "apis.py"
        )
        
        # 检查文件是否存在
        if not os.path.exists(target_file):
            return ApiResponse(
                status="success",
                data={"functions": []},
                message=f"No API file found for ontology: {ontology_name}",
                code="200"
            )
        
        # 读取文件内容
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # 提取函数元数据
        functions_metadata = _extract_function_metadata(content)
        
        # 过滤出引用该 API 的函数
        matching_functions = [
            {
                "function_name": f["name"],
                "function_label": f["label"],
                "api_name": f["api_name"]
            }
            for f in functions_metadata 
            if f["api_name"] == api_name
        ]
        
        return ApiResponse(
            status="success",
            data={
                "functions": matching_functions,
                "count": len(matching_functions)
            },
            message=f"Found {len(matching_functions)} function(s) referencing API '{api_name}'",
            code="200"
        )
        
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Failed to list functions by API: {str(e)}",
            code="500"
        )


@router.post("/execute")
async def execute_function(body: ExecReq, objects=Depends(get_objects)):
    try:
        return await execute(body.ontology_id, body.function, body.params, objects)
    except FunctionNotFound as e:
        return {"error": f"function not found: {e}"}
    except InvalidPayload as e:
        return {"error": f"invalid payload: {e}"}

@router.get("/list_files")
async def list_files(ontology_id: str):
    functions_dir = f"core/ontology/{ontology_id}/logics"
    return {"files": [f.name for f in Path(functions_dir).glob("*.py") if f.name != "setup.py"]}

def _sanitize_var_name(name: str) -> str:
    """
    将参数名转换为合法的Python变量名
    如果包含特殊字符，返回None表示不能作为变量名使用
    """
    import re
    # 检查是否为合法的Python标识符
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name):
        return name
    return None

def _generate_api_wrapper_code(
    function_name: str,
    api_info: ApiInfoModel,
    function_label: str,
    fun_desc: Optional[str] = None,
    timeout: int = 30
) -> str:
    """Generate Python code for API wrapper function"""
    # Prepare parameter signature
    params_sig_parts: List[str] = []
    required_params = []
    optional_params = []
    builtin_params = []  # 内置参数列表
    
    # 判断是否所有非内置参数都是合法的变量名
    has_invalid_param_names = False
    
    if api_info.request_params:
        for param in api_info.request_params:
            param_name = param.param_name
            is_builtin = getattr(param, 'is_builtin', False)
            
            # 检查非内置参数名是否合法
            if not is_builtin and _sanitize_var_name(param_name) is None:
                has_invalid_param_names = True
            
            # Map param_type to Python type
            type_map = {
                "string": "str",
                "integer": "int",
                "number": "float",
                "boolean": "bool",
                "object": "dict",
                "array": "list"
            }
            param_type = type_map.get(param.param_type.lower(), "str")
            
            # 检查是否为内置参数
            value_source = getattr(param, 'value_source', 'static')
            util_function_name = getattr(param, 'util_function_name', None)
            util_function_params = getattr(param, 'util_function_params', None)
            
            if is_builtin:
                # 内置参数不出现在函数签名中
                builtin_params.append((
                    param_name, param_type, param.param_desc, param.default_value, 
                    param.param_method, value_source, util_function_name, util_function_params
                ))
            elif param.is_required:
                required_params.append((param_name, param_type, param.param_desc))
            else:
                optional_params.append((param_name, param_type, param.param_desc, param.default_value))
    
    # Build function signature (不包含内置参数)
    # 如果有特殊字符参数名，使用**kwargs模式；否则使用普通参数模式
    if has_invalid_param_names:
        # 使用字典参数方式
        params_sig = "**params"
    else:
        # 使用普通参数方式
        for name, ptype, _ in required_params:
            params_sig_parts.append(f"{name}: {ptype}")
        for name, ptype, _, default in optional_params:
            default_val = f'"{default}"' if default else "None"
            params_sig_parts.append(f"{name}: {ptype} = {default_val}")
        
        params_sig = ", ".join(params_sig_parts)
    
    # Build function code
    lines = []
    lines.append("@Function")
    lines.append(f"def {function_name}({params_sig}):")
    
    # Docstring
    doc_lines = []
    doc_lines.append('    """')
    doc_lines.append(f"    @function_label: {function_label}")
    doc_lines.append(f"    @api_name: {api_info.api_name}")  # Track API reference
    if fun_desc or api_info.api_desc:
        doc_lines.append(f"    {fun_desc or api_info.api_desc}")
    doc_lines.append(f"    ")
    doc_lines.append(f"    API: {api_info.api_method} {api_info.url}")
    doc_lines.append(f"    Timeout: {timeout}s")
    
    # 只显示非内置参数
    if required_params or optional_params:
        doc_lines.append("    ")
        if has_invalid_param_names:
            doc_lines.append("    Params (pass as dict with keys):")
        else:
            doc_lines.append("    Params:")
        if required_params:
            doc_lines.append("      Required:")
            for name, ptype, desc in required_params:
                doc_lines.append(f"        - {name}: {ptype}" + (f" - {desc}" if desc else ""))
        if optional_params:
            doc_lines.append("      Optional:")
            for name, ptype, desc, _ in optional_params:
                doc_lines.append(f"        - {name}: {ptype}" + (f" - {desc}" if desc else ""))
    
    # 如果有内置参数，在文档中说明
    if builtin_params:
        doc_lines.append("    ")
        doc_lines.append("    Builtin Params (auto-configured):")
        for name, ptype, desc, default, _, value_source, util_func_name, util_func_params in builtin_params:
            if value_source == "util_function" and util_func_name:
                if util_func_params and isinstance(util_func_params, dict):
                    # 显示参数引用关系
                    param_names = ", ".join(util_func_params.keys())
                    doc_lines.append(f"        - {name}: {ptype} = {util_func_name}({param_names})" + (f" - {desc}" if desc else ""))
                else:
                    doc_lines.append(f"        - {name}: {ptype} = {util_func_name}()" + (f" - {desc}" if desc else ""))
            else:
                doc_lines.append(f"        - {name}: {ptype} = {default}" + (f" - {desc}" if desc else ""))
    
    # if api_info.response_params:
    #     doc_lines.append("    ")
    #     doc_lines.append("    Returns:")
    #     for param in api_info.response_params:
    #         doc_lines.append(f"      - {param.param_name}: {param.param_type}" + (f" - {param.param_desc}" if param.param_desc else ""))
    
    doc_lines.append('    """')
    lines.extend(doc_lines)
    
    # Function body
    lines.append("    import requests")
    lines.append("    import json")
    lines.append("    ")
    
    # 为内置参数赋值
    if builtin_params:
        # 收集需要导入的工具函数
        util_functions = set()
        for _, _, _, _, _, value_source, util_func_name, _ in builtin_params:
            if value_source == "util_function" and util_func_name:
                util_functions.add(util_func_name)
        
        if util_functions:
            lines.append("    # Import utility functions")
            util_funcs_str = ", ".join(sorted(util_functions))
            lines.append(f"    from core.ontology.utils.util_functions import {util_funcs_str}")
            lines.append("    ")
        
        lines.append("    # Builtin parameters (auto-configured)")
        
        # 拓扑排序：根据依赖关系确定内置参数的生成顺序
        # 第一步：收集所有内置参数名
        builtin_param_names = set()
        param_map = {}   # {param_name: 完整的参数元组}
        
        for param_tuple in builtin_params:
            param_name = param_tuple[0]
            builtin_param_names.add(param_name)
            param_map[param_name] = param_tuple
        
        # 第二步：构建依赖图
        param_deps = {}  # {param_name: [依赖的其他内置参数列表]}
        
        for param_tuple in builtin_params:
            param_name = param_tuple[0]
            param_deps[param_name] = []
            
            # 分析依赖：如果是工具函数，检查其参数
            value_source = param_tuple[5]
            util_func_params = param_tuple[7]
            
            if value_source == "util_function" and util_func_params and isinstance(util_func_params, dict):
                for util_param_name in util_func_params.keys():
                    # 如果引用的参数是另一个内置参数，添加依赖
                    if util_param_name in builtin_param_names:
                        param_deps[param_name].append(util_param_name)
        
        # 拓扑排序（使用Kahn算法）
        sorted_params = []
        in_degree = {}
        
        # 计算入度（每个节点依赖多少其他节点）
        for name in builtin_param_names:
            in_degree[name] = len(param_deps[name])
        
        # 找到所有入度为0的节点（不依赖其他内置参数的节点）
        queue = [name for name in builtin_param_names if in_degree[name] == 0]
        
        while queue:
            # 选择一个入度为0的节点
            current = queue.pop(0)
            sorted_params.append(current)
            
            # 更新依赖当前节点的其他节点的入度
            for name, deps in param_deps.items():
                if current in deps:
                    in_degree[name] -= 1
                    if in_degree[name] == 0 and name not in sorted_params and name not in queue:
                        queue.append(name)
        
        # 如果存在循环依赖，添加剩余的参数（保持原顺序）
        for param_name in builtin_param_names:
            if param_name not in sorted_params:
                sorted_params.append(param_name)
        
        # 按照排序后的顺序生成代码
        # 维护已定义的内置参数名集合，用于判断工具函数参数引用
        defined_builtin_params = set()
        
        for param_name in sorted_params:
            param_tuple = param_map[param_name]
            param_name, param_type, _, default_value, _, value_source, util_func_name, util_func_params = param_tuple
            # 使用安全的变量名（内置参数始终可以使用变量，因为它们不在签名中）
            safe_var_name = param_name.replace('-', '_').replace('.', '_').replace(' ', '_')
            
            if value_source == "util_function" and util_func_name:
                # 使用工具函数生成参数值
                if util_func_params and isinstance(util_func_params, dict):
                    # 关键词匹配：只传递在当前作用域中存在的参数
                    # 收集所有可用的参数（来自函数签名和之前定义的内置参数）
                    param_parts = []
                    for util_param_name in util_func_params.keys():
                        # 检查该参数是否在函数参数中或已定义的内置参数中
                        util_param_safe = util_param_name.replace('-', '_').replace('.', '_').replace(' ', '_')
                        
                        # 检查是否为函数参数
                        is_func_param = any(p[0] == util_param_name for p in required_params + optional_params)
                        
                        # 检查是否为之前定义的内置参数
                        is_prev_builtin = util_param_name in defined_builtin_params
                        
                        if is_func_param:
                            # 如果是函数参数
                            if has_invalid_param_names:
                                # 使用字典模式
                                param_parts.append(f'{util_param_name}=params.get("{util_param_name}")')
                            else:
                                # 使用变量模式
                                param_parts.append(f'{util_param_name}={util_param_name}')
                        elif is_prev_builtin:
                            # 如果是之前定义的内置参数，使用其安全变量名
                            param_parts.append(f'{util_param_name}={util_param_safe}')
                    
                    params_str = ", ".join(param_parts)
                    lines.append(f"    {safe_var_name} = {util_func_name}({params_str})")
                else:
                    lines.append(f"    {safe_var_name} = {util_func_name}()")
            elif default_value:
                # 使用静态默认值
                if param_type in ["str"]:
                    lines.append(f"    {safe_var_name} = \"{default_value}\"")
                elif param_type in ["int", "float"]:
                    lines.append(f"    {safe_var_name} = {default_value}")
                elif param_type == "bool":
                    lines.append(f"    {safe_var_name} = {default_value}")
                elif param_type == "dict":
                    # 确保字典默认值是有效的Python字典字面量
                    import json
                    try:
                        # 尝试解析为JSON并转换为Python字典字面量
                        if isinstance(default_value, str):
                            dict_obj = json.loads(default_value)
                            lines.append(f"    {safe_var_name} = {repr(dict_obj)}")
                        elif isinstance(default_value, dict):
                            lines.append(f"    {safe_var_name} = {repr(default_value)}")
                        else:
                            lines.append(f"    {safe_var_name} = {default_value}")
                    except:
                        # 如果解析失败，直接使用原值
                        lines.append(f"    {safe_var_name} = {default_value}")
                elif param_type == "list":
                    # 类似处理列表
                    import json
                    try:
                        if isinstance(default_value, str):
                            list_obj = json.loads(default_value)
                            lines.append(f"    {safe_var_name} = {repr(list_obj)}")
                        elif isinstance(default_value, list):
                            lines.append(f"    {safe_var_name} = {repr(default_value)}")
                        else:
                            lines.append(f"    {safe_var_name} = {default_value}")
                    except:
                        lines.append(f"    {safe_var_name} = {default_value}")
                else:
                    lines.append(f"    {safe_var_name} = \"{default_value}\"")
            else:
                # 如果没有默认值，使用 None
                lines.append(f"    {safe_var_name} = None")
            
            # 将当前参数添加到已定义集合中
            defined_builtin_params.add(param_name)
        
        lines.append("    ")
    
    # Build request parameters
    lines.append(f"    # Prepare API request")
    lines.append(f"    url = \"{api_info.url}\"")
    lines.append("    headers = {}")
    # 使用不同的变量名避免与函数参数冲突
    query_params_var = "query_params" if has_invalid_param_names else "params"
    lines.append(f"    {query_params_var} = {{}}")
    lines.append("    body = {}")
    lines.append("    ")
    
    if api_info.request_params:
        for param in api_info.request_params:
            param_name = param.param_name
            param_method = param.param_method.lower()
            is_builtin = getattr(param, 'is_builtin', False)
            
            # 使用安全的变量名
            if is_builtin:
                # 内置参数使用安全变量名
                safe_var_name = param_name.replace('-', '_').replace('.', '_').replace(' ', '_')
            else:
                # 非内置参数根据模式决定如何访问
                if has_invalid_param_names:
                    safe_var_name = f'params.get("{param_name}")'
                else:
                    safe_var_name = param_name
            
            # 内置参数的注释
            param_type_comment = "builtin" if is_builtin else param_method
            lines.append(f"    # Process {param_name} ({param_type_comment})")
            
            if param_method == "path":
                lines.append(f"    url = url.replace('{{{{{param_name}}}}}', str({safe_var_name}))")
            elif param_method == "query":
                # 内置参数或必需参数直接添加
                if is_builtin or param.is_required:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        {query_params_var}['{param_name}'] = {safe_var_name}")
                else:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        {query_params_var}['{param_name}'] = {safe_var_name}")
            elif param_method == "body":
                if is_builtin or param.is_required:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        body['{param_name}'] = {safe_var_name}")
                else:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        body['{param_name}'] = {safe_var_name}")
            elif param_method == "header":
                if is_builtin or param.is_required:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        headers['{param_name}'] = {safe_var_name}")
                else:
                    lines.append(f"    if {safe_var_name} is not None:")
                    lines.append(f"        headers['{param_name}'] = {safe_var_name}")
    
    lines.append("    ")
    lines.append("    # Make API request")
    lines.append("    try:")
    
    method = api_info.api_method.upper()
    if method in ["GET", "DELETE"]:
        lines.append(f"        response = requests.{method.lower()}(url, headers=headers, params={query_params_var}, timeout={timeout})")
    else:
        lines.append(f"        response = requests.{method.lower()}(url, headers=headers, params={query_params_var}, json=body, timeout={timeout})")
    
    lines.append("        response.raise_for_status()")
    lines.append("        return response.json()")
    lines.append("    except requests.exceptions.RequestException as e:")
    lines.append("        return {\"error\": f\"API request failed: {str(e)}\"}")
    lines.append("    except Exception as e:")
    lines.append("        return {\"error\": f\"Unexpected error: {str(e)}\"}")
    
    return "\n".join(lines)


@router.post("/create")
async def functions_create_api(payload: GenerateFunctionRequest) -> ApiResponse:
    """
    根据入参生成函数文件，保存到 core/ontology/{ontology_name}/logics/{file_name}.py (function类型)
    或 core/ontology_apis/{ontology_name}/logics/apis.py (api类型，多个API函数保存在同一个文件中)
    - 固定导入: `import setup` (如果有 ontology_name), `from core.runtime.registry import Function`
    - 导入 used_objects 中的对象: from core.ontology.{ontology_name}.objects.{obj} import {Obj} (仅 function 类型)
    - 生成模板函数，包含装饰器、入参、出参注释和描述，主体使用 pass，占位注释"在此处编辑你的逻辑"
    - 对于 api 类型，生成API包装器代码，自动调用外部API并返回结果
    """
    try:
        ontology_name = payload.ontology_name
        function_type = payload.function_type or "function"
        logger.info(f"create function: {ontology_name}, {function_type}")
        # 校验：function_type 必须是 'function' 或 'api'
        if function_type not in ["function", "api"]:
            return ApiResponse(
                status="failed",
                message="function_type must be either 'function' or 'api'",
                code="500"
            )
        
        # 校验：api 类型必须提供 api_info
        if function_type == "api" and not payload.api_info:
            return ApiResponse(
                status="failed",
                message="api_info is required when function_type is 'api'",
                code="500"
            )
        
        # 校验：api 类型必须提供 ontology_name
        if function_type == "api" and not ontology_name:
            return ApiResponse(
                status="failed",
                message="ontology_name is required when function_type is 'api'",
                code="500"
            )
        
        # 校验：ontology_name 为 None 时，used_objects 必须为 None
        if ontology_name is None and payload.used_objects is not None:
            return ApiResponse(
                status="failed",
                message="When ontology_name is None, used_objects must be None",
                code="500"
            )

        used_objects = payload.used_objects or []
        function_name = payload.function_name
        fun_params = payload.fun_params or {}
        outputs = payload.outputs or {}
        fun_desc = payload.fun_desc or ""
        function_label = payload.function_label
        file_name = payload.file_name or function_name

        # 目录准备 - 根据 function_type 决定路径
        if function_type == "api":
            # API 类型：保存到 core/ontology_apis/{ontology_name}/logics/apis.py
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology_apis", ontology_name, "logics"
            )
            # API 类型统一使用 apis.py 文件名
            file_name = "apis.py"
        elif ontology_name is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", "logics"
            )
        else:
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "logics"
            )
        os.makedirs(base_dir, exist_ok=True)
        
        # 确保 setup.py 存在
        if ontology_name:
            setup_py_path = os.path.join(base_dir, "setup.py")
            if not os.path.exists(setup_py_path):
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
                    setup_content = (
                        '"""\n'
                        '路径设置模块 - 用于在logics目录作为工作空间时正确设置Python路径\n'
                        '在任何其他导入之前导入此模块\n'
                        '"""\n\n'
                        "import sys\n"
                        "import os\n\n"
                        "# 获取项目根目录（从当前文件向上3级）\n"
                        "current_dir = os.path.dirname(os.path.abspath(__file__))\n"
                        "project_root = os.path.abspath(os.path.join(current_dir, '../../../..'))\n\n"
                        "# 将项目根目录添加到Python路径的开头\n"
                        "if project_root not in sys.path:\n"
                        "    sys.path.insert(0, project_root)\n\n"
                    )
                with open(setup_py_path, "w", encoding="utf-8") as sf:
                    sf.write(setup_content)
        
        # 为 API 类型创建 __init__.py
        if function_type == "api" and ontology_name:
            # 为 API 类型创建 __init__.py（在 logics 目录）
            init_py_path = os.path.join(base_dir, "__init__.py")
            if not os.path.exists(init_py_path):
                with open(init_py_path, "w", encoding="utf-8") as f:
                    f.write("# Auto-generated package file for ontology API logics\n")
            # 同时在上级目录也创建 __init__.py
            parent_init = os.path.join(os.path.dirname(base_dir), "__init__.py")
            if not os.path.exists(parent_init):
                with open(parent_init, "w", encoding="utf-8") as f:
                    f.write("# Auto-generated package file for ontology APIs\n")

        # 目标文件
        if file_name.endswith(".py"):
            pass
        else:
            file_name = f"{file_name}.py"
        output_filename = os.path.join(base_dir, f"{file_name}")
        file_existed = os.path.exists(output_filename)

        # 读取现有文件内容（如果存在）
        existing_content = ""
        existing_imports = set()
        if file_existed:
            try:
                with open(output_filename, "r", encoding="utf-8") as f:
                    existing_content = f.read()
                
                # 解析现有的 import 语句
                for line in existing_content.split('\n'):
                    line = line.strip()
                    if line.startswith('import ') or line.startswith('from '):
                        existing_imports.add(line)
            except Exception:
                existing_content = ""
                existing_imports = set()

        # 构造新的 import 语句
        new_imports: List[str] = []
        
        # 所有类型都需要 setup import（如果有 ontology_name）
        if ontology_name:
            setup_import = "import setup"
            if setup_import not in existing_imports:
                new_imports.append(setup_import)
        
        function_import = "from core.runtime.registry import Function"
        if function_import not in existing_imports:
            new_imports.append(function_import)
        
        # API 类型不需要导入 used_objects（API 函数不使用本体对象）
        if function_type == "function" and ontology_name is not None and used_objects:
            for obj_name in used_objects:
                obj_import = f"from core.ontology.{ontology_name}.objects.{obj_name} import {obj_name}"
                if obj_import not in existing_imports:
                    new_imports.append(obj_import)

        # 参数串（支持新旧两种格式）
        type_map = {
            "str": "str", "string": "str",
            "int": "int", "integer": "int",
            "float": "float", "double": "float", "number": "float",
            "bool": "bool", "boolean": "bool",
            "dict": "dict", "object": "object", "map": "dict",
            "list": "list", "array": "list",
            "any": "object",
        }
        required_fun_params: List[Dict[str, Any]] = []
        optional_fun_params: List[Dict[str, Any]] = []
        if isinstance(fun_params, dict):
            for pname, pspec in fun_params.items():
                if isinstance(pspec, FunParamSpec) or (hasattr(pspec, 'dict') and callable(getattr(pspec, 'dict'))):
                    d = pspec.model_dump() if hasattr(pspec, 'dict') else dict(pspec)
                    t = str(d.get("type") or "object").lower()
                    ann = type_map.get(t, "object")
                    is_req = bool(d.get("is_required"))
                    desc = str(d.get("desc") or "").strip()
                elif isinstance(pspec, dict):
                    t = str(pspec.get("type") or "object").lower()
                    ann = type_map.get(t, "object")
                    is_req = bool(pspec.get("is_required"))
                    desc = str(pspec.get("desc") or "").strip()
                else:
                    t = str(pspec or "object").lower()
                    ann = type_map.get(t, "object")
                    is_req = True
                    desc = ""
                item = {"name": pname, "ann": ann, "desc": desc}
                if is_req:
                    required_fun_params.append(item)
                else:
                    optional_fun_params.append(item)

        params_sig_parts: List[str] = []
        for it in required_fun_params:
            params_sig_parts.append(f"{it['name']}: {it['ann']}")
        for it in optional_fun_params:
            params_sig_parts.append(f"{it['name']}: {it['ann']} = None")
        params_sig = ", ".join(params_sig_parts)

        # 生成新函数代码（支持外部提供完整代码片段）
        code_snippet = (payload.code or "")
        
        # API 类型：使用 API 包装器代码生成
        if function_type == "api" and payload.api_info:
            api_wrapper_code = _generate_api_wrapper_code(
                function_name,
                payload.api_info,
                function_label,
                fun_desc,
                payload.api_info.timeout or 30
            )
            function_lines: List[str] = [ln.rstrip("\n") for ln in api_wrapper_code.splitlines()]
        elif code_snippet.strip():
            function_lines: List[str] = [ln.rstrip("\n") for ln in code_snippet.splitlines()]
        else:
            function_lines: List[str] = []
            function_lines.append("@Function")
            function_lines.append(
                f"def {function_name}({params_sig}):" if params_sig else f"def {function_name}():"
            )
            # Docstring（始终生成，包含 function_label，按需附加描述/参数/返回）
            doc_lines: List[str] = []
            doc_lines.append('    """')
            doc_lines.append(f"    @function_label: {function_label}")
            if fun_desc:
                doc_lines.append(f"    {fun_desc}")
            if fun_params:
                doc_lines.append("    ")
                doc_lines.append("    Params:")
                if required_fun_params:
                    doc_lines.append("      Required:")
                    for it in required_fun_params:
                        name = it["name"]; ann = it["ann"]; desc = it["desc"]
                        doc_lines.append(f"        - {name}: {ann}" + (f" - {desc}" if desc else ""))
                if optional_fun_params:
                    doc_lines.append("      Optional:")
                    for it in optional_fun_params:
                        name = it["name"]; ann = it["ann"]; desc = it["desc"]
                        doc_lines.append(f"        - {name}: {ann}" + (f" - {desc}" if desc else ""))
            if outputs:
                doc_lines.append("    ")
                doc_lines.append("    Returns:")
                for name, type_ in outputs.items():
                    doc_lines.append(f"      - {name}: {type_}")
            doc_lines.append('    """')
            function_lines.extend(doc_lines)

            function_lines.append("    # 在此处编辑你的逻辑")
            if outputs:
                function_lines.append("    pass")
            else:
                function_lines.append("    return")

        # 组装最终内容
        if file_existed:
            # 如果文件已存在，在现有内容基础上添加新的imports和函数
            final_lines = []
            
            # 如果有新的imports需要添加，插入到现有内容的适当位置
            if new_imports:
                existing_lines = existing_content.split('\n')
                import_inserted = False
                
                for i, line in enumerate(existing_lines):
                    final_lines.append(line)
                    # 在最后一个import语句后插入新的imports
                    if not import_inserted and (line.strip().startswith('import ') or line.strip().startswith('from ')):
                        # 找到下一个非import行或空行
                        j = i + 1
                        while j < len(existing_lines) and (existing_lines[j].strip().startswith('import ') or existing_lines[j].strip().startswith('from ')):
                            j += 1
                        if j < len(existing_lines):
                            # 在这里插入新imports
                            for new_import in new_imports:
                                final_lines.append(new_import)
                            import_inserted = True
                
                # 如果没有找到现有imports，在文件开头添加
                if not import_inserted:
                    final_lines = new_imports + [""] + final_lines
            else:
                final_lines = existing_content.split('\n')
            
            # 添加新函数（在文件末尾）
            if final_lines and final_lines[-1].strip():
                final_lines.append("")  # 确保有空行分隔
            final_lines.append("")  # 额外空行
            final_lines.extend(function_lines)
            
            final_code = "\n".join(final_lines) + "\n"
        else:
            # 如果文件不存在，创建新文件
            all_imports = new_imports
            code_lines = all_imports + [""] + function_lines
            final_code = "\n".join(code_lines) + "\n"

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(final_code)

        # 刷新函数注册
        try:
            if function_type == "api":
                # API 类型：从 ontology_apis/logics 目录注册
                api_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology_apis", ontology_name, "logics"
                )
                refresh(ontology_name, api_dir)
            elif ontology_name is None:
                # 无 ontology_name 的 function 类型
                functions_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology", "logics"
                )
                refresh("logics", functions_dir)
            else:
                # 有 ontology_name 的 function 类型
                functions_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "core", "ontology", ontology_name, "logics"
                )
                refresh(ontology_name, functions_dir)
        except Exception as e:
            # 不阻塞主流程，但记录日志
            
            logger.warning(f"Failed to refresh functions: {e}")
        
        message = "Function file overwritten" if file_existed else "Function file created"
        return ApiResponse(
            status="success",
            data={"output_filename": output_filename},
            message=message,
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Operation failed: {str(e)}",
            code="500"
        )

def _extract_function_metadata(content: str) -> List[Dict[str, Any]]:
    """
    从文件内容中提取所有函数的元数据
    返回: [{"name": str, "api_name": str, "label": str, "desc": str, "start_line": int, "end_line": int}]
    """
    import re
    
    functions = []
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 查找函数定义
        func_match = re.match(r'^def\s+(\w+)\s*\(', line)
        if func_match:
            func_name = func_match.group(1)
            start_line = i
            
            # 查找函数的 docstring 以提取元数据
            api_name = None
            function_label = None
            func_desc = None
            
            # 向前查找装饰器
            j = i - 1
            while j >= 0 and (lines[j].strip().startswith('@') or lines[j].strip() == ''):
                j -= 1
            
            # 向后查找 docstring
            j = i + 1
            in_docstring = False
            docstring_lines = []
            while j < len(lines):
                stripped = lines[j].strip()
                if '"""' in stripped:
                    if not in_docstring:
                        in_docstring = True
                        # 可能在同一行包含结束的 """
                        if stripped.count('"""') >= 2:
                            docstring_lines.append(stripped)
                            break
                    else:
                        docstring_lines.append(stripped)
                        break
                elif in_docstring:
                    docstring_lines.append(stripped)
                j += 1
            
            # 解析 docstring
            docstring_text = ' '.join(docstring_lines)
            api_name_match = re.search(r'@api_name:\s*(\S+)', docstring_text)
            if api_name_match:
                api_name = api_name_match.group(1)
            
            label_match = re.search(r'@function_label:\s*(.+?)(?:@|API:|Timeout:|""")', docstring_text)
            if label_match:
                function_label = label_match.group(1).strip()
            
            # 查找函数结束
            func_indent = len(line) - len(line.lstrip())
            end_line = i
            k = i + 1
            while k < len(lines):
                curr_line = lines[k]
                stripped = curr_line.strip()
                if stripped and not curr_line.startswith(' ' * (func_indent + 1)):
                    # 到达下一个顶级语句
                    break
                end_line = k
                k += 1
            
            functions.append({
                "name": func_name,
                "api_name": api_name,
                "label": function_label,
                "desc": func_desc,
                "start_line": start_line,
                "end_line": end_line
            })
        
        i += 1
    
    return functions


@router.post("/update/api_definition")
async def update_api_definition(payload: ApiDefinitionUpdateRequest) -> ApiResponse:
    """
    更新所有引用指定 API 的函数
    - 根据 api_name 查找所有引用该 API 的函数
    - 使用新的 API 信息重新生成所有这些函数
    - 保持函数名和 function_label 不变
    - 刷新函数注册
    """
    try:
        api_name = payload.api_name
        new_api_info = payload.api_info
        
        # 验证 api_info.api_name 匹配
        if new_api_info.api_name != api_name:
            return ApiResponse(
                status="failed",
                message=f"api_info.api_name '{new_api_info.api_name}' does not match requested api_name '{api_name}'",
                code="500"
            )
        
        # 遍历所有本体的 API 目录
        ontology_apis_root = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology_apis"
        )
        
        if not os.path.exists(ontology_apis_root):
            return ApiResponse(
                status="success",
                message="No ontology_apis directory found",
                code="200"
            )
        
        all_updated_functions = []
        updated_files = []
        
        # 遍历每个本体目录
        for ontology_dir in Path(ontology_apis_root).iterdir():
            if not ontology_dir.is_dir():
                continue
            
            ontology_name = ontology_dir.name
            logics_dir = ontology_dir / "logics"
            
            if not logics_dir.exists():
                continue
            
            # 扫描 logics 目录下的所有 Python 文件
            for py_file in logics_dir.glob("*.py"):
                if py_file.name == "__init__.py":
                    continue
                
                try:
                    # 读取文件内容
                    with open(py_file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # 提取所有函数的元数据
                    functions_metadata = _extract_function_metadata(content)
                    
                    # 找到所有引用该 API 的函数
                    matching_functions = [f for f in functions_metadata if f["api_name"] == api_name]
                    
                    if not matching_functions:
                        continue
                    
                    # 删除所有匹配的函数
                    lines = content.split('\n')
                    new_lines = []
                    lines_to_skip = set()
                    
                    for func_meta in matching_functions:
                        # 标记要删除的行（包括装饰器）
                        start = func_meta["start_line"]
                        end = func_meta["end_line"]
                        
                        # 向前查找装饰器
                        j = start - 1
                        while j >= 0 and (lines[j].strip().startswith('@') or lines[j].strip() == ''):
                            if lines[j].strip().startswith('@'):
                                start = j
                                break
                            j -= 1
                        
                        for line_num in range(start, end + 1):
                            lines_to_skip.add(line_num)
                    
                    # 构建新文件内容（删除旧函数）
                    for i, line in enumerate(lines):
                        if i not in lines_to_skip:
                            new_lines.append(line)
                    
                    # 重新生成所有匹配的函数
                    for func_meta in matching_functions:
                        function_name = func_meta["name"]
                        function_label = func_meta["label"] or f"API Function: {function_name}"
                        
                        # 生成新的函数代码（支持更新后的工具函数参数）
                        api_wrapper_code = _generate_api_wrapper_code(
                            function_name,
                            new_api_info,
                            function_label,
                            None,  # 使用 API 的描述
                            new_api_info.timeout or 30
                        )
                        function_lines = [ln.rstrip("\n") for ln in api_wrapper_code.splitlines()]
                        
                        # 添加到文件末尾
                        if new_lines and new_lines[-1].strip():
                            new_lines.append("")
                        new_lines.append("")
                        new_lines.extend(function_lines)
                        
                        all_updated_functions.append(f"{ontology_name}.{function_name}")
                    
                    # 写回文件
                    final_code = "\n".join(new_lines) + "\n"
                    with open(py_file, "w", encoding="utf-8") as f:
                        f.write(final_code)
                    
                    updated_files.append(str(py_file))
                    
                except Exception as e:
                    logger.warning(f"Failed to update file {py_file}: {e}")
                    continue
        
        if not all_updated_functions:
            return ApiResponse(
                status="success",
                message=f"No functions found that reference API '{api_name}'",
                code="200"
            )
        
        # 刷新所有涉及的本体的函数注册
        refreshed_ontologies = set()
        for ontology_dir in Path(ontology_apis_root).iterdir():
            if not ontology_dir.is_dir():
                continue
            ontology_name = ontology_dir.name
            logics_dir = ontology_dir / "logics"
            if logics_dir.exists():
                try:
                    refresh(ontology_name, str(logics_dir))
                    refreshed_ontologies.add(ontology_name)
                except Exception as e:
                    logger.warning(f"Failed to refresh {ontology_name} after API update: {e}")
        
        return ApiResponse(
            status="success",
            data={
                "api_name": api_name,
                "updated_functions": all_updated_functions,
                "updated_files": updated_files,
                "refreshed_ontologies": list(refreshed_ontologies),
                "count": len(all_updated_functions)
            },
            message=f"Updated {len(all_updated_functions)} function(s) across {len(updated_files)} file(s) that reference API '{api_name}'",
            code="200"
        )
        
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Update operation failed: {str(e)}",
            code="500"
        )


@router.post("/update/api_function")
async def functions_update_api(payload: FunctionUpdateRequest) -> ApiResponse:
    """
    更新 API 类型的函数
    - 从 core/ontology_apis/{ontology_name}/logics/apis.py 中找到并替换指定函数
    - 使用新的 API 信息重新生成函数代码
    - 刷新函数注册以加载更新
    """
    try:
        ontology_name = payload.ontology_name
        function_name = payload.function_name
        function_label = payload.function_label
        fun_desc = payload.fun_desc or ""
        
        # 确定目标文件路径
        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology_apis", ontology_name, "logics"
        )
        target_file = os.path.join(base_dir, "apis.py")
        
        # 检查文件是否存在
        if not os.path.exists(target_file):
            return ApiResponse(
                status="failed",
                message=f"API file not found for ontology: {ontology_name}",
                code="500"
            )
        
        # 读取现有文件内容
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # 解析文件，找到并删除旧函数
        lines = content.split('\n')
        new_lines = []
        function_found = False
        in_target_function = False
        function_start_indent = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # 检查是否是目标函数的定义行
            if stripped.startswith(f'def {function_name}(') or stripped == f'def {function_name}():':
                function_found = True
                in_target_function = True
                function_start_indent = len(line) - len(line.lstrip())
                
                # 检查前面是否有装饰器，需要从new_lines中移除
                j = len(new_lines) - 1
                while j >= 0 and (new_lines[j].strip() == '' or new_lines[j].strip().startswith('@')):
                    if new_lines[j].strip().startswith('@'):
                        # 找到装饰器，从这里开始删除
                        new_lines = new_lines[:j]
                        break
                    elif new_lines[j].strip() == '':
                        j -= 1
                    else:
                        break
                
                # 跳过当前def行，进入函数体删除模式
                i += 1
                continue
            
            if in_target_function:
                # 检查是否到达函数结束：遇到顶级行（包括装饰器或def）
                if stripped and not line.startswith(' ' * (function_start_indent + 1)):
                    # 到达下一个顶级语句，结束当前函数删除
                    in_target_function = False
                    new_lines.append(line)
                # 如果仍在目标函数内，跳过这行（不添加到new_lines）
            else:
                # 不在目标函数内，正常添加行
                new_lines.append(line)
            
            i += 1
        
        if not function_found:
            return ApiResponse(
                status="failed",
                message=f"Function '{function_name}' not found in apis.py",
                code="500"
            )
        
        # 生成新的函数代码
        api_wrapper_code = _generate_api_wrapper_code(
            function_name,
            payload.api_info,
            function_label,
            fun_desc,
            payload.api_info.timeout or 30
        )
        function_lines = [ln.rstrip("\n") for ln in api_wrapper_code.splitlines()]
        
        # 添加新函数到文件末尾
        if new_lines and new_lines[-1].strip():
            new_lines.append("")  # 确保有空行分隔
        new_lines.append("")  # 额外空行
        new_lines.extend(function_lines)
        
        # 写回文件
        final_code = "\n".join(new_lines) + "\n"
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(final_code)
        
        # 刷新函数注册
        try:
            api_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology_apis", ontology_name, "logics"
            )
            refresh(ontology_name, api_dir)
        except Exception as e:
            
            logger.warning(f"Failed to refresh functions after update: {e}")
        
        return ApiResponse(
            status="success",
            data={"output_filename": target_file, "function_name": function_name},
            message=f"API function '{function_name}' updated successfully",
            code="200"
        )
        
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Update operation failed: {str(e)}",
            code="500"
        )

@router.post("/delete")
async def functions_delete_api(payload: FunctionDeleteRequest) -> ApiResponse:
    """
    根据入参删除指定函数
    - function 类型: 从 core/ontology/{ontology_name}/logics/{file_name}.py 中删除
    - api 类型: 从 core/ontology_apis/{ontology_name}/logics/apis.py 中删除
    如果 ontology_name 为空，则从 core/ontology/logics/{file_name}.py 中删除
    如果删除后文件为空（只剩imports），则删除整个文件
    """
    try:
        ontology_name = payload.ontology_name
        file_name = payload.file_name
        function_name = payload.function_name
        function_type = payload.function_type or "function"
        if file_name is None and function_type != "api":
            return ApiResponse(
                status="failed",
                message="file_name is required for function type functions",
                code="500"
            )
        # 确定目标文件路径
        if function_type == "api":
            # API 类型：从 ontology_apis/logics 目录删除
            if not ontology_name:
                return ApiResponse(
                    status="failed",
                    message="ontology_name is required for API type functions",
                    code="500"
                )
            target_file = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology_apis", ontology_name, "logics", "apis.py"
            )
        elif ontology_name is None:
            target_file = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", "logics", f"{file_name}"
            )
        else:
            target_file = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", ontology_name, "logics", f"{file_name}"
            )

        # 检查文件是否存在
        if not os.path.exists(target_file):
            return ApiResponse(
                status="success",
                data={"file_path": target_file},
                message=f"Function file {file_name} already does not exist; nothing to delete",
                code="200"
            )

        # 读取文件内容
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()

        # 解析文件内容，找到要删除的函数
        lines = content.split('\n')
        new_lines = []
        function_found = False
        in_target_function = False
        function_start_indent = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # 检查是否是目标函数的定义行
            if stripped.startswith(f'def {function_name}(') or stripped == f'def {function_name}():':
                function_found = True
                in_target_function = True
                function_start_indent = len(line) - len(line.lstrip())
                
                # 检查前面是否有装饰器，需要从new_lines中移除
                j = len(new_lines) - 1
                while j >= 0 and (new_lines[j].strip() == '' or new_lines[j].strip().startswith('@')):
                    if new_lines[j].strip().startswith('@'):
                        # 找到装饰器，从这里开始删除
                        new_lines = new_lines[:j]
                        break
                    elif new_lines[j].strip() == '':
                        j -= 1
                    else:
                        break
                
                # 跳过当前def行，进入函数体删除模式
                i += 1
                continue
            
            if in_target_function:
                # 检查是否到达函数结束：遇到顶级行（包括装饰器或def）
                if stripped and not line.startswith(' ' * (function_start_indent + 1)):
                    # 到达下一个顶级语句（可能是 @Decorator 或 def），结束当前函数删除
                    in_target_function = False
                    new_lines.append(line)
                # 如果仍在目标函数内，跳过这行（不添加到new_lines）
            else:
                # 不在目标函数内，正常添加行
                new_lines.append(line)
            
            i += 1

        if not function_found:
            return ApiResponse(
                status="failed",
                message=f"Function '{function_name}' not found in {file_name}",
                code="500"
            )

        # 检查删除函数后是否还有其他函数
        remaining_content = '\n'.join(new_lines).strip()
        has_functions = False
        for line in new_lines:
            stripped = line.strip()
            if stripped.startswith('def ') and '@Function' in remaining_content:
                has_functions = True
                break

        if not has_functions:
            # 如果没有其他函数了，删除整个文件
            os.remove(target_file)

            # 刷新函数注册
            try:
                if function_type == "api":
                    api_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology_apis", ontology_name, "logics"
                    )
                    refresh(ontology_name, api_dir)
                elif ontology_name is None:
                    functions_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology", "logics"
                    )
                    refresh("logics", functions_dir)
                else:
                    functions_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology", ontology_name, "logics"
                    )
                    refresh(ontology_name, functions_dir)
            except Exception:
                pass

            return ApiResponse(
                status="success",
                data={"file_path": target_file},
                message=f"Function '{function_name}' deleted. File {file_name} removed as it contained no other functions.",
                code="200"
            )
        else:
            # 写回修改后的内容
            with open(target_file, "w", encoding="utf-8") as f:
                f.write('\n'.join(new_lines) + '\n')

            # 刷新函数注册
            try:
                if function_type == "api":
                    api_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology_apis", ontology_name, "logics"
                    )
                    refresh(ontology_name, api_dir)
                elif ontology_name is None:
                    functions_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology", "logics"
                    )
                    refresh("logics", functions_dir)
                else:
                    functions_dir = os.path.join(
                        os.path.dirname(os.path.dirname(__file__)),
                        "core", "ontology", ontology_name, "logics"
                    )
                    refresh(ontology_name, functions_dir)
            except Exception:
                pass

            return ApiResponse(
                status="success",
                data={"file_path": target_file},
                message=f"Function '{function_name}' deleted from {file_name}",
                code="200"
            )

    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Delete operation failed: {str(e)}",
            code="500"
        )
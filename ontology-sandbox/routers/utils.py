"""
工具函数管理接口
用于创建、注册、刷新和删除全局工具函数
"""

from __future__ import annotations

from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import sys

from core.runtime.registry import swap_utils_registry, list_utils, FunctionMeta
from apis.models import ApiResponse


UTILS_DIR = "core/ontology/utils"
UTILS_FILE = "util_functions.py"

router = APIRouter(prefix="/utils", tags=["utils"])


def _load_module_from_file(file_path: Path):
    """动态加载Python模块"""
    import importlib.util
    spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    raise ImportError(f"Cannot load module from {file_path}")


def rebuild_utils_registry() -> Dict[str, FunctionMeta]:
    """扫描并重建工具函数注册表"""
    new_reg: Dict[str, FunctionMeta] = {}
    
    utils_file = Path(UTILS_DIR) / UTILS_FILE
    if not utils_file.exists():
        return new_reg
    
    module = _load_module_from_file(utils_file)
    
    for attr in dir(module):
        obj = getattr(module, attr)
        if callable(obj) and getattr(obj, "__util_function__", False):
            name = obj.__name__
            doc = obj.__doc__.strip() if isinstance(obj.__doc__, str) else None
            new_reg[name] = FunctionMeta(
                name=name,
                module_path=str(utils_file),
                func=obj,
                description=doc,
            )
    
    return new_reg


def _param_types_json(fn) -> Dict[str, str]:
    """提取函数参数类型（简化版）"""
    import inspect
    sig = inspect.signature(fn)
    mapping: Dict[str, str] = {}
    for p in sig.parameters.values():
        if p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue
        annotation = p.annotation if p.annotation is not inspect._empty else "Any"
        # 转换类型注解为字符串
        if hasattr(annotation, "__name__"):
            type_str = annotation.__name__
        else:
            type_str = str(annotation).replace("typing.", "")
        mapping[p.name] = type_str
    return mapping


def _param_types_detail_json(fn) -> Dict[str, Dict[str, Any]]:
    """提取函数参数详细信息"""
    import inspect
    sig = inspect.signature(fn)
    detail: Dict[str, Dict[str, Any]] = {}
    for p in sig.parameters.values():
        if p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue
        annotation = p.annotation if p.annotation is not inspect._empty else "Any"
        # 转换类型注解为字符串
        if hasattr(annotation, "__name__"):
            type_str = annotation.__name__
        else:
            type_str = str(annotation).replace("typing.", "")
        detail[p.name] = {
            "type": type_str,
            "is_required": p.default is inspect._empty,
            "desc": "",
        }
    return detail


def _safe_getsource(obj) -> Optional[str]:
    """安全获取函数源代码"""
    import inspect
    try:
        return inspect.getsource(obj)
    except Exception:
        return None


@router.get("/refresh")
def refresh_utils_api() -> ApiResponse:
    """刷新工具函数注册表"""
    try:
        # 确保目录在 sys.path 中
        utils_dir = Path(UTILS_DIR).resolve()
        if str(utils_dir) not in sys.path:
            sys.path.insert(0, str(utils_dir))
        
        # 清除缓存的模块
        to_delete = []
        for name, mod in list(sys.modules.items()):
            try:
                mod_file = getattr(mod, "__file__", None)
                if isinstance(mod_file, str) and str(utils_dir) in mod_file:
                    to_delete.append(name)
            except Exception:
                continue
        for name in to_delete:
            sys.modules.pop(name, None)
        
        # 重建注册表
        new_reg = rebuild_utils_registry()
        
        # 构建别名
        from core.runtime.registry import _to_snake, _to_lower_camel
        aliases: Dict[str, str] = {}
        for canonical in new_reg.keys():
            snake = _to_snake(canonical)
            lower_camel = _to_lower_camel(canonical)
            if snake != canonical:
                aliases.setdefault(snake, canonical)
            if lower_camel != canonical:
                aliases.setdefault(lower_camel, canonical)
        
        swap_utils_registry(new_reg, aliases)
        
        # 构建详细的返回数据
        results: List[Dict[str, Any]] = []
        for m in new_reg.values():
            try:
                sig = _param_types_json(m.func)
                sig_detail = _param_types_detail_json(m.func)
            except Exception:
                sig = {}
                sig_detail = {}
            
            results.append({
                "name": m.name,
                "desc": m.description,
                "signature": sig,
                "signature_detail": sig_detail,
                "code": _safe_getsource(m.func),
                "filename": Path(m.module_path).name,
            })
        
        return ApiResponse(
            status="success",
            data={"registered": results},
            message=f"Utils refreshed successfully: {len(new_reg)} registered",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Refresh failed: {str(e)}",
            code="500"
        )


@router.get("")
def list_utils_api() -> ApiResponse:
    """列出所有已注册的工具函数"""
    try:
        utils = list_utils()
        results: List[Dict[str, Any]] = []
        for u in utils:
            try:
                sig = _param_types_json(u.func)
                sig_detail = _param_types_detail_json(u.func)
            except Exception:
                sig = {}
                sig_detail = {}
            
            results.append({
                "name": u.name,
                "desc": u.description,
                "signature": sig,
                "signature_detail": sig_detail,
                "code": _safe_getsource(u.func),
                "filename": Path(u.module_path).name,
            })
        
        return ApiResponse(
            status="success",
            data={"utils": results},
            message="Utils listed successfully",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"List failed: {str(e)}",
            code="500"
        )


class UtilCreateRequest(BaseModel):
    """创建工具函数的请求模型"""
    function_name: str
    function_params: Optional[Dict[str, str]] = None  # {param_name: param_type}
    function_desc: Optional[str] = None
    function_label: str
    code: Optional[str] = None  # 完整的函数代码（可选）


@router.post("/create")
async def create_util_function(payload: UtilCreateRequest) -> ApiResponse:
    """
    创建工具函数
    - 将函数添加到 util_functions.py
    - 使用 @Util 装饰器
    """
    try:
        function_name = payload.function_name
        function_params = payload.function_params or {}
        function_desc = payload.function_desc or ""
        function_label = payload.function_label
        code_snippet = payload.code or ""
        
        # 目标文件
        utils_dir = Path(UTILS_DIR)
        utils_dir.mkdir(parents=True, exist_ok=True)
        
        utils_file = utils_dir / UTILS_FILE
        file_existed = utils_file.exists()
        
        # 读取现有文件内容
        existing_content = ""
        existing_imports = set()
        if file_existed:
            try:
                with open(utils_file, "r", encoding="utf-8") as f:
                    existing_content = f.read()
                for line in existing_content.split('\n'):
                    s = line.strip()
                    if s.startswith('import ') or s.startswith('from '):
                        existing_imports.add(s)
            except Exception:
                existing_content = ""
                existing_imports = set()
        
        # 构造函数代码
        if code_snippet.strip():
            function_lines = [ln.rstrip("\n") for ln in code_snippet.splitlines()]
        else:
            function_lines = []
            
            # 构建参数签名
            params_sig_parts = []
            for pname, ptype in function_params.items():
                params_sig_parts.append(f"{pname}: {ptype}")
            params_sig = ", ".join(params_sig_parts)
            
            function_lines.append("@Util")
            function_lines.append(f"def {function_name}({params_sig}):")
            function_lines.append('    """')
            function_lines.append(f"    {function_label}")
            if function_desc:
                function_lines.append(f"    ")
                function_lines.append(f"    {function_desc}")
            if function_params:
                function_lines.append(f"    ")
                function_lines.append(f"    Args:")
                for pname, ptype in function_params.items():
                    function_lines.append(f"        {pname}: {ptype}")
            function_lines.append('    """')
            function_lines.append("    # 在此处编辑你的逻辑")
            function_lines.append("    pass")
        
        # 组装最终内容
        if file_existed:
            final_lines = existing_content.split('\n')
            if final_lines and final_lines[-1].strip():
                final_lines.append("")
            final_lines.append("")
            final_lines.extend(function_lines)
            final_code = "\n".join(final_lines) + "\n"
        else:
            # 创建新文件，包含文件头
            header_lines = [
                '"""',
                '全局工具函数库',
                '用于存放用户自定义的通用工具函数，如鉴权算法、数据转换等',
                '所有函数使用 @Util 装饰器标记',
                '"""',
                '',
                'from core.runtime.registry import Util',
                'from typing import Any',
                '',
            ]
            code_lines = header_lines + function_lines
            final_code = "\n".join(code_lines) + "\n"
        
        with open(utils_file, "w", encoding="utf-8") as f:
            f.write(final_code)
        
        # 刷新注册
        try:
            refresh_utils_api()
        except Exception:
            pass
        
        message = "Util function file overwritten" if file_existed else "Util function file created"
        return ApiResponse(
            status="success",
            data={"output_filename": str(utils_file)},
            message=message,
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Operation failed: {str(e)}",
            code="500"
        )


class UtilDeleteRequest(BaseModel):
    """删除工具函数的请求模型"""
    function_name: str


@router.post("/delete")
async def delete_util_function(payload: UtilDeleteRequest) -> ApiResponse:
    """删除工具函数"""
    try:
        function_name = payload.function_name
        utils_file = Path(UTILS_DIR) / UTILS_FILE
        
        if not utils_file.exists():
            return ApiResponse(
                status="success",
                message="Utils file does not exist; nothing to delete",
                code="200"
            )
        
        # 读取文件内容
        with open(utils_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        lines = content.split("\n")
        n = len(lines)
        i = 0
        modified = False
        
        while i < n:
            line = lines[i]
            if line.strip().startswith(f"def {function_name}("):
                # 找到函数定义
                start = i
                j = i - 1
                # 向前查找装饰器
                while j >= 0 and (lines[j].strip().startswith("@") or lines[j].strip() == ""):
                    if lines[j].strip().startswith("@"):
                        start = j
                        break
                    j -= 1
                
                # 向后查找函数结束
                k = i + 1
                while k < n:
                    lk = lines[k]
                    if lk.strip() == "":
                        k += 1
                        continue
                    indent = len(lk) - len(lk.lstrip())
                    if indent == 0 and (lk.lstrip().startswith("def ") or lk.lstrip().startswith("@")):
                        break
                    k += 1
                
                # 删除函数块
                del lines[start:k]
                modified = True
                break
            i += 1
        
        if not modified:
            return ApiResponse(
                status="failed",
                message=f"Function '{function_name}' not found in utils file",
                code="500"
            )
        
        # 写回文件
        remaining = "\n".join(lines)
        with open(utils_file, "w", encoding="utf-8") as f:
            f.write(remaining if remaining.endswith("\n") else remaining + "\n")
        
        # 刷新注册
        try:
            refresh_utils_api()
        except Exception:
            pass
        
        return ApiResponse(
            status="success",
            data={"file_path": str(utils_file)},
            message=f"Function '{function_name}' deleted successfully",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Delete operation failed: {str(e)}",
            code="500"
        )


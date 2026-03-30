from __future__ import annotations

from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os

from core.runtime.loader import refresh_actions
from core.runtime.registry import list_actions
from apis.models import ApiResponse
from routers.models import GenerateFunctionRequest, FunParamSpec, ApiInfoModel


ACTIONS_DIR_TEMPLATE = "core/ontology/{}/actions"


router = APIRouter(prefix="/actions", tags=["actions"])


class RefreshReq(BaseModel):
    ontology_id: str


@router.get("/refresh")
async def refresh_actions_api(ontology_id: str) -> ApiResponse:
    """
    刷新指定本体的动作注册（包括普通actions和API actions）
    """
    try:
        # 1) 刷新 core/ontology/{ontology_id}/actions（替换模式）
        actions_dir = ACTIONS_DIR_TEMPLATE.format(ontology_id)
        registered_normal = []
        
        if os.path.exists(actions_dir):
            registered_normal = refresh_actions(ontology_id, actions_dir, merge=False)
        
        # 2) 刷新 core/ontology_apis/{ontology_id}/actions（合并模式）
        api_actions_dir = f"core/ontology_apis/{ontology_id}/actions"
        registered_api = []
        
        if Path(api_actions_dir).exists():
            registered_api = refresh_actions(ontology_id, api_actions_dir, merge=True)
        
        # 合并所有注册的 action
        all_registered = registered_normal + registered_api
        
        # 仅返回普通actions中 build_type == 'function' 的 action 信息到前端
        registered_normal_filtered = [
            it for it in (registered_normal or []) if (it.get("build_type") or "function") == "function"
        ]
        
        # 统计总数（包括API actions）
        all_registered_filtered = [
            it for it in (all_registered or []) if (it.get("build_type") or "function") == "function"
        ]
        
        if len(all_registered) == 0:
            return ApiResponse(
                status="failed",
                message=f"No actions directory found for ontology: {ontology_id}",
                code="200"
            )
        
        return ApiResponse(
            status="success",
            data={
                "registered": registered_normal_filtered,  # 只返回普通actions
                "count": len(registered_normal_filtered),
                "total": len(registered_normal),
                "total_count_with_api": len(all_registered_filtered),  # 总数包含API actions
                "api_actions_count": len(registered_api)
            },
            message=f"Successfully refreshed {len(registered_normal_filtered)} action(s) (total: {len(registered_normal)}, with API: {len(all_registered)})",
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
        # 类型错误 - 动作参数缺少类型注解或其他类型问题
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
                message=f"Type error in user action: {error_msg}",
                code="500"
            )
        
    except Exception as e:
        # 其他错误 - 尽可能提供详细信息
        import traceback
        error_trace = traceback.format_exc()
        
        # 尝试从堆栈跟踪中提取文件和行号信息
        actions_dir = ACTIONS_DIR_TEMPLATE.format(ontology_id)
        lines = error_trace.split('\n')
        user_file_info = None
        for i, line in enumerate(lines):
            if 'File "' in line and actions_dir in line:
                # 找到用户动作文件的错误位置
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
                message=f"Failed to refresh actions: {type(e).__name__}: {str(e)}",
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
def list_registered_actions(ontology_id: str) -> ApiResponse:
    return ApiResponse(
        status="success",
        data={"actions": [
            {
                "name": a.name,
                "desc": a.description,
                "signature": {},  # filled by refresh return; here we only list basic info
                "filename": Path(a.module_path).name,
            }
            for a in list_actions(ontology_id)
            if getattr(getattr(a, "func", None), "__build_type__", getattr(a, "build_type", None) or "function") == "function"
        ]},
        message="Actions listed successfully",
        code="200"
    )

@router.get("/list_files")
async def list_files(ontology_id: str) -> ApiResponse:
    actions_dir = f"core/ontology/{ontology_id}/actions"
    return ApiResponse(
        status="success",
        data={"files": [f.name for f in Path(actions_dir).glob("*.py") if f.name != "setup.py"]},
        message="Files listed successfully",
        code="200"
    )


@router.post("/create_fun")
async def actions_create_fun(payload: GenerateFunctionRequest) -> ApiResponse:
    """
    根据入参生成 action 文件，保存到 core/ontology/{ontology_name}/actions/{file_name}.py
    - 固定导入: `import setup`, `from core.runtime.registry import Action`
    - 导入 used_objects 中的对象: from core.ontology.{ontology_name}.objects.{obj} import {Obj}
    - 生成模板函数（@Action 装饰），包含入参、出参注释和描述，主体使用 pass/return 占位
    """
    try:
        ontology_name = payload.ontology_name
        if not ontology_name:
            return ApiResponse(status="failed", message="ontology_name is required for actions", code="500")

        used_objects = payload.used_objects or []
        if not used_objects:
            return ApiResponse(status="failed", message="used_objects is required and must be non-empty for actions", code="500")
        action_name = payload.function_name
        fun_params = payload.fun_params or {}
        outputs = payload.outputs or {}
        fun_desc = payload.fun_desc or ""
        action_label = payload.function_label
        file_name = payload.file_name or action_name
        code_snippet = (payload.code or "")

        # 目录准备: core/ontology/{ontology}/actions
        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name, "actions"
        )
        os.makedirs(base_dir, exist_ok=True)

        # 确保 setup.py 存在（优先从模板复制）
        setup_py_path = os.path.join(base_dir, "setup.py")
        if not os.path.exists(setup_py_path):
            template_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", "test_ontology", "actions", "setup.py"
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
                    '路径设置模块 - 用于在actions目录作为工作空间时正确设置Python路径\n'
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

        # 目标文件名
        if not file_name.endswith(".py"):
            file_name = f"{file_name}.py"
        output_filename = os.path.join(base_dir, file_name)
        file_existed = os.path.exists(output_filename)

        # 读取现有文件内容
        existing_content = ""
        existing_imports = set()
        if file_existed:
            try:
                with open(output_filename, "r", encoding="utf-8") as f:
                    existing_content = f.read()
                for line in existing_content.split('\n'):
                    s = line.strip()
                    if s.startswith('import ') or s.startswith('from '):
                        existing_imports.add(s)
            except Exception:
                existing_content = ""
                existing_imports = set()

        # 构造 imports
        new_imports: List[str] = []
        setup_import = "import setup"
        if setup_import not in existing_imports:
            new_imports.append(setup_import)
        action_import = "from core.runtime.registry import Action"
        if action_import not in existing_imports:
            new_imports.append(action_import)
        if used_objects:
            for obj_name in used_objects:
                obj_import = f"from core.ontology.{ontology_name}.objects.{obj_name} import {obj_name}"
                if obj_import not in existing_imports:
                    new_imports.append(obj_import)

        # 参数串：将 used_objects 中的每个对象作为强制入参（名称为其小写或自定义规则）
        def to_param_name(cls_name: str) -> str:
            if not cls_name:
                return "obj"
            return cls_name[:1].lower() + cls_name[1:]

        object_params = {to_param_name(o): o for o in used_objects}

        # 适配新的 fun_params 结构，与 functions_create_api 保持一致
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
                    # 向后兼容旧格式：直接给出类型字符串
                    t = str(pspec or "object").lower()
                    ann = type_map.get(t, "object")
                    is_req = True
                    desc = ""
                item = {"name": pname, "ann": ann, "desc": desc}
                if is_req:
                    required_fun_params.append(item)
                else:
                    optional_fun_params.append(item)

        # 构建参数签名：对象参数 + 必填业务参数 + 选填业务参数（默认 None）
        sig_parts: List[str] = []
        for name, type_ in object_params.items():
            sig_parts.append(f"{name}: {type_}")
        for it in required_fun_params:
            sig_parts.append(f"{it['name']}: {it['ann']}")
        for it in optional_fun_params:
            sig_parts.append(f"{it['name']}: {it['ann']} = None")
        params_sig = ", ".join(sig_parts)

        # 生成 action 函数代码（支持外部提供完整代码片段）
        if code_snippet.strip():
            func_lines: List[str] = [ln.rstrip("\n") for ln in code_snippet.splitlines()]
        else:
            func_lines: List[str] = []
            # 绑定到首个对象：避免循环导入，使用装饰器元数据，在刷新时完成绑定
            bind_target = used_objects[0]
            func_lines.append(f"@Action(bind_to=\"{bind_target}\", build_type=\"function\")")
            func_lines.append(
                f"def {action_name}({params_sig}):" if params_sig else f"def {action_name}():"
            )
            doc_lines: List[str] = []
            doc_lines.append('    """')
            doc_lines.append(f"    @action_label: {action_label}")
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
            func_lines.extend(doc_lines)
            func_lines.append("    # 在此处编辑你的逻辑")
            if outputs:
                func_lines.append("    pass")
            else:
                func_lines.append("    return \"success\"")

        # 组装最终内容
        if file_existed:
            final_lines = []
            if new_imports:
                existing_lines = existing_content.split('\n')
                import_inserted = False
                for i, line in enumerate(existing_lines):
                    final_lines.append(line)
                    if not import_inserted and (line.strip().startswith('import ') or line.strip().startswith('from ')):
                        j = i + 1
                        while j < len(existing_lines) and (existing_lines[j].strip().startswith('import ') or existing_lines[j].strip().startswith('from ')):
                            j += 1
                        if j < len(existing_lines):
                            for imp in new_imports:
                                final_lines.append(imp)
                            import_inserted = True
                if not import_inserted:
                    final_lines = new_imports + [""] + final_lines
            else:
                final_lines = existing_content.split('\n')

            if final_lines and final_lines[-1].strip():
                final_lines.append("")
            final_lines.append("")
            final_lines.extend(func_lines)
            final_code = "\n".join(final_lines) + "\n"
        else:
            code_lines = new_imports + [""] + func_lines
            final_code = "\n".join(code_lines) + "\n"

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(final_code)

        # 刷新 actions 注册
        try:
            refresh_actions(ontology_name, base_dir)
        except Exception:
            pass

        message = "Action file overwritten" if file_existed else "Action file created"
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


class ActionDeleteRequest(BaseModel):
    ontology_name: str
    action_name: str


@router.post("/delete_fun")
async def actions_delete_api(payload: ActionDeleteRequest) -> ApiResponse:
    """
    删除 core/ontology/{ontology_name}/actions 下文件中的某个 @Action 装饰的函数。
    - 若删除的是文件中最后一个 @Action，则删除该文件。
    - 删除后会刷新 actions 注册与动态绑定。
    """
    try:
        ontology_name = payload.ontology_name
        action_name = payload.action_name
        actions_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name, "actions"
        )
        if not os.path.isdir(actions_dir):
            return ApiResponse(status="success", message=f"Actions dir already does not exist; nothing to delete: {actions_dir}", code="200")

        target_file: Optional[str] = None
        modified = False
        file_deleted = False

        for py in sorted(Path(actions_dir).glob("*.py")):
            if py.name == "setup.py":
                continue
            try:
                content = py.read_text(encoding="utf-8")
            except Exception:
                continue

            lines = content.split("\n")
            n = len(lines)
            i = 0
            while i < n:
                line = lines[i]
                if line.strip().startswith(f"def {action_name}("):
                    # Collect decorators above
                    start = i
                    j = i - 1
                    has_action_decorator = False
                    while j >= 0 and lines[j].strip().startswith("@"):
                        if "@Action" in lines[j].strip():
                            has_action_decorator = True
                        start = j
                        j -= 1
                    if not has_action_decorator:
                        # Not an action, skip this def occurrence
                        i += 1
                        continue
                    # Find block end: next unindented non-empty line (top-level)
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

                    # Delete the decorator+def block
                    del lines[start:k]

                    remaining = "\n".join(lines)
                    # If no other @Action remains, delete file
                    if "@Action" not in remaining:
                        try:
                            os.remove(str(py))
                            target_file = str(py)
                            modified = True
                            file_deleted = True
                            break
                        except Exception:
                            # Fallback: write updated content instead
                            py.write_text(remaining if remaining.endswith("\n") else remaining + "\n", encoding="utf-8")
                            target_file = str(py)
                            modified = True
                            file_deleted = False
                            break
                    else:
                        # Write back updated content
                        py.write_text(remaining if remaining.endswith("\n") else remaining + "\n", encoding="utf-8")
                        target_file = str(py)
                        modified = True
                        file_deleted = False
                        break
                i += 1

            if modified:
                break

        if not modified:
            return ApiResponse(status="failed", message=f"Action '{action_name}' not found under {actions_dir}", code="500")

        # Refresh actions registry/bindings
        try:
            refresh_actions(ontology_name, actions_dir)
        except Exception:
            pass

        msg = (
            f"Action '{action_name}' deleted and file removed: {target_file}"
            if file_deleted else
            f"Action '{action_name}' deleted from file: {target_file}"
        )
        return ApiResponse(status="success", data={"file_path": target_file, "file_deleted": file_deleted}, message=msg, code="200")
    except Exception as e:
        return ApiResponse(status="failed", message=f"Delete operation failed: {str(e)}", code="500")

class ActionParamModel(BaseModel):
    fieldName: Optional[str] = None
    attributeName: Optional[str] = None
    property: Optional[str] = None
    name: Optional[str] = None
    paramRequired: Optional[Any] = None

    class Config:
        extra = "allow"


class ActionObjectTypeModel(BaseModel):
    objectTypeName: Optional[str] = None

    class Config:
        extra = "allow"


class ActionApplyCore(BaseModel):
    ontology_name: Optional[str] = None
    ontologyName: Optional[str] = None
    object_name: Optional[str] = None
    objectName: Optional[str] = None
    objectType: Optional[ActionObjectTypeModel] = None
    status: Optional[int] = 1
    actionName: str
    actionLabel: Optional[str] = ""
    actionDesc: Optional[str] = ""
    actionType: Optional[str] = None  # create|update|delete (delete ignored here; separate API handles deletion)
    params: Optional[List[ActionParamModel]] = None
    functionInfo: Optional[Dict[str, Any]] = None  # {"name": str, "params": {k: v}}

    class Config:
        extra = "allow"


class ActionApplyRequest(BaseModel):
    # 支持两种形态：顶层字段或 data 包裹
    data: Optional[ActionApplyCore] = None
    # 顶层等价字段（全部可选）
    ontology_name: Optional[str] = None
    ontologyName: Optional[str] = None
    object_name: Optional[str] = None
    objectName: Optional[str] = None
    objectType: Optional[ActionObjectTypeModel] = None
    status: Optional[int] = 1
    actionName: Optional[str] = None
    actionLabel: Optional[str] = ""
    actionDesc: Optional[str] = ""
    actionType: Optional[str] = None
    params: Optional[List[ActionParamModel]] = None
    functionInfo: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"


@router.post("/create_obj")
async def action_create_obj(payload: ActionApplyRequest) -> ApiResponse:
    """
    在对象类文件 core/ontology/{ontology_name}/objects/{object}.py 中新增/更新/删除 action 方法。

    约定：
    - 如果 actionType == "delete" 或 status == 0，则删除该方法；否则创建/覆盖该方法。
    - 方法名使用 actionName 原样生成。
    - CRUD 默认委托到 OntologyObject 基类：create()/update_by_pk()/delete_by_pk()

    期望入参（两种形态均可）：
    1) 直接传：{
         "ontology_name": "test_ontology",
         "object_name": "PRODUCTS",
         "status": 1,
         "actionName": "CreateProduct",
         "actionLabel": "创建产品",
         "actionDesc": "创建产品",
         "actionType": "create",  # create|update|delete
         "params": [{"fieldName": "name", "paramRequired": 1}, ...]
       }
    2) 外层包装为 { "data": { ...同上... } }
    """
    from core.runtime.loader import refresh_objects
    try:
        core: ActionApplyCore = payload.data if payload.data is not None else payload

        ontology_name = core.ontology_name or core.ontologyName
        object_name = core.object_name or core.objectName or (core.objectType.objectTypeName if core.objectType else None)
        status = core.status or 1
        action_name = core.actionName
        action_label = core.actionLabel or ""
        action_desc = core.actionDesc or ""
        action_type = (core.actionType or "").lower()
        params = list(core.params or [])
        function_info = dict(core.functionInfo or {})

        if not ontology_name:
            return ApiResponse(status="failed", message="Missing 'ontology_name' in request", code="500")
        if not object_name:
            return ApiResponse(status="failed", message="Missing 'object_name' (or objectType.objectTypeName) in request", code="500")
        if not action_name:
            return ApiResponse(status="failed", message="Missing 'actionName' in request", code="500")

        # New behavior: generate action file under actions folder and bind via decorator
        # Build actions dir: core/ontology/{ontology_name}/actions
        actions_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name, "actions"
        )
        os.makedirs(actions_dir, exist_ok=True)

        # Ensure setup.py exists
        setup_py_path = os.path.join(actions_dir, "setup.py")
        if not os.path.exists(setup_py_path):
            template_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology", "test_ontology", "actions", "setup.py"
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
                    '路径设置模块 - 用于在actions目录作为工作空间时正确设置Python路径\n'
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

        # Compute filename: Object_Action.py
        file_name = f"{object_name}_actions.py"
        output_filename = os.path.join(actions_dir, file_name)

        # No required-field validation for action_create_obj; accept whatever user passes

        # Helper: object param name
        def to_param_name(cls_name: str) -> str:
            if not cls_name:
                return "obj"
            return cls_name[:1].lower() + cls_name[1:]

        obj_param = to_param_name(object_name)

        # Build action function file contents
        code_lines: List[str] = []
        code_lines.append("import setup")
        code_lines.append("from typing import Any, Dict")
        code_lines.append("from core.runtime.registry import Action")
        code_lines.append(f"from core.ontology.{ontology_name}.objects.{object_name} import {object_name}")
        code_lines.append("")
        code_lines.append(f"@Action(bind_to=\"{object_name}\", build_type=\"object\")")
        if action_type in ("", "create"):
            code_lines.append(f"def {action_name}({obj_param}: {object_name}, data: Dict[str, Any]) -> int:")
        elif action_type == "update":
            code_lines.append(f"def {action_name}({obj_param}: {object_name}, pk_value: Any, updates: Dict[str, Any]) -> int:")
        elif action_type == "delete":
            code_lines.append(f"def {action_name}({obj_param}: {object_name}, pk_value: Any) -> int:")
        else:
            return ApiResponse(status="failed", message=f"Unknown actionType: {action_type}. Expect one of create|update|delete", code="500")
        # Docstring
        title = action_label or action_desc or action_name
        code_lines.append("    \"\"\"")
        code_lines.append(f"    {title}")
        if action_desc and action_label != action_desc:
            code_lines.append(f"    {action_desc}")
        code_lines.append(f"    [auto-generated action: {action_type or 'create'}]")
        
        # Add parameter details if params is provided
        if params:
            code_lines.append("")
            if action_type in ("", "create"):
                code_lines.append("    Args:")
                code_lines.append(f"        {obj_param}: {object_name} instance")
                code_lines.append("        data: Dict containing:")
            elif action_type == "update":
                code_lines.append("    Args:")
                code_lines.append(f"        {obj_param}: {object_name} instance")
                code_lines.append("        pk_value: Primary key value")
                code_lines.append("        updates: Dict containing:")
            elif action_type == "delete":
                code_lines.append("    Args:")
                code_lines.append(f"        {obj_param}: {object_name} instance")
                code_lines.append("        pk_value: Primary key value")
            
            # Add field details for create and update actions
            if action_type in ("", "create", "update"):
                for p in params:
                    fname = p.fieldName or p.attributeName or p.property or p.name
                    req_flag = p.paramRequired
                    if fname:
                        is_required = "(required)" if (req_flag == 1 or req_flag is True) else "(optional)"
                        code_lines.append(f"            - {fname}: {is_required}")
        
        code_lines.append("    \"\"\"")
        # Delegate directly without required-field validation
        if action_type in ("", "create"):
            code_lines.append(f"    return {obj_param}.create(data, ontology_name='{ontology_name}', object_type_name='{object_name}')")
        elif action_type == "update":
            code_lines.append(f"    return {obj_param}.update_by_pk(pk_value, updates, ontology_name='{ontology_name}', object_type_name='{object_name}')")
        elif action_type == "delete":
            code_lines.append(f"    return {obj_param}.delete_by_pk(pk_value, ontology_name='{ontology_name}', object_type_name='{object_name}')")

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write("\n".join(code_lines) + "\n")

        # Refresh actions registry/bindings
        try:
            refresh_actions(ontology_name, actions_dir)
        except Exception:
            pass

        return ApiResponse(
            status="success",
            data={"output_filename": output_filename},
            message="Action file created",
            code="200"
        )

        # 目标对象类文件
        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name, "objects"
        )
        target_file = os.path.join(base_dir, f"{object_name}.py")

        if not os.path.exists(target_file):
            return ApiResponse(status="failed", message=f"Object class file not found: {target_file}", code="500")

        # 读取文件
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()

        # 确保 typing 导入（避免重复太激进的合并，简单兜底插入一条）
        if "from typing import" not in content or ("Any" not in content or "Dict" not in content):
            # 尝试插入到第一条 import 之前/之后
            lines = content.split("\n")
            inserted = False
            for i, line in enumerate(lines):
                if line.startswith("from ") or line.startswith("import "):
                    # 在第一段 import 之前插入
                    lines.insert(i, "from typing import Any, Dict")
                    inserted = True
                    break
            if not inserted:
                lines.insert(0, "from typing import Any, Dict")
            content = "\n".join(lines)

        # 在类定义中增删方法
        lines = content.split("\n")
        class_header = f"class {object_name}(OntologyObject):"
        try:
            cls_idx = next(i for i, ln in enumerate(lines) if ln.strip().startswith(class_header))
        except StopIteration:
            return ApiResponse(status="failed", message=f"Class header not found: {class_header} in {target_file}", code="500")

        # 定位类体的起止区域（简单策略：直到遇到下一个顶级 class/def 或文件结束）
        class_body_start = cls_idx + 1
        i = class_body_start
        class_end = len(lines)
        while i < len(lines):
            ln = lines[i]
            if ln and not ln.startswith(" ") and not ln.startswith("\t"):
                class_end = i
                break
            i += 1

        # 侦测类体缩进与方法体缩进
        indent_class = None
        for k in range(class_body_start, class_end):
            sample = lines[k]
            if sample.strip() == "":
                continue
            if sample.startswith(" ") or sample.startswith("\t"):
                indent_class = sample[: len(sample) - len(sample.lstrip())]
                break
        if indent_class is None:
            indent_class = "    "
        indent_unit = "\t" if "\t" in indent_class else "    "
        indent_method = indent_class  # def 行与类体同缩进
        indent_body = indent_class + indent_unit
        indent_body2 = indent_body + indent_unit

        # 在类体内查找已有同名方法，若存在则移除整个方法块（含其缩进行）
        def_line_prefix = f"{indent_method}def {action_name}("
        method_start = None
        method_end = None
        j = class_body_start
        while j < class_end:
            ln = lines[j]
            if ln.startswith(def_line_prefix) or ln.strip().startswith(f"def {action_name}("):
                method_start = j
                # 向下扫描到下一个非缩进行（或装饰器不考虑，因为这里不生成装饰器）
                k = j + 1
                while k < class_end:
                    nxt = lines[k]
                    if nxt and not nxt.startswith(indent_class):
                        break
                    k += 1
                method_end = k
                break
            j += 1

        # 如果是删除操作，或者显式 status == 0
        # is_delete = (action_type == "delete") or (status == 0)
        # if is_delete:
        #     if method_start is None:
        #         return {"status": "error", "message": f"Action method '{action_name}' not found to delete in {target_file}"}
        #     # 删除方法块与其前面可能的空行
        #     del lines[method_start:method_end]
        #     # 清理多余空行（最多两行）
        #     if method_start - 1 >= class_body_start and lines[method_start - 1].strip() == "":
        #         del lines[method_start - 1]
        #     content_out = "\n".join(lines)
        #     with open(target_file, "w", encoding="utf-8") as f:
        #         f.write(content_out if content_out.endswith("\n") else content_out + "\n")

        #     try:
        #         refresh_objects(ontology_name)
        #     except Exception:
        #         pass
        #     return {"status": "success", "message": f"Action '{action_name}' deleted from {target_file}", "file_path": target_file}

        # 生成方法代码
        required_fields = []
        try:
            for p in params:
                # 支持多种命名：fieldName 或 attributeName/property/name
                fname = p.fieldName or p.attributeName or p.property or p.name
                req_flag = p.paramRequired
                if fname and (req_flag == 1 or req_flag is True):
                    required_fields.append(str(fname))
        except Exception:
            required_fields = []

        method_lines: List[str] = []
        # 若挂载函数：签名基于函数的 params；否则根据 actionType 默认签名
        if function_info:
            fn_name = str(function_info.get("name") or "").strip()
            fn_params_types: Dict[str, Any] = function_info.get("params") or {}
            # 参数类型映射
            type_map = {
                "str": "str", "string": "str",
                "int": "int", "integer": "int",
                "float": "float", "double": "float", "number": "float",
                "bool": "bool", "boolean": "bool",
                "dict": "Dict[str, Any]", "object": "Dict[str, Any]", "map": "Dict[str, Any]",
                "list": "List[Any]", "array": "List[Any]",
                "any": "Any",
            }
            sig_parts: List[str] = []
            needs_list = False
            for pname, ptype in fn_params_types.items():
                t = str(ptype or "any").lower()
                ann = type_map.get(t, "Any")
                if ann.startswith("List["):
                    needs_list = True
                sig_parts.append(f"{pname}: {ann}")
            params_sig = ", ".join(sig_parts)
            # 如果需要 List，确保 typing 已导入
            if needs_list and "from typing import List" not in content:
                # 在第一段 import 之前插入
                ins_idx = 0
                for i2, l2 in enumerate(lines):
                    if l2.startswith("from ") or l2.startswith("import "):
                        ins_idx = i2
                        break
                lines.insert(ins_idx, "from typing import List")
                content = "\n".join(lines)
            # 生成方法签名（异步，便于 await 执行函数）
            method_lines.append(f"{indent_method}async def {action_name}(self{', ' + params_sig if params_sig else ''}) -> Any:")
        else:
            method_lines.append(f"{indent_method}def {action_name}(self, data: Dict[str, Any]) -> int:")
            if action_type == "update":
                method_lines[0] = f"{indent_method}def {action_name}(self, pk_value: Any, updates: Dict[str, Any]) -> int:"
            elif action_type == "delete":
                method_lines[0] = f"{indent_method}def {action_name}(self, pk_value: Any) -> int:"

        # Docstring
        doc = []
        doc.append(f"{indent_body}\"\"\"")
        title = action_label or action_desc or action_name
        doc.append(f"{indent_body}{title}")
        if action_desc and action_label != action_desc:
            doc.append(f"{indent_body}{action_desc}")
        if function_info:
            doc.append(f"{indent_body}[auto-generated action: function '{fn_name}']")
        else:
            doc.append(f"{indent_body}[auto-generated action: {action_type or 'create'}]")
        
        # Add parameter details if params is provided
        if params and not function_info:
            doc.append(f"{indent_body}")
            doc.append(f"{indent_body}Args:")
            doc.append(f"{indent_body}    self: {object_name} instance")
            if action_type in ("", "create"):
                doc.append(f"{indent_body}    data: Dict containing:")
            elif action_type == "update":
                doc.append(f"{indent_body}    pk_value: Primary key value")
                doc.append(f"{indent_body}    updates: Dict containing:")
            elif action_type == "delete":
                doc.append(f"{indent_body}    pk_value: Primary key value")
            
            # Add field details for create and update actions
            if action_type in ("", "create", "update"):
                for p in params:
                    fname = p.fieldName or p.attributeName or p.property or p.name
                    req_flag = p.paramRequired
                    if fname:
                        is_required = "(required)" if (req_flag == 1 or req_flag is True) else "(optional)"
                        doc.append(f"{indent_body}        - {fname}: {is_required}")
        
        doc.append(f"{indent_body}\"\"\"")
        method_lines.extend(doc)

        # 校验与委托
        if function_info:
            # 直接导入并调用指定函数：from core.ontology.{ontology}.functions.{module} import {fn_name}
            module_name = (
                function_info.get("module")
                or function_info.get("file")
                or function_info.get("file_name")
                or function_info.get("module_name")
            )
            if not module_name:
                return ApiResponse(status="failed", message="function_info.module (or file/file_name) is required for direct import", code="500")

            method_lines.append(
                f"{indent_body}from core.ontology.{ontology_name}.logics.{module_name} import {fn_name} as __fn"
            )
            method_lines.append(f"{indent_body}import inspect as __inspect")

            keys = list((function_info.get('params') or {}).keys())
            if keys:
                arglist = ", ".join([f"{k}={k}" for k in keys])
                method_lines.append(f"{indent_body}__res = __fn({arglist})")
            else:
                method_lines.append(f"{indent_body}__res = __fn()")
            # method_lines.append(f"{indent_body}if __inspect.isawaitable(__res):")
            # method_lines.append(f"{indent_body2}return await __res")
            method_lines.append(f"{indent_body}return __res")
        else:
            if action_type in ("", "create"):
                if required_fields:
                    method_lines.append(f"{indent_body}required_fields = [" + ", ".join([repr(x) for x in required_fields]) + "]")
                    method_lines.append(f"{indent_body}for _attr in required_fields:")
                    method_lines.append(f"{indent_body2}if _attr not in data or data.get(_attr) is None:")
                    method_lines.append(f"{indent_body2}{indent_unit}raise ValueError(f\"Missing required field: {{_attr}}\")")
                method_lines.append(f"{indent_body}return self.create(data, ontology_name='{ontology_name}', object_type_name='{object_name}')")
            elif action_type == "update":
                if required_fields:
                    method_lines.append(f"{indent_body}required_update_fields = [" + ", ".join([repr(x) for x in required_fields]) + "]")
                    method_lines.append(f"{indent_body}for _attr in required_update_fields:")
                    method_lines.append(f"{indent_body2}if _attr not in updates:")
                    method_lines.append(f"{indent_body2}{indent_unit}raise ValueError(f\"Missing required update field: {{_attr}}\")")
                method_lines.append(f"{indent_body}return self.update_by_pk(pk_value, updates, ontology_name='{ontology_name}', object_type_name='{object_name}')")
            elif action_type == "delete":
                method_lines.append(f"{indent_body}return self.delete_by_pk(pk_value, ontology_name='{ontology_name}', object_type_name='{object_name}')")
            else:
                return ApiResponse(status="failed", message=f"Unknown actionType: {action_type}. Expect one of create|update|delete", code="500")

        # 如果已存在相同方法，先删除再添加
        if method_start is not None:
            del lines[method_start:method_end]
            # 去除方法块前的多余空行
            if method_start - 1 >= class_body_start and lines[method_start - 1].strip() == "":
                del lines[method_start - 1]
            insert_at = method_start
        else:
            # 追加到类体末尾，确保类体与方法间空一行
            insert_at = class_end
            if insert_at > class_body_start and (insert_at - 1) < len(lines) and lines[insert_at - 1].strip() != "":
                lines.insert(insert_at, "")
                insert_at += 1

        # 插入方法代码并写回
        for idx, ml in enumerate(method_lines):
            lines.insert(insert_at + idx, ml)

        content_out = "\n".join(lines)
        if not content_out.endswith("\n"):
            content_out += "\n"

        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content_out)

        # 刷新对象，便于后续导入与缓存
        try:
            refresh_objects(ontology_name)
        except Exception:
            pass

        return ApiResponse(
            status="success",
            message=f"Action '{action_name}' applied to {target_file}",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Action apply failed: {str(e)}",
            code="500"
        )


class ApiDefinitionUpdateRequest(BaseModel):
    """Request model for updating all actions that reference a specific API"""
    api_name: str  # The unique API name to find and update
    api_info: ApiInfoModel  # Updated API info (must have matching api_name)


class ActionDeleteInfo(BaseModel):
    action_name: str
    object_type_name: str


class ActionDeleteBatchRequest(BaseModel):
    ontology_name: str
    action_info: List[ActionDeleteInfo]


@router.post("/delete_obj_action")
async def action_delete_obj(payload: ActionDeleteBatchRequest) -> ApiResponse:

    """
    批量删除对象类中的 action 方法。

    入参：
    - ontology_name: 目标本体名
    - action_info: 列表，每项包含 {"action_name": str, "object_type_name": str}
    """
    from core.runtime.loader import refresh_objects
    try:
        ontology_name = payload.ontology_name
        results: List[Dict[str, Any]] = []

        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology", ontology_name, "objects"
        )

        for item in payload.action_info:
            action_name = item.action_name
            object_name = item.object_type_name
            target_file = os.path.join(base_dir, f"{object_name}.py")

            if not os.path.exists(target_file):
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "success",
                    "message": f"Object class file already does not exist; nothing to delete: {target_file}",
                    "file_path": target_file,
                })
                continue

            try:
                with open(target_file, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as ex:
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "error",
                    "message": f"Read failed: {ex}",
                })
                continue

            lines = content.split("\n")
            class_header = f"class {object_name}(OntologyObject):"

            # 定位类
            try:
                cls_idx = next(i for i, ln in enumerate(lines) if ln.strip().startswith(class_header))
            except StopIteration:
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "error",
                    "message": f"Class header not found: {class_header}",
                })
                continue

            class_body_start = cls_idx + 1
            i = class_body_start
            class_end = len(lines)
            while i < len(lines):
                ln = lines[i]
                if ln and not ln.startswith(" ") and not ln.startswith("\t"):
                    class_end = i
                    break
                i += 1

            # 查找方法
            def_line_prefix = f"    def {action_name}("
            method_start = None
            method_end = None
            j = class_body_start
            while j < class_end:
                ln = lines[j]
                if ln.startswith(def_line_prefix) or ln.strip().startswith(f"def {action_name}("):
                    method_start = j
                    k = j + 1
                    while k < class_end:
                        nxt = lines[k]
                        if nxt and not nxt.startswith("    "):
                            break
                        k += 1
                    method_end = k
                    break
                j += 1

            if method_start is None:
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "error",
                    "message": f"Action method '{action_name}' not found in class {object_name}",
                })
                continue

            # 删除方法块
            del lines[method_start:method_end]
            if method_start - 1 >= class_body_start and lines[method_start - 1].strip() == "":
                del lines[method_start - 1]

            content_out = "\n".join(lines)
            if not content_out.endswith("\n"):
                content_out += "\n"

            try:
                with open(target_file, "w", encoding="utf-8") as f:
                    f.write(content_out)
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "success",
                    "message": f"Action '{action_name}' deleted from {target_file}",
                    "file_path": target_file,
                })
            except Exception as ex:
                results.append({
                    "object": object_name,
                    "action": action_name,
                    "status": "error",
                    "message": f"Write failed: {ex}",
                })

        # 刷新对象
        try:
            refresh_objects(ontology_name)
        except Exception:
            pass

        return ApiResponse(
            status="success",
            data={"results": results},
            message="Action delete batch successful",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Action delete failed: {str(e)}",
            code="500"
        )


# --------------------
# Unified delete API
# --------------------

class UnifiedActionDeleteRequest(BaseModel):
    ontology_name: str
    action_name: str
    object_type_name: Optional[str] = None  # 提供则优先尝试对象类中删除


def _delete_from_actions_dir(ontology_name: str, action_name: str) -> Dict[str, Any]:
    actions_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "core", "ontology", ontology_name, "actions"
    )
    if not os.path.isdir(actions_dir):
        return {"modified": False, "reason": f"Actions dir not found: {actions_dir}"}

    target_file: Optional[str] = None
    modified = False
    file_deleted = False

    for py in sorted(Path(actions_dir).glob("*.py")):
        if py.name == "setup.py":
            continue
        try:
            content = py.read_text(encoding="utf-8")
        except Exception:
            continue

        lines = content.split("\n")
        n = len(lines)
        i = 0
        while i < n:
            line = lines[i]
            if line.strip().startswith(f"def {action_name}("):
                # Collect decorators above
                start = i
                j = i - 1
                has_action_decorator = False
                while j >= 0 and lines[j].strip().startswith("@"):
                    if "@Action" in lines[j].strip():
                        has_action_decorator = True
                    start = j
                    j -= 1
                if not has_action_decorator:
                    i += 1
                    continue
                # Find block end
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

                del lines[start:k]

                remaining = "\n".join(lines)
                if "@Action" not in remaining:
                    try:
                        os.remove(str(py))
                        target_file = str(py)
                        modified = True
                        file_deleted = True
                        break
                    except Exception:
                        py.write_text(remaining if remaining.endswith("\n") else remaining + "\n", encoding="utf-8")
                        target_file = str(py)
                        modified = True
                        file_deleted = False
                        break
                else:
                    py.write_text(remaining if remaining.endswith("\n") else remaining + "\n", encoding="utf-8")
                    target_file = str(py)
                    modified = True
                    file_deleted = False
                    break
            i += 1

        if modified:
            break

    return {
        "modified": modified,
        "file_deleted": file_deleted,
        "target_file": target_file,
        "actions_dir": actions_dir,
    }


def _delete_from_object_file(ontology_name: str, action_name: str, object_type_name: Optional[str]) -> Dict[str, Any]:
    if not object_type_name:
        return {"modified": False, "reason": "object_type_name not provided"}
    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "core", "ontology", ontology_name, "objects"
    )
    target_file = os.path.join(base_dir, f"{object_type_name}.py")
    if not os.path.exists(target_file):
        return {"modified": False, "reason": f"Object class file not found: {target_file}"}

    try:
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as ex:
        return {"modified": False, "reason": f"Read failed: {ex}"}

    lines = content.split("\n")
    class_header = f"class {object_type_name}(OntologyObject):"
    try:
        cls_idx = next(i for i, ln in enumerate(lines) if ln.strip().startswith(class_header))
    except StopIteration:
        return {"modified": False, "reason": f"Class header not found: {class_header}"}

    class_body_start = cls_idx + 1
    i = class_body_start
    class_end = len(lines)
    while i < len(lines):
        ln = lines[i]
        if ln and not ln.startswith(" ") and not ln.startswith("\t"):
            class_end = i
            break
        i += 1

    def_line_prefix = f"    def {action_name}("
    method_start = None
    method_end = None
    j = class_body_start
    while j < class_end:
        ln = lines[j]
        if ln.startswith(def_line_prefix) or ln.strip().startswith(f"def {action_name}("):
            method_start = j
            k = j + 1
            while k < class_end:
                nxt = lines[k]
                if nxt and not nxt.startswith("    "):
                    break
                k += 1
            method_end = k
            break
        j += 1

    if method_start is None:
        return {"modified": False, "reason": f"Action method '{action_name}' not found in class {object_type_name}"}

    del lines[method_start:method_end]
    if method_start - 1 >= class_body_start and lines[method_start - 1].strip() == "":
        del lines[method_start - 1]

    content_out = "\n".join(lines)
    if not content_out.endswith("\n"):
        content_out += "\n"

    try:
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content_out)
    except Exception as ex:
        return {"modified": False, "reason": f"Write failed: {ex}"}

    return {"modified": True, "file_deleted": False, "target_file": target_file, "objects_dir": base_dir}


@router.post("/delete")
async def actions_delete_unified_batch(payload: ActionDeleteBatchRequest) -> ApiResponse:
    """
    批量删除（统一入口）：同一 ontology 下删除多个 action。
    - 对每个 action_info 项：若带 object_type_name，优先对象类删除，否则优先 actions 目录删除；失败则相互回退。
    - 每次删除成功后刷新对应注册（objects 或 actions）。
    """
    results: List[Dict[str, Any]] = []
    try:
        ontology_name = payload.ontology_name
        for item in payload.action_info:
            action_name = item.action_name
            object_type_name = item.object_type_name
            try:
                # 决策顺序
                if object_type_name:
                    res_obj = _delete_from_object_file(ontology_name, action_name, object_type_name)
                    if res_obj.get("modified"):
                        try:
                            from core.runtime.loader import refresh_objects
                            refresh_objects(ontology_name)
                        except Exception:
                            pass
                        results.append({
                            "action": action_name,
                            "object": object_type_name,
                            "status": "success",
                            "route": "object",
                            "file_path": res_obj.get("target_file"),
                            "file_deleted": False,
                        })
                        continue
                    res_act = _delete_from_actions_dir(ontology_name, action_name)
                    if res_act.get("modified"):
                        try:
                            refresh_actions(ontology_name, res_act.get("actions_dir") or "")
                        except Exception:
                            pass
                        results.append({
                            "action": action_name,
                            "object": object_type_name,
                            "status": "success",
                            "route": "actions_dir",
                            "file_path": res_act.get("target_file"),
                            "file_deleted": res_act.get("file_deleted"),
                        })
                    else:
                        reason_obj = res_obj.get("reason")
                        reason_act = res_act.get("reason")
                        if reason_obj and reason_obj.startswith("Object class file not found:"):
                            results.append({
                                "action": action_name,
                                "object": object_type_name,
                                "status": "success",
                                "route": "object",
                                "message": f"{reason_obj} (already absent)",
                            })
                        elif reason_act and reason_act.startswith("Actions dir not found:"):
                            results.append({
                                "action": action_name,
                                "object": object_type_name,
                                "status": "success",
                                "route": "actions_dir",
                                "message": f"{reason_act} (already absent)",
                            })
                        else:
                            reason = reason_obj or reason_act or "not found"
                            results.append({
                                "action": action_name,
                                "object": object_type_name,
                                "status": "failed",
                                "reason": reason,
                            })
                else:
                    res_act = _delete_from_actions_dir(ontology_name, action_name)
                    if res_act.get("modified"):
                        try:
                            refresh_actions(ontology_name, res_act.get("actions_dir") or "")
                        except Exception:
                            pass
                        results.append({
                            "action": action_name,
                            "status": "success",
                            "route": "actions_dir",
                            "file_path": res_act.get("target_file"),
                            "file_deleted": res_act.get("file_deleted"),
                        })
                    else:
                        reason_act = res_act.get("reason")
                        if reason_act and reason_act.startswith("Actions dir not found:"):
                            results.append({
                                "action": action_name,
                                "status": "success",
                                "route": "actions_dir",
                                "message": f"{reason_act} (already absent)",
                            })
                        else:
                            results.append({
                                "action": action_name,
                                "status": "failed",
                                "reason": reason_act or "not found",
                            })
            except Exception as ie:
                results.append({
                    "action": item.action_name,
                    "object": item.object_type_name,
                    "status": "failed",
                    "reason": str(ie),
                })
        return ApiResponse(status="success", code="200", data={"results": results}, message="Batch delete completed")
    except Exception as e:
        return ApiResponse(status="failed", code="500", message=f"Batch delete failed: {str(e)}")



@router.post("/create_api")
async def actions_create_api(payload: GenerateFunctionRequest) -> ApiResponse:
    """
    创建 API 类型的 action 文件，保存到 core/ontology_apis/{ontology_name}/actions/{file_name}.py
    - 与 function 的 API 类型类似，但保存在 actions 目录下
    - 使用 @Action 装饰器而不是 @Function
    - 自动生成 API 调用包装代码
    - 需要在 used_objects 中指定绑定的对象
    """
    try:
        ontology_name = payload.ontology_name
        if not ontology_name:
            return ApiResponse(status="failed", message="ontology_name is required for API actions", code="500")

        used_objects = payload.used_objects or []
        if not used_objects:
            return ApiResponse(status="failed", message="used_objects is required for API actions (to specify bind_to object)", code="500")

        action_name = payload.function_name
        action_label = payload.function_label
        fun_desc = payload.fun_desc or ""
        api_info = payload.api_info
        bind_target = used_objects[0]  # 绑定到第一个对象

        if not api_info:
            return ApiResponse(status="failed", message="api_info is required for API type actions", code="500")

        # 目录准备: core/ontology_apis/{ontology_name}/actions/
        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "ontology_apis", ontology_name, "actions"
        )
        os.makedirs(base_dir, exist_ok=True)

        # 为 API 类型创建 __init__.py（在 actions 目录）
        init_py_path = os.path.join(base_dir, "__init__.py")
        if not os.path.exists(init_py_path):
            with open(init_py_path, "w", encoding="utf-8") as f:
                f.write("# Auto-generated package file for ontology API actions\n")
        
        # 同时在上级目录也创建 __init__.py
        parent_init = os.path.join(os.path.dirname(base_dir), "__init__.py")
        if not os.path.exists(parent_init):
            with open(parent_init, "w", encoding="utf-8") as f:
                f.write("# Auto-generated package file for ontology APIs\n")

        # API 类型统一使用 apis.py 文件名
        file_name = "apis.py"
        output_filename = os.path.join(base_dir, file_name)
        file_existed = os.path.exists(output_filename)

        # 读取现有文件内容
        existing_content = ""
        existing_imports = set()
        if file_existed:
            try:
                with open(output_filename, "r", encoding="utf-8") as f:
                    existing_content = f.read()
                for line in existing_content.split('\n'):
                    s = line.strip()
                    if s.startswith('import ') or s.startswith('from '):
                        existing_imports.add(s)
            except Exception:
                existing_content = ""
                existing_imports = set()

        # 构造 imports（API 类型不需要 setup import，但需要导入绑定的对象）
        new_imports: List[str] = []
        action_import = "from core.runtime.registry import Action"
        if action_import not in existing_imports:
            new_imports.append(action_import)
        
        # 导入绑定的对象类
        if used_objects:
            for obj_name in used_objects:
                obj_import = f"from core.ontology.{ontology_name}.objects.{obj_name} import {obj_name}"
                if obj_import not in existing_imports:
                    new_imports.append(obj_import)

        # 使用函数中的 API 包装器生成逻辑
        from routers.functions import _generate_api_wrapper_code
        
        api_wrapper_code = _generate_api_wrapper_code(
            action_name,
            api_info,
            action_label,
            fun_desc,
            api_info.timeout or 30
        )
        
        # 替换 @Function 为 @Action(bind_to="...", build_type="api")
        
        action_decorator = f'@Action(bind_to="{bind_target}", build_type="api")'
        api_wrapper_code = api_wrapper_code.replace("@Function", action_decorator)
        
        action_lines: List[str] = [ln.rstrip("\n") for ln in api_wrapper_code.splitlines()]

        # 组装最终内容
        if file_existed:
            final_lines = []
            if new_imports:
                existing_lines = existing_content.split('\n')
                import_inserted = False
                for i, line in enumerate(existing_lines):
                    final_lines.append(line)
                    if not import_inserted and (line.strip().startswith('import ') or line.strip().startswith('from ')):
                        j = i + 1
                        while j < len(existing_lines) and (existing_lines[j].strip().startswith('import ') or existing_lines[j].strip().startswith('from ')):
                            j += 1
                        if j < len(existing_lines):
                            for imp in new_imports:
                                final_lines.append(imp)
                            import_inserted = True
                if not import_inserted:
                    final_lines = new_imports + [""] + final_lines
            else:
                final_lines = existing_content.split('\n')

            if final_lines and final_lines[-1].strip():
                final_lines.append("")
            final_lines.append("")
            final_lines.extend(action_lines)
            final_code = "\n".join(final_lines) + "\n"
        else:
            code_lines = new_imports + [""] + action_lines
            final_code = "\n".join(code_lines) + "\n"

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(final_code)

        # 刷新 actions 注册（从 API actions 目录）
        try:
            api_actions_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "core", "ontology_apis", ontology_name, "actions"
            )
            refresh_actions(ontology_name, api_actions_dir)
        except Exception:
            pass

        message = "API action file overwritten" if file_existed else "API action file created"
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


def _extract_action_metadata(content: str) -> List[Dict[str, Any]]:
    """
    从文件内容中提取所有 action 的元数据
    返回: [{"name": str, "api_name": str, "label": str, "bind_to": str, "start_line": int, "end_line": int}]
    """
    import re
    
    actions = []
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 查找函数定义
        func_match = re.match(r'^def\s+(\w+)\s*\(', line)
        if func_match:
            func_name = func_match.group(1)
            start_line = i
            
            # 查找函数的 docstring 和装饰器以提取元数据
            api_name = None
            action_label = None
            bind_to = None
            
            # 向前查找装饰器
            j = i - 1
            decorator_start = i
            while j >= 0 and (lines[j].strip().startswith('@') or lines[j].strip() == ''):
                if lines[j].strip().startswith('@Action'):
                    decorator_start = j
                    # 提取 bind_to
                    bind_match = re.search(r'bind_to\s*=\s*["\'](\w+)["\']', lines[j])
                    if bind_match:
                        bind_to = bind_match.group(1)
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
            
            label_match = re.search(r'@(?:action_label|function_label):\s*(.+?)(?:@|API:|Timeout:|""")', docstring_text)
            if label_match:
                action_label = label_match.group(1).strip()
            
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
            
            actions.append({
                "name": func_name,
                "api_name": api_name,
                "label": action_label,
                "bind_to": bind_to,
                "start_line": decorator_start,  # 从装饰器开始
                "end_line": end_line
            })
        
        i += 1
    
    return actions


@router.post("/update/api_definition")
async def update_action_api_definition(payload: ApiDefinitionUpdateRequest) -> ApiResponse:
    """
    更新所有引用指定 API 的 actions（全局遍历所有本体）
    - 根据 api_name 查找所有引用该 API 的 actions
    - 遍历所有本体的 API actions 目录
    - 使用新的 API 信息重新生成所有这些 actions
    - 保持 action 名和 action_label、bind_to 不变
    - 支持工具函数参数的更新
    - 刷新 actions 注册
    """
    try:
        from routers.models import ApiInfoModel
        
        api_name = payload.api_name
        
        # 转换 api_info（如果是字典则转为 ApiInfoModel）
        if isinstance(payload.api_info, dict):
            new_api_info = ApiInfoModel(**payload.api_info)
        else:
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
        
        all_updated_actions = []
        updated_files = []
        
        # 遍历每个本体目录
        for ontology_dir in Path(ontology_apis_root).iterdir():
            if not ontology_dir.is_dir():
                continue
            
            ontology_name = ontology_dir.name
            actions_dir = ontology_dir / "actions"
            
            if not actions_dir.exists():
                continue
            
            # 扫描 actions 目录下的所有 Python 文件
            for py_file in actions_dir.glob("*.py"):
                if py_file.name == "__init__.py":
                    continue
                
                try:
                    # 读取文件内容
                    with open(py_file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # 提取所有 action 的元数据
                    actions_metadata = _extract_action_metadata(content)
                    
                    # 找到所有引用该 API 的 actions
                    matching_actions = [a for a in actions_metadata if a["api_name"] == api_name]
                    
                    if not matching_actions:
                        continue
                    
                    # 删除所有匹配的 actions
                    lines = content.split('\n')
                    new_lines = []
                    lines_to_skip = set()
                    
                    for action_meta in matching_actions:
                        # 标记要删除的行（包括装饰器）
                        start = action_meta["start_line"]
                        end = action_meta["end_line"]
                        
                        for line_num in range(start, end + 1):
                            lines_to_skip.add(line_num)
                    
                    # 构建新文件内容（删除旧 actions）
                    for i, line in enumerate(lines):
                        if i not in lines_to_skip:
                            new_lines.append(line)
                    
                    # 重新生成所有匹配的 actions
                    from routers.functions import _generate_api_wrapper_code
                    
                    for action_meta in matching_actions:
                        action_name = action_meta["name"]
                        action_label = action_meta["label"] or f"API Action: {action_name}"
                        bind_to = action_meta["bind_to"]
                        
                        if not bind_to:
                            # 如果没有找到 bind_to，跳过此 action
                            continue
                        
                        # 生成新的 action 代码（支持更新后的工具函数参数）
                        api_wrapper_code = _generate_api_wrapper_code(
                            action_name,
                            new_api_info,
                            action_label,
                            None,  # 使用 API 的描述
                            new_api_info.timeout or 30
                        )
                        
                        # 替换装饰器
                        action_decorator = f'@Action(bind_to="{bind_to}", build_type="api")'
                        api_wrapper_code = api_wrapper_code.replace("@Function", action_decorator)
                        
                        action_lines = [ln.rstrip("\n") for ln in api_wrapper_code.splitlines()]
                        
                        # 添加到文件末尾
                        if new_lines and new_lines[-1].strip():
                            new_lines.append("")
                        new_lines.append("")
                        new_lines.extend(action_lines)
                        
                        all_updated_actions.append(f"{ontology_name}.{action_name}")
                    
                    # 写回文件
                    final_code = "\n".join(new_lines) + "\n"
                    with open(py_file, "w", encoding="utf-8") as f:
                        f.write(final_code)
                    
                    updated_files.append(str(py_file))
                    
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to update file {py_file}: {e}")
                    continue
        
        if not all_updated_actions:
            return ApiResponse(
                status="success",
                message=f"No actions found that reference API '{api_name}'",
                code="200"
            )
        
        # 刷新所有涉及的本体的 actions 注册
        refreshed_ontologies = set()
        for ontology_dir in Path(ontology_apis_root).iterdir():
            if not ontology_dir.is_dir():
                continue
            ontology_name = ontology_dir.name
            actions_dir = ontology_dir / "actions"
            if actions_dir.exists():
                try:
                    refresh_actions(ontology_name, str(actions_dir))
                    refreshed_ontologies.add(ontology_name)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to refresh {ontology_name} actions after API update: {e}")
        
        return ApiResponse(
            status="success",
            data={
                "api_name": api_name,
                "updated_actions": all_updated_actions,
                "updated_files": updated_files,
                "refreshed_ontologies": list(refreshed_ontologies),
                "count": len(all_updated_actions)
            },
            message=f"Updated {len(all_updated_actions)} action(s) across {len(updated_files)} file(s) that reference API '{api_name}'",
            code="200"
        )
    except Exception as e:
        return ApiResponse(
            status="failed",
            message=f"Update operation failed: {str(e)}",
            code="500"
        )

from __future__ import annotations

import hashlib
import importlib.util
import sys
from pathlib import Path
from types import ModuleType
from typing import Dict, Set, Tuple, Optional, Callable, Any
import inspect
import ast

from core.runtime.registry import FunctionMeta, swap_registry, swap_actions_registry, _to_snake, _to_lower_camel


def refresh_objects(ontology_id: str) -> None:
    """Refresh imported object modules for a specific ontology.

    - Invalidate import caches
    - Remove cached modules under core/ontology/<ontology_id>/objects
    - Reinstall object aliases for the ontology
    """
    try:
        import importlib
        importlib.invalidate_caches()
    except Exception:
        pass

    objects_dir = Path(f"core/ontology/{ontology_id}/objects")
    if objects_dir.exists():
        abs_objects_dir = str(objects_dir.resolve())
        to_delete: list[str] = []
        for name, mod in list(sys.modules.items()):
            try:
                mod_file = getattr(mod, "__file__", None)
                if isinstance(mod_file, str) and mod_file.startswith(abs_objects_dir):
                    to_delete.append(name)
                    continue
                # Also purge alias modules core.ontology.objects.* that point to this ontology
                if name.startswith("core.ontology.objects."):
                    # Best-effort: drop alias to force reassignment on reinstall
                    to_delete.append(name)
            except Exception:
                continue
        for name in to_delete:
            sys.modules.pop(name, None)

    # Reinstall aliases so new files are importable under core.ontology.objects.*
    _install_objects_aliases(ontology_id)


def _module_name_for(path: Path) -> str:
    digest = hashlib.sha1(str(path).encode()).hexdigest()[:12]
    return f"user_func_{digest}"


def _load_module_from_file(path: Path) -> ModuleType:
    mod_name = _module_name_for(path)
    if mod_name in sys.modules:
        del sys.modules[mod_name]
    spec = importlib.util.spec_from_file_location(mod_name, str(path))
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load spec for module from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


def _safe_getsource(obj) -> str | None:
    try:
        return inspect.getsource(obj)
    except Exception:
        return None


def _annotation_to_str(tp) -> str:
    try:
        # Prefer class/type names
        name = getattr(tp, "__name__", None)
        if isinstance(name, str):
            return name
        # typing types
        n2 = getattr(tp, "_name", None)
        if isinstance(n2, str) and n2:
            return n2
        text = str(tp)
        return text.replace("typing.", "")
    except Exception:
        return "unknown"


def _param_types_json(fn) -> Dict[str, str]:
    sig = inspect.signature(fn)
    mapping: Dict[str, str] = {}
    func_name = getattr(fn, "__name__", "unknown")
    for p in sig.parameters.values():
        if p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue
        if p.name == "objects":
            # internal injection param, not part of external signature
            continue
        if p.annotation is inspect._empty:
            raise TypeError(f"Function '{func_name}' parameter '{p.name}' missing type annotation")
        mapping[p.name] = _annotation_to_str(p.annotation)
    return mapping


def _param_types_detail_json(fn) -> Dict[str, Dict[str, Any]]:
    sig = inspect.signature(fn)
    detail: Dict[str, Dict[str, Any]] = {}
    func_name = getattr(fn, "__name__", "unknown")
    for p in sig.parameters.values():
        if p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue
        if p.name == "objects":
            continue
        if p.annotation is inspect._empty:
            raise TypeError(f"Function '{func_name}' parameter '{p.name}' missing type annotation")
        detail[p.name] = {
            "type": _annotation_to_str(p.annotation),
            "is_required": p.default is inspect._empty,
            "desc": "",
        }
    return detail


def _install_objects_aliases(ontology_id: str) -> None:
    """Alias core.ontology.<oid>.objects.* to core.ontology.objects.* for user-friendly imports."""
    objects_dir = Path(f"core/ontology/{ontology_id}/objects")
    if not objects_dir.exists():
        return
    shared_objects_dir = Path("core/ontology/objects")
    # Ensure project root and 'core' namespace are importable
    try:
        core_dir = Path("core").resolve()
        project_root = core_dir.parent
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
        if "core" not in sys.modules:
            core_pkg = ModuleType("core")
            try:
                core_pkg.__path__ = [str(core_dir)]  # type: ignore[attr-defined]
            except Exception:
                pass
            sys.modules["core"] = core_pkg
    except Exception:
        pass
    # Ensure parent namespace modules exist
    if "core.ontology" not in sys.modules:
        pkg = ModuleType("core.ontology")
        try:
            pkg.__path__ = [str(Path("core/ontology").resolve())]  # type: ignore[attr-defined]
        except Exception:
            pass
        sys.modules["core.ontology"] = pkg
    # Ensure core.ontology.objects package exists and its __path__ includes both shared and ontology-specific dirs
    if "core.ontology.objects" not in sys.modules:
        obj_pkg = ModuleType("core.ontology.objects")
        try:
            obj_pkg.__path__ = [
                str(shared_objects_dir.resolve()),
                str(objects_dir.resolve()),
            ]  # type: ignore[attr-defined]
        except Exception:
            pass
        sys.modules["core.ontology.objects"] = obj_pkg
    else:
        try:
            obj_pkg = sys.modules["core.ontology.objects"]
            current_path = list(getattr(obj_pkg, "__path__", []))  # type: ignore[attr-defined]
            desired = [str(shared_objects_dir.resolve()), str(objects_dir.resolve())]
            # Prepend shared dir to prefer shared modules like base.py
            new_path = []
            for p in desired + current_path:
                if p not in new_path:
                    new_path.append(p)
            obj_pkg.__path__ = new_path  # type: ignore[attr-defined]
        except Exception:
            pass

    # Walk objects dir and alias submodules (import base.py first to satisfy dependencies)
    py_files = list(objects_dir.rglob("*.py"))
    py_files.sort(key=lambda p: (p.name != "base.py", str(p)))
    for py in py_files:
        if py.name == "__init__.py":
            continue
        rel = py.relative_to(objects_dir).with_suffix("")
        parts = list(rel.parts)
        target_mod = "core.ontology.%s.objects.%s" % (ontology_id, ".".join(parts))
        alias_mod = "core.ontology.objects.%s" % ".".join(parts)
        try:
            mod = importlib.import_module(target_mod)
            sys.modules[alias_mod] = mod
        except Exception:
            continue

def rebuild_registry(functions_dir: Path) -> Dict[str, FunctionMeta]:
    new_reg: Dict[str, FunctionMeta] = {}
    if not functions_dir.exists():
        return new_reg
    for py in functions_dir.rglob("*.py"):
        module = _load_module_from_file(py)
        module_name = _module_name_for(py)
        for attr in dir(module):
            obj = getattr(module, attr)
            if callable(obj) and getattr(obj, "__user_function__", False):
                # Only register functions defined in the current module, not imported ones
                # Check if the function's __module__ matches the current module
                func_module = getattr(obj, "__module__", None)
                if func_module and func_module != module_name:
                    # This function was imported from another module, skip it
                    continue
                name = obj.__name__
                doc = obj.__doc__.strip() if isinstance(obj.__doc__, str) else None
                # Enforce parameter type annotations for user-facing params
                # TypeError will be raised if any parameter is missing type annotation
                _ = _param_types_json(obj)
                new_reg[name] = FunctionMeta(
                    name=name,
                    module_path=str(py),
                    func=obj,
                    description=doc,
                )
    return new_reg


def rebuild_action_registry(actions_dir: Path) -> Dict[str, FunctionMeta]:
    new_reg: Dict[str, FunctionMeta] = {}
    if not actions_dir.exists():
        return new_reg
    for py in actions_dir.rglob("*.py"):
        module = _load_module_from_file(py)
        module_name = _module_name_for(py)
        for attr in dir(module):
            obj = getattr(module, attr)
            if callable(obj) and getattr(obj, "__user_action__", False):
                # Only register actions defined in the current module, not imported ones
                func_module = getattr(obj, "__module__", None)
                if func_module and func_module != module_name:
                    # This action was imported from another module, skip it
                    continue
                name = obj.__name__
                doc = obj.__doc__.strip() if isinstance(obj.__doc__, str) else None
                # Enforce parameter type annotations for user-facing params
                # TypeError will be raised if any parameter is missing type annotation
                _ = _param_types_json(obj)
                new_reg[name] = FunctionMeta(
                    name=name,
                    module_path=str(py),
                    func=obj,
                    description=doc,
                    build_type=getattr(obj, "__build_type__", None),
                )
    return new_reg


def _is_objects_import(module_path: Optional[str], ontology_id: str) -> bool:
    try:
        if not isinstance(module_path, str):
            return False
        # Support both shared alias and ontology-specific import paths
        return (
            ".ontology.objects" in module_path
            or f".ontology.{ontology_id}.objects" in module_path
        )
    except Exception:
        return False


def _collect_module_level_imports(tree: ast.AST, ontology_id: str) -> Tuple[Dict[str, str], Dict[str, str]]:
    """Collect top-level imports referencing ontology objects.

    Returns two mappings:
      - from_import_alias_to_object: alias -> object name (e.g., Product)
      - module_import_alias_to_object: module alias -> object name (tail segment)
    """
    from_import_alias_to_object: Dict[str, str] = {}
    module_import_alias_to_object: Dict[str, str] = {}
    for node in getattr(tree, "body", []) or []:
        try:
            if isinstance(node, ast.ImportFrom):
                mod = node.module
                if _is_objects_import(mod, ontology_id):
                    for alias in node.names:
                        obj_name = alias.name
                        alias_name = alias.asname or alias.name
                        if isinstance(alias_name, str) and isinstance(obj_name, str):
                            from_import_alias_to_object[alias_name] = obj_name
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    full_name = alias.name
                    if not isinstance(full_name, str):
                        continue
                    if _is_objects_import(full_name, ontology_id):
                        alias_name = alias.asname or full_name.split(".")[-1]
                        obj_name = full_name.split(".")[-1]
                        if isinstance(alias_name, str) and isinstance(obj_name, str):
                            module_import_alias_to_object[alias_name] = obj_name
        except Exception:
            # Best-effort extraction; ignore problematic nodes
            continue
    return from_import_alias_to_object, module_import_alias_to_object


def _find_function_node(tree: ast.AST, func_name: str, first_lineno: Optional[int]) -> Optional[ast.AST]:
    candidates: list[ast.AST] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and getattr(node, "name", None) == func_name:
            candidates.append(node)
    if not candidates:
        return None
    if first_lineno is None:
        return candidates[0]
    # Prefer exact lineno match; otherwise pick the one with lineno just <= first_lineno
    exact = [n for n in candidates if getattr(n, "lineno", -1) == first_lineno]
    if exact:
        return exact[0]
    before = [n for n in candidates if getattr(n, "lineno", -1) <= first_lineno]
    if before:
        return sorted(before, key=lambda n: getattr(n, "lineno", 0), reverse=True)[0]
    return candidates[0]


def _collect_used_objects_for_function(
    ontology_id: str,
    module_path: Path,
    func_name: str,
    first_lineno: Optional[int],
) -> list[str]:
    """Analyze a single function to determine which ontology objects it uses.

    Rules:
      - If objects are imported inside the function (either `from ... import X` or `import ...X`), count them regardless of usage.
      - If objects are imported at module level, count them only if referenced in the function body.
    """
    try:
        src = module_path.read_text(encoding="utf-8")
    except Exception:
        return []

    try:
        tree = ast.parse(src)
    except Exception:
        return []

    # Top-level imports
    top_from_alias_to_obj, top_mod_alias_to_obj = _collect_module_level_imports(tree, ontology_id)

    fn_node = _find_function_node(tree, func_name, first_lineno)
    if fn_node is None:
        return []

    used: Set[str] = set()
    # Function-scope imports (count regardless of actual symbol references)
    try:
        for inner in ast.walk(fn_node):
            if isinstance(inner, ast.ImportFrom):
                mod = inner.module
                if _is_objects_import(mod, ontology_id):
                    for alias in inner.names:
                        obj_name = alias.name
                        if isinstance(obj_name, str):
                            used.add(obj_name)
            elif isinstance(inner, ast.Import):
                for alias in inner.names:
                    full_name = alias.name
                    if isinstance(full_name, str) and _is_objects_import(full_name, ontology_id):
                        obj_name = full_name.split(".")[-1]
                        used.add(obj_name)
    except Exception:
        pass

    # If already imported inside, we still also consider top-level usage; duplicates are fine via set
    used_names: Set[str] = set()
    used_attr_pairs: Set[Tuple[str, str]] = set()
    try:
        for inner in ast.walk(fn_node):
            if isinstance(inner, ast.Name) and isinstance(inner.id, str):
                used_names.add(inner.id)
            elif isinstance(inner, ast.Attribute):
                val = inner.value
                if isinstance(val, ast.Name) and isinstance(val.id, str) and isinstance(inner.attr, str):
                    used_attr_pairs.add((val.id, inner.attr))
    except Exception:
        pass

    # Resolve top-level from-imports used by name
    for alias_name, obj_name in top_from_alias_to_obj.items():
        if alias_name in used_names:
            used.add(obj_name)

    # Resolve top-level module-imports used via attribute access
    for mod_alias, obj_name in top_mod_alias_to_obj.items():
        if (mod_alias, obj_name) in used_attr_pairs:
            used.add(obj_name)

    return sorted(list(used))


def refresh(ontology_id: str, functions_dir: str, merge: bool = False) -> list[dict]:
    path = Path(functions_dir)
    # Ensure the functions directory is importable so intra-folder imports like `import setup` work
    abs_dir = str(path.resolve())
    if abs_dir not in sys.path:
        sys.path.insert(0, abs_dir)
    # Drop cached modules that originate from the functions directory to avoid stale imports
    to_delete = []
    for name, mod in list(sys.modules.items()):
        try:
            mod_file = getattr(mod, "__file__", None)
            if isinstance(mod_file, str) and mod_file.startswith(abs_dir):
                to_delete.append(name)
        except Exception:
            continue
    for name in to_delete:
        sys.modules.pop(name, None)
    # Install friendly aliases for objects to allow imports without ontology_id in path
    _install_objects_aliases(ontology_id)
    new_reg = rebuild_registry(path)
    # Build aliases: allow snake_case and lowerCamelCase to resolve to the same function
    aliases: Dict[str, str] = {}
    for canonical in new_reg.keys():
        snake = _to_snake(canonical)
        lower_camel = _to_lower_camel(canonical)
        if snake != canonical:
            aliases.setdefault(snake, canonical)
        if lower_camel != canonical:
            aliases.setdefault(lower_camel, canonical)
    swap_registry(ontology_id, new_reg, aliases, merge=merge)
    results: list[dict] = []
    for m in new_reg.values():
        try:
            first_lineno = getattr(getattr(m, "func", None), "__code__", None)
            if first_lineno is not None:
                first_lineno = getattr(first_lineno, "co_firstlineno", None)
        except Exception:
            first_lineno = None
        used_objects = _collect_used_objects_for_function(
            ontology_id,
            Path(m.module_path),
            m.name,
            first_lineno,
        )
        results.append({
            "name": m.name,
            "desc": m.description,
            "signature": _param_types_json(m.func),
            "signature_detail": _param_types_detail_json(m.func),
            "code": _safe_getsource(m.func),
            "filename": Path(m.module_path).name,
            "used_objects": used_objects,
        })
    return results


def refresh_actions(ontology_id: str, actions_dir: str, merge: bool = False) -> list[dict]:
    path = Path(actions_dir)
    abs_dir = str(path.resolve())
    if abs_dir not in sys.path:
        sys.path.insert(0, abs_dir)
    # Drop cached modules that originate from the actions directory
    to_delete = []
    for name, mod in list(sys.modules.items()):
        try:
            mod_file = getattr(mod, "__file__", None)
            if isinstance(mod_file, str) and mod_file.startswith(abs_dir):
                to_delete.append(name)
        except Exception:
            continue
    for name in to_delete:
        sys.modules.pop(name, None)

    # Install object aliases for ontology to allow action code to import objects
    _install_objects_aliases(ontology_id)

    new_reg = rebuild_action_registry(path)

    # Build aliases
    aliases: Dict[str, str] = {}
    for canonical in new_reg.keys():
        snake = _to_snake(canonical)
        lower_camel = _to_lower_camel(canonical)
        if snake != canonical:
            aliases.setdefault(snake, canonical)
        if lower_camel != canonical:
            aliases.setdefault(lower_camel, canonical)

    swap_actions_registry(ontology_id, new_reg, aliases, merge=merge)

    # Dynamic binding to object classes if action carries binding metadata
    try:
        for meta in new_reg.values():
            fn: Callable[..., Any] = meta.func
            bind_to_obj = getattr(fn, "__bind_to_object__", None)
            method_name = getattr(fn, "__bind_method_name__", None) or meta.name
            if not bind_to_obj:
                continue
            # Try to import target object class
            try:
                from core.ontology.objects import base as objects_base  # ensure alias path exists
            except Exception:
                pass
            try:
                # Priority: ontology-specific object
                module_path = f"core.ontology.{ontology_id}.objects.{bind_to_obj}"
                mod = __import__(module_path, fromlist=[bind_to_obj])
                target_cls = getattr(mod, bind_to_obj)
            except Exception:
                # Fallback to shared alias namespace
                try:
                    mod = __import__(f"core.ontology.objects.{bind_to_obj}", fromlist=[bind_to_obj])
                    target_cls = getattr(mod, bind_to_obj)
                except Exception:
                    continue

            # Attach method wrapper to call action function. Do not import action in object to avoid cycle.
            def _make_bound_method(f: Callable[..., Any]):
                if inspect.iscoroutinefunction(f):
                    async def _amethod(self, *args, **kwargs):
                        return await f(self, *args, **kwargs)
                    # Mark as bound action wrapper for safe overwrite on refresh
                    try:
                        setattr(_amethod, "__is_bound_action__", True)
                        setattr(_amethod, "__bound_action_name__", getattr(f, "__name__", None))
                        setattr(_amethod, "__bound_action_module__", getattr(f, "__module__", None))
                        setattr(_amethod, "__bound_action_target__", bind_to_obj)
                    except Exception:
                        pass
                    return _amethod
                else:
                    def _method(self, *args, **kwargs):
                        return f(self, *args, **kwargs)
                    # Mark as bound action wrapper for safe overwrite on refresh
                    try:
                        setattr(_method, "__is_bound_action__", True)
                        setattr(_method, "__bound_action_name__", getattr(f, "__name__", None))
                        setattr(_method, "__bound_action_module__", getattr(f, "__module__", None))
                        setattr(_method, "__bound_action_target__", bind_to_obj)
                    except Exception:
                        pass
                    return _method

            try:
                # Only avoid overriding real class methods. If the existing attribute
                # is a previously bound action wrapper, allow replacement so refresh takes effect.
                existing = getattr(target_cls, method_name, None)
                if existing is not None and not getattr(existing, "__is_bound_action__", False):
                    # Real class method exists; do not override
                    continue
                setattr(target_cls, method_name, _make_bound_method(fn))
            except Exception:
                continue
    except Exception:
        # best effort; do not fail refresh
        pass

    results: list[dict] = []
    for m in new_reg.values():
        sig = _param_types_json(m.func)
        sig_detail = _param_types_detail_json(m.func)
        bind_to_obj = None
        try:
            bind_to_obj = getattr(m.func, "__bind_to_object__", None)
            if isinstance(bind_to_obj, str) and bind_to_obj:
                # Filter out bound object from both compact and detailed signatures
                # sig = {k: v for k, v in sig.items() if str(v) != bind_to_obj}
                sig_detail = {k: v for k, v in sig_detail.items() if str(v.get("type")) != bind_to_obj}
        except Exception:
            pass
        used_objects = [bind_to_obj] if isinstance(bind_to_obj, str) and bind_to_obj else []
        results.append({
            "name": m.name,
            "desc": m.description,
            "signature": sig,
            "signature_detail": sig_detail,
            "code": _safe_getsource(m.func),
            "filename": Path(m.module_path).name,
            "used_objects": used_objects,
            "build_type": getattr(m.func, "__build_type__", getattr(m, "build_type", None)) or "function",
        })
    return results



def activate_published(ontology_id: str, functions_dir: str, published_names: list[str]) -> dict:
    """Rebuild code registry, then keep only published_names.

    This does not persist anything to DB. It is safe to call multiple times.
    Returns a summary including activated names and any missing/mismatch info.
    """
    path = Path(functions_dir)
    abs_dir = str(path.resolve())
    if abs_dir not in sys.path:
        sys.path.insert(0, abs_dir)

    # Ensure object aliases are installed (for user code imports)
    _install_objects_aliases(ontology_id)

    # Rebuild full registry from code
    full_reg = rebuild_registry(path)

    # Build aliases for the filtered set
    filtered_reg: Dict[str, FunctionMeta] = {}
    missing_in_code: list[str] = []
    for name in published_names:
        meta = full_reg.get(name)
        if meta is None:
            # try common normalizations
            snake = _to_snake(name)
            meta = full_reg.get(snake)
        if meta is None:
            missing_in_code.append(name)
            continue
        filtered_reg[meta.name] = meta

    aliases: Dict[str, str] = {}
    for canonical in filtered_reg.keys():
        snake = _to_snake(canonical)
        lower_camel = _to_lower_camel(canonical)
        if snake != canonical:
            aliases.setdefault(snake, canonical)
        if lower_camel != canonical:
            aliases.setdefault(lower_camel, canonical)

    swap_registry(ontology_id, filtered_reg, aliases)

    activated = list(filtered_reg.keys())
    return {
        "activated": activated,
        "missing_in_code": missing_in_code,
    }


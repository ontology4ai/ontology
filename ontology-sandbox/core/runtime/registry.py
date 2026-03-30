from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional, Dict
import threading
import re


@dataclass
class FunctionMeta:
    name: str
    module_path: str
    func: Callable[..., Any]
    description: Optional[str]
    build_type: Optional[str] = None


_registry: Dict[str, Dict[str, FunctionMeta]] = {}
_aliases: Dict[str, Dict[str, str]] = {}

# Separate registry for actions
_actions_registry: Dict[str, Dict[str, FunctionMeta]] = {}
_actions_aliases: Dict[str, Dict[str, str]] = {}
_lock = threading.RLock()


def Function(fn: Callable[..., Any]):
    setattr(fn, "__user_function__", True)
    return fn

# Backward-compatible alias
user_function = Function


def Util(fn: Callable[..., Any]):
    """Decorator for utility functions (global, not ontology-specific)"""
    setattr(fn, "__util_function__", True)
    return fn


def Action(_fn: Optional[Callable[..., Any]] = None, *, bind_to: Optional[str] = None, method_name: Optional[str] = None, build_type: Optional[str] = None):
    """Decorator for actions. Optional binding metadata:
    - bind_to: target object class name to attach as a method
    - method_name: method name on the object (defaults to function name)
    - build_type: 'function' | 'object' to mark how this action should be surfaced
    """
    def _decorate(fn: Callable[..., Any]):
        setattr(fn, "__user_action__", True)
        if bind_to:
            setattr(fn, "__bind_to_object__", bind_to)
        if method_name:
            setattr(fn, "__bind_method_name__", method_name)
        # Default to 'function' so legacy actions continue to appear in listings
        try:
            setattr(fn, "__build_type__", build_type if build_type in ("function", "object") else "function")
        except Exception:
            # Best-effort; do not block decoration if setattr fails
            pass
        return fn

    if _fn is None:
        return _decorate
    else:
        return _decorate(_fn)


def _to_snake(name: str) -> str:
    text = re.sub(r"(.)([A-Z][a-z0-9]+)", r"\1_\2", name)
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", text)
    return text.replace("-", "_").lower()


def _to_lower_camel(name: str) -> str:
    if not name:
        return name
    if "_" in name:
        parts = [p for p in name.split("_") if p]
        if not parts:
            return name
        head = parts[0].lower()
        tail = "".join(p.capitalize() for p in parts[1:])
        return head + tail
    # Already camel-ish: just ensure lower first char
    return name[0].lower() + name[1:]


def swap_registry(ontology_id: str, new_reg: Dict[str, FunctionMeta], aliases: Optional[Dict[str, str]] = None, merge: bool = False) -> None:
    """
    Update the function registry for a given ontology.
    
    Args:
        ontology_id: The ontology identifier
        new_reg: The new registry to set or merge
        aliases: Optional aliases mapping
        merge: If True, merge with existing registry; if False, replace entirely
    """
    with _lock:
        if merge:
            # Merge with existing registry instead of replacing
            if ontology_id not in _registry:
                _registry[ontology_id] = {}
            _registry[ontology_id].update(new_reg)
            
            # Merge aliases instead of replacing
            if ontology_id not in _aliases:
                _aliases[ontology_id] = {}
            if aliases:
                for alias, canonical in aliases.items():
                    if alias and canonical and canonical in new_reg:
                        _aliases[ontology_id][alias] = canonical
        else:
            # Replace mode (default behavior for backward compatibility)
            _registry[ontology_id] = dict(new_reg)
            _aliases[ontology_id] = {}
            if aliases:
                for alias, canonical in aliases.items():
                    if alias and canonical and canonical in new_reg:
                        _aliases[ontology_id][alias] = canonical


def get_function(ontology_id: str, name: str) -> Optional[FunctionMeta]:
    with _lock:
        reg = _registry.get(ontology_id) or {}
        als = _aliases.get(ontology_id) or {}
        meta = reg.get(name)
        if meta:
            return meta
        # alias lookup
        canonical = als.get(name)
        if canonical:
            return reg.get(canonical)
        # fallback normalization attempts
        snake = _to_snake(name)
        meta = reg.get(snake)
        if meta:
            return meta
        camel = _to_lower_camel(name)
        canonical = als.get(camel)
        if canonical:
            return reg.get(canonical)
        return reg.get(camel)


def list_functions(ontology_id: str) -> list[FunctionMeta]:
    with _lock:
        reg = _registry.get(ontology_id) or {}
        return list(reg.values())


def swap_actions_registry(ontology_id: str, new_reg: Dict[str, FunctionMeta], aliases: Optional[Dict[str, str]] = None, merge: bool = False) -> None:
    """
    Update the actions registry for a given ontology.
    
    Args:
        ontology_id: The ontology identifier
        new_reg: The new registry to set or merge
        aliases: Optional aliases mapping
        merge: If True, merge with existing registry; if False, replace entirely
    """
    with _lock:
        if merge:
            # Merge with existing registry instead of replacing
            if ontology_id not in _actions_registry:
                _actions_registry[ontology_id] = {}
            _actions_registry[ontology_id].update(new_reg)
            
            # Merge aliases instead of replacing
            if ontology_id not in _actions_aliases:
                _actions_aliases[ontology_id] = {}
            if aliases:
                for alias, canonical in aliases.items():
                    if alias and canonical and canonical in new_reg:
                        _actions_aliases[ontology_id][alias] = canonical
        else:
            # Replace mode (default behavior for backward compatibility)
            _actions_registry[ontology_id] = dict(new_reg)
            _actions_aliases[ontology_id] = {}
            if aliases:
                for alias, canonical in aliases.items():
                    if alias and canonical and canonical in new_reg:
                        _actions_aliases[ontology_id][alias] = canonical


def get_action(ontology_id: str, name: str) -> Optional[FunctionMeta]:
    with _lock:
        reg = _actions_registry.get(ontology_id) or {}
        als = _actions_aliases.get(ontology_id) or {}
        meta = reg.get(name)
        if meta:
            return meta
        canonical = als.get(name)
        if canonical:
            return reg.get(canonical)
        snake = _to_snake(name)
        meta = reg.get(snake)
        if meta:
            return meta
        camel = _to_lower_camel(name)
        canonical = als.get(camel)
        if canonical:
            return reg.get(canonical)
        return reg.get(camel)


def list_actions(ontology_id: str) -> list[FunctionMeta]:
    with _lock:
        reg = _actions_registry.get(ontology_id) or {}
        return list(reg.values())


# Utility functions registry (global, not ontology-specific)
_utils_registry: Dict[str, FunctionMeta] = {}
_utils_aliases: Dict[str, str] = {}


def swap_utils_registry(new_reg: Dict[str, FunctionMeta], aliases: Optional[Dict[str, str]] = None) -> None:
    """Swap the utility functions registry"""
    with _lock:
        global _utils_registry, _utils_aliases
        _utils_registry = dict(new_reg)
        _utils_aliases = {}
        if aliases:
            for alias, canonical in aliases.items():
                if alias and canonical and canonical in new_reg:
                    _utils_aliases[alias] = canonical


def get_util(name: str) -> Optional[FunctionMeta]:
    """Get a utility function by name"""
    with _lock:
        meta = _utils_registry.get(name)
        if meta:
            return meta
        # alias lookup
        canonical = _utils_aliases.get(name)
        if canonical:
            return _utils_registry.get(canonical)
        # fallback normalization attempts
        snake = _to_snake(name)
        meta = _utils_registry.get(snake)
        if meta:
            return meta
        camel = _to_lower_camel(name)
        canonical = _utils_aliases.get(camel)
        if canonical:
            return _utils_registry.get(canonical)
        return _utils_registry.get(camel)


def list_utils() -> list[FunctionMeta]:
    """List all utility functions"""
    with _lock:
        return list(_utils_registry.values())



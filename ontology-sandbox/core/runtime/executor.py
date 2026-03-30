from __future__ import annotations

import asyncio
import functools
import inspect
from dataclasses import is_dataclass, asdict
from typing import Any, Dict

from pydantic import BaseModel, ValidationError, create_model
from pydantic.config import ConfigDict

from core.runtime.registry import get_function


class FunctionNotFound(Exception):
    pass


class InvalidPayload(Exception):
    pass


def _build_params_model(fn):
    signature = inspect.signature(fn)
    fields: dict = {}
    has_var_keyword = False

    for name, param in signature.parameters.items():
        if name == "objects":
            continue
        # Check if this is a **kwargs parameter
        if param.kind == inspect.Parameter.VAR_KEYWORD:
            has_var_keyword = True
            continue
        annotation = param.annotation if param.annotation is not inspect._empty else Any
        if param.default is inspect._empty:
            fields[name] = (annotation, ...)
        else:
            fields[name] = (annotation, param.default)

    # If function has **kwargs, allow arbitrary extra fields
    if has_var_keyword:
        class _ParamsBase(BaseModel):
            model_config = ConfigDict(extra="allow")
    else:
        class _ParamsBase(BaseModel):
            model_config = ConfigDict(extra="forbid")

    ParamsModel = create_model("ParamsModel", __base__=_ParamsBase, **fields)
    return ParamsModel


async def execute(ontology_id: str, function_name: str, payload: Dict[str, Any], objects: Any) -> Dict[str, Any]:
    meta = get_function(ontology_id, function_name)
    if not meta:
        raise FunctionNotFound(function_name)

    fn = meta.func

    # Validate and coerce payload based on function signature
    try:
        ParamsModel = _build_params_model(fn)
        validated = ParamsModel.model_validate(payload).model_dump()
    except ValidationError as e:
        raise InvalidPayload(str(e))

    # Prepare call kwargs and inject objects if requested
    call_kwargs = dict(validated)
    if "objects" in inspect.signature(fn).parameters and "objects" not in call_kwargs:
        call_kwargs["objects"] = objects

    if inspect.iscoroutinefunction(fn):
        result = await fn(**call_kwargs)
    else:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, functools.partial(fn, **call_kwargs))

    if isinstance(result, BaseModel):
        return result.model_dump()
    if is_dataclass(result):
        return asdict(result)
    if isinstance(result, dict):
        return result
    return {"result": result}



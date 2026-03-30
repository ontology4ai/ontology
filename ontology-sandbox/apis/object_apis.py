from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
from apis.models import ApiResponse
from core.runtime.executor import execute
from routers.service import _get_object_instance, _execute_action_direct, _collect_ontology_maps
from core.runtime.context import set_track_id

router = APIRouter()

class RunActionBody(BaseModel):
    ontology_name: str
    action_name: str
    object_name: str
    params: Optional[Dict[str, Any]] = None
    track_id: Optional[str] = None


@router.post("/action/run")
async def run_action(body: RunActionBody):
    try:
        if body.track_id:
            set_track_id(body.track_id)
        res = await _execute_action_direct(
            body.ontology_name,
            body.object_name,
            body.action_name,
            body.params or {},
        )
        return ApiResponse(status="success", code="200", data=res)
    except Exception as e:
        return ApiResponse(status="failed", code="500", data=None, message=str(e))


class FunctionRunBody(BaseModel):
    ontology_name: str
    function_name: str
    params: Optional[Dict[str, Any]] = None

@router.post("/function/run")
async def function_run(body: FunctionRunBody):
    try:
        res = await execute(body.ontology_name, body.function_name, body.params or {}, None)
        if isinstance(res, dict) and res.get("error"):
            return ApiResponse(status="failed", code="500", data=None, message=str(res.get("error")))
        return ApiResponse(status="success", code="200", data=res)
    except Exception as e:
        return ApiResponse(status="failed", code="500", data=None, message=str(e))


class ObjectFindBody(BaseModel):
    ontology_name: str
    object_name: str
    return_attrs: Optional[Union[str, List[str]]] = None
    where_sql: Optional[str] = None
    where_params: Optional[List[Any]] = None
    order_by: Optional[str] = None
    order_by_column: Optional[str] = None
    page_size: Optional[int] = None
    page_token: Optional[int] = None
    condition: Optional[Dict[str, Any]] = None


@router.post("/find")
async def object_find(body: ObjectFindBody):
    try:
        inst = _get_object_instance(body.ontology_name, body.object_name)
        ontology_maps = _collect_ontology_maps(body.ontology_name)

        ob = body.order_by or body.order_by_column
        if body.where_sql:
            res = inst.find(
                return_attrs=body.return_attrs,
                where_sql=body.where_sql,
                where_params=body.where_params,
                order_by=ob,
                page_size=body.page_size,
                page_token=body.page_token,
                ontology_maps=ontology_maps,
                ontology_name=body.ontology_name,
                object_type_name=body.object_name,
            )
        else:
            if body.page_size is not None or body.page_token is not None or ob is not None:
                res = inst.find(
                    return_attrs=body.return_attrs,
                    where_sql="1=1",
                    where_params=None,
                    order_by=ob,
                    page_size=body.page_size,
                    page_token=body.page_token,
                    ontology_maps=ontology_maps,
                    ontology_name=body.ontology_name,
                    object_type_name=body.object_name,
                )
            else:
                cond = body.condition or {}
                res = inst.find(
                    return_attrs=body.return_attrs,
                    ontology_maps=ontology_maps,
                    ontology_name=body.ontology_name,
                    object_type_name=body.object_name,
                    **cond,
                )
        return ApiResponse(status="success", code="200", data=res)
    except Exception as e:
        return ApiResponse(status="failed", code="500", data=None, message=str(e))
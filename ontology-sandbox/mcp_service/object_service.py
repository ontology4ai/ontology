"""
FastMCP server exposing ontology tools over Streamable HTTP.

Env:
- ONTOLOGY_API_BASE: Base URL of the ontology REST API (default http://localhost:5050/api/v1/ontology)
- MCP_HOST: Host to bind the MCP Streamable HTTP server (default 0.0.0.0)
- MCP_PORT: Port to bind (default 8001)
"""

import os
import json
from typing import Any, Dict, List, Optional, Union

from mcp.server.fastmcp import FastMCP
from core.runtime.executor import execute, FunctionNotFound, InvalidPayload
from routers.service import _get_object_instance, _execute_action_direct, _collect_ontology_maps


mcp = FastMCP(
    name="Ontology Object Service Tools",
    instructions=(
        "Tools that call the actions and global functions of the ontology.\n"
        "This server runs via Streamable HTTP."
    ),
)


async def _post_api(path: str, payload: Dict[str, Any]) -> Union[Dict[str, Any], List[Any], str]:
    # Kept for backward-compatibility; not used by updated local tools below.
    raise RuntimeError("Remote API calls are disabled for local-execution MCP tools")
        


@mcp.tool()
async def ontology_object_action_run(
    ontology_name: str,
    action_name:str,
    object_name:str,
    params: Dict[str, Any]
) -> Union[Dict[str, Any], List[Any], str]:
    """
    Run an action on an ontology object. This action allows CREATE, UPDATE, DELETE operations.
    """
    try:
        res = await _execute_action_direct(ontology_name, object_name, action_name, params or {})
        return res
    except Exception as e:
        return {"error": str(e)}

@mcp.tool()
async def ontology_object_function_run(
    ontology_name: str,
    function_name: str,
    params: Optional[Dict[str, Any]] = None
) -> Union[Dict[str, Any], List[Any], str]:
    """
    Run an registered function in an ontology.
    """
    try:
        res = await execute(ontology_name, function_name, params or {}, None)
        return res
    except (FunctionNotFound, InvalidPayload) as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}

@mcp.tool()
async def ontology_object_find(
    ontology_name: str,
    object_name: str,
    return_attrs: Optional[Union[str, List[str]]] = None,
    where_sql: Optional[str] = None,
    where_params: Optional[List[Any]] = None,
    order_by: Optional[str] = None,
    order_by_column: Optional[str] = None,
    page_size: Optional[int] = None,
    page_token: Optional[int] = None,
    condition: Optional[Dict[str, Any]] = None,
) -> Union[Dict[str, Any], List[Any], str]:
    """
    Find data rows from an ontology object.
    """
    try:
        inst = _get_object_instance(ontology_name, object_name)
        ontology_maps = _collect_ontology_maps(ontology_name)

        ob = order_by or order_by_column
        if where_sql:
            res = inst.find(
                return_attrs=return_attrs,
                where_sql=where_sql,
                where_params=where_params,
                order_by=ob,
                page_size=page_size,
                page_token=page_token,
                ontology_maps=ontology_maps,
                ontology_name=ontology_name,
                object_type_name=object_name,
            )
        else:
            if page_size is not None or page_token is not None or ob is not None:
                res = inst.find(
                    return_attrs=return_attrs,
                    where_sql="1=1",
                    where_params=None,
                    order_by=ob,
                    page_size=page_size,
                    page_token=page_token,
                    ontology_maps=ontology_maps,
                    ontology_name=ontology_name,
                    object_type_name=object_name,
                )
            else:
                cond = condition or {}
                res = inst.find(
                    return_attrs=return_attrs,
                    ontology_maps=ontology_maps,
                    ontology_name=ontology_name,
                    object_type_name=object_name,
                    **cond,
                )
        return res
    except Exception as e:
        return {"error": str(e)}

# Expose ASGI app for mounting under an existing server (path defaults to /mcp)
app = mcp.streamable_http_app()


def main() -> None:
    # Configure host/port if available
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port_str = os.getenv("MCP_PORT", "8001")
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



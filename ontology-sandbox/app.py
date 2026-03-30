from fastapi import FastAPI
from contextlib import asynccontextmanager, AsyncExitStack

from fastapi.routing import Mount
import uvicorn
import os
from routers.functions import router as functions_router
from routers.service import router as service_router
from routers.actions import router as actions_router
from routers.utils import router as utils_router
from apis.object_apis import router as object_apis_router
from apis.api_json_to_generator import router as ontology_router

from typing import Iterable
from pathlib import Path
from core.runtime.loader import refresh, refresh_actions, refresh_objects
from public.public_variable import logger
from mcp_service.object_service import mcp as object_mcp
from mcp_service.ontology_service import mcp as ontology_mcp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local sync of functions at startup (no external calls)
    def _iter_ontology_ids() -> Iterable[str]:
        root = Path("core/ontology")
        if not root.exists():
            return []
        for child in root.iterdir():
            # Treat any child that contains an 'objects' dir as an ontology
            if child.is_dir() and (child / "objects").exists():
                yield child.name

    def _iter_ontology_api_ids() -> Iterable[str]:
        """遍历 core/ontology_apis 下的所有本体"""
        root = Path("core/ontology_apis")
        if not root.exists():
            return []
        for child in root.iterdir():
            # 只要是目录就认为是一个 API 本体
            if child.is_dir():
                yield child.name

    # 0) Refresh each ontology's objects (clear caches/aliases)
    for oid in _iter_ontology_ids():
        try:
            refresh_objects(oid)
            logger.info(f"Refreshed {oid} objects")
        except Exception as e:
            logger.warning(f"Refresh objects failed for ontology '{oid}': {e}")

    # 1) Refresh each ontology's logics
    for oid in _iter_ontology_ids():
        functions_dir = f"core/ontology/{oid}/logics"
        try:
            registered = refresh(oid, functions_dir)
            if registered:
                logger.info(f"Refreshed {oid} logics: {len(registered)} registered")
        except Exception as e:
            logger.warning(f"Refresh failed for ontology '{oid}': {e}")

    # 2) Refresh global functions under core/ontology/logics as their own namespace
    try:
        global_dir = Path("core/ontology/logics")
        if global_dir.exists():
            registered = refresh("functions", str(global_dir))
            if registered:
                logger.info(f"Refreshed global logics: {len(registered)} registered")
    except Exception as e:
        logger.warning(f"Refresh failed for global logics: {e}")

    # 3) Refresh each ontology's actions
    for oid in _iter_ontology_ids():
        actions_dir = f"core/ontology/{oid}/actions"
        try:
            registered_actions = refresh_actions(oid, actions_dir)
            if registered_actions:
                logger.info(f"Refreshed {oid} actions: {len(registered_actions)} registered")
        except Exception as e:
            logger.warning(f"Refresh actions failed for ontology '{oid}': {e}")

    # 4) Refresh API-based functions under core/ontology_apis/{ontology_name}/logics
    for oid in _iter_ontology_api_ids():
        api_functions_dir = f"core/ontology_apis/{oid}/logics"
        try:
            api_functions_path = Path(api_functions_dir)
            if api_functions_path.exists():
                registered = refresh(oid, api_functions_dir, merge=True)
                if registered:
                    logger.info(f"Refreshed {oid} API logics: {len(registered)} registered")
        except Exception as e:
            logger.warning(f"Refresh API logics failed for ontology '{oid}': {e}")

    # 5) Refresh API-based actions under core/ontology_apis/{ontology_name}/actions
    for oid in _iter_ontology_api_ids():
        api_actions_dir = f"core/ontology_apis/{oid}/actions"
        try:
            api_actions_path = Path(api_actions_dir)
            if api_actions_path.exists():
                registered_actions = refresh_actions(oid, api_actions_dir, merge=True)
                if registered_actions:
                    logger.info(f"Refreshed {oid} API actions: {len(registered_actions)} registered")
        except Exception as e:
            logger.warning(f"Refresh API actions failed for ontology '{oid}': {e}")

    # 6) Refresh utility functions
    try:
        from routers.utils import rebuild_utils_registry
        from core.runtime.registry import swap_utils_registry, _to_snake, _to_lower_camel
        
        new_reg = rebuild_utils_registry()
        aliases = {}
        for canonical in new_reg.keys():
            snake = _to_snake(canonical)
            lower_camel = _to_lower_camel(canonical)
            if snake != canonical:
                aliases.setdefault(snake, canonical)
            if lower_camel != canonical:
                aliases.setdefault(lower_camel, canonical)
        
        swap_utils_registry(new_reg, aliases)
        if new_reg:
            logger.info(f"Refreshed utility functions: {len(new_reg)} registered")
    except Exception as e:
        logger.warning(f"Refresh utility functions failed: {e}")

    async with AsyncExitStack() as stack:
        await stack.enter_async_context(ontology_mcp.session_manager.run())
        await stack.enter_async_context(object_mcp.session_manager.run())
        yield

# app = FastAPI()
app = FastAPI(title="Unified API Server", 
    lifespan=lifespan,
    routes=[
        Mount("/llm", app=ontology_mcp.streamable_http_app()),
        Mount("/ontology", app=object_mcp.streamable_http_app()),
        Mount("/llm-sse", app=ontology_mcp.sse_app()),
        Mount("/ontology-sse", app=object_mcp.sse_app()),
    ]
)

# 注册到主应用
app.include_router(ontology_router, prefix="/api/v1/ontology", tags=["ontology"])
app.include_router(functions_router)
app.include_router(service_router)
app.include_router(actions_router)
app.include_router(utils_router)
app.include_router(object_apis_router, prefix="/object/apis", tags=["object_api"])

if __name__ == "__main__":
    """
    应用启动入口，所有配置通过环境变量读取
    
    支持的环境变量：
    - APP_HOST: 服务监听地址（默认: 0.0.0.0）
    - APP_PORT: 服务监听端口（默认: 8000）
    - APP_RELOAD: 是否启用热重载，支持 true/1/yes（默认: false）
    - APP_WORKERS: worker进程数（默认: 1）
    - APP_LOG_LEVEL: 日志级别（默认: info）
    
    其他业务配置项请通过API服务获取（public.public_function.get_config）
    """
    
    # 从环境变量读取启动配置，使用合理的默认值
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", "8000"))
    reload = os.getenv("APP_RELOAD", "false").lower() in ("true", "1", "yes")
    workers = int(os.getenv("APP_WORKERS", "1"))
    log_level = os.getenv("APP_LOG_LEVEL", "info").lower()
    
    # uvicorn 不支持在 reload 模式下多进程启动
    if reload and workers > 1:
        workers = 1
        logger.info("热重载模式已启用，workers自动设置为1")
    
    logger.info(f"启动服务配置 - Host: {host}, Port: {port}, Reload: {reload}, Workers: {workers}, LogLevel: {log_level}")
    
    try:
        uvicorn.run(
            "app:app",  # Import string instead of app object
            host=host,
            port=port,
            reload=reload,
            workers=workers,
            log_level=log_level,
        )
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        raise
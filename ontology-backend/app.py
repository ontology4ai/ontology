from fastapi import FastAPI
from contextlib import asynccontextmanager
from apis.ontology import router as ontology_router, _cleanup_service_cache
from config.config_loader import get_settings
from public.public_variable import logger
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Application starting up...")
    
    yield
    
    # Shutdown
    logger.info("Application shutting down, cleaning up resources...")
    try:
        await _cleanup_service_cache()
        logger.info("Resource cleanup completed successfully")
    except Exception as e:
        logger.error(f"Error during resource cleanup: {e}", exc_info=True)


app = FastAPI(lifespan=lifespan)

app.include_router(ontology_router, prefix="/api/v1/ontology")


if __name__ == "__main__":
    try:
        settings = get_settings()
        # uvicorn 不支持在 reload 模式下多进程启动，这里做个兼容
        workers = settings.server.workers if not settings.server.reload else 1
        uvicorn.run(
            "app:app",  # Import string instead of app object
            host=settings.server.host,
            port=settings.server.port,
            reload=settings.server.reload,
            workers=workers,
            log_level=str(settings.logging.level).lower(),
        )
    except Exception:
        # 如果配置加载失败，使用合理默认值启动，便于排错
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
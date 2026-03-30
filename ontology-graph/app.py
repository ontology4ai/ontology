from fastapi import FastAPI
from contextlib import asynccontextmanager
from apis.ontology import router as ontology_router
from config import StartupConfig
from core.task_manager import task_manager
from public.public_variable import logger, configure_logger
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 配置logger（使用环境变量）
    configure_logger()
    
    # 启动时执行
    logger.info("Starting application...")
    logger.info(f"Environment: {StartupConfig.get_environment()}")
    logger.info(f"Server: {StartupConfig.get_host()}:{StartupConfig.get_port()}")
    
    # 注册并启动导入任务服务worker（Redis队列版本）
    import_task_service = None
    try:
        from core.import_task_service import get_import_task_service
        from apis.ontology import _owl_import_handler, _csv_import_handler
        
        import_task_service = get_import_task_service()
        
        # 注册任务处理器
        import_task_service.register_handler("owl_import", _owl_import_handler)
        import_task_service.register_handler("csv_import", _csv_import_handler)
        
        # 启动worker
        import_task_service.start_worker()
        
        # 检查依赖状态
        deps = await import_task_service.check_dependencies()
        if deps["all_ready"]:
            logger.info("Import task worker started with all dependencies ready")
        else:
            logger.warning("Import task worker started, but some dependencies are not ready:")
            for dep_name, dep_info in deps.items():
                if dep_name != "all_ready" and not dep_info["ready"]:
                    logger.warning(f"  - {dep_name}: {dep_info['error']}")
            logger.warning("Worker will retry when dependencies become available")
        
        # 打印队列状态
        try:
            from core.import_task_service import IMPORT_TASK_QUEUE, IMPORT_TASK_RUNNING
            redis = import_task_service._get_redis_service()
            queue_length = await redis.queue_length(IMPORT_TASK_QUEUE)
            running_count = await redis.set_count(IMPORT_TASK_RUNNING)
            logger.info(f"[ImportTask] Initial queue status: {queue_length} tasks waiting, {running_count} tasks running")
        except Exception as qe:
            logger.warning(f"[ImportTask] Failed to get queue status: {qe}")
    except Exception as e:
        logger.error(f"Failed to start import task worker: {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    # 启动批量测试worker（支持优雅降级）
    batch_test_service = None
    try:
        from core.batch_test_service import get_batch_test_service
        batch_test_service = get_batch_test_service()
        batch_test_service.start_worker()
        
        # Check initial dependencies status (non-blocking)
        deps = await batch_test_service.check_dependencies()
        if deps["all_ready"]:
            logger.info("Batch test worker started with all dependencies ready")
        else:
            logger.warning("Batch test worker started, but some dependencies are not ready:")
            for dep_name, dep_info in deps.items():
                if dep_name != "all_ready" and not dep_info["ready"]:
                    logger.warning(f"  - {dep_name}: {dep_info['error']}")
            logger.warning("Worker will retry when dependencies become available")
        
        # Print queue status (regardless of dependency status, if Redis is available)
        try:
            from core.batch_test_service import BATCH_TEST_QUEUE, BATCH_TEST_RUNNING
            redis = batch_test_service._get_redis_service()
            queue_length = await redis.queue_length(BATCH_TEST_QUEUE)
            running_count = await redis.set_count(BATCH_TEST_RUNNING)
            logger.info(f"Initial queue status: {queue_length} tasks waiting, {running_count} tasks running")
        except Exception as qe:
            logger.warning(f"Failed to get queue status: {qe}")
    except Exception as e:
        logger.error(f"Failed to start batch test worker: {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    # yield 之后的代码在应用关闭时执行
    yield
    
    # 关闭时执行
    logger.info("Shutting down application...")
    
    # 关闭导入任务worker
    try:
        if import_task_service is not None:
            await import_task_service.stop_worker()
            logger.info("Import task worker stopped")
    except Exception as e:
        logger.error(f"Error stopping import task worker: {e}")
    
    # 关闭批量测试worker
    try:
        if batch_test_service is not None:
            await batch_test_service.stop_worker()
            logger.info("Batch test worker stopped")
    except Exception as e:
        logger.error(f"Error stopping batch test worker: {e}")
    
    # 这里可以添加其他清理逻辑
    # 例如：关闭数据库连接、清理临时文件等


app = FastAPI(
    title="ODLM API Server",
    lifespan=lifespan
)

app.include_router(ontology_router, prefix="/api/v1/ontology")


if __name__ == "__main__":
    # 从环境变量获取启动配置（带默认值）
    host = StartupConfig.get_host()
    port = StartupConfig.get_port()
    workers = StartupConfig.get_workers()
    reload = StartupConfig.get_reload()
    log_level = StartupConfig.get_log_level().lower()
    
    # uvicorn 不支持在 reload 模式下多进程启动
    if reload:
        workers = 1
    
    logger.info(f"Starting server on {host}:{port} with {workers} workers")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers,
        log_level=log_level,
    )

from loguru import logger
import sys
import os
import enum

class DifyAgentMode(enum.Enum):
    OAG = "oag"
    COMMON = "dev"
    VERIFY = "verify"

def configure_logger():
    """
    配置logger，使用环境变量配置
    
    环境变量:
        LOG_LEVEL: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)，默认 INFO
        LOG_FILE_PATH: 日志文件路径，默认 logs/app.log
        LOG_MAX_SIZE: 日志文件最大大小，默认 10 MB
        LOG_RETENTION: 日志保留时间，默认 30 days
        LOG_COMPRESS: 是否压缩，默认 true
    """
    # 移除默认的handler（避免重复输出）
    logger.remove()
    
    # 从环境变量获取配置
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_file_path = os.getenv("LOG_FILE_PATH", "logs/app.log")
    log_max_size = os.getenv("LOG_MAX_SIZE", "10 MB")
    log_retention = os.getenv("LOG_RETENTION", "30 days")
    log_compress = os.getenv("LOG_COMPRESS", "true").lower() in ("true", "1", "yes")
    log_format = os.getenv(
        "LOG_FORMAT",
        "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}"
    )
    
    # 添加控制台输出（带颜色）
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True,
    )
    
    # 添加文件输出
    if log_file_path:
        # 确保日志目录存在
        log_dir = os.path.dirname(log_file_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        logger.add(
            log_file_path,
            format=log_format,
            level=log_level,
            rotation=log_max_size,
            retention=log_retention,
            compression="zip" if log_compress else None,
            encoding="utf-8",
            enqueue=True,  # 异步写入，提高性能
        )
        
        logger.info(f"Logger configured with file output: {log_file_path}")
    else:
        logger.info("Logger configured with console output only")

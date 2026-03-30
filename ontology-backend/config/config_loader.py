"""
Configuration helpers backed by environment variables.
"""

import os
from functools import lru_cache
from typing import Dict, Any, Optional


def _to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


@lru_cache(maxsize=1)
def get_mysql_config() -> Dict[str, Any]:
    """
    Return MySQL configuration from environment variables.

    Supported env vars:
      ONTOLOGY_MYSQL_HOST, ONTOLOGY_MYSQL_PORT, ONTOLOGY_MYSQL_USER | ONTOLOGY_MYSQL_USERNAME, 
      ONTOLOGY_MYSQL_PASSWORD, ONTOLOGY_MYSQL_DATABASE | ONTOLOGY_MYSQL_DB, ONTOLOGY_MYSQL_CHARSET, 
      ONTOLOGY_MYSQL_AUTOCOMMIT, ONTOLOGY_MYSQL_POOL_MINSIZE, ONTOLOGY_MYSQL_POOL_MAXSIZE, 
      ONTOLOGY_MYSQL_POOL_RECYCLE
    """
    host = os.getenv("ONTOLOGY_MYSQL_HOST", "localhost")
    port_str = os.getenv("ONTOLOGY_MYSQL_PORT", "3306")
    port = int(port_str)
    user = (os.getenv("ONTOLOGY_MYSQL_USER") or 
            os.getenv("ONTOLOGY_MYSQL_USERNAME") or
            "root")
    password = os.getenv("ONTOLOGY_MYSQL_PASSWORD", "")
    database = (os.getenv("ONTOLOGY_MYSQL_DATABASE") or 
                os.getenv("ONTOLOGY_MYSQL_DB") or
                "")
    charset = os.getenv("ONTOLOGY_MYSQL_CHARSET", "utf8mb4")

    env_autocommit = os.getenv("ONTOLOGY_MYSQL_AUTOCOMMIT")
    if env_autocommit is not None:
        autocommit = _to_bool(env_autocommit)
    else:
        autocommit = True

    minsize_str = os.getenv("ONTOLOGY_MYSQL_POOL_MINSIZE", "5")
    minsize = int(minsize_str)
    maxsize_str = os.getenv("ONTOLOGY_MYSQL_POOL_MAXSIZE", "100")
    maxsize = int(maxsize_str)
    pool_recycle_str = os.getenv("ONTOLOGY_MYSQL_POOL_RECYCLE", "3600")
    pool_recycle = int(pool_recycle_str)

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
        "charset": charset,
        "autocommit": autocommit,
        "minsize": minsize,
        "maxsize": maxsize,
        "pool_recycle": pool_recycle,
    }


# Backwards-compatibility helpers used elsewhere in the app
class _ServerSettings:
    def __init__(self):
        self.host: str = os.getenv("APP_HOST", "0.0.0.0")

        port_str = os.getenv("APP_PORT", "8000")
        self.port: int = int(port_str)

        workers_str = os.getenv("APP_WORKERS", "1")
        self.workers: int = int(workers_str)

        env_reload = os.getenv("APP_RELOAD")
        if env_reload is not None:
            self.reload: bool = _to_bool(env_reload)
        else:
            self.reload = False

        env_debug = os.getenv("APP_DEBUG")
        if env_debug is not None:
            self.debug: bool = _to_bool(env_debug)
        else:
            self.debug = False


class _LoggingSettings:
    def __init__(self):
        self.level: str = os.getenv("LOG_LEVEL", "INFO")
        self.file_path: str = os.getenv("LOG_FILE_PATH", "")


class _AppSettings:
    def __init__(self):
        self.server = _ServerSettings()
        self.logging = _LoggingSettings()

        self.environment: str = os.getenv("ENVIRONMENT", "development")

        env_swagger = os.getenv("ENABLE_SWAGGER")
        if env_swagger is not None:
            self.enable_swagger: bool = _to_bool(env_swagger)
        else:
            self.enable_swagger = True


@lru_cache(maxsize=1)
def get_settings() -> _AppSettings:
    """
    Get application settings from environment variables.
    """
    return _AppSettings()


def reload_settings() -> _AppSettings:
    get_settings.cache_clear()
    return get_settings()
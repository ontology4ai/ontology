"""
Configuration Management Package

This package provides lazy-loading configuration management for the ODLM Python application.
- Startup configs (host, port, workers) come from environment variables with defaults
- Runtime configs are fetched on-demand from remote config service
- No startup validation - configs are validated when used
- Supports config hot-reload without service restart
"""

from .config_loader import (
    # Startup configuration (from environment variables)
    StartupConfig,
    
    # Async config getters (recommended - fetch fresh on each call)
    get_mysql_config,
    get_redis_config,
    get_postgres_config,
    get_minio_config,
    get_ontology_route_url_config,
    get_dify_config,
    get_aap_config,
    get_netgate_url,
    get_embedding_config,
    get_llm_config,
    get_ai_services_config,
    get_database_config,
    get_custom_config,
    fetch_remote_config,
    
    # Sync wrappers (for backwards compatibility in sync contexts)
    get_mysql_config_sync,
    get_redis_config_sync,
    get_postgres_config_sync,
    get_minio_config_sync,
    get_ontology_route_url_config_sync,
    get_dify_config_sync,
    get_aap_config_sync,
    get_netgate_url_sync,
    get_embedding_config_sync,
    get_llm_config_sync,
    get_database_config_sync,
    
    # Utilities
    list_ai_services,
    
    # Deprecated (for backwards compatibility during migration)
    ConfigLoader,
    get_config_loader,
    get_settings,
    reload_settings,
)

# Keep config_models for type definitions if needed
from .config_models import (
    DatabaseConfig,
    MySQLConfig,
    PostgresConfig,
    MinioConfig,
    DifyConfig,
    LoggingConfig,
    ServerConfig,
    LLMConfig,
    EmbeddingConfig,
    AIServicesConfig,
    ApplicationConfig,
)

__all__ = [
    # Startup config
    'StartupConfig',
    
    # Async config getters
    'get_mysql_config',
    'get_redis_config',
    'get_postgres_config',
    'get_minio_config',
    'get_ontology_route_url_config',
    'get_dify_config',
    'get_aap_config',
    'get_netgate_url',
    'get_embedding_config',
    'get_llm_config',
    'get_ai_services_config',
    'get_database_config',
    'get_custom_config',
    'fetch_remote_config',
    
    # Sync wrappers
    'get_mysql_config_sync',
    'get_redis_config_sync',
    'get_postgres_config_sync',
    'get_minio_config_sync',
    'get_ontology_route_url_config_sync',
    'get_dify_config_sync',
    'get_aap_config_sync',
    'get_netgate_url_sync',
    'get_embedding_config_sync',
    'get_llm_config_sync',
    'get_database_config_sync',
    
    # Utilities
    'list_ai_services',
    
    # Config models (for type hints)
    'DatabaseConfig',
    'MySQLConfig',
    'PostgresConfig',
    'MinioConfig',
    'DifyConfig',
    'LoggingConfig',
    'ServerConfig',
    'LLMConfig',
    'EmbeddingConfig',
    'AIServicesConfig',
    'ApplicationConfig',
    
    # Deprecated
    'ConfigLoader',
    'get_config_loader',
    'get_settings',
    'reload_settings',
]

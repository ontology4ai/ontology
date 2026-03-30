"""
Configuration Loader - Lazy Loading Implementation

This module provides configuration management with:
- Startup configs (host, port, workers) from environment variables with defaults
- Runtime configs fetched lazily from remote config service via get_config()
- No startup validation - configs are fetched and validated on demand
- Support for config hot-reload without service restart
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, Union, List
from functools import wraps
from public.public_variable import logger
import aiohttp

# ============================================================================
# Environment Variable Based Startup Config (with defaults)
# ============================================================================

class StartupConfig:
    """
    Startup configuration from environment variables.
    These are the only configs needed at service startup.
    """
    
    @staticmethod
    def get_host() -> str:
        """Get server host from env or default"""
        return os.getenv("APP_HOST", "0.0.0.0")
    
    @staticmethod
    def get_port() -> int:
        """Get server port from env or default"""
        return int(os.getenv("APP_PORT", "5050"))
    
    @staticmethod
    def get_workers() -> int:
        """Get worker count from env or default"""
        return int(os.getenv("APP_WORKERS", "1"))
    
    @staticmethod
    def get_reload() -> bool:
        """Get reload flag from env or default"""
        return os.getenv("APP_RELOAD", "false").lower() in ("true", "1", "yes")
    
    @staticmethod
    def get_debug() -> bool:
        """Get debug flag from env or default"""
        return os.getenv("APP_DEBUG", "false").lower() in ("true", "1", "yes")
    
    @staticmethod
    def get_log_level() -> str:
        """Get log level from env or default"""
        return os.getenv("LOG_LEVEL", "INFO").upper()
    
    @staticmethod
    def get_log_file_path() -> Optional[str]:
        """Get log file path from env or default"""
        return os.getenv("LOG_FILE_PATH", "logs/app.log")
    
    @staticmethod
    def get_environment() -> str:
        """Get environment name from env or default"""
        return os.getenv("APP_ENVIRONMENT", "development")


# ============================================================================
# Remote Config Service Client
# ============================================================================

async def fetch_remote_config(config_name: str, timeout: int = 30, max_retries: int = 2) -> str:
    """
    Fetch configuration from remote config service with retry mechanism.
    
    Args:
        config_name: Configuration key name
        timeout: Request timeout in seconds
        max_retries: Maximum number of retries (total attempts = max_retries + 1)
        
    Returns:
        Configuration value as string
        
    Raises:
        ValueError: When config not found or request fails after all retries
    """
    base_url = (
        f"{os.getenv('NET_GATE', 'http://localhost:9080')}/"
        f"{os.getenv('ONTOLOGY_BACKEND_SERVER', 'ontology_backend_server')}"
    ).rstrip("/")
    
    url = f"{base_url}/api/v1/ontology/config/get"
    payload = {"config_name": config_name}
    
    last_error = None
    
    # Retry loop: attempt once + max_retries
    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                logger.info(f"Retrying config fetch for '{config_name}' (attempt {attempt + 1}/{max_retries + 1})")
            
            timeout_obj = aiohttp.ClientTimeout(total=timeout)
            async with aiohttp.ClientSession(timeout=timeout_obj) as session:
                async with session.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.text()
                    
                    try:
                        result = json.loads(response_data)
                    except json.JSONDecodeError as e:
                        # Log the original response content when JSON parsing fails
                        logger.error(f"JSON decode error for config '{config_name}': {e}")
                        logger.error(f"Original response content (first 500 chars): {response_data[:500]}")
                        logger.error(f"Response content length: {len(response_data)} chars")
                        raise ValueError(f"Invalid response for config '{config_name}': {e}")
                    
                    if result.get("status") == "success" and result.get("code") == "200":
                        config_value = result.get("data", {}).get("config_value")
                        if attempt > 0:
                            logger.info(f"Successfully fetched config '{config_name}' on attempt {attempt + 1}")
                        return config_value
                    else:
                        message = result.get("message", "Unknown error")
                        logger.warning(f"Failed to fetch config '{config_name}': {message}")
                        raise ValueError(f"Config '{config_name}' not found: {message}")
                        
        except aiohttp.ClientError as e:
            last_error = e
            logger.error(f"HTTP error fetching config '{config_name}' (attempt {attempt + 1}/{max_retries + 1}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                continue
        except ValueError as e:
            last_error = e
            logger.error(f"Config fetch error for '{config_name}' (attempt {attempt + 1}/{max_retries + 1}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                continue
        except Exception as e:
            last_error = e
            logger.error(f"Unexpected error fetching config '{config_name}' (attempt {attempt + 1}/{max_retries + 1}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                continue
        
        # If we get here without exception, break the retry loop
        break
    
    # If all retries failed, raise the last error
    if last_error:
        raise ValueError(f"Failed to fetch config '{config_name}' after {max_retries + 1} attempts: {last_error}")


def _parse_config_value(value: str) -> Any:
    """
    Parse config value string to appropriate Python type.
    Tries JSON parsing first, then returns as string.
    """
    if value is None:
        return None
    
    # Try JSON parsing for complex types
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Handle boolean strings
    if value.lower() in ('true', 'yes', '1', 'on'):
        return True
    elif value.lower() in ('false', 'no', '0', 'off'):
        return False
    
    # Handle None/null
    if value.lower() in ('none', 'null', ''):
        return None
    
    # Try number conversion
    try:
        if '.' in value:
            return float(value)
        else:
            return int(value)
    except ValueError:
        pass
    
    return value


# ============================================================================
# Lazy Config Getters - Fetch on Demand
# ============================================================================

async def get_mysql_config() -> Optional[Dict[str, Any]]:
    """
    Get MySQL configuration from remote service (mysql_meta).
    Returns None if not configured.
    """
    try:
        value = await fetch_remote_config("mysql_meta")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("MySQL config (mysql_meta) not found in remote service")
        return None


async def get_redis_config() -> Optional[Dict[str, Any]]:
    """
    Get Redis configuration from remote service (ontology_redis).
    Returns None if not configured.
    
    Expected format:
    {"host": "localhost", "port": 6380, "password": "...", "db": "2"}
    """
    try:
        value = await fetch_remote_config("ontology_redis")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("Redis config (ontology_redis) not found in remote service")
        return None


async def get_postgres_config() -> Optional[Dict[str, Any]]:
    """
    Get Postgres configuration from remote service.
    Returns None if not configured.
    """
    try:
        value = await fetch_remote_config("postgres")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("Postgres config not found in remote service")
        return None


async def get_minio_config() -> Optional[Dict[str, Any]]:
    """
    Get MinIO configuration from remote service (ontology_minio_info).
    Returns None if not configured.
    
    Expected format:
    {"host": "http://...", "access_key": "...", "secret_key": "...", "bucket": "..."}
    """
    try:
        value = await fetch_remote_config("ontology_minio_info")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("MinIO config (ontology_minio_info) not found in remote service")
        return None


async def get_ontology_route_url_config() -> Optional[Dict[str, Any]]:
    """
    Get ontology route URL configuration from remote service (ontology_route_url_python).
    Returns None if not configured.
    
    Expected format:
    {
        "ontology_graph": "ontology_back",
        "sandbox_dev": "ontology_sandbox",
        "sandbox_pro": "sandbox_pro",
        "ontology_backend": "ontology_backend_server"
    }
    """
    try:
        value = await fetch_remote_config("ontology_route_url_python")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("Ontology route URL config (ontology_route_url_python) not found in remote service")
        return None


async def get_dify_config(agent_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get Dify configuration from remote service (ontology_dify_info).
    
    Args:
        agent_name: Optional agent name ('dev' for chat, 'auto_complete' for auto-complete)
                   If None, returns full config
    
    Returns:
        If agent_name provided: {"base_url": "...", "api_key": "..."}
        If agent_name is None: Full config dict
    
    Expected remote format:
    {"base_url": "http://...", "agents": {"dev": "api-key", "auto_complete": "api-key"}}
    """
    try:
        value = await fetch_remote_config("ontology_dify_info")
        config = _parse_config_value(value)
        if not isinstance(config, dict):
            return None
        
        if agent_name is None:
            return config
        
        # Extract specific agent config
        base_url = config.get("base_url")
        agents = config.get("agents", {})
        api_key = agents.get(agent_name)
        
        if base_url and api_key:
            return {"base_url": base_url, "api_key": api_key}
        
        logger.warning(f"Dify agent '{agent_name}' not found in config")
        return None
        
    except ValueError:
        logger.debug("Dify config (ontology_dify_info) not found in remote service")
        return None


async def get_aap_config(agent_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get AAP configuration from remote service (ontology_aap_info).
    
    Args:
        agent_name: Optional agent name (e.g., 'auto_complete')
                   If None, returns full config
    
    Returns:
        If agent_name provided: {"base_url": "...", "api_key": "...", "agent_id": "...", "version": "..."}
        If agent_name is None: Full config dict
    
    Expected remote format:
    {"base_url": "http://...", "agents": {"auto_complete": {"api_key": "...", "agent_id": "...", "version": "..."}}}
    """
    try:
        value = await fetch_remote_config("ontology_aap_info")
        config = _parse_config_value(value)
        if not isinstance(config, dict):
            return None
        
        if agent_name is None:
            return config
        
        # Extract specific agent config
        base_url = config.get("base_url")
        agents = config.get("agents", {})
        agent_cfg = agents.get(agent_name, {})
        
        if base_url and agent_cfg:
            return {
                "base_url": base_url,
                "api_key": agent_cfg.get("api_key"),
                "agent_id": agent_cfg.get("agent_id"),
                "version": agent_cfg.get("version"),
            }
        
        logger.warning(f"AAP agent '{agent_name}' not found in config")
        return None
        
    except ValueError:
        logger.debug("AAP config (ontology_aap_info) not found in remote service")
        return None


async def get_netgate_url() -> str:
    """
    Get network gateway URL from remote service (ontology_netgate_http).
    Falls back to environment variable if not found.
    
    Returns:
        Gateway URL string
    """
    # try:
    #     value = await fetch_remote_config("ontology_netgate_http")
    #     if value:
    #         return value.strip()
    # except ValueError:
    #     pass
    
    # Fallback to environment variable
    return os.getenv('NET_GATE', 'http://localhost:9080')


async def get_embedding_config(service_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get embedding service configuration from remote service.
    
    Args:
        service_name: Specific service name, or None for default
        
    Returns:
        Embedding configuration dict or None
    """
    config_key = f"embedding.{service_name}" if service_name else "embedding"
    try:
        value = await fetch_remote_config(config_key)
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        # Try without service name suffix
        if service_name:
            try:
                value = await fetch_remote_config("embedding")
                config = _parse_config_value(value)
                if isinstance(config, dict):
                    # If config has the service_name as key, return that
                    if service_name in config:
                        return config[service_name]
                    return config
            except ValueError:
                pass
        logger.debug(f"Embedding config not found: {config_key}")
        return None


async def get_llm_config(service_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get LLM service configuration from remote service.
    
    Args:
        service_name: Specific service name (e.g., 'deepseek'), or None for default
        
    Returns:
        LLM configuration dict or None
    """
    config_key = f"llm.{service_name}" if service_name else "llm"
    try:
        value = await fetch_remote_config(config_key)
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        # Try without service name suffix
        if service_name:
            try:
                value = await fetch_remote_config("llm")
                config = _parse_config_value(value)
                if isinstance(config, dict):
                    # If config has the service_name as key, return that
                    if service_name in config:
                        return config[service_name]
                    return config
            except ValueError:
                pass
        logger.debug(f"LLM config not found: {config_key}")
        return None


async def get_ai_services_config() -> Optional[Dict[str, Any]]:
    """
    Get all AI services configuration from remote service.
    """
    try:
        value = await fetch_remote_config("ai_services")
        config = _parse_config_value(value)
        if isinstance(config, dict):
            return config
        return None
    except ValueError:
        logger.debug("AI services config not found in remote service")
        return None


async def get_database_config(db_type: str) -> Optional[Dict[str, Any]]:
    """
    Get database configuration by type.
    
    Args:
        db_type: Database type ('mysql', 'postgres')
        
    Returns:
        Database configuration dict or None
    """
    getters = {
        'mysql': get_mysql_config,
        'postgres': get_postgres_config,
    }
    
    getter = getters.get(db_type)
    if getter:
        return await getter()
    
    logger.warning(f"Unknown database type: {db_type}")
    return None


async def get_custom_config(config_name: str) -> Optional[Any]:
    """
    Get any custom configuration by name.
    
    Args:
        config_name: Configuration key name
        
    Returns:
        Configuration value or None
    """
    try:
        value = await fetch_remote_config(config_name)
        return _parse_config_value(value)
    except ValueError:
        logger.debug(f"Custom config not found: {config_name}")
        return None


# ============================================================================
# Synchronous Wrappers (for backwards compatibility in sync contexts)
# ============================================================================

def _run_async(coro):
    """Run async coroutine in sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're in an async context, we need a different approach
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result(timeout=60)
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        # No event loop, create new one
        return asyncio.run(coro)


def get_mysql_config_sync() -> Optional[Dict[str, Any]]:
    """Synchronous version of get_mysql_config"""
    return _run_async(get_mysql_config())


def get_redis_config_sync() -> Optional[Dict[str, Any]]:
    """Synchronous version of get_redis_config"""
    return _run_async(get_redis_config())


def get_postgres_config_sync() -> Optional[Dict[str, Any]]:
    """Synchronous version of get_postgres_config"""
    return _run_async(get_postgres_config())


def get_minio_config_sync() -> Optional[Dict[str, Any]]:
    """Synchronous version of get_minio_config"""
    return _run_async(get_minio_config())


def get_ontology_route_url_config_sync() -> Optional[Dict[str, Any]]:
    """Synchronous version of get_ontology_route_url_config"""
    return _run_async(get_ontology_route_url_config())


def get_dify_config_sync(agent_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_dify_config"""
    return _run_async(get_dify_config(agent_name))


def get_aap_config_sync(agent_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_aap_config"""
    return _run_async(get_aap_config(agent_name))


def get_netgate_url_sync() -> str:
    """Synchronous version of get_netgate_url"""
    return _run_async(get_netgate_url())


def get_embedding_config_sync(service_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_embedding_config"""
    return _run_async(get_embedding_config(service_name))


def get_llm_config_sync(service_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_llm_config"""
    return _run_async(get_llm_config(service_name))


def get_database_config_sync(db_type: str) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_database_config"""
    return _run_async(get_database_config(db_type))


# ============================================================================
# Utility Functions
# ============================================================================

def list_ai_services() -> Dict[str, List[str]]:
    """
    List all available AI services (placeholder - needs remote implementation)
    """
    # This would need to query the remote service for available services
    return {"llm": [], "embedding": []}


# ============================================================================
# Deprecated - For backwards compatibility during migration
# ============================================================================

class ConfigLoader:
    """
    DEPRECATED: This class is kept for backwards compatibility.
    Use the async config getters directly instead.
    """
    
    def __init__(self, *args, **kwargs):
        logger.warning(
            "ConfigLoader is deprecated. Use async config getters "
            "(get_mysql_config, get_postgres_config, etc.) instead."
        )
    
    def load_configuration(self, *args, **kwargs):
        raise NotImplementedError(
            "Configuration is now fetched lazily. Use async getters like "
            "get_mysql_config(), get_postgres_config(), etc."
        )


def get_config_loader(*args, **kwargs):
    """DEPRECATED: Use async config getters instead."""
    logger.warning(
        "get_config_loader is deprecated. Use async config getters "
        "(get_mysql_config, get_postgres_config, etc.) instead."
    )
    return None


def get_settings():
    """
    DEPRECATED: Use StartupConfig for startup configs or async getters for runtime configs.
    """
    raise NotImplementedError(
        "get_settings() is deprecated. Use:\n"
        "- StartupConfig.get_host(), StartupConfig.get_port(), etc. for startup configs\n"
        "- await get_mysql_config(), await get_postgres_config(), etc. for runtime configs"
    )


def reload_settings():
    """
    DEPRECATED: Configs are now fetched fresh on each request.
    No need to reload - just call the config getter again.
    """
    logger.info("reload_settings is deprecated. Configs are fetched fresh on each request.")
    pass

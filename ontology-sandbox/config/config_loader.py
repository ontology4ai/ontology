"""
Configuration loader for environment-driven settings.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, Union
from functools import lru_cache
from public.public_variable import logger
from .config_models import AppSettings


class ConfigLoader:
    """
    Configuration loader that supports environment variable overrides only.
    """
    
    def __init__(
        self,
        config_dir: Union[str, Path] = "config",
        environment: Optional[str] = None,
        auto_reload: bool = False
    ):
        """
        Initialize configuration loader
        
        Args:
            config_dir: Reserved for backward compatibility
            environment: Environment name (development, staging, production)
            auto_reload: Reserved for backward compatibility
        """
        self.config_dir = Path(config_dir)
        self.environment = environment or os.getenv("APP_ENVIRONMENT", "development")
        self.auto_reload = auto_reload
        self._settings: Optional[AppSettings] = None
        
        logger.info(f"ConfigLoader initialized for environment: {self.environment}")
    
    def _merge_configs(self, base_config: Dict[str, Any], override_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep merge two configuration dictionaries
        
        Args:
            base_config: Base configuration
            override_config: Configuration to override base with
            
        Returns:
            Merged configuration
        """
        def deep_merge(base: Dict, override: Dict) -> Dict:
            result = base.copy()
            
            for key, value in override.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value)
                else:
                    result[key] = value
            
            return result
        
        return deep_merge(base_config, override_config)
    
    def _load_environment_variables(self) -> Dict[str, Any]:
        """
        Load configuration from environment variables
        
        Environment variables should be prefixed with CONFIG_ and use
        double underscores for nested keys. For example:
        - CONFIG_APP__NAME=MyApp
        - CONFIG_DATABASES__MYSQL__HOST=localhost
        """
        env_config = {}
        prefix = "CONFIG_"
        
        for key, value in os.environ.items():
            if not key.startswith(prefix):
                continue
            
            # Remove prefix and convert to lowercase
            config_key = key[len(prefix):].lower()
            
            # Handle nested keys (double underscore separator)
            keys = config_key.split("__")
            
            # Navigate/create nested structure
            current = env_config
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            
            # Set the final value with type conversion
            final_key = keys[-1]
            current[final_key] = self._convert_env_value(value)
        
        if env_config:
            logger.debug(f"Loaded {len(env_config)} environment variable overrides")
        
        return env_config
    
    def _convert_env_value(self, value: str) -> Union[str, int, float, bool, None]:
        """
        Convert environment variable string to appropriate Python type
        
        Args:
            value: String value from environment variable
            
        Returns:
            Converted value
        """
        # Handle boolean values
        if value.lower() in ('true', 'yes', '1', 'on'):
            return True
        elif value.lower() in ('false', 'no', '0', 'off'):
            return False
        
        # Handle None/null values
        if value.lower() in ('none', 'null', ''):
            return None
        
        # Try to convert to number
        try:
            if '.' in value:
                return float(value)
            else:
                return int(value)
        except ValueError:
            pass
        
        # Return as string if no conversion applies
        return value
    
    def load_configuration(self, force_reload: bool = False) -> AppSettings:
        """
        Load configuration from defaults plus CONFIG_ environment overrides.
        
        Args:
            force_reload: Force reload even if already loaded
            
        Returns:
            Validated application settings
        """
        if self._settings and not force_reload:
            return self._settings
        
        try:
            logger.info("Loading application configuration from environment variables...")

            merged_config: Dict[str, Any] = {
                "app": {
                    "environment": self.environment,
                }
            }

            env_vars = self._load_environment_variables()
            if env_vars:
                merged_config = self._merge_configs(merged_config, env_vars)
            
            self._settings = AppSettings(**merged_config)
            
            logger.info(f"Configuration loaded successfully for environment: {self.environment}")
            logger.debug(f"Configuration summary: {self._get_config_summary()}")
            
            return self._settings
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise ValueError(f"Configuration loading failed: {e}")
    
    def _get_config_summary(self) -> Dict[str, Any]:
        """Get a summary of the loaded configuration (without sensitive data)"""
        if not self._settings:
            return {}
        
        return {
            "app_name": self._settings.app.name,
            "environment": self._settings.app.environment,
            "server_port": self._settings.server.port,
        }
    
    def get_database_config(self, db_type: str) -> Optional[Dict[str, Any]]:
        """Databases are no longer managed here; return None."""
        if not self._settings:
            raise ValueError("Configuration not loaded. Call load_configuration() first.")
        return None
    
    def reload_configuration(self) -> AppSettings:
        """Force reload settings from environment variables."""
        logger.info("Forcing configuration reload...")
        return self.load_configuration(force_reload=True)
    
    def validate_configuration(self) -> bool:
        """
        Validate current configuration
        
        Returns:
            True if configuration is valid
        """
        try:
            if not self._settings:
                self.load_configuration()
            
            logger.info("Configuration validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Configuration validation failed: {e}")
            return False
    
    def export_configuration(self, output_path: Path, include_sensitive: bool = False) -> None:
        """Export current configuration as JSON."""
        if not self._settings:
            raise ValueError("Configuration not loaded")
        
        config_dict = self._settings.model_dump()

        if not include_sensitive:
            for key in ["databases", "ai_services"]:
                config_dict.pop(key, None)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(config_dict, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Configuration exported to: {output_path}")


# Global configuration loader instance
_config_loader: Optional[ConfigLoader] = None


@lru_cache(maxsize=1)
def get_config_loader(
    config_dir: str = "config",
    environment: Optional[str] = None,
    auto_reload: bool = False
) -> ConfigLoader:
    """
    Get or create the global configuration loader instance
    
    Args:
        config_dir: Configuration directory
        environment: Environment name
        auto_reload: Enable auto-reload
        
    Returns:
        ConfigLoader instance
    """
    global _config_loader
    
    if _config_loader is None:
        _config_loader = ConfigLoader(
            config_dir=config_dir,
            environment=environment,
            auto_reload=auto_reload
        )
    
    return _config_loader


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """
    Get the application settings (cached)
    
    Returns:
        Loaded and validated application settings
    """
    loader = get_config_loader()
    return loader.load_configuration()


def reload_settings() -> AppSettings:
    """
    Force reload settings and clear cache
    
    Returns:
        Reloaded application settings
    """
    # Clear the cache
    get_settings.cache_clear()
    get_config_loader.cache_clear()
    
    global _config_loader
    _config_loader = None
    
    # Load fresh settings
    return get_settings()


"""
Configuration models for environment-driven settings.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic_settings import BaseSettings
from typing import Optional, Dict, List, Any, Literal


class DatabaseConfig(BaseModel):
    """Base database configuration"""
    host: str = Field(default="localhost", description="Database host")
    port: int = Field(description="Database port")
    user: str = Field(description="Database user")
    password: str = Field(description="Database password")
    database: str = Field(description="Database name")
    
    model_config = {"extra": "allow"}  # Allow additional fields for database-specific config


class MySQLConfig(DatabaseConfig):
    """MySQL specific configuration"""
    port: int = Field(default=3306, description="MySQL port")
    charset: str = Field(default="utf8mb4", description="Character encoding")
    autocommit: bool = Field(default=False, description="Auto-commit transactions")
    
    # Connection pool settings
    minsize: int = Field(default=1, ge=1, description="Minimum pool size")
    maxsize: int = Field(default=10, ge=1, description="Maximum pool size")
    pool_recycle: int = Field(default=3600, ge=60, description="Pool recycle time in seconds")
    
    @field_validator('maxsize')
    @classmethod
    def validate_pool_size(cls, v, info):
        if info.data.get('minsize') and v < info.data['minsize']:
            raise ValueError('maxsize must be >= minsize')
        return v


class PostgresConfig(DatabaseConfig):
    """PostgreSQL specific configuration (for async SQLModel)"""
    port: int = Field(default=5432, description="PostgreSQL port")
    default_schema: Optional[str] = Field(default=None, description="Default schema (search_path)")
    
    # Pool & engine settings
    pool_size: int = Field(default=5, ge=1, description="Connection pool size")
    max_overflow: int = Field(default=10, ge=0, description="Max overflow connections")
    pool_recycle: int = Field(default=3600, ge=60, description="Pool recycle time in seconds")
    echo: bool = Field(default=False, description="Echo SQL statements for debugging")
    connect_args: Optional[Dict[str, Any]] = Field(default=None, description="Additional asyncpg connect args")
    dsn: Optional[str] = Field(default=None, description="Full SQLAlchemy DSN, overrides other fields if set")


class MinioConfig(BaseModel):
    """MinIO object storage configuration"""
    host: str = Field(description="MinIO endpoint, may include scheme")
    access_key: str = Field(description="MinIO access key")
    secret_key: str = Field(description="MinIO secret key")
    bucket: str = Field(description="Default bucket for ontology exports")
    secure: Optional[bool] = Field(default=None, description="Override TLS detection; None derives from host scheme")
    region: Optional[str] = Field(default=None, description="Optional MinIO/S3 region")
    prefix: str = Field(default="ontology-exports", description="Key prefix used when uploading tar archives")

    model_config = {"extra": "allow"}


class DifyConfig(BaseModel):
    """Dify AI agent platform configuration"""
    base_url: str = Field(description="Dify API base URL (e.g., 'http://localhost:1909')")
    api_key: str = Field(description="Dify API key for authentication")
    
    @field_validator('base_url')
    @classmethod
    def validate_base_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('base_url must be a valid URL starting with http:// or https://')
        return v.rstrip('/')
    
    @field_validator('api_key')
    @classmethod
    def validate_api_key(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('api_key cannot be empty')
        return v.strip()

    model_config = {"extra": "allow"}


class DatabasesConfig(BaseModel):
    """All database configurations (optional - configs loaded lazily on demand)"""
    mysql: Optional[MySQLConfig] = None
    postgres: Optional[PostgresConfig] = None
    
    # NOTE: Removed startup validation - configs are now loaded lazily
    # and validated when actually used


class LoggingConfig(BaseModel):
    """Logging configuration"""
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )
    format: str = Field(
        default="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        description="Log format string"
    )
    file_path: Optional[str] = Field(default=None, description="Log file path")
    max_file_size: str = Field(default="10 MB", description="Max log file size")
    rotation_time: str = Field(default="1 day", description="Log rotation time")
    retention: str = Field(default="30 days", description="Log retention period")
    compress: bool = Field(default=True, description="Compress rotated logs")


class ServerConfig(BaseModel):
    """Server configuration"""
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")
    workers: int = Field(default=1, ge=1, description="Number of worker processes")
    reload: bool = Field(default=False, description="Enable auto-reload")
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # Security settings
    cors_origins: List[str] = Field(default=["*"], description="CORS allowed origins")
    cors_methods: List[str] = Field(default=["*"], description="CORS allowed methods")
    cors_headers: List[str] = Field(default=["*"], description="CORS allowed headers")


class LLMConfig(BaseModel):
    """Large Language Model configuration"""
    name: str = Field(description="LLM service name (e.g., 'openai', 'anthropic', 'azure')")
    api_key: str = Field(description="API key for the LLM service")
    base_url: Optional[str] = Field(default=None, description="Base URL for the LLM API")
    model: str = Field(description="Model name (e.g., 'gpt-4', 'claude-3-sonnet')")
    max_tokens: int = Field(default=4096, ge=1, description="Maximum tokens per request")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Temperature for response randomness")
    timeout: int = Field(default=60, ge=1, description="Request timeout in seconds")
    max_retries: int = Field(default=3, ge=0, description="Maximum number of retries")
    
    # Optional advanced settings
    organization: Optional[str] = Field(default=None, description="Organization ID (for OpenAI)")
    api_version: Optional[str] = Field(default=None, description="API version (for Azure)")
    deployment_name: Optional[str] = Field(default=None, description="Deployment name (for Azure)")
    
    @field_validator('api_key')
    @classmethod
    def validate_api_key(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('api_key cannot be empty')
        return v.strip()


class EmbeddingConfig(BaseModel):
    """Embedding service configuration"""
    name: str = Field(description="Embedding service name (e.g., 'openai', 'sentence-transformers')")
    host: str = Field(description="Service host URL (e.g., 'http://localhost:8000')")
    model: str = Field(description="Embedding model name")
    dimension: int = Field(default=1536, ge=1, description="Embedding vector dimension")
    batch_size: int = Field(default=32, ge=1, description="Batch size for processing")
    timeout: int = Field(default=30, ge=1, description="Request timeout in seconds")
    max_retries: int = Field(default=3, ge=0, description="Maximum number of retries")
    
    # Optional authentication
    api_key: Optional[str] = Field(default=None, description="API key if required")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Additional headers")
    
    @field_validator('host')
    @classmethod
    def validate_host_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('host must be a valid URL starting with http:// or https://')
        return v.rstrip('/')


class AIServicesConfig(BaseModel):
    """AI services configuration container"""
    llm: Optional[Dict[str, LLMConfig]] = Field(
        default=None,
        description="LLM service configurations (key: service alias, value: config)"
    )
    embedding: Optional[Dict[str, EmbeddingConfig]] = Field(
        default=None,
        description="Embedding service configurations (key: service alias, value: config)"
    )
    
    # Global settings
    default_llm: Optional[str] = Field(default=None, description="Default LLM service alias to use")
    default_embedding: Optional[str] = Field(default=None, description="Default embedding service alias to use")
    enable_fallback: bool = Field(default=True, description="Enable fallback to other services if primary fails")
    
    @model_validator(mode='after')
    def validate_defaults(self):
        """Validate that default services exist in configurations"""
        if self.default_llm and self.llm and self.default_llm not in self.llm:
            raise ValueError(f'default_llm "{self.default_llm}" not found in llm configurations')
        
        if self.default_embedding and self.embedding and self.default_embedding not in self.embedding:
            raise ValueError(f'default_embedding "{self.default_embedding}" not found in embedding configurations')
        
        return self


class ApplicationConfig(BaseModel):
    """Application specific configuration"""
    name: str = Field(default="ODLM Python", description="Application name")
    version: str = Field(default="0.1.0", description="Application version")
    description: str = Field(default="", description="Application description")
    environment: Literal["development", "staging", "production"] = Field(
        default="development", description="Environment"
    )
    timezone: str = Field(default="UTC", description="Application timezone")
    
    # Feature flags
    features: Dict[str, bool] = Field(
        default_factory=lambda: {
            "enable_metrics": True,
            "enable_swagger": True,
            "enable_health_checks": True,
        },
        description="Feature flags"
    )


class AppSettings(BaseSettings):
    """
    Main application settings backed by defaults and environment variables.
    """
    
    # Core configurations
    app: ApplicationConfig = Field(default_factory=ApplicationConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)
    databases: DatabasesConfig = Field(default_factory=DatabasesConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    minio: Optional[MinioConfig] = Field(default=None, alias="Minio")
    
    # AI services configuration (optional)
    ai_services: Optional[AIServicesConfig] = Field(default=None, description="AI services configuration")
    
    # Dify configuration (optional)
    dify: Optional[DifyConfig] = Field(default=None, description="Dify AI agent platform configuration")
    
    # Custom configurations (for extensibility)
    custom: Dict[str, Any] = Field(default_factory=dict, description="Custom configuration")
    
    model_config = {
        # Environment variable settings
        "env_prefix": "CONFIG_",
        "env_nested_delimiter": "__",
        "case_sensitive": False,
        
        # Environment file settings
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        
    # Allow extra fields for flexibility
    "extra": "allow",
    "populate_by_name": True,
        
        # JSON schema settings
        "json_schema_extra": {
            "example": {
                "app": {
                    "name": "ODLM Python",
                    "environment": "production"
                },
                "databases": {
                    "mysql": {
                        "host": "mysql.example.com",
                        "user": "app_user",
                        "database": "app_db"
                    }
                },
                "ai_services": {
                    "llm": {
                        "openai": {
                            "name": "openai",
                            "api_key": "sk-xxx",
                            "model": "gpt-4"
                        }
                    },
                    "embedding": {
                        "local": {
                            "name": "sentence-transformers",
                            "host": "http://localhost:8000",
                            "model": "all-MiniLM-L6-v2"
                        }
                    },
                    "default_llm": "openai",
                    "default_embedding": "local"
                }
            }
        }
    }
    
    @model_validator(mode='after')
    def validate_environment_consistency(self):
        """Ensure configuration is consistent with environment"""
        if self.app.environment == 'production':
            # Production-specific validations
            if self.server.debug:
                raise ValueError('debug mode should be disabled in production')
            if self.server.reload:
                raise ValueError('auto-reload should be disabled in production')
            if self.logging.level == 'DEBUG':
                raise ValueError('debug logging should be disabled in production')
                
        elif self.app.environment == 'development':
            # Development-specific recommendations (warnings, not errors)
            pass
            
        return self



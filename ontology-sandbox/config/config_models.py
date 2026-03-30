"""
Configuration models for environment-driven settings.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Dict, Literal, List


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


class MinIOConfig(BaseModel):
    """MinIO object storage configuration"""
    enabled: bool = Field(default=False, description="Enable MinIO storage")
    endpoint: str = Field(default="localhost:9000", description="MinIO server endpoint")
    access_key: str = Field(default="", description="MinIO access key")
    secret_key: str = Field(default="", description="MinIO secret key")
    bucket_name: str = Field(default="ontology-exports", description="Default bucket name")
    secure: bool = Field(default=False, description="Use HTTPS")
    region: str = Field(default="us-east-1", description="Region name")
    download_url_prefix: str = Field(default="", description="Download URL prefix for generated files")


class AppSettings(BaseModel):
    """
    Main application settings backed by defaults and environment variables.
    """
    
    # Core configurations
    app: ApplicationConfig = Field(default_factory=ApplicationConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)
    minio: MinIOConfig = Field(default_factory=MinIOConfig)
    
    model_config = {
        "extra": "allow",
        "json_schema_extra": {
            "example": {
                "app": {
                    "name": "Ontology Sandbox",
                    "environment": "production"
                },
                "server": {
                    "host": "0.0.0.0",
                    "port": 8000
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
                
        elif self.app.environment == 'development':
            # Development-specific recommendations (warnings, not errors)
            pass
            
        return self
"""
Database Service Factory

This module provides factory functions to create database service instances
using configuration from the centralized configuration system.
"""

from typing import Optional
from config import get_settings, get_mysql_config
from .mysql import MySQLService
from public.public_variable import logger
import traceback

class DatabaseServiceFactory:
    """
    Factory class for creating database service instances with configuration
    """
    
    def __init__(self):
        """Initialize the factory with current settings"""
        self.settings = get_settings()
        logger.info("Database service factory initialized")
    
    def create_mysql_service(self, config_override: Optional[dict] = None) -> Optional[MySQLService]:
        """
        Create MySQL service instance using configuration
        
        Args:
            config_override: Optional configuration overrides
            
        Returns:
            MySQLService instance or None if not configured
        """
        try:
            config = get_mysql_config()
            if not config:
                logger.warning("MySQL not configured, skipping service creation")
                return None
            
            # Apply overrides if provided
            if config_override:
                config.update(config_override)
            
            # Remove any fields that aren't MySQL service parameters
            mysql_params = {
                'host': config.get('host'),
                'port': config.get('port'),
                'user': config.get('user'),
                'password': config.get('password'),
                'database': config.get('database'),
                'charset': config.get('charset', 'utf8mb4'),
                'autocommit': config.get('autocommit', False),
                'minsize': config.get('minsize', 1),
                'maxsize': config.get('maxsize', 10),
                'pool_recycle': config.get('pool_recycle', 3600)
            }
            
            # Remove None values
            mysql_params = {k: v for k, v in mysql_params.items() if v is not None}
            
            service = MySQLService(**mysql_params)
            logger.info(f"MySQL service created: {service}")
            return service
            
        except Exception as e:
            logger.error(f"Failed to create MySQL service: {e}")
            logger.error(traceback.format_exc())
            raise
    
    

    
    def create_all_services(self) -> dict:
        """
        Create all configured database services
        
        Returns:
            Dictionary of service name -> service instance
        """
        services = {}
        
        # Create MySQL service
        mysql_service = self.create_mysql_service()
        if mysql_service:
            services['mysql'] = mysql_service
        
        logger.info(f"Created {len(services)} database services: {list(services.keys())}")
        return services
    
    async def test_all_connections(self) -> dict:
        """
        Test connections to all configured databases
        
        Returns:
            Dictionary of service name -> connection status
        """
        services = self.create_all_services()
        results = {}
        
        # Test MySQL connection
        if 'mysql' in services:
            try:
                success = await services['mysql'].aping()
                results['mysql'] = success
                logger.info(f"MySQL connection test: {'SUCCESS' if success else 'FAILED'}")
            except Exception as e:
                results['mysql'] = False
                logger.error(f"MySQL connection test failed: {e}")
        
        # Close services after testing
        for service_name, service in services.items():
            try:
                if hasattr(service, 'aclose'):
                    await service.aclose()
                elif hasattr(service, 'close'):
                    await service.close()
            except Exception as e:
                logger.warning(f"Error closing {service_name} service: {e}")
        
        return results


# Global factory instance
_factory: Optional[DatabaseServiceFactory] = None


def get_database_factory() -> DatabaseServiceFactory:
    """
    Get or create the global database service factory
    
    Returns:
        DatabaseServiceFactory instance
    """
    global _factory
    if _factory is None:
        _factory = DatabaseServiceFactory()
    return _factory


# Convenience functions for creating individual services

def create_mysql_service(config_override: Optional[dict] = None) -> Optional[MySQLService]:
    """Create MySQL service using configuration"""
    factory = get_database_factory()
    return factory.create_mysql_service(config_override)




def create_all_database_services() -> dict:
    """Create all configured database services"""
    factory = get_database_factory()
    return factory.create_all_services()


async def test_database_connections() -> dict:
    """Test all database connections"""
    factory = get_database_factory()
    return await factory.test_all_connections()
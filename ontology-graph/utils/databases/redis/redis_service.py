"""
Redis Service

This module provides Redis operations with connection pooling for queue management.
Supports single, sentinel, and cluster modes.
"""

import os
import json
import asyncio
from typing import Optional, Any, List, Dict, Literal
from contextlib import asynccontextmanager
from public.public_variable import logger

try:
    import redis.asyncio as aioredis
    from redis.asyncio.sentinel import Sentinel
    from redis.asyncio.cluster import RedisCluster
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis package not installed. Redis features will be disabled.")


RedisMode = Literal["single", "sentinel", "cluster"]


class RedisService:
    """
    Redis Service with async support for queue management
    
    Supports three deployment modes:
    - Single: Standard single Redis instance
    - Sentinel: Redis Sentinel for high availability
    - Cluster: Redis Cluster for horizontal scaling
    
    Features:
    - Connection pooling
    - Queue operations (push, pop, length)
    - Key-value operations
    - Set operations
    """
    
    def __init__(
        self,
        mode: RedisMode = "single",
        config: Dict[str, Any] = None,
        decode_responses: bool = True,
    ):
        """
        Initialize Redis service with configuration
        
        Args:
            mode: Redis deployment mode (single/sentinel/cluster)
            config: Mode-specific configuration dictionary
            decode_responses: Whether to decode byte responses to strings
            
        Config format for each mode:
        
        Single mode:
            {
                "host": "localhost",
                "port": 6380,
                "password": "...",
                "db": 2,
                "timeout": 3000,
                "max_connections": 50
            }
        
        Sentinel mode:
            {
                "master_name": "mymaster",
                "sentinels": [
                    {"host": "localhost", "port": 26379}
                ],
                "password": "...",
                "db": 0,
                "sentinel_password": null,
                "max_connections": 50
            }
        
        Cluster mode:
            {
                "nodes": [
                    {"host": "localhost", "port": 6379}
                ],
                "password": "...",
                "max_redirects": 3,
                "max_connections": 50
            }
        """
        if not REDIS_AVAILABLE:
            raise ImportError("redis package is required. Install with: pip install redis")
        
        if config is None:
            config = {}
        
        self.mode = mode
        self.config = config
        self.decode_responses = decode_responses
        
        self._pool: Optional[Any] = None
        self._client: Optional[Any] = None
        
        logger.info(f"Redis service initialized in {mode} mode")
    
    async def _get_client(self) -> Any:
        """Get or create Redis client based on mode"""
        if self._client is None:
            if self.mode == "single":
                self._client = await self._create_single_client()
            elif self.mode == "sentinel":
                self._client = await self._create_sentinel_client()
            elif self.mode == "cluster":
                self._client = await self._create_cluster_client()
            else:
                raise ValueError(f"Unsupported Redis mode: {self.mode}")
        return self._client
    
    async def _create_single_client(self) -> aioredis.Redis:
        """Create single-instance Redis client"""
        host = self.config.get("host", "localhost")
        port = int(self.config.get("port", 6379))
        password = self.config.get("password") or None
        db = int(self.config.get("db", 0))
        max_connections = int(self.config.get("max_connections", 10))
        timeout = self.config.get("timeout", 3000)
        
        self._pool = aioredis.ConnectionPool(
            host=host,
            port=port,
            password=password,
            db=db,
            max_connections=max_connections,
            decode_responses=self.decode_responses,
            socket_timeout=timeout / 1000.0 if timeout else None,
            socket_connect_timeout=timeout / 1000.0 if timeout else None,
        )
        client = aioredis.Redis(connection_pool=self._pool)
        logger.info(f"Connected to Redis single instance: {host}:{port} db={db}")
        return client
    
    async def _create_sentinel_client(self) -> aioredis.Redis:
        """Create Redis Sentinel client"""
        master_name = self.config.get("master_name", "mymaster")
        sentinels = self.config.get("sentinels", [])
        password = self.config.get("password") or None
        sentinel_password = self.config.get("sentinel_password") or None
        db = int(self.config.get("db", 0))
        
        if not sentinels:
            raise ValueError("Sentinel mode requires at least one sentinel node")
        
        # Convert sentinel list to tuples
        sentinel_list = [(s["host"], int(s["port"])) for s in sentinels]
        
        sentinel = Sentinel(
            sentinel_list,
            sentinel_kwargs={
                "password": sentinel_password,
                "decode_responses": self.decode_responses,
            },
            password=password,
            db=db,
            decode_responses=self.decode_responses,
        )
        
        client = sentinel.master_for(
            master_name,
            socket_timeout=self.config.get("timeout", 3000) / 1000.0,
        )
        
        logger.info(f"Connected to Redis Sentinel: master={master_name}, sentinels={len(sentinel_list)}")
        return client
    
    async def _create_cluster_client(self) -> RedisCluster:
        """Create Redis Cluster client"""
        nodes = self.config.get("nodes", [])
        password = self.config.get("password") or None
        max_redirects = int(self.config.get("max_redirects", 3))
        
        if not nodes:
            raise ValueError("Cluster mode requires at least one node")
        
        # Convert nodes list to startup_nodes format
        startup_nodes = [
            {"host": node["host"], "port": int(node["port"])}
            for node in nodes
        ]
        
        client = RedisCluster(
            startup_nodes=startup_nodes,
            password=password,
            max_connections_per_node=int(self.config.get("max_connections", 50)),
            decode_responses=self.decode_responses,
            skip_full_coverage_check=True,
            max_connections=int(self.config.get("max_connections", 50)),
        )
        
        logger.info(f"Connected to Redis Cluster: {len(nodes)} nodes")
        return client
    
    async def close(self):
        """Close the Redis connection"""
        if self._client:
            await self._client.close()
            self._client = None
        if self._pool:
            await self._pool.disconnect()
            self._pool = None
        logger.info("Redis connection closed")
    
    async def ping(self) -> bool:
        """Test Redis connection"""
        try:
            client = await self._get_client()
            result = await client.ping()
            return result
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    # Queue Operations (FIFO using list)
    
    async def queue_push(self, queue_name: str, item: Any) -> int:
        """
        Push an item to the end of the queue (FIFO - right push)
        
        Args:
            queue_name: Name of the queue
            item: Item to push (will be JSON serialized if not string)
            
        Returns:
            Length of the queue after push
        """
        client = await self._get_client()
        if not isinstance(item, str):
            item = json.dumps(item, ensure_ascii=False)
        return await client.rpush(queue_name, item)
    
    async def queue_pop(self, queue_name: str, timeout: int = 0) -> Optional[str]:
        """
        Pop an item from the front of the queue (FIFO - left pop)
        
        Args:
            queue_name: Name of the queue
            timeout: Blocking timeout in seconds (0 = non-blocking)
            
        Returns:
            The popped item or None if queue is empty
        """
        client = await self._get_client()
        if timeout > 0:
            result = await client.blpop(queue_name, timeout=timeout)
            return result[1] if result else None
        else:
            return await client.lpop(queue_name)
    
    async def queue_length(self, queue_name: str) -> int:
        """
        Get the length of the queue
        
        Args:
            queue_name: Name of the queue
            
        Returns:
            Number of items in the queue
        """
        client = await self._get_client()
        return await client.llen(queue_name)
    
    async def queue_peek(self, queue_name: str, start: int = 0, end: int = -1) -> List[str]:
        """
        Peek at items in the queue without removing them
        
        Args:
            queue_name: Name of the queue
            start: Start index
            end: End index (-1 for all)
            
        Returns:
            List of items in the specified range
        """
        client = await self._get_client()
        return await client.lrange(queue_name, start, end)
    
    async def queue_remove(self, queue_name: str, item: Any, count: int = 0) -> int:
        """
        Remove items from the queue
        
        Args:
            queue_name: Name of the queue
            item: Item to remove (will be JSON serialized if not string)
            count: Number of occurrences to remove (0 = all, >0 from head, <0 from tail)
            
        Returns:
            Number of items removed
        """
        client = await self._get_client()
        if not isinstance(item, str):
            item = json.dumps(item, ensure_ascii=False)
        return await client.lrem(queue_name, count, item)
    
    # Key-Value Operations
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        client = await self._get_client()
        return await client.get(key)
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """
        Set key-value pair
        
        Args:
            key: Key name
            value: Value to set
            expire: Expiration time in seconds (optional)
            
        Returns:
            True if successful
        """
        client = await self._get_client()
        if not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False)
        return await client.set(key, value, ex=expire)
    
    async def delete(self, *keys: str) -> int:
        """Delete keys"""
        client = await self._get_client()
        return await client.delete(*keys)
    
    async def incr(self, key: str, amount: int = 1) -> int:
        """Increment a key's value"""
        client = await self._get_client()
        return await client.incrby(key, amount)
    
    async def decr(self, key: str, amount: int = 1) -> int:
        """Decrement a key's value"""
        client = await self._get_client()
        return await client.decrby(key, amount)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        client = await self._get_client()
        return await client.exists(key) > 0
    
    # Set Operations (for tracking running tasks)
    
    async def set_add(self, set_name: str, *members: str) -> int:
        """Add members to a set"""
        client = await self._get_client()
        return await client.sadd(set_name, *members)
    
    async def set_remove(self, set_name: str, *members: str) -> int:
        """Remove members from a set"""
        client = await self._get_client()
        return await client.srem(set_name, *members)
    
    async def set_members(self, set_name: str) -> set:
        """Get all members of a set"""
        client = await self._get_client()
        return await client.smembers(set_name)
    
    async def set_count(self, set_name: str) -> int:
        """Get the number of members in a set"""
        client = await self._get_client()
        return await client.scard(set_name)
    
    async def set_is_member(self, set_name: str, member: str) -> bool:
        """Check if a member exists in a set"""
        client = await self._get_client()
        return await client.sismember(set_name, member)
    
    # Hash Operations (for task metadata)
    
    async def hash_set(self, hash_name: str, key: str, value: str) -> int:
        """
        Set a field in a hash
        
        Args:
            hash_name: Name of the hash
            key: Field key
            value: Field value
            
        Returns:
            1 if field is new, 0 if field existed and value was updated
        """
        client = await self._get_client()
        return await client.hset(hash_name, key, value)
    
    async def hash_get(self, hash_name: str, key: str) -> Optional[str]:
        """
        Get a field value from a hash
        
        Args:
            hash_name: Name of the hash
            key: Field key
            
        Returns:
            Field value or None if not exists
        """
        client = await self._get_client()
        return await client.hget(hash_name, key)
    
    async def hash_delete(self, hash_name: str, *keys: str) -> int:
        """
        Delete one or more fields from a hash
        
        Args:
            hash_name: Name of the hash
            keys: Field keys to delete
            
        Returns:
            Number of fields deleted
        """
        client = await self._get_client()
        return await client.hdel(hash_name, *keys)
    
    async def hash_get_all(self, hash_name: str) -> Dict[str, str]:
        """
        Get all fields and values from a hash
        
        Args:
            hash_name: Name of the hash
            
        Returns:
            Dictionary of all fields and values
        """
        client = await self._get_client()
        return await client.hgetall(hash_name)
    
    async def hash_exists(self, hash_name: str, key: str) -> bool:
        """
        Check if a field exists in a hash
        
        Args:
            hash_name: Name of the hash
            key: Field key
            
        Returns:
            True if field exists, False otherwise
        """
        client = await self._get_client()
        return await client.hexists(hash_name, key)


# Global Redis service instance
_redis_service: Optional[RedisService] = None


def _parse_redis_config(remote_config: Dict[str, Any]) -> tuple[RedisMode, Dict[str, Any]]:
    """
    Parse Redis configuration and return mode and mode-specific config.
    
    New format:
    {
        "mode": "single",  // or "sentinel", "cluster"
        "single": {...},
        "sentinel": {...},
        "cluster": {...},
        "common": {...}
    }
    
    Legacy format (auto-detect as single mode):
    {
        "host": "localhost",
        "port": 6380,
        "password": "...",
        "db": "2"
    }
    
    Environment variable override:
    - DEV_REDIS_DB: If set, overrides the db value from config (for local development)
    """
    # Check if it's the new format
    if "mode" in remote_config:
        mode = remote_config.get("mode", "single")
        common = remote_config.get("common", {})
        
        if mode not in ["single", "sentinel", "cluster"]:
            logger.warning(f"Invalid Redis mode '{mode}', falling back to 'single'")
            mode = "single"
        
        # Get mode-specific config and merge with common config
        mode_config = remote_config.get(mode, {}).copy()
        
        # Merge common config (mode-specific takes precedence)
        if "max_connections" not in mode_config:
            mode_config["max_connections"] = common.get("max_connections", 50)
        if "timeout" not in mode_config and mode != "cluster":
            mode_config["timeout"] = common.get("timeout", 3000)
        if "pool_size" in common and "max_connections" not in mode_config:
            mode_config["max_connections"] = common.get("pool_size", 10)
        
        # Apply environment variable override for db (only for single/sentinel modes)
        dev_redis_db = os.getenv("DEV_REDIS_DB")
        if dev_redis_db and mode in ["single", "sentinel"]:
            try:
                mode_config["db"] = int(dev_redis_db)
                logger.info(f"Using DEV_REDIS_DB override: db={dev_redis_db}")
            except ValueError:
                logger.warning(f"Invalid DEV_REDIS_DB value '{dev_redis_db}', ignoring override")
        
        return mode, mode_config
    
    # Legacy format - treat as single mode
    else:
        logger.info("Detected legacy Redis config format, treating as single mode")
        mode_config = remote_config
        
        # Apply environment variable override for db
        dev_redis_db = os.getenv("DEV_REDIS_DB")
        if dev_redis_db:
            try:
                mode_config = mode_config.copy()  # Create a copy to avoid modifying original
                mode_config["db"] = int(dev_redis_db)
                logger.info(f"Using DEV_REDIS_DB override: db={dev_redis_db}")
            except ValueError:
                logger.warning(f"Invalid DEV_REDIS_DB value '{dev_redis_db}', ignoring override")
        
        return "single", mode_config


def get_redis_service() -> RedisService:
    """
    Get or create the global Redis service instance.
    Connection settings are read from remote config service (ontology_redis).
    Falls back to environment variables if config service is unavailable.
    
    New remote config format:
    {
        "mode": "single",  // Options: single, sentinel, cluster
        "single": {
            "host": "localhost",
            "port": 6380,
            "password": "...",
            "db": 2,
            "timeout": 3000
        },
        "sentinel": {
            "master_name": "mymaster",
            "sentinels": [
                {"host": "localhost", "port": 26379}
            ],
            "password": "...",
            "db": 0,
            "sentinel_password": null
        },
        "cluster": {
            "nodes": [
                {"host": "localhost", "port": 6379}
            ],
            "password": "...",
            "max_redirects": 3
        },
        "common": {
            "timeout": 3000,
            "pool_size": 10,
            "max_connections": 50
        }
    }
    
    Legacy config format (treated as single mode):
    {"host": "localhost", "port": 6380, "password": "...", "db": "2"}
    
    Environment variable fallbacks (single mode only):
    - REDIS_HOST (default: localhost)
    - REDIS_PORT (default: 6379)
    - REDIS_PASSWORD (default: None)
    - REDIS_DB (default: 0)
    - REDIS_MAX_CONNECTIONS (default: 10)
    """
    global _redis_service
    if _redis_service is None:
        # Try to get config from remote service
        remote_config = None
        try:
            from config import get_redis_config_sync
            remote_config = get_redis_config_sync()
            if remote_config:
                logger.info("Using Redis config from remote service")
        except Exception as e:
            logger.warning(f"Failed to get Redis config from remote service: {e}, falling back to env vars")
        
        # Use remote config or fallback to environment variables
        if remote_config and isinstance(remote_config, dict):
            try:
                mode, mode_config = _parse_redis_config(remote_config)
                _redis_service = RedisService(
                    mode=mode,
                    config=mode_config,
                    decode_responses=True,
                )
            except Exception as e:
                logger.error(f"Failed to parse Redis config: {e}, falling back to env vars")
                remote_config = None
        
        # Fallback to environment variables (single mode only)
        if _redis_service is None:
            logger.info("Using Redis config from environment variables")
            env_config = {
                "host": os.getenv("REDIS_HOST", "localhost"),
                "port": int(os.getenv("REDIS_PORT", "6379")),
                "password": os.getenv("REDIS_PASSWORD") or None,
                "db": int(os.getenv("REDIS_DB", "0")),
                "max_connections": int(os.getenv("REDIS_MAX_CONNECTIONS", "10")),
            }
            _redis_service = RedisService(
                mode="single",
                config=env_config,
                decode_responses=True,
            )
    
    return _redis_service


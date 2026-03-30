"""
PostgreSQL Service Class with Async Support

This module provides a comprehensive PostgreSQL service class that supports both
asynchronous and synchronous operations with connection pooling, transaction
management, and proper error handling.

Best Practices Implemented:
- Connection pooling for async operations
- Async/await patterns for non-blocking operations (via asyncpg)
- Context managers for automatic resource cleanup
- Comprehensive error handling and logging
- Type hints for better code maintainability
- Transaction support with rollback capabilities
"""

from typing import Any, Dict, List, Optional, Union, Tuple, AsyncGenerator
from contextlib import asynccontextmanager, contextmanager
import traceback
import re

import asyncpg
import psycopg2
from psycopg2 import extras as pg_extras 

from public.public_variable import logger


class PostgresService:
    """
    PostgreSQL Database Service with async support

    Features:
    - Async connection pooling (asyncpg)
    - Transaction management with automatic rollback
    - Comprehensive error handling and logging
    - Support for parameterized queries to prevent SQL injection
    - Both async and sync methods for flexibility
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 5432,
        user: str = "postgres",
        password: str = "",
        database: str = "",
        autocommit: bool = False,
        # Connection pool settings (async)
        minsize: int = 1,
        maxsize: int = 200,
    ):
        """
        Initialize PostgreSQL service with connection parameters

        Args:
            host: PostgreSQL server host
            port: PostgreSQL server port
            user: Database user
            password: Database password
            database: Database name
            autocommit: Whether to autocommit transactions
            minsize: Minimum async pool size
            maxsize: Maximum async pool size
        """
        # psycopg2 expects the key name to be 'dbname'; asyncpg expects 'database'
        self.config = {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "dbname": database,
            "autocommit": autocommit,
        }

        self.pool_config = {
            "minsize": minsize,
            "maxsize": maxsize,
        }

        self._async_pool: Optional[asyncpg.pool.Pool] = None
        
        # 获取连接的超时时间
        self._acquire_timeout = 30
        # 命令执行超时
        self._command_timeout = 60

        logger.info(
            f"PostgreSQL service initialized for database: {database} at {host}:{port}"
        )

    @staticmethod
    def _pool_is_closed(pool: asyncpg.pool.Pool) -> bool:
        """
        Version-tolerant check for whether an asyncpg pool is closed.
        Some versions may not expose a 'closed' attribute consistently.
        """
        try:
            closed_attr = getattr(pool, "closed", None)
            if isinstance(closed_attr, bool):
                return closed_attr
            if callable(closed_attr):
                return bool(closed_attr())
        except Exception:
            pass
        return bool(getattr(pool, "_closed", False))

    async def _get_async_pool(self) -> asyncpg.pool.Pool:
        """Get or create async connection pool"""
        if self._async_pool is None or self._pool_is_closed(self._async_pool):
            try:
                # Map configuration for asyncpg
                self._async_pool = await asyncpg.create_pool(
                    host=self.config["host"],
                    port=self.config["port"],
                    user=self.config["user"],
                    password=self.config["password"],
                    database=self.config["dbname"],
                    min_size=self.pool_config["minsize"],
                    max_size=self.pool_config["maxsize"],
                    command_timeout=self._command_timeout,  # 命令执行超时
                    timeout=10,  # 连接超时
                )
                logger.info("Async PostgreSQL (asyncpg) connection pool created successfully")
            except Exception as e:
                logger.error(f"Failed to create async PostgreSQL pool: {str(e)}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to create async PostgreSQL pool: {str(e)}")

        return self._async_pool

    def _get_sync_connection(self) -> psycopg2.extensions.connection:
        """Get sync connection (creates new connection each time for simplicity)"""
        try:
            # psycopg2.connect accepts 'dbname' kwarg
            connection = psycopg2.connect(
                host=self.config["host"],
                port=self.config["port"],
                user=self.config["user"],
                password=self.config["password"],
                dbname=self.config["dbname"],
            )
            # Align autocommit behavior with configuration
            connection.autocommit = bool(self.config.get("autocommit", False))
            logger.debug("Sync PostgreSQL connection created successfully")
            return connection
        except Exception as e:
            logger.error(f"Failed to create sync PostgreSQL connection: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to create sync PostgreSQL connection: {str(e)}")

    @asynccontextmanager
    async def get_async_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """
        Async context manager for getting database connections

        Usage:
            async with service.get_async_connection() as conn:
                # Use connection
                pass
        """
        import asyncio
        pool = await self._get_async_pool()
        conn: Optional[asyncpg.Connection] = None
        try:
            # 记录连接池状态
            logger.debug(f"PostgreSQL pool status - size: {pool.get_size()}, freesize: {pool.get_idle_size()}, maxsize: {pool.get_max_size()}")
            
            # 添加获取连接的超时
            conn = await asyncio.wait_for(
                pool.acquire(),
                timeout=self._acquire_timeout
            )
            
            # 健康检查：执行简单查询确保连接可用
            try:
                await asyncio.wait_for(conn.fetchval("SELECT 1"), timeout=5)
            except Exception as ping_err:
                logger.warning(f"PostgreSQL connection health check failed, will release and retry: {ping_err}")
                # 先释放回池
                try:
                    await pool.release(conn)
                except Exception:
                    pass
                conn = None
                # 重新获取一个连接
                conn = await asyncio.wait_for(
                    pool.acquire(),
                    timeout=self._acquire_timeout
                )
            
            yield conn
            
        except asyncio.TimeoutError:
            # 连接池耗尽时输出更多诊断信息
            try:
                logger.error(f"Timeout acquiring PostgreSQL connection from pool after {self._acquire_timeout}s. "
                           f"Pool status - size: {pool.get_size()}, freesize: {pool.get_idle_size()}, maxsize: {pool.get_max_size()}")
            except Exception:
                logger.error(f"Timeout acquiring PostgreSQL connection from pool after {self._acquire_timeout}s")
            raise Exception(f"PostgreSQL connection pool timeout after {self._acquire_timeout}s")
        except Exception as e:
            logger.error(f"Error with async PostgreSQL connection: {str(e)}")
            raise
        finally:
            if conn is not None:
                try:
                    if not conn.is_closed():
                        await pool.release(conn)
                    else:
                        logger.debug("PostgreSQL connection was already closed, skipping release")
                except Exception as release_err:
                    logger.warning(f"Failed to release PostgreSQL connection: {release_err}")

    # --- Internal helpers for asyncpg parameter style ---

    @staticmethod
    def _convert_query_and_params(
        query: str,
        params: Optional[Union[Dict, List, Tuple]],
    ) -> Tuple[str, Tuple[Any, ...]]:
        """Convert psycopg-style placeholders to asyncpg-style if needed.

        Supports:
        - Sequence params with "%s" placeholders
        - Mapping params with "%(name)s" placeholders
        - If query already contains "$1"-style placeholders, it passes through.
        - Handles IN %s with list parameters by converting to = ANY($n)
        """
        if not params:
            return query, tuple()

        # If already asyncpg-style, pass through but ensure positional args
        if re.search(r"\$\d+", query):
            if isinstance(params, dict):
                raise ValueError("Positional parameters required when using $n placeholders")
            return query, tuple(params)

        if isinstance(params, (list, tuple)):
            # Replace each %s with $1, $2, ...
            # Special handling: convert "IN %s" to "= ANY($n)" when param is a list
            count = query.count("%s")
            if count != len(params):
                raise ValueError("Number of %s placeholders does not match params length")
            new_query_parts: List[str] = []
            index = 0
            # Split by %s but keep track of context
            parts = re.split(r"(%s)", query)
            for i, ch in enumerate(parts):
                if ch == "%s":
                    # Check if previous part ends with "IN " or "in " (case-insensitive)
                    is_in_clause = False
                    if i > 0:
                        prev_part = parts[i - 1]
                        # Check if the previous part ends with IN (with optional whitespace/parentheses)
                        if re.search(r'\bIN\s*$', prev_part, re.IGNORECASE):
                            is_in_clause = True
                    
                    # If this is an IN clause and the parameter is a list, use ANY
                    if is_in_clause and index < len(params) and isinstance(params[index], (list, tuple)):
                        # Remove the trailing "IN " from the previous part
                        if new_query_parts:
                            new_query_parts[-1] = re.sub(r'\bIN\s*$', '', new_query_parts[-1], flags=re.IGNORECASE)
                        new_query_parts.append(f"= ANY(${index + 1})")
                    else:
                        new_query_parts.append(f"${index + 1}")
                    index += 1
                else:
                    new_query_parts.append(ch)
            return "".join(new_query_parts), tuple(params)

        if isinstance(params, dict):
            # Replace each %(name)s with $1.. in order of appearance
            # Special handling: convert "IN %(name)s" to "= ANY($n)" when param is a list
            pattern = re.compile(r"%\(([^)]+)\)s")
            names = pattern.findall(query)
            if not names:
                # No named placeholders; allow passthrough
                return query, tuple()
            args: List[Any] = []
            index_map: Dict[str, int] = {}

            def replacement(match: re.Match) -> str:
                name = match.group(1)
                # Allow duplicate names by reusing index
                if name in index_map:
                    return f"${index_map[name]}"
                value = params.get(name)
                args.append(value)
                new_index = len(args)
                index_map[name] = new_index
                
                # Check if this is part of an IN clause with a list value
                # Look back in the query to see if "IN " precedes this placeholder
                match_start = match.start()
                prefix = query[:match_start]
                if re.search(r'\bIN\s*$', prefix, re.IGNORECASE) and isinstance(value, (list, tuple)):
                    # We'll return a marker to replace the "IN %(name)s" pattern
                    return f"__IN_REMOVED__= ANY(${new_index})"
                
                return f"${new_index}"

            new_query = pattern.sub(replacement, query)
            # Remove the "IN " that precedes the __IN_REMOVED__ marker
            new_query = re.sub(r'\bIN\s*__IN_REMOVED__', '', new_query, flags=re.IGNORECASE)
            return new_query, tuple(args)

        # Fallback
        return query, tuple()

    @contextmanager
    def get_sync_connection(self):
        """
        Sync context manager for getting database connections

        Usage:
            with service.get_sync_connection() as conn:
                # Use connection
                pass
        """
        conn = None
        try:
            conn = self._get_sync_connection()
            yield conn
        except Exception as e:
            logger.error(f"Error with sync PostgreSQL connection: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()

    # Async Methods

    async def aexecute(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> int:
        """
        Execute a query asynchronously (INSERT, UPDATE, DELETE)

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            Number of affected rows
        """
        async with self.get_async_connection() as conn:
            try:
                sql, args = self._convert_query_and_params(query, params)
                if self.config.get("autocommit", False):
                    status: str = await conn.execute(sql, *args)
                else:
                    async with conn.transaction():
                        status = await conn.execute(sql, *args)
                # status like 'INSERT 0 1' or 'UPDATE 5'
                try:
                    affected_rows = int(status.split()[-1])
                except Exception:
                    affected_rows = 0
                logger.debug(
                    f"Async PostgreSQL query executed successfully, affected rows: {affected_rows}"
                )
                return int(affected_rows)
            except Exception as e:
                logger.error(f"Failed to execute async PostgreSQL query: {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to execute async PostgreSQL query: {str(e)}")

    async def afetch_one(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a single row asynchronously

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            Single row as dictionary or None if no results
        """
        async with self.get_async_connection() as conn:
            try:
                sql, args = self._convert_query_and_params(query, params)
                row = await conn.fetchrow(sql, *args)
                logger.debug(f"Async PostgreSQL fetch one completed, result: {bool(row)}")
                return dict(row) if row is not None else None
            except Exception as e:
                logger.error(f"Failed to async fetch one (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to async fetch one (PostgreSQL): {str(e)}")

    async def afetch_all(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all rows asynchronously

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            List of rows as dictionaries
        """
        async with self.get_async_connection() as conn:
            try:
                sql, args = self._convert_query_and_params(query, params)
                result = await conn.fetch(sql, *args)
                rows = [dict(r) for r in result]
                logger.debug(f"Async PostgreSQL fetch all completed, rows: {len(rows)}")
                return rows
            except Exception as e:
                logger.error(f"Failed to async fetch all (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to async fetch all (PostgreSQL): {str(e)}")

    async def afetch_many(
        self,
        query: str,
        size: int,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch multiple rows asynchronously

        Args:
            query: SQL query string
            size: Number of rows to fetch
            params: Query parameters for parameterized queries

        Returns:
            List of rows as dictionaries
        """
        async with self.get_async_connection() as conn:
            try:
                sql, args = self._convert_query_and_params(query, params)
                # asyncpg has no fetchmany; emulate with LIMIT
                limited_sql = f"SELECT * FROM ({sql}) AS subquery LIMIT {int(size)}"
                result = await conn.fetch(limited_sql, *args)
                rows = [dict(r) for r in result]
                logger.debug(f"Async PostgreSQL fetch many completed, rows: {len(rows)}")
                return rows
            except Exception as e:
                logger.error(f"Failed to async fetch many (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to async fetch many (PostgreSQL): {str(e)}")

    async def aexecute_many(
        self,
        query: str,
        params_list: List[Union[Dict, List, Tuple]],
    ) -> int:
        """
        Execute a query multiple times with different parameters asynchronously

        Args:
            query: SQL query string
            params_list: List of parameters for each execution

        Returns:
            Total number of affected rows
        """
        async with self.get_async_connection() as conn:
            try:
                # asyncpg.executemany doesn't provide affected row count; execute individually
                total = 0
                if not params_list:
                    return 0
                if self.config.get("autocommit", False):
                    for p in params_list:
                        sql, args = self._convert_query_and_params(query, p)
                        status = await conn.execute(sql, *args)
                        try:
                            total += int(status.split()[-1])
                        except Exception:
                            pass
                else:
                    async with conn.transaction():
                        for p in params_list:
                            sql, args = self._convert_query_and_params(query, p)
                            status = await conn.execute(sql, *args)
                            try:
                                total += int(status.split()[-1])
                            except Exception:
                                pass
                logger.debug(
                    f"Async PostgreSQL execute many completed, affected rows: {total}"
                )
                return int(total)
            except Exception as e:
                logger.error(f"Failed to async execute many (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params count: {len(params_list)}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to async execute many (PostgreSQL): {str(e)}")

    @asynccontextmanager
    async def atransaction(self):
        """
        Async transaction context manager

        Usage:
            async with service.atransaction() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("INSERT ...")
                    await cursor.execute("UPDATE ...")
                # Auto-commit if no exception, rollback if exception
        """
        async with self.get_async_connection() as conn:
            tr = conn.transaction()
            try:
                await tr.start()
                yield conn
                await tr.commit()
                logger.debug("Async PostgreSQL transaction committed successfully")
            except Exception:
                await tr.rollback()
                logger.error("Async PostgreSQL transaction rolled back due to error")
                logger.error(traceback.format_exc())
                raise

    # Sync Methods (for compatibility)

    def execute(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> int:
        """
        Execute a query synchronously (INSERT, UPDATE, DELETE)

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            Number of affected rows
        """
        with self.get_sync_connection() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    if not self.config.get("autocommit", False):
                        conn.commit()
                    affected_rows = cursor.rowcount
                    logger.debug(
                        f"Sync PostgreSQL query executed successfully, affected rows: {affected_rows}"
                    )
                    return int(affected_rows)
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                logger.error(f"Failed to execute sync PostgreSQL query: {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to execute sync PostgreSQL query: {str(e)}")

    def fetch_one(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a single row synchronously

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            Single row as dictionary or None if no results
        """
        with self.get_sync_connection() as conn:
            try:
                with conn.cursor(cursor_factory=pg_extras.RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchone()
                    logger.debug(
                        f"Sync PostgreSQL fetch one completed, result: {bool(result)}"
                    )
                    return dict(result) if result is not None else None
            except Exception as e:
                logger.error(f"Failed to sync fetch one (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to sync fetch one (PostgreSQL): {str(e)}")

    def fetch_all(
        self,
        query: str,
        params: Optional[Union[Dict, List, Tuple]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all rows synchronously

        Args:
            query: SQL query string
            params: Query parameters for parameterized queries

        Returns:
            List of rows as dictionaries
        """
        with self.get_sync_connection() as conn:
            try:
                with conn.cursor(cursor_factory=pg_extras.RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchall()
                    rows = [dict(r) for r in result]
                    logger.debug(
                        f"Sync PostgreSQL fetch all completed, rows: {len(rows)}"
                    )
                    return rows
            except Exception as e:
                logger.error(f"Failed to sync fetch all (PostgreSQL): {str(e)}")
                logger.error(f"Query: {query}")
                logger.error(f"Params: {params}")
                logger.error(traceback.format_exc())
                raise Exception(f"Failed to sync fetch all (PostgreSQL): {str(e)}")

    @contextmanager
    def transaction(self):
        """
        Sync transaction context manager

        Usage:
            with service.transaction() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("INSERT ...")
                    cursor.execute("UPDATE ...")
                # Auto-commit if no exception, rollback if exception
        """
        with self._get_sync_connection() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("BEGIN")
                yield conn
                with conn.cursor() as cursor:
                    cursor.execute("COMMIT")
                logger.debug("Sync PostgreSQL transaction committed successfully")
            except Exception as e:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("ROLLBACK")
                except Exception:
                    pass
                logger.error(
                    f"Sync PostgreSQL transaction rolled back due to error: {str(e)}"
                )
                logger.error(traceback.format_exc())
                raise

    # Utility Methods

    async def aclose(self):
        """Close async connection pool"""
        if self._async_pool:
            await self._async_pool.close()
            logger.info("Async PostgreSQL connection pool closed")

    async def aping(self) -> bool:
        """
        Test async database connectivity

        Returns:
            True if connection successful, False otherwise
        """
        try:
            async with self.get_async_connection() as conn:
                value = await conn.fetchval("SELECT 1")
                logger.info("Async PostgreSQL ping successful")
                return value == 1
        except Exception as e:
            logger.error(f"Async PostgreSQL ping failed: {str(e)}")
            return False

    def ping(self) -> bool:
        """
        Test sync database connectivity

        Returns:
            True if connection successful, False otherwise
        """
        try:
            with self.get_sync_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    logger.info("Sync PostgreSQL ping successful")
                    return (result[0] if isinstance(result, (list, tuple)) else result) == 1
        except Exception as e:
            logger.error(f"Sync PostgreSQL ping failed: {str(e)}")
            return False

    def __repr__(self) -> str:
        return f"PostgresService(host={self.config['host']}, database={self.config['dbname']})"



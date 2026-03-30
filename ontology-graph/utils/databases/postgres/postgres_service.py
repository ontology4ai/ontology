"""
PostgreSQL ORM Service (Async, SQLModel)

This module provides an async-first PostgreSQL service built on top of
SQLAlchemy's async engine and SQLModel's ORM. It manages engine/session
lifecycles, transactions, and provides convenient helpers for health checks
and schema initialization.

Best Practices Implemented:
- Async engine and session management with connection pooling
- Context managers for automatic resource cleanup
- Comprehensive error handling and logging
- Type hints for maintainability
"""

from __future__ import annotations

from typing import AsyncGenerator, Optional, Any
from contextlib import asynccontextmanager

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text, MetaData
from sqlalchemy.engine import URL

from public.public_variable import logger


class PostgresORMService:
    """
    Async PostgreSQL ORM service using SQLModel/SQLAlchemy.

    Features:
    - Async engine and session factory with pooling
    - Transaction/session context managers
    - Health check (ping)
    - Optional schema initialization helpers
    - Raw SQL execution helpers (for utility/maintenance)
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 5432,
        user: str = "postgres",
        password: str = "",
        database: str = "postgres",
        dsn: Optional[str] = None,
        schema: Optional[str] = None,
        # Pool & engine settings
        pool_size: int = 5,
        max_overflow: int = 10,
        pool_recycle: int = 3600,
        echo: bool = False,
        connect_args: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Initialize the async Postgres ORM service.

        Args:
            host: Database host
            port: Database port
            user: Username
            password: Password
            database: Database name
            schema: Optional default schema (search_path)
            pool_size: Base pool size
            max_overflow: Extra transient connections beyond pool_size
            pool_recycle: Seconds after which a connection is recycled
            echo: SQL echo for debugging
            connect_args: Additional asyncpg connect args
        """
        # Build a safe URL/DSN. Prefer explicitly provided DSN, otherwise construct via URL.create
        if dsn:
            url = dsn
        else:
            url = URL.create(
                drivername="postgresql+asyncpg",
                username=user,
                password=password,
                host=host,
                port=port,
                database=database,
            )
        self._dsn = url
        self._schema = schema

        engine_args: dict[str, Any] = {
            "echo": echo,
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "pool_recycle": pool_recycle,
        }
        if connect_args:
            engine_args["connect_args"] = connect_args

        try:
            self._engine: AsyncEngine = create_async_engine(self._dsn, **engine_args)
            self._session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
                bind=self._engine,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False,
            )
            logger.info(
                f"Postgres ORM service initialized for database: {database} at {host}:{port}"
            )
        except Exception as e:
            logger.error(f"Failed to create async Postgres engine: {str(e)}")
            raise

    @property
    def engine(self) -> AsyncEngine:
        return self._engine

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Async context manager yielding an `AsyncSession`.
        """
        session: Optional[AsyncSession] = None
        try:
            session = self._session_factory()
            if self._schema:
                await session.execute(text(f"SET search_path TO {self._schema}"))
            yield session
            await session.commit()
        except Exception as e:
            if session is not None:
                await session.rollback()
            logger.error(f"Error during session operation: {str(e)}")
            raise
        finally:
            if session is not None:
                await session.close()

    async def ping(self) -> bool:
        """Check connectivity to the database."""
        try:
            async with self.engine.begin() as conn:
                if self._schema:
                    await conn.execute(text(f"SET search_path TO {self._schema}"))
                result = await conn.execute(text("SELECT 1"))
                row = result.scalar()
                logger.info("Async Postgres ping successful")
                return row == 1
        except Exception as e:
            logger.error(f"Async Postgres ping failed: {str(e)}")
            return False

    async def create_all(self, metadata: Optional[MetaData] = None) -> None:
        """
        Create tables for registered SQLModel models.

        If `metadata` is not provided, uses `SQLModel.metadata`.
        """
        target_metadata = metadata or SQLModel.metadata
        try:
            async with self.engine.begin() as conn:
                if self._schema:
                    await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {self._schema}"))
                    await conn.execute(text(f"SET search_path TO {self._schema}"))
                await conn.run_sync(target_metadata.create_all)
            logger.info("Postgres tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {str(e)}")
            raise

    async def drop_all(self, metadata: Optional[MetaData] = None) -> None:
        """
        Drop tables for registered SQLModel models.

        If `metadata` is not provided, uses `SQLModel.metadata`.
        """
        target_metadata = metadata or SQLModel.metadata
        try:
            async with self.engine.begin() as conn:
                if self._schema:
                    await conn.execute(text(f"SET search_path TO {self._schema}"))
                await conn.run_sync(target_metadata.drop_all)
            logger.info("Postgres tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop tables: {str(e)}")
            raise

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Transaction context manager yielding an `AsyncSession`.
        """
        async with self.get_session() as session:
            yield session

    async def aexecute(self, sql: str, params: Optional[dict[str, Any]] = None) -> None:
        """Execute a raw SQL statement (INSERT/UPDATE/DELETE)."""
        async with self.get_session() as session:
            await session.execute(text(sql), params or {})

    async def afetch_all(self, sql: str, params: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        """Execute a raw SELECT and return list of mappings."""
        async with self.get_session() as session:
            result = await session.execute(text(sql), params or {})
            return [dict(row._mapping) for row in result]

    async def afetch_one(self, sql: str, params: Optional[dict[str, Any]] = None) -> Optional[dict[str, Any]]:
        """Execute a raw SELECT and return one mapping or None."""
        async with self.get_session() as session:
            result = await session.execute(text(sql), params or {})
            row = result.first()
            return dict(row._mapping) if row else None

    async def aclose(self) -> None:
        """Dispose the async engine and close pool connections."""
        try:
            await self.engine.dispose()
            logger.info("Async Postgres engine disposed")
        except Exception as e:
            logger.warning(f"Error disposing Postgres engine: {str(e)}")

    def __repr__(self) -> str:  # pragma: no cover - repr utility
        return f"PostgresORMService(dsn=***, schema={self._schema})"



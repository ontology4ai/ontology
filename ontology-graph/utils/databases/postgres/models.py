"""
SQLModel ORM models for existing PostgreSQL tables in schema "dev".

These classes are mapped to your existing tables and suitable for use with
the async `PostgresORMService`. Import this module before calling
`await service.create_all()` so models are registered in `SQLModel.metadata`.
For existing databases you typically won't call `create_all`; you will use
sessions to query/insert/update rows.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any

import sqlalchemy as sa
from sqlalchemy.types import UserDefinedType
from sqlmodel import SQLModel, Field
from pgvector.sqlalchemy import Vector

class OntologyAgentSupportedTask(SQLModel, table=True):
    __tablename__ = "ontology_agent_supported_task"
    __table_args__ = {"schema": "dev"}

    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(default=None, sa_column=sa.Column(sa.String(255)))
    detail: Optional[str] = Field(default=None, sa_column=sa.Column(sa.String(255)))
    created_at: Optional[datetime] = Field(default=None, sa_column=sa.Column(sa.DateTime()))
    updated_at: Optional[datetime] = Field(default=None, sa_column=sa.Column(sa.DateTime()))
    status: int = Field(sa_column=sa.Column(sa.Integer, nullable=False))


class OntologyConceptLevelNodesInfo(SQLModel, table=True):
    __tablename__ = "ontology_concept_level_nodes_info"
    __table_args__ = {"schema": "dev"}

    id: Optional[int] = Field(default=None, primary_key=True)
    node_name: str = Field(sa_column=sa.Column(sa.String(100), nullable=False, unique=True))
    label: Optional[str] = Field(default=None, sa_column=sa.Column(sa.String(100)))
    subclass_of: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    comment: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text()))


class OntologyInstanceNodesInfo(SQLModel, table=True):
    __tablename__ = "ontology_instance_nodes_info"
    __table_args__ = {"schema": "dev"}

    id: Optional[int] = Field(default=None, primary_key=True)
    node_name: str = Field(sa_column=sa.Column(sa.String(100), nullable=False, unique=True))
    is_instance_of: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    comment: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text()))
    workspace_id: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    owner_id: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    create_time: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    last_update: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    embedding: Optional[Any] = Field(default=None, sa_type=Vector(1024))

class OntologyManage(SQLModel, table=True):
    __tablename__ = "ontology_manage"
    __table_args__ = {"schema": "dev"}

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=sa.Column(sa.String(100), nullable=False))
    en_name: Optional[str] = Field(default=None, sa_column=sa.Column(sa.String(100)))
    workspace_id: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    owner_id: Optional[int] = Field(default=None, sa_column=sa.Column(sa.Integer))
    create_time: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    last_update: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    status: Optional[int] = Field(default=1, sa_column=sa.Column(sa.Integer, server_default=sa.text("1")))

class OntologyObjectRelation(SQLModel, table=True):
    __tablename__ = "ontology_object_relation"
    __table_args__ = {"schema": "dev"}
    
    ontology_id: int = Field(sa_column=sa.Column(sa.Integer, nullable=False, primary_key=True))
    object_id: int = Field(sa_column=sa.Column(sa.Integer, nullable=False, primary_key=True))

__all__ = [
    "DevVector",
    "OntologyAgentSupportedTask",
    "OntologyConceptLevelNodesInfo",
    "OntologyInstanceNodesInfo",
    "OntologyManage",
    "OntologyObjectRelation",
]



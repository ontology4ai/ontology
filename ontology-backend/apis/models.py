from typing import List, Optional, Literal, Any,Union

from pydantic import BaseModel, Field, ConfigDict,field_validator


class ObjectFieldInfo(BaseModel):
    """Field definition for an object being created."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    instance_id: int = Field(..., description="Instance ID")
    object_field_name: str = Field(..., description="Name of the object field to create")
    source_field_name: str = Field(..., description="Source field name that this object field originates from")


class CreateObjectRequest(BaseModel):
    """Request body for applying object changes for a given ontology.
    Now only includes ontology_id; all other data is loaded from MySQL tables
    and processed step-by-step (create/update/delete) based on `state`.
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ontology_id: str = Field(..., description="Ontology ID from MySQL `ontology_manage.id`")


class ApiResponse(BaseModel):
    """Unified API response model with at least a status field."""

    model_config = ConfigDict(extra="allow")

    status: Literal["success", "failed"]
    message: Optional[str] = None
    data: Optional[Any] = None


class UpdateObjectRequest(BaseModel):
    """Request body for updating an existing Object and optionally its fields."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    object_id: int = Field(..., description="ID of the object in MySQL `user_object` table")
    # Optional updates for the object itself
    object_name: Optional[str] = Field(default=None, description="New unique name for the Object instance")
    comment: Optional[str] = Field(default=None)
    source_table: Optional[str] = Field(default=None)
    object_owner: Optional[str] = Field(default=None)
    object_display_name: Optional[str] = Field(default=None)
    # Optional field upserts
    fields_info: Optional[List[ObjectFieldInfo]] = Field(default=None, description="Fields to upsert; omitted means do not change fields")


class DeleteObjectRequest(BaseModel):
    """Request body for deleting an Object by its MySQL ID."""

    model_config = ConfigDict(extra="forbid")

    object_id: int = Field(..., description="ID of the object in MySQL `user_object` table")


class CreateOntologyRequest(BaseModel):
    """Request body for creating an Ontology in Postgres and Neo4j."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ontology_id: int = Field(..., description="Ontology ID")
    ontology_name: str = Field(..., description="Ontology display name (Chinese)")
    ontology_en_name: Optional[str] = Field(default=None, description="Ontology English name")
    ontology_description: Optional[str] = Field(default="", description="Ontology description")
    owner_id: Optional[int] = Field(default=None, description="Owner user id")
    workspace_id: Optional[int] = Field(default=None, description="Workspace id")

class JoinedTableInfo(BaseModel):
    """Joined table info."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    joined_table_name: str = Field(..., description="Name of the joined table")
    joined_table_id: str = Field(..., description="ID of the joined table")
    left_foreign_key: str = Field(..., description="Left foreign key")
    right_foreign_key: str = Field(..., description="Right foreign key")

class CreateObjectLinkRequest(BaseModel):
    """Request body for creating an Object Link in Neo4j."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    left_object_name: str = Field(..., description="Name of the left object")
    right_object_name: str = Field(..., description="Name of the right object")
    link_name: str = Field(..., description="Name of the link")
    link_en_name: Optional[str] = Field(default=None, description="English name of the link")
    link_type: int = Field(..., description="Type of the link, 1: one to one, 2: one to many, 3: many to one, 4: many to many")
    left_key_name: str = Field(..., description="Name of the left key")
    right_key_name: str = Field(..., description="Name of the right key")
    joined_table_info: Optional[JoinedTableInfo] = Field(default=None, description="Joined table info")


class CreateObjLinkRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    left_object_name: str
    right_object_name: str
    link_name: Union[str, List[str]]     # zh 可多值
    link_en_name: Optional[Union[str, List[str]]] = None  # en 可多值
    link_type: int
    left_key_name: str
    right_key_name: str
    joined_table_info: Optional["JoinedTableInfo"] = None

    @field_validator("link_name", "link_en_name")
    @classmethod
    def _to_list(cls, v):
        if v is None:
            return None
        return v if isinstance(v, list) else [v]

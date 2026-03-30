from typing import List, Optional, Literal, Any,Union

from pydantic import BaseModel, Field, ConfigDict,field_validator,model_validator,AnyUrl

class ApiResponse(BaseModel):
    """Unified API response model with at least a status field."""

    model_config = ConfigDict(extra="allow")

    status: Literal["success", "failed"]
    message: Optional[str] = None
    data: Optional[Any] = None
    code: Optional[str] = None
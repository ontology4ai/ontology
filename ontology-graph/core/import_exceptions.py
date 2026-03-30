from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class OwlValidationError(Exception):
    """Raised when OWL validation/import returns a structured failure payload.

    This preserves the full `result_json` so async task callbacks can forward
    detailed validation errors back to the caller.
    """

    result_json: Dict[str, Any]
    message: Optional[str] = None

    def __post_init__(self) -> None:
        if self.message is None:
            msg = None
            try:
                msg = self.result_json.get("message")
            except Exception:
                msg = None
            self.message = msg or "OWL validation failed"
        super().__init__(self.message)

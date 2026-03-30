"""
Runtime context management using contextvars for async-safe request tracking.

This module provides context variables that can be accessed throughout the execution
chain without explicit parameter passing. Context is automatically isolated between
different async requests/tasks.

Usage:
    # Set context at the beginning of a request
    set_track_id("track_123")
    
    # Get context anywhere in the call chain
    track_id = get_track_id()
    
    # Or use context manager for automatic cleanup
    with track_context(track_id="track_123"):
        # ... execute actions
        pass
"""

from contextvars import ContextVar, Token
from typing import Optional, Any, Dict
from contextlib import contextmanager


# ============================================================================
# Context Variables
# ============================================================================

# Track ID for tracing action execution across the call chain
_current_track_id: ContextVar[Optional[str]] = ContextVar('current_track_id', default=None)

# Operation sequence number for tracking operation order within a track_id
_current_operation_number: ContextVar[int] = ContextVar('current_operation_number', default=0)

# Request ID for correlating all operations in a single API request
_current_request_id: ContextVar[Optional[str]] = ContextVar('current_request_id', default=None)

# User ID for tracking which user initiated the operation
_current_user_id: ContextVar[Optional[str]] = ContextVar('current_user_id', default=None)

# Additional metadata that can be stored in context
_current_metadata: ContextVar[Dict[str, Any]] = ContextVar('current_metadata', default={})


# ============================================================================
# Track ID Operations
# ============================================================================

def set_track_id(track_id: Optional[str]) -> Token:
    """
    Set the current track ID in context.
    
    Args:
        track_id: The track ID to set, or None to clear
        
    Returns:
        Token that can be used to reset the context later
    """
    return _current_track_id.set(track_id)


def get_track_id() -> Optional[str]:
    """
    Get the current track ID from context.
    
    Returns:
        The current track ID, or None if not set
    """
    return _current_track_id.get()


def reset_track_id(token: Token) -> None:
    """
    Reset track ID to its previous value using a token.
    
    Args:
        token: Token returned by set_track_id()
    """
    _current_track_id.reset(token)


# ============================================================================
# Operation Number Operations
# ============================================================================

def get_operation_number() -> int:
    """
    Get operation number as millisecond timestamp.
    This ensures operations are ordered by execution time.
    
    Returns:
        Current timestamp in milliseconds since epoch
    """
    import time
    return int(time.time() * 1000)


def get_and_increment_operation_number() -> int:
    """
    Get operation number as millisecond timestamp.
    This is the main function used for logging operations.
    The "increment" naming is kept for backward compatibility,
    but it actually returns current timestamp in milliseconds.
    
    Returns:
        Current timestamp in milliseconds since epoch
    """
    import time
    return int(time.time() * 1000)


# Keep these functions for backward compatibility, though they're no longer used
def increment_operation_number() -> int:
    """
    (Deprecated) Returns current timestamp in milliseconds.
    Kept for backward compatibility.
    """
    import time
    return int(time.time() * 1000)


def set_operation_number(number: int) -> Token:
    """
    (Deprecated) Set operation number in context.
    This is a no-op now that we use timestamps.
    Kept for backward compatibility.
    """
    return _current_operation_number.set(number)


def reset_operation_number(token: Token) -> None:
    """
    (Deprecated) Reset operation number using token.
    Kept for backward compatibility.
    """
    _current_operation_number.reset(token)


# ============================================================================
# Request ID Operations
# ============================================================================

def set_request_id(request_id: Optional[str]) -> Token:
    """
    Set the current request ID in context.
    
    Args:
        request_id: The request ID to set, or None to clear
        
    Returns:
        Token that can be used to reset the context later
    """
    return _current_request_id.set(request_id)


def get_request_id() -> Optional[str]:
    """
    Get the current request ID from context.
    
    Returns:
        The current request ID, or None if not set
    """
    return _current_request_id.get()


def reset_request_id(token: Token) -> None:
    """
    Reset request ID to its previous value using a token.
    
    Args:
        token: Token returned by set_request_id()
    """
    _current_request_id.reset(token)


# ============================================================================
# User ID Operations
# ============================================================================

def set_user_id(user_id: Optional[str]) -> Token:
    """
    Set the current user ID in context.
    
    Args:
        user_id: The user ID to set, or None to clear
        
    Returns:
        Token that can be used to reset the context later
    """
    return _current_user_id.set(user_id)


def get_user_id() -> Optional[str]:
    """
    Get the current user ID from context.
    
    Returns:
        The current user ID, or None if not set
    """
    return _current_user_id.get()


def reset_user_id(token: Token) -> None:
    """
    Reset user ID to its previous value using a token.
    
    Args:
        token: Token returned by set_user_id()
    """
    _current_user_id.reset(token)


# ============================================================================
# Metadata Operations
# ============================================================================

def set_metadata(key: str, value: Any) -> None:
    """
    Set a metadata value in the current context.
    
    Args:
        key: The metadata key
        value: The value to store
    """
    metadata = _current_metadata.get().copy()
    metadata[key] = value
    _current_metadata.set(metadata)


def get_metadata(key: str, default: Any = None) -> Any:
    """
    Get a metadata value from the current context.
    
    Args:
        key: The metadata key
        default: Default value if key not found
        
    Returns:
        The metadata value, or default if not found
    """
    return _current_metadata.get().get(key, default)


def get_all_metadata() -> Dict[str, Any]:
    """
    Get all metadata from the current context.
    
    Returns:
        Dictionary of all metadata
    """
    return _current_metadata.get().copy()


def clear_metadata() -> None:
    """
    Clear all metadata from the current context.
    """
    _current_metadata.set({})


# ============================================================================
# Bulk Operations
# ============================================================================

def get_current_context() -> Dict[str, Any]:
    """
    Get all current context values as a dictionary.
    
    Returns:
        Dictionary containing all context values
    """
    return {
        "track_id": get_track_id(),
        "operation_number": get_operation_number(),
        "request_id": get_request_id(),
        "user_id": get_user_id(),
        "metadata": get_all_metadata(),
    }


def set_context(
    track_id: Optional[str] = None,
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Token]:
    """
    Set multiple context values at once.
    
    Args:
        track_id: Optional track ID to set
        request_id: Optional request ID to set
        user_id: Optional user ID to set
        metadata: Optional metadata dictionary to set
        
    Returns:
        Dictionary of tokens that can be used to reset each context value
    """
    tokens = {}
    
    if track_id is not None:
        tokens["track_id"] = set_track_id(track_id)
    
    if request_id is not None:
        tokens["request_id"] = set_request_id(request_id)
    
    if user_id is not None:
        tokens["user_id"] = set_user_id(user_id)
    
    if metadata is not None:
        tokens["metadata"] = _current_metadata.set(metadata.copy())
    
    return tokens


def clear_context() -> None:
    """
    Clear all context values.
    """
    set_track_id(None)
    set_request_id(None)
    set_user_id(None)
    clear_metadata()


# ============================================================================
# Context Managers
# ============================================================================

@contextmanager
def track_context(
    track_id: Optional[str] = None,
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """
    Context manager for setting context values with automatic cleanup.
    
    Args:
        track_id: Optional track ID to set
        request_id: Optional request ID to set
        user_id: Optional user ID to set
        metadata: Optional metadata dictionary to set
        
    Example:
        with track_context(track_id="track_123", user_id="user_456"):
            # Context is set here
            execute_action()
        # Context is automatically reset here
    """
    tokens = set_context(
        track_id=track_id,
        request_id=request_id,
        user_id=user_id,
        metadata=metadata,
    )
    
    try:
        yield
    finally:
        # Reset all context values to their previous state
        if "track_id" in tokens:
            reset_track_id(tokens["track_id"])
        if "request_id" in tokens:
            reset_request_id(tokens["request_id"])
        if "user_id" in tokens:
            reset_user_id(tokens["user_id"])
        if "metadata" in tokens:
            _current_metadata.reset(tokens["metadata"])


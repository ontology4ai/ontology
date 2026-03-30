from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict
from typing import Union, Optional, Dict, List, Any, Tuple
import re
from decimal import Decimal
from apis.models import ApiResponse
from config.config_loader import get_mysql_config
from utils.databases.mysql.mysql_service import MySQLService
from utils.databases.postgres import PostgresService
from public.public_variable import logger
import httpx
import json
import os
from base64 import b64decode
from functools import wraps

try:
    from Crypto.Cipher import AES  # PyCryptodome
except Exception:  # pragma: no cover - optional dep
    AES = None

try:
    import sqlparse
    from sqlparse.sql import Token, Identifier, IdentifierList, Parenthesis, Where, Function
    from sqlparse.tokens import Keyword, DML
except ImportError:
    sqlparse = None
    logger.warning("sqlparse not installed, complex table replacement will use regex fallback")

router = APIRouter()
# PROD_BASE = os.getenv("ONTOLOGY_SERVER_BASE").rstrip("/")

# ---------------------------
# Helper function for Decimal normalization
# ---------------------------
def _normalize_value(val: Any) -> Any:
    """Convert Decimal to float for JSON serialization, keep other types as-is"""
    if isinstance(val, Decimal):
        return float(val)
    return val

def _normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize all Decimal values in a dictionary to float"""
    return {k: _normalize_value(v) for k, v in row.items()}

def _normalize_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize all Decimal values in a list of dictionaries to float"""
    return [_normalize_row(row) for row in rows]

# ---------------------------
# MySQL service getter (sync API)
# ---------------------------
_mysql_service: Optional[MySQLService] = None


def _get_mysql_service() -> MySQLService:
    global _mysql_service
    if _mysql_service is None:
        cfg = get_mysql_config() or {}
        _mysql_service = MySQLService(
            host=cfg.get("host", "localhost"),
            port=int(cfg.get("port", 3306)),
            user=cfg.get("user", cfg.get("username", "root")),
            password=cfg.get("password", ""),
            database=cfg.get("database", cfg.get("db", "test")),
            charset=cfg.get("charset", "utf8mb4"),
            autocommit=True,
            minsize=int(cfg.get("minsize", 1)),
            maxsize=int(cfg.get("maxsize", 10)),
            pool_recycle=int(cfg.get("pool_recycle", 3600)),
        )
    return _mysql_service


# ---------------------------
# Service cache for dynamic database connections
# ---------------------------
_service_cache: Dict[str, Union[MySQLService, PostgresService]] = {}


def _get_cached_service(
    service_type: str,  # "mysql" or "postgresql"
    host: str,
    port: int,
    user: str,
    password: str,
    database: str,
    **kwargs
) -> Union[MySQLService, PostgresService]:
    """
    Get or create a cached database service instance.
    This prevents creating multiple connection pools for the same database.
    """
    # Create cache key from connection parameters
    cache_key = f"{service_type}://{user}@{host}:{port}/{database}"
    
    if cache_key not in _service_cache:
        if service_type == "postgresql":
            _service_cache[cache_key] = PostgresService(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                autocommit=kwargs.get("autocommit", True),
                minsize=kwargs.get("minsize", 1),
                maxsize=kwargs.get("maxsize", 100),
            )
            logger.info(f"Created and cached PostgreSQL service for {host}:{port}/{database}")
        else:  # mysql
            _service_cache[cache_key] = MySQLService(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                charset=kwargs.get("charset", "utf8mb4"),
                autocommit=kwargs.get("autocommit", True),
                minsize=kwargs.get("minsize", 1),
                maxsize=kwargs.get("maxsize", 100),
                pool_recycle=kwargs.get("pool_recycle", 3600),
            )
            logger.info(f"Created and cached MySQL service for {host}:{port}/{database}")
    
    return _service_cache[cache_key]


async def _cleanup_service_cache():
    """
    Close all cached database service connections.
    This should be called during application shutdown.
    """
    for cache_key, service in _service_cache.items():
        try:
            if isinstance(service, (MySQLService, PostgresService)):
                # Close the connection pool
                if hasattr(service, '_async_pool') and service._async_pool:
                    if isinstance(service, MySQLService):
                        if not service._async_pool.closed:
                            service._async_pool.close()
                            await service._async_pool.wait_closed()
                    else:  # PostgresService
                        await service._async_pool.close()
                    logger.info(f"Closed connection pool for {cache_key}")
        except Exception as e:
            logger.error(f"Error closing service {cache_key}: {e}")
    _service_cache.clear()
    logger.info("Service cache cleaned up")


# ---------------------------
# Helpers
# ---------------------------
def _handle_exceptions(func):
    @wraps(func)
    async def _wrapped(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            # Log full stacktrace for server diagnostics
            logger.error(f"Endpoint error: {e}", exc_info=True)
            # Ensure client always receives structured error
            return ApiResponse(status="failed", message=str(e))
    return _wrapped
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# AES constants mirrored from Java `AesCipher`
_AES_ALGO = "AES/CBC/PKCS5Padding"
_AES_DEFAULT_IV = "7b51fd7053196308".encode("utf-8")
_AES_DEFAULT_KEY = "b6fa92796c6431c5".encode("utf-8")


def _pkcs5_unpad(data: bytes) -> bytes:
    if not data:
        return data
    pad_len = data[-1]
    if pad_len < 1 or pad_len > 16:
        return data
    return data[:-pad_len]


def decrypt_password_like_java(encrypted_base64: str) -> str:
    """Decrypt `ds_auth` using the same logic as Java AesCipher.decrypt.

    Java uses AES/CBC/PKCS5Padding with a fixed 16-byte key and IV encoded as UTF-8
    and Base64 for the ciphertext.
    """
    if not encrypted_base64:
        return ""
    if AES is None:
        raise RuntimeError("PyCryptodome is required for AES decryption (Crypto.Cipher.AES)")
    cipher_bytes = b64decode(encrypted_base64)
    cipher = AES.new(_AES_DEFAULT_KEY, AES.MODE_CBC, iv=_AES_DEFAULT_IV)
    plain_padded = cipher.decrypt(cipher_bytes)
    plain = _pkcs5_unpad(plain_padded)
    return plain.decode("utf-8")


def _parse_jdbc_mysql_url(url: str) -> Tuple[str, int, Optional[str]]:
    """Parse a JDBC MySQL URL like:
    jdbc:mysql://host:port/database?params
    Returns (host, port, database_or_none)
    """
    if not url or not isinstance(url, str):
        return ("localhost", 3306, None)
    u = url.strip()
    if u.startswith("jdbc:mysql://"):
        u = u[len("jdbc:mysql://"):]
    # split off params
    path = u
    if "?" in u:
        path = u.split("?", 1)[0]
    # split host:port and db
    # form: host:port/db
    host_port, _, dbpart = path.partition("/")
    host = host_port
    port = 3306
    if ":" in host_port:
        host, port_str = host_port.split(":", 1)
        try:
            port = int(port_str)
        except Exception:
            port = 3306
    database = dbpart or None
    return (host, port, database)


def _parse_jdbc_postgres_url(url: str) -> Tuple[str, int, Optional[str]]:
    """Parse a JDBC Postgres URL like:
    jdbc:postgresql://host:port/database?params
    Returns (host, port, database_or_none)
    """
    if not url or not isinstance(url, str):
        return ("localhost", 5432, None)
    u = url.strip()
    if u.startswith("jdbc:postgresql://"):
        u = u[len("jdbc:postgresql://"):]
    path = u
    if "?" in u:
        path = u.split("?", 1)[0]
    host_port, _, dbpart = path.partition("/")
    host = host_port
    port = 5432
    if ":" in host_port:
        host, port_str = host_port.split(":", 1)
        try:
            port = int(port_str)
        except Exception:
            port = 5432
    database = dbpart or None
    return (host, port, database)


async def _get_target_service(ontology_name: Optional[str], object_type_name: Optional[str], is_sim: bool = False) -> Tuple[Optional[Union[MySQLService, PostgresService]], str, Optional[str]]:
    """Lookup DS info and build the proper service by dsType.
    Returns (service_or_none, dialect, schema) where dialect in {"mysql", "postgresql"}.
    Schema is only applicable for Postgres and may be None/empty.
    
    Args:
        ontology_name: Name of the ontology
        object_type_name: Name of the object type
        is_sim: If True, use ds_name and ds_profile='sim' to query connection info
    """
    if not ontology_name or not object_type_name:
        return (None, "mysql", None)
    atlas = _get_mysql_service()
    
    if is_sim:
        # Step 1: Get ds_name by ds_id
        sql_ds_name = (
            "select mtd.ds_name "
            "from ontology_object_type oot "
            "join modo_team_ds mtd on oot.ds_id = mtd.rela_id "
            "join ontology_manage om on om.id = oot.ontology_id "
            "where om.ontology_name = %s and oot.object_type_name = %s"
        )
        row_ds = await atlas.afetch_one(sql_ds_name, [ontology_name, object_type_name])
        if not row_ds:
            return (None, "mysql", None)
        
        ds_name = row_ds.get("ds_name")
        if not ds_name:
            return (None, "mysql", None)
        
        # Step 2: Query connection info by ds_name and ds_profile='sim'
        sql = (
            "select ds_conf, ds_acct, ds_auth, ds_schema "
            "from modo_team_ds "
            "where ds_name = %s and ds_profile = %s"
        )
        row = await atlas.afetch_one(sql, [ds_name, "sim"])
        
        # Check if simulation environment exists
        if not row:
            raise Exception(f"该数据源 '{ds_name}' 没有仿真环境配置，无法执行仿真操作")
        
        # Use ds_schema from modo_team_ds table (simulation environment)
        # If schema contains multiple values separated by comma, take the first one
        ds_schema_raw = row.get("ds_schema") or ""
        if ds_schema_raw and "," in ds_schema_raw:
            row["ds_schema"] = ds_schema_raw.split(",")[0].strip()
        else:
            row["ds_schema"] = ds_schema_raw
    else:
        # Original logic: query by ds_id
        sql = (
            "select mtd.ds_conf, mtd.ds_acct, mtd.ds_auth, oot.ds_schema "
            "from ontology_object_type oot "
            "join modo_team_ds mtd on oot.ds_id = mtd.rela_id "
            "join ontology_manage om on om.id = oot.ontology_id "
            "where om.ontology_name = %s and oot.object_type_name = %s"
        )
        row = await atlas.afetch_one(sql, [ontology_name, object_type_name])
    if not row:
        return (None, "mysql", None)
    try:
        ds_conf_raw = row.get("ds_conf")
        ds_conf = json.loads(ds_conf_raw) if isinstance(ds_conf_raw, str) else (ds_conf_raw or {})
    except Exception:
        ds_conf = {}

    ds_type = str(ds_conf.get("dsType") or "mysql").strip().lower()
    user = row.get("ds_acct") or ds_conf.get("dsAcct")
    enc_pwd = row.get("ds_auth") or ds_conf.get("dsAuth") or ""
    try:
        password = decrypt_password_like_java(enc_pwd)
    except Exception as e:
        logger.error(f"Failed to decrypt ds_auth: {e}")
        return (None, "mysql", None)

    if ds_type == "postgresql":
        url = ds_conf.get("url") or ds_conf.get("jdbcUrl") or ""
        host, port, db_from_url = _parse_jdbc_postgres_url(url)
        database = (ds_conf.get("physicalDbName") or db_from_url or "").strip()
        if not host or not user or not database:
            return (None, "postgresql", None)
        schema = (row.get("ds_schema") or "").strip() or None
        service = _get_cached_service(
            service_type="postgresql",
            host=str(host),
            port=int(port or 5432),
            user=str(user),
            password=str(password),
            database=str(database),
            autocommit=True,
            minsize=1,
            maxsize=100
        )
        return (service, "postgresql", schema)

    # default mysql
    url = ds_conf.get("url") or ds_conf.get("jdbcUrl") or ""
    host, port, db_from_url = _parse_jdbc_mysql_url(url)
    database = (row.get("ds_schema") or ds_conf.get("dsSchema") or db_from_url or "").strip()
    if not host or not user or not database:
        return (None, "mysql", None)
    service = _get_cached_service(
        service_type="mysql",
        host=host,
        port=int(port or 3306),
        user=str(user),
        password=str(password),
        database=str(database),
        charset="utf8mb4",
        autocommit=True,
        minsize=1,
        maxsize=100,
        pool_recycle=3600
    )
    return (service, "mysql", None)


def _quote_identifier(identifier: str) -> str:
    parts = (identifier or "").split(".")
    if not parts:
        raise ValueError("Invalid identifier")
    for p in parts:
        if not _IDENTIFIER_RE.match(p):
            raise ValueError(f"Unsafe identifier: {identifier}")
    return ".".join(f"`{p}`" for p in parts)


def _quote_identifier_list(identifiers: List[str]) -> str:
    return ", ".join(_quote_identifier(i) for i in identifiers)


def _quote_identifier_pg(identifier: str) -> str:
    parts = (identifier or "").split(".")
    if not parts:
        raise ValueError("Invalid identifier")
    for p in parts:
        if not _IDENTIFIER_RE.match(p):
            raise ValueError(f"Unsafe identifier: {identifier}")
    return ".".join(f'"{p}"' for p in parts)


def _quote_identifier_list_pg(identifiers: List[str]) -> str:
    return ", ".join(_quote_identifier_pg(i) for i in identifiers)


def _parse_order_by(order_by: Optional[str]) -> Optional[str]:
    if not order_by:
        return None
    tokens = order_by.strip().split()
    if len(tokens) == 1:
        return _quote_identifier(tokens[0])
    if len(tokens) == 2 and tokens[1].upper() in {"ASC", "DESC"}:
        return f"{_quote_identifier(tokens[0])} {tokens[1].upper()}"
    raise ValueError("Invalid order_by; expected 'col' or 'col ASC|DESC'")


def _parse_order_by_with(order_by: Optional[str], quote_fn) -> Optional[str]:
    if not order_by:
        return None
    
    # 支持多字段排序，用逗号分隔
    fields = [f.strip() for f in order_by.split(',')]
    parsed_fields = []
    
    for field in fields:
        if not field:
            continue
        tokens = field.split()
        if len(tokens) == 1:
            # 只有列名
            parsed_fields.append(quote_fn(tokens[0]))
        elif len(tokens) == 2 and tokens[1].upper() in {"ASC", "DESC"}:
            # 列名 + ASC/DESC
            parsed_fields.append(f"{quote_fn(tokens[0])} {tokens[1].upper()}")
        else:
            raise ValueError(f"Invalid order_by field '{field}'; expected 'col' or 'col ASC|DESC'")
    
    if not parsed_fields:
        return None
    
    return ", ".join(parsed_fields)


# ---------------------------
# MySQL -> Postgres where_sql converter (best-effort)
# ---------------------------
_DATE_FMT_MAP = {
    "%Y": "YYYY",
    "%y": "YY",
    "%m": "MM",
    "%c": "MM",  # approximate
    "%d": "DD",
    "%e": "DD",  # approximate
    "%H": "HH24",
    "%h": "HH12",
    "%i": "MI",
    "%s": "SS",
    "%M": "Month",
    "%b": "Mon",
}


def _convert_mysql_date_format_to_pg(fmt: str) -> str:
    out = fmt
    for k, v in _DATE_FMT_MAP.items():
        out = out.replace(k, v)
    return out


def _convert_mysql_where_to_pg(where_sql: str) -> str:
    s = where_sql or ""
    if not s:
        return s
    # Backticks -> double quotes
    s = re.sub(r"`([^`]+)`", r'"\\1"', s)
    # IFNULL -> COALESCE
    s = re.sub(r"\bIFNULL\s*\(", "COALESCE(", s, flags=re.IGNORECASE)

    # DATE_FORMAT(expr, 'fmt') -> to_char(expr, 'fmt') with token mapping
    def _datefmt_repl(match: re.Match) -> str:
        expr = match.group(1)
        fmt = match.group(2)
        return f"to_char({expr}, '{_convert_mysql_date_format_to_pg(fmt)}')"

    s = re.sub(r"DATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'([^']+)'\s*\)", _datefmt_repl, s, flags=re.IGNORECASE)

    # STR_TO_DATE(str, 'fmt') -> to_timestamp(str, 'fmt') mapping tokens
    def _strtodate_repl(match: re.Match) -> str:
        expr = match.group(1)
        fmt = match.group(2)
        return f"to_timestamp({expr}, '{_convert_mysql_date_format_to_pg(fmt)}')"

    s = re.sub(r"STR_TO_DATE\s*\(\s*([^,]+?)\s*,\s*'([^']+)'\s*\)", _strtodate_repl, s, flags=re.IGNORECASE)

    # UNIX_TIMESTAMP(expr) -> EXTRACT(EPOCH FROM expr)
    s = re.sub(r"UNIX_TIMESTAMP\s*\(\s*\)", "EXTRACT(EPOCH FROM now())", s, flags=re.IGNORECASE)
    s = re.sub(r"UNIX_TIMESTAMP\s*\(\s*([^\)]+?)\s*\)", r"EXTRACT(EPOCH FROM \1)", s, flags=re.IGNORECASE)

    # FROM_UNIXTIME(expr) -> to_timestamp(expr)
    s = re.sub(r"FROM_UNIXTIME\s*\(\s*([^\)]+?)\s*\)", r"to_timestamp(\1)", s, flags=re.IGNORECASE)

    # IF(cond, a, b) -> CASE WHEN cond THEN a ELSE b END (simple, non-nested)
    s = re.sub(r"\bIF\s*\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^\)]+?)\s*\)", r"CASE WHEN \1 THEN \2 ELSE \3 END", s, flags=re.IGNORECASE)

    # LOCATE(substr, str) -> POSITION(substr IN str)
    s = re.sub(r"\bLOCATE\s*\(\s*([^,]+?)\s*,\s*([^\)]+?)\s*\)", r"POSITION(\1 IN \2)", s, flags=re.IGNORECASE)

    # CONCAT -> concat (Postgres has concat)
    s = re.sub(r"\bCONCAT\s*\(", "concat(", s, flags=re.IGNORECASE)

    return s


# ---------------------------
# SQL Table Replacement with sqlparse
# ---------------------------
def _replace_table_in_token(token, table_rules: Dict[str, str], alias_counter: Dict[str, int]) -> str:
    """
    Recursively process a token and replace table references with pre_sql_rule subqueries.
    
    Args:
        token: sqlparse token to process
        table_rules: Dict mapping table_name (schema.table format) to pre_sql_rule
        alias_counter: Counter for generating unique aliases
    
    Returns:
        Modified SQL string
    """
    if isinstance(token, Identifier):
        # Check if this is a table reference (not a column)
        real_name = token.get_real_name()
        if real_name:
            # Handle schema.table format
            full_table_name = str(token.get_real_name())
            parent_name = token.get_parent_name()
            if parent_name:
                full_table_name = f"{parent_name}.{full_table_name}"
            
            # Check if this table should be replaced
            if full_table_name in table_rules:
                pre_sql = table_rules[full_table_name].strip().rstrip(";")
                alias = token.get_alias()
                
                if alias:
                    return f"({pre_sql}) AS {alias}"
                else:
                    # Generate a unique alias if not provided
                    alias_counter[full_table_name] = alias_counter.get(full_table_name, 0) + 1
                    auto_alias = f"t{alias_counter[full_table_name]}"
                    return f"({pre_sql}) AS {auto_alias}"
    
    elif isinstance(token, IdentifierList):
        # Process each identifier in the list
        result = []
        for identifier in token.get_identifiers():
            result.append(_replace_table_in_token(identifier, table_rules, alias_counter))
        return ", ".join(result)
    
    elif isinstance(token, Parenthesis):
        # Recursively process subquery
        inner_sql = str(token)[1:-1]  # Remove outer parentheses
        replaced = _apply_table_rules_with_sqlparse(inner_sql, table_rules, alias_counter)
        return f"({replaced})"
    
    # Return token as-is if no replacement needed
    return str(token)


def _recursively_process_token(token, table_rules: Dict[str, str], alias_counter: Dict[str, int], is_table_position: bool = False) -> str:
    """
    Recursively process any token and its children, replacing tables where found.
    
    Args:
        token: sqlparse token to process
        table_rules: Dict mapping table_name to pre_sql_rule
        alias_counter: Counter for generating unique aliases
        is_table_position: Whether this token is in a position where a table name is expected (after FROM/JOIN)
    
    Returns:
        Processed token as string
    """
    # If this is a table position, try to replace the table
    if is_table_position:
        return _replace_table_in_token(token, table_rules, alias_counter)
    
    # Handle Parenthesis (potential subquery)
    if isinstance(token, Parenthesis):
        inner_sql = str(token)[1:-1]  # Remove outer parentheses
        # Recursively process the subquery
        replaced_inner = _apply_table_rules_with_sqlparse(inner_sql, table_rules, alias_counter)
        return f"({replaced_inner})"
    
    # Handle WHERE clause and other complex tokens
    if isinstance(token, Where):
        # Process each sub-token in the WHERE clause
        result_parts = []
        for sub_token in token.tokens:
            if sub_token.is_whitespace:
                result_parts.append(str(sub_token))
            elif isinstance(sub_token, Parenthesis):
                # Recursively process subquery in WHERE
                inner_sql = str(sub_token)[1:-1]
                replaced_inner = _apply_table_rules_with_sqlparse(inner_sql, table_rules, alias_counter)
                result_parts.append(f"({replaced_inner})")
            else:
                result_parts.append(str(sub_token))
        return "".join(result_parts)
    
    # Handle Function (may contain subqueries)
    if isinstance(token, Function):
        result_parts = []
        for sub_token in token.tokens:
            if isinstance(sub_token, Parenthesis):
                inner_sql = str(sub_token)[1:-1]
                replaced_inner = _apply_table_rules_with_sqlparse(inner_sql, table_rules, alias_counter)
                result_parts.append(f"({replaced_inner})")
            else:
                result_parts.append(str(sub_token))
        return "".join(result_parts)
    
    # For any other token with children, recursively process
    if hasattr(token, 'tokens'):
        result_parts = []
        for sub_token in token.tokens:
            result_parts.append(_recursively_process_token(sub_token, table_rules, alias_counter, False))
        return "".join(result_parts)
    
    # Default: return token as-is
    return str(token)


def _apply_table_rules_with_sqlparse(sql: str, table_rules: Dict[str, str], alias_counter: Optional[Dict[str, int]] = None) -> str:
    """
    Apply table replacement rules to SQL using sqlparse for accurate parsing.
    
    Args:
        sql: SQL string to process
        table_rules: Dict mapping table_name (schema.table format) to pre_sql_rule
        alias_counter: Optional counter for generating unique aliases
    
    Returns:
        Modified SQL with tables replaced by subqueries
    """
    if not table_rules or not sqlparse:
        return sql
    
    if alias_counter is None:
        alias_counter = {}
    
    try:
        parsed = sqlparse.parse(sql)
        if not parsed:
            return sql
        
        statement = parsed[0]
        result_tokens = []
        in_from_or_join = False
        
        for token in statement.tokens:
            # Skip whitespace and comments
            if token.is_whitespace or token.ttype in (sqlparse.tokens.Comment.Single, sqlparse.tokens.Comment.Multiline):
                result_tokens.append(str(token))
                continue
            
            # Detect FROM or JOIN keywords
            if token.ttype is Keyword and token.value.upper() in ('FROM', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN'):
                result_tokens.append(str(token))
                in_from_or_join = True
                continue
            
            # Process the table/identifier after FROM or JOIN
            if in_from_or_join:
                replaced = _recursively_process_token(token, table_rules, alias_counter, is_table_position=True)
                result_tokens.append(replaced)
                in_from_or_join = False
            else:
                # For all other tokens, recursively process (to handle subqueries)
                replaced = _recursively_process_token(token, table_rules, alias_counter, is_table_position=False)
                result_tokens.append(replaced)
        
        return "".join(result_tokens)
    
    except Exception as e:
        logger.warning(f"sqlparse failed to parse SQL, using original: {e}")
        return sql


def _apply_table_rules_regex_fallback(sql: str, table_rules: Dict[str, str]) -> str:
    """
    Fallback regex-based table replacement when sqlparse is not available.
    
    Args:
        sql: SQL string to process
        table_rules: Dict mapping table_name (schema.table format) to pre_sql_rule
    
    Returns:
        Modified SQL with tables replaced by subqueries
    """
    result = sql
    for table_name, pre_sql_rule in table_rules.items():
        escaped_table = re.escape(table_name)
        pre_sql = pre_sql_rule.strip().rstrip(";")
        
        # Pattern 1: FROM/JOIN schema.table alias
        result = re.sub(
            rf'(?i)\b(FROM|JOIN)\s+{escaped_table}\s+(?:AS\s+)?(\w+)',
            rf'\1 ({pre_sql}) AS \2',
            result
        )
        # Pattern 2: FROM/JOIN schema.table (no alias, followed by WHERE/JOIN/ORDER/GROUP/LIMIT/;/))
        result = re.sub(
            rf'(?i)\b(FROM|JOIN)\s+{escaped_table}\b(?=\s*(?:WHERE|JOIN|ORDER|GROUP|LIMIT|HAVING|UNION|;|\)|$))',
            rf'\1 ({pre_sql})',
            result
        )
    
    return result


def apply_object_rules(sql: str, object_rules: Dict[str, Dict[str, Any]]) -> str:
    """
    Apply pre_sql replacement using object-based rules (new architecture).
    This avoids conflicts when multiple objects map to the same physical table.
    
    Args:
        sql: Original SQL string
        object_rules: Dict mapping object_name to {table_name, pre_sql, alias}
    
    Returns:
        Modified SQL with object references replaced by subqueries where pre_sql exists
    """
    if not object_rules:
        return sql
    
    logger.info(f"Applying object_rules for objects: {list(object_rules.keys())}")
    
    # Build a mapping from (table_name, alias) -> pre_sql for precise matching
    # This allows us to distinguish between different objects using the same table
    result_sql = sql
    
    for obj_name, rule in object_rules.items():
        table_name = rule.get("table_name")
        pre_sql = rule.get("pre_sql")
        alias = rule.get("alias")
        
        if not table_name or not pre_sql:
            # No replacement needed if there's no pre_sql
            continue
        
        logger.info(f"Replacing object '{obj_name}' (table={table_name}, alias={alias}) with pre_sql")
        
        escaped_table = re.escape(table_name)
        pre_sql_clean = pre_sql.strip().rstrip(";")
        
        if alias:
            # If there's an alias, match: FROM/JOIN table_name alias
            # Pattern: (FROM|JOIN) table_name alias
            pattern = rf'(?i)\b(FROM|JOIN)\s+{escaped_table}\s+{re.escape(alias)}\b'
            replacement = rf'\1 ({pre_sql_clean}) AS {alias}'
            result_sql = re.sub(pattern, replacement, result_sql)
        else:
            # No alias: match table_name without alias (followed by WHERE/JOIN/etc or end)
            # Pattern: (FROM|JOIN) table_name (followed by WHERE/JOIN/ORDER/GROUP/LIMIT/;/)/end)
            pattern = rf'(?i)\b(FROM|JOIN)\s+{escaped_table}\b(?=\s*(?:WHERE|JOIN|ORDER|GROUP|LIMIT|HAVING|UNION|;|\)|$))'
            replacement = rf'\1 ({pre_sql_clean}) AS {obj_name}_subquery'
            result_sql = re.sub(pattern, replacement, result_sql)
    
    return result_sql


def apply_pre_sql_table_rules(sql: str, table_rules: Dict[str, str]) -> str:
    """
    Apply pre_sql_rule replacement to all matching tables in SQL (including subqueries).
    Uses sqlparse for accurate parsing if available, otherwise falls back to regex.
    
    Args:
        sql: Original SQL string
        table_rules: Dict mapping table_name (schema.table format) to pre_sql_rule
    
    Returns:
        Modified SQL with table references replaced by subqueries
    """
    if not table_rules:
        return sql
    
    logger.info(f"Applying table rules to SQL: {list(table_rules.keys())}")
    
    if sqlparse:
        return _apply_table_rules_with_sqlparse(sql, table_rules)
    else:
        logger.info("Using regex fallback for table replacement")
        return _apply_table_rules_regex_fallback(sql, table_rules)


# ---------------------------
# Request models
# ---------------------------
class CreateRowRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    table_name: str = Field(..., description="Target table name")
    data: Dict[str, Any] = Field(..., description="Column values to insert")
    primary_key_column: Optional[str] = Field(
        default=None, description="PK column name for existence check (optional)"
    )
    ontology_name: Optional[str] = Field(default=None, description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Object type name for DS routing")
    is_sim: bool = Field(default=False, description="If True, use ds_name and ds_profile='sim' for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="Pre-defined SQL as base query (not used in CREATE)")


class UpdateRowRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    table_name: str = Field(...)
    primary_key_column: Optional[str] = Field(default=None)
    pk_value: Optional[Any] = Field(default=None)
    pk_values: Optional[List[Any]] = Field(default=None)
    updates: Dict[str, Any] = Field(..., description="Columns to update")
    where_sql: Optional[str] = Field(default=None)
    where_params: Optional[List[Any]] = Field(default=None)
    ontology_name: Optional[str] = Field(default=None, description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Object type name for DS routing")
    is_sim: bool = Field(default=False, description="If True, use ds_name and ds_profile='sim' for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="Pre-defined SQL as base query (not used in UPDATE)")


class DeleteRowRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    table_name: str = Field(...)
    primary_key_column: str = Field(...)
    pk_value: Optional[Any] = Field(default=None)
    pk_values: Optional[List[Any]] = Field(default=None)
    ontology_name: Optional[str] = Field(default=None, description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Object type name for DS routing")
    is_sim: bool = Field(default=False, description="If True, use ds_name and ds_profile='sim' for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="Pre-defined SQL as base query (not used in DELETE)")


class FindRowRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    table_name: str = Field(...)
    # Interpret return_attrs as physical column names to select
    return_attrs: Optional[Union[str, List[str]]] = Field(default=None)
    where_sql: Optional[str] = Field(default=None)
    where_params: Optional[List[Any]] = Field(default=None)
    order_by: Optional[str] = Field(default=None)
    page_size: Optional[int] = Field(default=None)
    page_token: Optional[int] = Field(default=None)
    ontology_name: Optional[str] = Field(default=None, description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Object type name for DS routing")
    is_sim: bool = Field(default=False, description="If True, use ds_name and ds_profile='sim' for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="Pre-defined SQL as base query (replaces table_name)")


class ComplexQueryRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    base_table: str = Field(..., description="Base table name for FROM clause")
    select_expressions: Optional[List[str]] = Field(default=None, description="Raw select expressions list")
    joins_sql: Optional[str] = Field(default=None, description="JOIN clauses appended after FROM base_table")
    where_sql: Optional[str] = Field(default=None, description="WHERE clause conditions")
    group_by_sql: Optional[str] = Field(default=None, description="GROUP BY clause")
    having_sql: Optional[str] = Field(default=None, description="HAVING clause")
    order_by_sql: Optional[str] = Field(default=None, description="ORDER BY clause")
    page_size: Optional[int] = Field(default=None, description="Page size for LIMIT")
    page_token: Optional[int] = Field(default=None, description="Offset token for OFFSET")
    ontology_name: Optional[str] = Field(default=None, description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Object type name for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="Pre-defined SQL as base query (not used in complex_query)")


class ComplexSqlRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    raw_sql: str = Field(..., description="Raw SQL to execute (single SELECT/CTE only)")
    params: Optional[List[Any]] = Field(default=None, description="Positional parameters for SQL")
    page_size: Optional[int] = Field(default=None, description="Page size for LIMIT")
    page_token: Optional[int] = Field(default=None, description="Offset token for OFFSET")
    need_total_count: bool = Field(default=True, description="Whether to compute total_count")
    ontology_name: str = Field(..., description="Ontology name for DS routing")
    object_type_name: Optional[str] = Field(default=None, description="Representative object type for DS routing")
    is_sim: bool = Field(default=False, description="If True, use ds_name and ds_profile='sim' for DS routing")
    pre_sql_rule: Optional[str] = Field(default=None, description="[Deprecated] Pre-defined SQL as base query (replaces first FROM table)")
    table_pre_sql_rules: Optional[Dict[str, str]] = Field(default=None, description="Dict mapping table names (schema.table format) to pre_sql_rule for each table")
    object_rules: Optional[Dict[str, Dict[str, Any]]] = Field(default=None, description="Dict mapping object_name to {table_name, pre_sql, alias}. New architecture that avoids conflicts when multiple objects map to same table.")


class ChangeLogRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    
    track_id: Optional[str] = Field(default=None, description="跟踪ID，用于关联action执行链")
    operation_type: str = Field(..., description="操作类型: CREATE/UPDATE/DELETE")
    object_type_name: Optional[str] = Field(default=None, description="对象类型名称")
    affected_rows: int = Field(default=0, description="影响的行数")
    record_count_before: Optional[int] = Field(default=None, description="操作前记录总数")
    record_count_after: Optional[int] = Field(default=None, description="操作后记录总数")
    change_details: Optional[Dict[str, Any]] = Field(default=None, description="变更详情JSON")
    operation_number: int = Field(..., description="操作序号")


class SchemaLookupRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ontology_name: str = Field(..., description="Ontology name for DS routing")
    object_type_name: str = Field(..., description="Object type name for DS routing")

class ActionRunRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    action_id: str = Field(..., description="Action unique id")
    params: Dict[str, Any] = Field(..., description="Parameters required by the action")

class FindRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ontology_name: str = Field(...)
    object_name: str = Field(...)
    return_attrs: Optional[Union[str, List[str]]] = Field(default=None)
    where_sql: Optional[str] = Field(default=None)
    where_params: Optional[List[Any]] = Field(default=None)
    order_by: Optional[str] = Field(default=None)
    page_size: Optional[int] = Field(default=None)
    page_token: Optional[int] = Field(default=None)


class RunFunctionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ontology_name: str = Field(...)
    function_name: str = Field(...)
    params: Dict[str, Any] = Field(default_factory=dict)


class ConfigPropertyRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    config_name: str = Field(..., description="配置项名称，对应表中的prop_name字段")


# ---------------------------
# Action helpers
# ---------------------------
_TYPE_ALIASES: Dict[str, Tuple[type, ...]] = {
    "string": (str,),
    "str": (str,),
    "int": (int,),
    "integer": (int,),
    "float": (float,),
    "number": (int, float),
    "bool": (bool,),
    "boolean": (bool,),
    "array": (list,),
    "list": (list,),
    "object": (dict,),
    "dict": (dict,),
    "map": (dict,),
    "any": (object,),
    "*": (object,),
}

# ---------------------------
# Endpoints
# ---------------------------
@router.post("/object/create")
@_handle_exceptions
async def create_object(request: CreateRowRequest) -> ApiResponse:
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name, request.is_sim)
    if service is None:
        service = _get_mysql_service()
        dialect = "mysql"
    quote = _quote_identifier_pg if dialect == "postgresql" else _quote_identifier
    quote_list = _quote_identifier_list_pg if dialect == "postgresql" else _quote_identifier_list
    table_sql = quote(request.table_name) if dialect != "postgresql" or not schema else f"{_quote_identifier_pg(schema)}.{_quote_identifier_pg(request.table_name)}"

    if not isinstance(request.data, dict) or not request.data:
        return ApiResponse(status="failed", message="'data' must be a non-empty dict")

    # Query count before insert
    count_sql_before = f"SELECT COUNT(1) AS cnt FROM {table_sql}"
    count_row_before = await service.afetch_one(count_sql_before)
    count_before = count_row_before.get("cnt", 0) if count_row_before else 0

    columns: List[str] = []
    params: List[Any] = []
    for col, val in request.data.items():
        columns.append(col)
        params.append(val)

    cols_sql = quote_list(columns)
    placeholders = ", ".join(["%s"] * len(columns))
    insert_sql = f"INSERT INTO {table_sql} ({cols_sql}) VALUES ({placeholders})"
    affected = await service.aexecute(insert_sql, params)
    
    # Query count after insert
    count_sql_after = f"SELECT COUNT(1) AS cnt FROM {table_sql}"
    count_row_after = await service.afetch_one(count_sql_after)
    count_after = count_row_after.get("cnt", 0) if count_row_after else 0
    
    # Keep the original inserted_record from request data
    inserted_record = dict(request.data)
    
    # Get the full inserted record from database (includes auto-generated fields like IDs, defaults, etc.)
    full_data: Optional[Dict[str, Any]] = None
    
    # Try to fetch the complete record
    if request.primary_key_column:
        pk_col_sql = quote(request.primary_key_column)
        if request.primary_key_column in request.data:
            # PK was provided in request, use it to fetch the full record
            fetch_sql = f"SELECT * FROM {table_sql} WHERE {pk_col_sql} = %s"
            full_data = await service.afetch_one(fetch_sql, [request.data[request.primary_key_column]])
        elif dialect == "mysql":
            # PK is auto-generated, get LAST_INSERT_ID for MySQL
            last_id_sql = "SELECT LAST_INSERT_ID() AS id"
            last_id_row = await service.afetch_one(last_id_sql)
            if last_id_row and last_id_row.get("id"):
                fetch_sql = f"SELECT * FROM {table_sql} WHERE {pk_col_sql} = %s"
                full_data = await service.afetch_one(fetch_sql, [last_id_row["id"]])
        # For PostgreSQL with auto-increment, we can't get the ID after insert without RETURNING clause
        # In this case, full_data will remain None
    else:
        # No primary key column provided
        # Without a primary key, we cannot reliably fetch the exact inserted record
        # especially in concurrent scenarios. full_data will remain None.
        logger.info("No primary_key_column provided, full_data will not be fetched from database")
    
    # If full_data is still None, use inserted_record as fallback
    # Note: This may not include auto-generated fields (like auto-increment IDs, defaults, etc.)
    if full_data is None:
        logger.info("Using inserted_record as full_data (may not include database-generated fields)")
        full_data = inserted_record
    
    # Normalize Decimal values to float
    full_data_normalized = _normalize_row(full_data) if full_data else None
    
    changes = {
        "count_before": count_before,
        "count_after": count_after,
        "inserted_record": inserted_record,
        "full_data": full_data_normalized
    }
    
    return ApiResponse(status="success", data={"affected_rows": affected, "changes": changes})


@router.post("/object/update")
@_handle_exceptions
async def update_object(request: UpdateRowRequest) -> ApiResponse:
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name, request.is_sim)
    if service is None:
        service = _get_mysql_service()
        dialect = "mysql"
    quote = _quote_identifier_pg if dialect == "postgresql" else _quote_identifier
    table_sql = quote(request.table_name) if dialect != "postgresql" or not schema else f"{_quote_identifier_pg(schema)}.{_quote_identifier_pg(request.table_name)}"

    if not isinstance(request.updates, dict) or not request.updates:
        return ApiResponse(status="failed", message="'updates' must be a non-empty dict")

    # Validate that either PK-based inputs are provided or a WHERE clause is provided
    has_pk_inputs = (request.pk_value is not None) or (bool(request.pk_values))
    has_where_inputs = bool((request.where_sql or "").strip())
    if not has_pk_inputs and not has_where_inputs:
        return ApiResponse(status="success", data={"affected_rows": 0, "changes": []})

    set_clauses: List[str] = []
    params: List[Any] = []
    for col, val in request.updates.items():
        set_clauses.append(f"{quote(col)} = %s")
        params.append(val)
    set_sql = ", ".join(set_clauses)

    # Build WHERE clause
    where_sql: str
    where_params: List[Any] = []
    if has_pk_inputs:
        if not request.primary_key_column:
            return ApiResponse(status="failed", message="'primary_key_column' is required for PK-based update")
        pk_col_sql = quote(request.primary_key_column)
        if request.pk_values is not None:
            values = list(request.pk_values)
            if not values:
                return ApiResponse(status="success", data={"affected_rows": 0, "changes": []})
            placeholders = ", ".join(["%s"] * len(values))
            where_sql = f"{pk_col_sql} IN ({placeholders})"
            where_params.extend(values)
        else:
            where_sql = f"{pk_col_sql} = %s"
            where_params.append(request.pk_value)
    else:
        where_sql = (request.where_sql or "").strip() or "1=1"
        if dialect == "postgresql":
            try:
                where_sql = _convert_mysql_where_to_pg(where_sql)
            except Exception:
                pass
        if request.where_params:
            where_params.extend(list(request.where_params))

    # Query the full data before update to track changes (SELECT * for complete record)
    select_sql = f"SELECT * FROM {table_sql} WHERE {where_sql}"
    rows_before = await service.afetch_all(select_sql, where_params)
    logger.info(f"query full data: {select_sql}")
    # Execute the UPDATE
    update_params = []
    for col, val in request.updates.items():
        update_params.append(val)
    update_params.extend(where_params)
    
    sql = f"UPDATE {table_sql} SET {set_sql} WHERE {where_sql}"
    affected = await service.aexecute(sql, update_params)
    
    # Build changes information
    changes = []
    if rows_before:
        for row in rows_before:
            pk_value = row.get(request.primary_key_column) if request.primary_key_column else None
            
            # Build field-level changes (only for updated fields)
            field_changes = {}
            for col, new_val in request.updates.items():
                old_val = row.get(col)
                # Normalize values for comparison and storage
                old_val_normalized = _normalize_value(old_val)
                new_val_normalized = _normalize_value(new_val)
                # Only include fields that actually changed
                if old_val_normalized != new_val_normalized:
                    field_changes[col] = {
                        "before": old_val_normalized,
                        "after": new_val_normalized
                    }
            
            if field_changes:
                # Normalize all values in full_data
                full_data_normalized = _normalize_row(row)
                change_item = {
                    "fields": field_changes,
                    "full_data": full_data_normalized,  # Full record before update
                }
                logger.info(f"change item: {change_item}")
                if pk_value is not None:
                    change_item["primary_key"] = {request.primary_key_column: pk_value}
                changes.append(change_item)
    
    return ApiResponse(status="success", data={"affected_rows": affected, "changes": changes})


@router.post("/object/delete")
@_handle_exceptions
async def delete_object(request: DeleteRowRequest) -> ApiResponse:
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name, request.is_sim)
    if service is None:
        service = _get_mysql_service()
        dialect = "mysql"
    quote = _quote_identifier_pg if dialect == "postgresql" else _quote_identifier
    table_sql = quote(request.table_name) if dialect != "postgresql" or not schema else f"{_quote_identifier_pg(schema)}.{_quote_identifier_pg(request.table_name)}"

    pk_col_sql = quote(request.primary_key_column)
    sql: str
    params: List[Any]

    if (request.pk_value is None) and (not request.pk_values):
        return ApiResponse(status="failed", message="Provide 'pk_value' or 'pk_values'")

    # Query count before delete
    count_sql_before = f"SELECT COUNT(1) AS cnt FROM {table_sql}"
    count_row_before = await service.afetch_one(count_sql_before)
    count_before = count_row_before.get("cnt", 0) if count_row_before else 0

    # Build WHERE clause for querying records to be deleted
    where_sql: str
    if request.pk_values is not None:
        values = list(request.pk_values)
        if not values:
            return ApiResponse(status="success", data={
                "affected_rows": 0,
                "changes": {
                    "count_before": count_before,
                    "count_after": count_before,
                    "deleted_records": []
                }
            })
        placeholders = ", ".join(["%s"] * len(values))
        where_sql = f"{pk_col_sql} IN ({placeholders})"
        params = values
    else:
        where_sql = f"{pk_col_sql} = %s"
        params = [request.pk_value]

    # Query records before delete to track what will be deleted
    select_sql = f"SELECT * FROM {table_sql} WHERE {where_sql}"
    records_to_delete = await service.afetch_all(select_sql, params)
    
    # Execute DELETE
    sql = f"DELETE FROM {table_sql} WHERE {where_sql}"
    affected = await service.aexecute(sql, params)
    
    # Query count after delete
    count_sql_after = f"SELECT COUNT(1) AS cnt FROM {table_sql}"
    count_row_after = await service.afetch_one(count_sql_after)
    count_after = count_row_after.get("cnt", 0) if count_row_after else 0
    
    # Normalize Decimal values to float
    deleted_records_normalized = _normalize_rows(records_to_delete)
    
    changes = {
        "count_before": count_before,
        "count_after": count_after,
        "deleted_records": deleted_records_normalized
    }
    
    return ApiResponse(status="success", data={"affected_rows": affected, "changes": changes})


@router.post("/object/find")
@_handle_exceptions
async def find_object(request: FindRowRequest) -> ApiResponse:
    logger.info(f"Find object request: {request.ontology_name}, {request.object_type_name}")
    logger.info(f"where sql: {request.where_sql}")
    logger.info(f"where params: {request.where_params}")
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name, request.is_sim)
    if service is None:
        service = _get_mysql_service()
        dialect = "mysql"
    quote = _quote_identifier_pg if dialect == "postgresql" else _quote_identifier
    quote_list = _quote_identifier_list_pg if dialect == "postgresql" else _quote_identifier_list
    
    # Build table_sql: use pre_sql_rule as subquery if provided
    if request.pre_sql_rule:
        preset_sql = request.pre_sql_rule.strip().rstrip(";")
        table_sql = f"({preset_sql}) AS preset_base"
        logger.info(f"Using pre_sql_rule as base query: {preset_sql}")
    else:
        table_sql = quote(request.table_name) if dialect != "postgresql" or not schema else f"{_quote_identifier_pg(schema)}.{_quote_identifier_pg(request.table_name)}"

    # Determine selected columns
    if request.return_attrs is None:
        select_sql = "*"
        single_attr: Optional[str] = None
    elif isinstance(request.return_attrs, str):
        select_sql = quote(request.return_attrs)
        single_attr = request.return_attrs
    else:
        cols = list(request.return_attrs)
        if not cols:
            select_sql = "*"
            single_attr = None
        else:
            select_sql = quote_list(cols)
            single_attr = None

    where_sql = (request.where_sql or "").strip()
    if not where_sql:
        where_sql = "1=1"
    elif dialect == "postgresql":
        try:
            where_sql = _convert_mysql_where_to_pg(where_sql)
        except Exception:
            pass

    order_by_sql = _parse_order_by_with(request.order_by, quote) if request.order_by else None

    sql = f"SELECT {select_sql} FROM {table_sql} WHERE {where_sql}"
    if order_by_sql:
        sql += f" ORDER BY {order_by_sql}"

    # Total count (before pagination)
    count_sql = f"SELECT COUNT(1) AS cnt FROM {table_sql} WHERE {where_sql}"
    try:
        count_row = await service.afetch_one(count_sql, list(request.where_params or []))
        try:
            total_count = int(count_row.get("cnt")) if count_row else 0
        except Exception:
            total_count = 0
    except Exception as e:
        msg = str(e)
        if "ambiguous" in msg.lower():
            import re as _re
            # Try to capture quoted or unquoted column name
            m = _re.search(r"column(?: reference)?\s+\"?([A-Za-z0-9_\.]+)\"?\s+is ambiguous", msg, flags=_re.IGNORECASE)
            col = m.group(1) if m else "<unknown>"
            return ApiResponse(status="failed", message=f"PostgreSQL 列名歧义: '{col}'，请在 SELECT/WHERE/GROUP/HAVING/ORDER BY 中使用表别名限定（如 a.{col}），或在 JOIN 中使用 USING({col}) 以消除歧义")
        raise

    params_list: List[Any] = list(request.where_params or [])
    # Track parsed pagination values for computing next_page_token
    size_int_value: Optional[int] = None
    offset_int_value: int = 0
    if request.page_size is not None:
        try:
            size_int = int(request.page_size)
            if size_int > 0:
                sql += " LIMIT %s"
                params_list.append(size_int)
                size_int_value = size_int
        except Exception:
            pass
        try:
            if request.page_token is not None:
                offset_int = int(request.page_token)
                if offset_int >= 0:
                    sql += " OFFSET %s"
                    params_list.append(offset_int)
                    offset_int_value = offset_int
        except Exception:
            pass
    logger.info(f"sql: {sql}")
    logger.info(f"params_list: {params_list}")
    try:
        rows = await service.afetch_all(sql, params_list)
    except Exception as e:
        msg = str(e)
        if "ambiguous" in msg.lower():
            import re as _re
            m = _re.search(r"column(?: reference)?\s+\"?([A-Za-z0-9_\.]+)\"?\s+is ambiguous", msg, flags=_re.IGNORECASE)
            col = m.group(1) if m else "<unknown>"
            return ApiResponse(status="failed", message=f"PostgreSQL 列名歧义: '{col}'，请在 SELECT/WHERE/GROUP/HAVING/ORDER BY 中使用表别名限定（如 a.{col}），或在 JOIN 中使用 USING({col}) 以消除歧义")
        raise

    # Normalize Decimal values to float
    rows_normalized = _normalize_rows(rows)

    # If paginated, return items with page_size and next_page_token
    if size_int_value is not None and size_int_value > 0:
        next_token = (offset_int_value + len(rows_normalized)) if len(rows_normalized) == size_int_value else None
        if isinstance(request.return_attrs, str):
            values = [row.get(single_attr) for row in rows_normalized]
            return ApiResponse(status="success", data={
                "items": values,
                "page_size": size_int_value,
                "next_page_token": next_token,
                "total_count": total_count,
            })
        return ApiResponse(status="success", data={
            "items": rows_normalized,
            "page_size": size_int_value,
            "next_page_token": next_token,
            "total_count": total_count,
        })

    if isinstance(request.return_attrs, str):
        values = [row.get(single_attr) for row in rows_normalized]
        return ApiResponse(status="success", data={
            "items": values,
            "page_size": None,
            "next_page_token": None,
            "total_count": total_count,
        })
    return ApiResponse(status="success", data={
        "items": rows_normalized,
        "page_size": None,
        "next_page_token": None,
        "total_count": total_count,
    })

@router.post("/object/complex_sql")
@_handle_exceptions
async def complex_sql(request: ComplexSqlRequest) -> ApiResponse:
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name, request.is_sim)
    if service is None:
        service = _get_mysql_service()
        dialect = "mysql"

    sql_text = (request.raw_sql or "").strip().rstrip(";")
    
    # Apply table replacement rules
    # Priority: object_rules (newest, object-based) > table_pre_sql_rules (multi-table) > pre_sql_rule (deprecated single-table)
    if request.object_rules:
        # Use newest object-based replacement (avoids conflicts when multiple objects map to same table)
        logger.info(f"Applying object_rules for objects: {list(request.object_rules.keys())}")
        sql_text = apply_object_rules(sql_text, request.object_rules)
    elif request.table_pre_sql_rules:
        # Use multi-table replacement with sqlparse (backward compatibility)
        logger.info(f"Applying table_pre_sql_rules: {list(request.table_pre_sql_rules.keys())}")
        sql_text = apply_pre_sql_table_rules(sql_text, request.table_pre_sql_rules)
    elif request.pre_sql_rule:
        # Fallback to old single-table replacement (deprecated)
        logger.info("Using deprecated pre_sql_rule (single table replacement)")
        preset_sql = request.pre_sql_rule.strip().rstrip(";")
        wrapped_preset = f"({preset_sql}) AS preset_base"
        # Replace the first FROM table_name (handles optional schema: table or schema.table)
        sql_text = re.sub(
            r"(?i)\bFROM\s+[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?",
            f"FROM {wrapped_preset}",
            sql_text,
            count=1
        )
        logger.info(f"Applied pre_sql_rule to raw_sql, replaced first FROM clause")

    # Best-effort MySQL -> Postgres conversions if needed
    def _maybe_convert_full(sql_in: str) -> str:
        if dialect != "postgresql":
            return sql_in
        try:
            return _convert_mysql_where_to_pg(sql_in)
        except Exception:
            return sql_in

    base_sql = _maybe_convert_full(sql_text)

    # Build total count
    total_count: Optional[int] = None
    if request.need_total_count:
        # Try to strip trailing LIMIT/OFFSET to avoid counting a limited subset
        import re as _re
        sql_no_limit = _re.sub(r"\s+LIMIT\s+\d+(\s+OFFSET\s+\d+)?\s*$", "", base_sql, flags=_re.IGNORECASE)
        count_sql = f"SELECT COUNT(1) AS cnt FROM ({sql_no_limit}) AS t"
        try:
            row = await service.afetch_one(count_sql, list(request.params or []))
            try:
                total_count = int(row.get("cnt")) if row else 0
            except Exception:
                total_count = 0
        except Exception as e:
            msg = str(e)
            if "ambiguous" in msg.lower():
                import re as _re2
                m = _re2.search(r"column(?: reference)?\s+\"?([A-Za-z0-9_\.]+)\"?\s+is ambiguous", msg, flags=_re2.IGNORECASE)
                col = m.group(1) if m else "<unknown>"
                return ApiResponse(status="failed", message=f"PostgreSQL 列名歧义: '{col}'，请在 SQL 中为列添加表别名（如 a.{col}）或使用 USING({col}) 以消除歧义")
            raise

    # Main query with pagination (do not add LIMIT if user already provided one)
    import re as _re3
    has_limit = _re3.search(r"\bLIMIT\b", base_sql, flags=_re3.IGNORECASE) is not None

    sql_out_parts: List[str] = [base_sql]
    params_list: List[Any] = list(request.params or [])
    size_int_value: Optional[int] = None
    offset_int_value: int = 0

    if not has_limit and request.page_size is not None:
        try:
            size_int = int(request.page_size)
            if size_int > 0:
                sql_out_parts.append("LIMIT %s")
                params_list.append(size_int)
                size_int_value = size_int
        except Exception:
            pass
        try:
            if request.page_token is not None:
                offset_int = int(request.page_token)
                if offset_int >= 0:
                    sql_out_parts.append("OFFSET %s")
                    params_list.append(offset_int)
                    offset_int_value = offset_int
        except Exception:
            pass

    sql_out = " ".join(sql_out_parts)
    logger.info(f"sql: {sql_out}")
    logger.info(f"params_list: {params_list}")

    try:
        rows = await service.afetch_all(sql_out, params_list)
    except Exception as e:
        msg = str(e)
        if "ambiguous" in msg.lower():
            import re as _re4
            m = _re4.search(r"column(?: reference)?\s+\"?([A-Za-z0-9_\.]+)\"?\s+is ambiguous", msg, flags=_re4.IGNORECASE)
            col = m.group(1) if m else "<unknown>"
            return ApiResponse(status="failed", message=f"PostgreSQL 列名歧义: '{col}'，请在 SQL 中为列添加表别名（如 a.{col}）或使用 USING({col}) 以消除歧义")
        raise

    # Normalize Decimal values to float
    rows_normalized = _normalize_rows(rows)

    if size_int_value is not None and size_int_value > 0:
        next_token = (offset_int_value + len(rows_normalized)) if len(rows_normalized) == size_int_value else None
        return ApiResponse(status="success", data={
            "items": rows_normalized,
            "page_size": size_int_value,
            "next_page_token": next_token,
            "total_count": total_count,
        })

    return ApiResponse(status="success", data={
        "items": rows_normalized,
        "page_size": None,
        "next_page_token": None,
        "total_count": total_count,
    })

@router.post("/object/schema/find")
@_handle_exceptions
async def find_schema(request: SchemaLookupRequest) -> ApiResponse:
    """Return the resolved dialect and schema for a given ontology/object type.

    - dialect: "mysql" or "postgresql"
    - schema: for Postgres, this is the schema name (may be None); for MySQL, None
    """
    service, dialect, schema = await _get_target_service(request.ontology_name, request.object_type_name)
    if service is None:
        dialect = "mysql"
        schema = None
    return ApiResponse(status="success", data={
        "dialect": dialect,
        "schema": schema,
    })

@router.post("/data_change_log/save")
@_handle_exceptions
async def save_data_change_log(request: ChangeLogRequest) -> ApiResponse:
    """
    保存数据变更审计日志
    将一个操作中的多条数据变更分别存储为多条日志记录
    
    Args:
        request: 包含变更日志信息的请求对象
        
    Returns:
        ApiResponse: 包含插入的日志ID列表
    """
    service = _get_mysql_service()
    
    # 验证 operation_type
    valid_operations = ["CREATE", "UPDATE", "DELETE"]
    operation_type = request.operation_type.upper()
    if operation_type not in valid_operations:
        return ApiResponse(
            status="failed", 
            message=f"Invalid operation_type. Must be one of: {', '.join(valid_operations)}"
        )
    
    # 解析 change_details，提取需要插入的记录列表
    # 每条记录格式: {"change_detail": {...}, "full_data": {...}}
    records_to_insert: List[Dict[str, Any]] = []
    
    if request.change_details:
        try:
            if operation_type == "CREATE":
                # CREATE: 只有一条插入记录
                inserted_record = request.change_details.get("inserted_record")
                full_data = request.change_details.get("full_data")
                if inserted_record:
                    records_to_insert.append({
                        "change_detail": {"inserted_record": inserted_record},
                        "full_data": full_data
                    })
                else:
                    return ApiResponse(
                        status="failed",
                        message="CREATE operation requires 'inserted_record' in change_details"
                    )
            
            elif operation_type == "UPDATE":
                # UPDATE: 可能有多条变更记录，每条记录中有 full_data
                changes = request.change_details.get("changes", [])
                if not isinstance(changes, list):
                    changes = [changes]
                
                for item in changes:
                    if item:
                        # 提取 full_data，其余作为 change_detail
                        full_data = item.pop("full_data", None) if isinstance(item, dict) else None
                        records_to_insert.append({
                            "change_detail": item,
                            "full_data": full_data
                        })
            
            elif operation_type == "DELETE":
                # DELETE: 可能有多条删除记录，每条完整记录就是 full_data
                deleted_records = request.change_details.get("deleted_records", [])
                if not isinstance(deleted_records, list):
                    deleted_records = [deleted_records]
                
                for record in deleted_records:
                    if record:
                        records_to_insert.append({
                            "change_detail": {"deleted_record": record},
                            "full_data": record  # 删除的完整记录就是 full_data
                        })
        except Exception as e:
            return ApiResponse(
                status="failed",
                message=f"Failed to parse change_details: {e}",
                code="500"
            )
    
    # 如果没有要插入的记录，返回成功但记录数为0
    if not records_to_insert:
        return ApiResponse(
            status="success",
            code="200",
            data={
                "log_ids": [],
                "records_inserted": 0
            },
            message="没有需要记录的变更"
        )
    
    # 构建 INSERT SQL
    insert_sql = """
        INSERT INTO ontology_data_change_log 
        (track_id, operation_type, object_type_name, affected_rows, 
         record_count_before, record_count_after, change_details, full_data, `order`)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    log_ids = []
    
    try:
        # 为每条变更记录插入一条日志
        for record in records_to_insert:
            # 将 change_detail 转换为 JSON 字符串
            change_detail = record.get("change_detail")
            change_details_json = json.dumps(change_detail, ensure_ascii=False) if change_detail else None
            
            # 将 full_data 转换为 JSON 字符串
            full_data = record.get("full_data")
            full_data_json = json.dumps(full_data, ensure_ascii=False) if full_data else None
            
            params = [
                request.track_id,
                operation_type,
                request.object_type_name,
                None,  # affected_rows 设为 NULL
                request.record_count_before,
                request.record_count_after,
                change_details_json,
                full_data_json,
                request.operation_number
            ]
            
            # 执行插入
            await service.aexecute(insert_sql, params)
            
            # 获取插入的 ID
            last_id_sql = "SELECT LAST_INSERT_ID() AS id"
            last_id_row = await service.afetch_one(last_id_sql)
            log_id = last_id_row.get("id") if last_id_row else None
            
            if log_id:
                log_ids.append(log_id)
        
        logger.info(f"Data change logs saved successfully. {len(log_ids)} records inserted. Log IDs: {log_ids}")
        
        return ApiResponse(
            status="success",
            code="200",
            data={
                "log_ids": log_ids,
                "records_inserted": len(log_ids)
            },
            message=f"成功记录 {len(log_ids)} 条日志"
        )
    except Exception as e:
        logger.error(f"Failed to save data change log: {e}")
        return ApiResponse(
            status="failed",
            message=f"保存日志失败: {str(e)}"
        )


@router.post("/config/get")
@_handle_exceptions
async def get_config_property(request: ConfigPropertyRequest) -> ApiResponse:
    """
    根据配置项名称获取配置值
    特殊处理：
    - 当 config_name 为 'mysql_meta' 时，返回当前环境的数据库配置信息
    - 当 config_name 以 'llm_' 开头时，返回模型服务配置信息（从 ontology_modelmatch 和 ontology_modelmatch_service 表查询）
    
    Args:
        request: 包含配置项名称的请求对象
        
    Returns:
        ApiResponse: 包含配置值的响应，prop_label字段可能是字符串或JSON字符串
    """
    # 特殊处理：如果请求 mysql_meta，返回当前数据库配置
    if request.config_name == "mysql_meta":
        try:
            mysql_config = get_mysql_config()
            # 构造返回的配置信息（包含敏感信息）
            config_value = {
                "host": mysql_config.get("host"),
                "port": mysql_config.get("port"),
                "user": mysql_config.get("user"),
                "password": mysql_config.get("password"),
                "database": mysql_config.get("database"),
                "charset": mysql_config.get("charset", "utf8mb4")
            }
            
            return ApiResponse(
                status="success",
                code="200",
                data={
                    "config_name": request.config_name,
                    "config_value": json.dumps(config_value, ensure_ascii=False)
                },
                message="成功获取配置项"
            )
        except Exception as e:
            logger.error(f"Failed to get mysql_meta config: {e}")
            return ApiResponse(
                status="failed",
                message=f"获取数据库配置失败: {str(e)}",
                code="500"
            )
    
    # 特殊处理：如果请求 llm_config 开头的配置，返回模型服务配置
    if request.config_name.startswith("llm_config"):
        try:
            service = _get_mysql_service()
            
            # 联表查询服务和模型信息
            sql = """
                SELECT 
                    s.service_name,
                    m.url,
                    m.api_key,
                    m.model_name
                FROM ontology_modelmatch_service s
                LEFT JOIN ontology_modelmatch m ON s.model_id = m.model_id
            """
            
            rows = await service.afetch_all(sql)
            
            if not rows:
                return ApiResponse(
                    status="failed",
                    message="未找到任何模型服务配置",
                    code="404"
                )
            
            # 构造返回的配置字典
            config_dict = {}
            for row in rows:
                service_name = row.get("service_name")
                if service_name:
                    config_dict[service_name] = {
                        "base_url": row.get("url"),
                        "api_key": row.get("api_key"),
                        "model_name": row.get("model_name")
                    }
            
            return ApiResponse(
                status="success",
                code="200",
                data={
                    "config_name": request.config_name,
                    "config_value": json.dumps(config_dict, ensure_ascii=False)
                },
                message="成功获取模型服务配置"
            )
        except Exception as e:
            logger.error(f"Failed to get llm config: {e}")
            return ApiResponse(
                status="failed",
                message=f"获取模型服务配置失败: {str(e)}",
                code="500"
            )
    
    # 常规处理：从数据库查询配置项
    service = _get_mysql_service()
    
    # 查询配置项
    sql = "SELECT prop_label FROM dacp_meta_property WHERE prop_name = %s"
    
    try:
        row = await service.afetch_one(sql, [request.config_name])
        
        if not row:
            return ApiResponse(
                status="failed",
                message=f"配置项 '{request.config_name}' 不存在",
                code="404"
            )
        
        prop_label = row.get("prop_label")
        
        return ApiResponse(
            status="success",
            code="200",
            data={
                "config_name": request.config_name,
                "config_value": prop_label
            },
            message="成功获取配置项"
        )
    except Exception as e:
        logger.error(f"Failed to get config property: {e}")
        return ApiResponse(
            status="failed",
            message=f"获取配置项失败: {str(e)}",
            code="500"
        )
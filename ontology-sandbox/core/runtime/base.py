import os
import json
import asyncio
import threading
import requests
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union
from urllib import request as _urlrequest
from urllib.error import URLError, HTTPError
from pathlib import Path
import inspect
from public.public_variable import logger
from public.public_function import save_large_result_to_csv
from core.runtime.context import get_track_id, get_and_increment_operation_number

class OntologyObject:
    """
    Base class for ontology objects backed by a relational table.

    Subclasses must set:
      - _table_name: str
      - _field_map: dict[str, str]  # ontology_attr -> column_name

    DB connection is taken from environment variables (MySQL 8.0):
      MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

    The find() API supports both simple and compound queries:
      - find("attr", value, return_attrs=None)
      - find(return_attrs=[...], attr1=value1, attr2=value2)

    Returns:
      - If return_attrs is None: List[Dict[str, Any]] mapping ontology attrs to values
      - If return_attrs is a string: List[Any] values of that attribute
      - If return_attrs is a list/tuple: List[Dict[str, Any]] of those attrs
    """

    _table_name: str = ""
    _field_map: Dict[str, str] = {}
    # Primary key ontology attribute name; subclasses should set this if not "id"
    _primary_key_attr: Optional[str] = None

    # Row-instance attribute projection: when instances are created from find(as_objects=True),
    # values are stored in this mapping and exposed via __getattr__.
    _row_values: Optional[Dict[str, Any]] = None

    def __init_subclass__(cls, **kwargs: Any) -> None:
        """
        On subclass creation, register property descriptors for ontology attributes so
        that IDEs and REPL can discover them (improves autocompletion). Also attach
        type annotations for these attributes to assist static tools.
        """
        super().__init_subclass__(**kwargs)
        try:
            field_map = getattr(cls, "_field_map", None)
            if isinstance(field_map, dict) and field_map:
                # Ensure __annotations__ exists
                if not hasattr(cls, "__annotations__") or cls.__annotations__ is None:
                    cls.__annotations__ = {}  # type: ignore[assignment]
                annotations: Dict[str, Any] = getattr(cls, "__annotations__")  # type: ignore[assignment]

                for attr_name in field_map.keys():
                    if not hasattr(cls, attr_name):
                        # Create a read-only property that returns row-projected value (or None)
                        def _make_getter(_attr: str):
                            def _getter(self: "OntologyObject") -> Any:
                                values = getattr(self, "_row_values", None)
                                return None if values is None else values.get(_attr)
                            return _getter
                        setattr(cls, attr_name, property(_make_getter(attr_name)))
                    # Add a broad annotation to surface attribute name to static tools
                    if attr_name not in annotations:
                        annotations[attr_name] = Optional[Any]
        except Exception:
            # Best-effort; do not fail class creation if anything goes wrong
            pass

    # ---------------------------
    # HTTP client for external CRUD service
    # ---------------------------
    @staticmethod
    def _get_object_service_base_url() -> str:
        # Prefer explicit env var; fallback to common alternative; default localhost
        return (
            f"{os.getenv('NET_GATE', 'http://localhost:9080')}/{os.getenv('ONTOLOGY_BACKEND_SERVER', 'ontology_backend_server')}/api/v1/ontology"
        ).rstrip("/")
    
    @staticmethod
    def _get_audit_service_base_url() -> str:
        """
        Get base URL for audit/change log service.
        Uses the same gateway as object service but different path.
        """
        return (
            f"{os.getenv('NET_GATE', 'http://localhost:9080')}/{os.getenv('ONTOLOGY_BACKEND_SERVER', 'ontology_backend_server')}/api/v1/ontology"
        ).rstrip("/")

    @staticmethod
    def _quote_identifier(identifier: str) -> str:
        """
        Quote a SQL identifier (column or table name) with double quotes.
        
        This ensures consistent behavior across different databases, especially
        PostgreSQL which is case-sensitive with quoted identifiers.
        
        Args:
            identifier: The column or table name to quote
            
        Returns:
            Quoted identifier, e.g., 'UserName' -> '"UserName"'
            
        Note:
            - Escapes any existing double quotes by doubling them
            - If identifier is already quoted, returns as-is
            - Empty or None identifiers are returned as-is
        """
        if not identifier or not isinstance(identifier, str):
            return identifier
        
        # If already quoted, return as-is
        if identifier.startswith('"') and identifier.endswith('"'):
            return identifier
        
        # Escape any internal double quotes by doubling them
        escaped = identifier.replace('"', '""')
        
        # Wrap with double quotes
        return f'"{escaped}"'

    @classmethod
    def _post_service_json(cls, path: str, payload: Dict[str, Any], timeout: int = 300) -> Dict[str, Any]:
        base = cls._get_object_service_base_url()
        url = f"{base}{path}"
        
        body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        logger.info(f"payload: {payload}")
        req = _urlrequest.Request(url=url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with _urlrequest.urlopen(req, timeout=timeout) as resp:
                resp_bytes = resp.read()
        except HTTPError as e:
            raise RuntimeError(f"Service HTTP error {e.code} for {path}: {e.reason}")
        except URLError as e:
            raise RuntimeError(f"Service URL error for {path}: {e.reason}")
        except Exception as e:
            raise RuntimeError(f"Service request failed for {path}: {e}")

        try:
            res = json.loads(resp_bytes.decode("utf-8"))
        except Exception:
            sample = resp_bytes[:200]
            raise RuntimeError(f"Invalid JSON response from service {path}: {sample!r}")
        if not isinstance(res, dict):
            raise RuntimeError(f"Invalid response type from service {path}")
        status = res.get("status")
        if status != "success":
            raise RuntimeError(str(res.get("message") or "service call failed"))
        # Prefer 'data' field; some services may use 'message' to carry JSON string but here we expect 'data'
        return res.get("data") if "data" in res else res
    
    @classmethod
    def _send_sim_callback(cls, track_id: str, message: str) -> None:
        """
        Send callback to SIM_CALLBACK_URL when is_sim is true.
        
        Args:
            track_id: The track ID from context
            message: The message to send
        """
        callback_url = os.environ.get("SIM_CALLBACK_URL")
        if not callback_url:
            logger.warning("SIM_CALLBACK_URL not set, skipping callback")
            return
        
        try:
            payload = {
                "eventName": track_id,
                "msg": message
            }
            response = requests.post(callback_url, json=payload, timeout=5)
            if response.status_code == 200:
                logger.info(f"[TRACK_ID: {track_id}] SIM callback sent successfully: {message}")
            else:
                logger.warning(
                    f"[TRACK_ID: {track_id}] SIM callback returned status {response.status_code}: {message}"
                )
        except Exception as e:
            logger.error(f"[TRACK_ID: {track_id}] Failed to send SIM callback: {e}")
    
    @classmethod
    def _send_change_log(
        cls,
        track_id: Optional[str],
        operation_type: str,
        object_type_name: Optional[str],
        affected_rows: int,
        record_count_before: Optional[int],
        record_count_after: Optional[int],
        change_details: Optional[Dict[str, Any]],
    ) -> None:
        """
        Send data change log to audit service.
        This method is fire-and-forget and will not raise exceptions to avoid
        impacting the main business logic.
        
        Args:
            track_id: Track ID from context
            operation_type: Operation type (CREATE/UPDATE/DELETE)
            object_type_name: Object type name
            affected_rows: Number of affected rows
            record_count_before: Record count before operation
            record_count_after: Record count after operation
            change_details: Detailed change information
        """
        try:
            # Get operation number (millisecond timestamp) for ordering operations
            operation_number = get_and_increment_operation_number()
            
            base_url = cls._get_audit_service_base_url()
            url = f"{base_url}/data_change_log/save"
            
            payload = {
                "track_id": track_id,
                "operation_number": operation_number,  # Millisecond timestamp for ordering
                "operation_type": operation_type,
                "object_type_name": object_type_name,
                "affected_rows": affected_rows,
                "record_count_before": record_count_before,
                "record_count_after": record_count_after,
                "change_details": change_details,
            }
            
            body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
            req = _urlrequest.Request(
                url=url, 
                data=body, 
                headers={"Content-Type": "application/json"}, 
                method="POST"
            )
            
            # Use short timeout for audit logging to avoid blocking business logic
            with _urlrequest.urlopen(req, timeout=5) as resp:
                resp_bytes = resp.read()
                result = json.loads(resp_bytes.decode("utf-8"))
                
                if result.get("status") == "success":
                    logger.info(
                        f"[TRACK_ID: {track_id}] Change log sent successfully. "
                        f"Operation: {operation_type}, Object: {object_type_name}"
                    )
                else:
                    logger.warning(
                        f"[TRACK_ID: {track_id}] Change log sent but service returned non-success: "
                        f"{result.get('message', 'Unknown error')}"
                    )
        
        except Exception as e:
            # Log error but don't raise - audit logging should not impact business operations
            logger.error(
                f"[TRACK_ID: {track_id}] Failed to send change log to audit service: {e}. "
                f"Operation: {operation_type}, Object: {object_type_name}"
            )

    # ---------------------------
    # Public API
    # ---------------------------
    def __getattr__(self, name: str) -> Any:
        """
        Allow dot-access of ontology attributes on instances created by find(as_objects=True).
        If the attribute name is a known ontology attribute and this instance carries
        row-projected values, return the value (or None if not present in the row).
        """
        field_map = getattr(self, "_field_map", {}) or {}
        if name in field_map and getattr(self, "_row_values", None) is not None:
            return self._row_values.get(name)
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __dir__(self) -> List[str]:
        """
        Include ontology attribute names in dir() output to improve interactive
        completion (IPython/Jupyter) and some IDEs.
        """
        try:
            names = set(super().__dir__())  # type: ignore[arg-type]
        except Exception:
            names = set()
        try:
            names.update(getattr(self, "_field_map", {}).keys())
        except Exception:
            pass
        return sorted(names)

    def _infer_ontology_and_object(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Best-effort inference of (ontology_name, object_type_name) based on the
        class's module path or file system location. Never raises; returns (None, None)
        if inference fails.
        """
        try:
            # Prefer module path pattern: core.ontology.<ontology>.objects.<module>
            module_name = getattr(self.__class__, "__module__", "")
            if isinstance(module_name, str) and module_name.startswith("core.ontology."):
                parts = module_name.split(".")
                # Expect: [core, ontology, <ontology_id>, objects, <module>]
                if len(parts) >= 5 and parts[2]:
                    ontology_id = parts[2]
                    object_type = getattr(self.__class__, "__name__", None)
                    if isinstance(object_type, str) and object_type:
                        return ontology_id, object_type
            # Fallback: inspect file path and locate .../core/ontology/<ontology_id>/objects/...
            file_path = inspect.getfile(self.__class__)
            p = Path(file_path)
            parts = list(p.parts)
            if "ontology" in parts:
                idx = parts.index("ontology")
                if idx + 1 < len(parts):
                    ontology_id = parts[idx + 1]
                    object_type = getattr(self.__class__, "__name__", None)
                    if isinstance(object_type, str) and object_type:
                        return ontology_id, object_type
        except Exception:
            # Best-effort inference; ignore all errors
            pass
        return None, None

    def _map_order_by(self, order_by: Optional[str], ontology_maps: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Map ontology attribute identifiers in an ORDER BY clause to physical columns.
        Supports qualified identifiers like Object.Attr via ontology_maps and
        unqualified attributes via this object's _field_map. Preserves quoted strings.
        """
        if not order_by:
            return None
        try:
            import re as _re

            object_attr_to_col: Dict[Tuple[str, str], str] = {}
            attr_to_cols: Dict[str, List[str]] = {}
            if isinstance(ontology_maps, dict):
                try:
                    object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
                    for (obj, attr), col in object_attr_to_col.items():
                        attr_to_cols.setdefault(attr, [])
                        if col not in attr_to_cols[attr]:
                            attr_to_cols[attr].append(col)
                except Exception:
                    object_attr_to_col = {}
                    attr_to_cols = {}

            def _replace_qualified_idents(seg: str) -> str:
                def _sub(m: _re.Match[str]) -> str:
                    obj = m.group(1)
                    attr = m.group(2)
                    col = object_attr_to_col.get((obj, attr))
                    if col:
                        # Quote the column name for database compatibility
                        return self._quote_identifier(col)
                    return m.group(0)
                return _re.sub(r"(?<![A-Za-z0-9_])([A-Za-z_][\w]*)\.([A-Za-z0-9_\u4e00-\u9fa5]+)(?![A-Za-z0-9_])", _sub, seg)

            def _replace_unqualified_attrs(seg: str) -> str:
                attrs_sorted_self = sorted(self._field_map.keys(), key=len, reverse=True)
                for a in attrs_sorted_self:
                    pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(a)}(?![A-Za-z0-9_])")
                    # Quote the column name for database compatibility
                    quoted_col = self._quote_identifier(self._field_map[a])
                    seg = pat.sub(quoted_col, seg)
                for attr, cols in attr_to_cols.items():
                    if attr in self._field_map:
                        continue
                    if len(cols) != 1:
                        continue
                    col = cols[0]
                    # Quote the column name for database compatibility
                    quoted_col = self._quote_identifier(col)
                    pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(attr)}(?![A-Za-z0-9_])")
                    seg = pat.sub(quoted_col, seg)
                return seg

            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", str(order_by))
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    out_parts.append(seg)
                else:
                    seg = _replace_qualified_idents(seg)
                    seg = _replace_unqualified_attrs(seg)
                    out_parts.append(seg)
            return "".join(out_parts)
        except Exception:
            return str(order_by)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert this instance (from find(as_objects=True)) into a dict mapping
        ontology attribute names to values. Missing values are returned as None.
        """
        result: Dict[str, Any] = {}
        attrs = list((getattr(self, "_field_map", {}) or {}).keys())
        for attr in attrs:
            try:
                result[attr] = getattr(self, attr)
            except Exception:
                result[attr] = None
        return result
    
    def check_attr_mapping(
        self,
        object_names: Optional[Iterable[str]] = None,
        *,
        ontology_name: Optional[str] = None,
        ontology_maps: Optional[Dict[str, Any]] = None,
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        获取属性到物理列的映射与主键信息。
        - 无 object_names 时：返回当前对象的映射（与旧版兼容）
        - 提供 object_names 时：批量返回这些对象的映射信息
        """
        # 单对象（旧行为）
        if object_names is None:
            table_name = getattr(self, "_table_name", None)
            field_map = dict(getattr(self, "_field_map", {}) or {})
            primary_key_attr = getattr(self, "_primary_key_attr", None)
            primary_key_column = None
            try:
                if primary_key_attr and isinstance(field_map, dict):
                    primary_key_column = field_map.get(primary_key_attr)
            except Exception:
                primary_key_column = None
            return {
                "object_name": self.__class__.__name__,
                # "table_name": table_name,
                # "primary_key_attr": primary_key_attr,
                "primary_key_column": primary_key_column,
                "attr_to_col": field_map,
            }
        # 批量对象：基于 ontology_maps 或按需动态导入对象类
        results: List[Dict[str, Any]] = []
        names_list = [str(n) for n in list(object_names or []) if str(n).strip()]
        # 预取 maps
        object_attr_to_col: Dict[Tuple[str, str], str] = {}
        if isinstance(ontology_maps, dict):
            try:
                object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
            except Exception:
                object_attr_to_col = {}
        for name in names_list:
            # 1) 先用 maps 拿到属性->列映射
            attr_map: Dict[str, str] = {}
            if object_attr_to_col:
                try:
                    for (obj, attr), col in object_attr_to_col.items():
                        if obj == name:
                            attr_map[attr] = col
                except Exception:
                    pass
            # 2) 主键列：尽量通过动态导入对象类推断
            pk_col: Optional[str] = None
            try:
                if ontology_name:
                    import importlib
                    module_path = f"core.ontology.{ontology_name}.objects.{name}"
                    mod = importlib.import_module(module_path)
                    # 优先取与 name 同名类；否则取第一个 OntologyObject 子类
                    cls_candidate = None
                    if hasattr(mod, name):
                        cand = getattr(mod, name)
                        try:
                            if isinstance(cand, type) and issubclass(cand, OntologyObject):
                                cls_candidate = cand
                        except Exception:
                            cls_candidate = None
                    if cls_candidate is None:
                        for n in dir(mod):
                            c = getattr(mod, n)
                            try:
                                if isinstance(c, type) and issubclass(c, OntologyObject):
                                    cls_candidate = c
                                    break
                            except Exception:
                                continue
                    if cls_candidate is not None:
                        inst = cls_candidate()
                        fm = dict(getattr(inst, "_field_map", {}) or {})
                        if not attr_map:
                            # 若 maps 未提供，则回退使用类上定义的 field_map
                            attr_map = fm
                        pk_attr = getattr(inst, "_primary_key_attr", None)
                        if pk_attr and isinstance(fm, dict):
                            pk_col = fm.get(pk_attr)
            except Exception:
                # 动态导入失败则忽略，pk_col 可能保持为 None
                pass
            results.append({
                "object_name": name,
                "primary_key_column": pk_col,
                "attr_to_col": dict(attr_map or {}),
            })
        return results
    def find(
        self,
        *args: Any,
        return_attrs: Optional[Union[str, Iterable[str]]] = None,
        ontology_maps: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Query rows by ontology attribute conditions and return selected attributes.

        Usage:
          - find("attr", value, return_attrs="field")
          - find(attr=value, return_attrs=["field1", "field2"]) 
          - find(attr1=v1, attr2=v2)  # returns all mapped attrs
        
        Returns dict with keys:
          - items: List[Any]|List[Dict[str, Any]] or List[OntologyObject] when as_objects=True
          - page_size: Optional[int]
          - next_page_token: Optional[str]
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        if not self._table_name or not self._field_map:
            raise ValueError("Subclass must define _table_name and _field_map")
        # logger.info(f"ontology_maps: {ontology_maps}")
        # Optional: return rows as object views with dot-access
        as_objects = bool(kwargs.pop("as_objects", False))
        # Advanced path: raw WHERE clause support
        where_sql_raw = kwargs.pop("where_sql", None)
        ontology_name = kwargs.pop("ontology_name", None)
        # Accept both keys for backward compatibility
        object_type_name = kwargs.pop("object_type_name", None) or kwargs.pop("object_name", None)
        # Control whether to save large data to CSV (default False)
        save_long_data = bool(kwargs.pop("save_long_data", False))

        # Auto-infer ontology/object names if missing from kwargs
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object

        # Send SIM callback at the start if is_sim is true
        track_id = get_track_id()
        if track_id:
            start_message = f'find请求开始:{{"object_name": "{object_type_name}"}}'
            self._send_sim_callback(track_id, start_message)
            time.sleep(1)

        def _finalize_result(
            items: Any,
            page_size_val: Optional[int],
            next_token_val: Optional[Union[int, str]],
            total_count_val: Optional[int],
            enable_save_long_data: bool = False,
            where_sql_final_val: Optional[str] = None,
            physical_cols_val: Optional[Union[str, List[str]]] = None,
            where_params_val: Optional[List[Any]] = None,
            order_by_val: Optional[str] = None,
            track_id_val: Optional[str] = None,
        ) -> Dict[str, Any]:
            warning_msg = "查询结果数据较大，请使用分页逐步查询完所有数据"
            message = "查询成功"
            result_items = items
            is_large_data = False
            download_url = None
            
            try:
                char_limit = 8000
                count_limit = 1000
                
                # 检查字符数是否超过限制
                if isinstance(items, list):
                    total_chars = len(str(items))
                    if total_chars > char_limit:
                        is_large_data = True
                else:
                    if len(str(items)) > char_limit:
                        is_large_data = True
                
                # 检查数据条数是否超过限制
                if isinstance(total_count_val, int) and total_count_val > count_limit:
                    is_large_data = True
                elif isinstance(items, list) and len(items) > count_limit:
                    is_large_data = True
                
                # 如果数据量过大且启用了保存功能
                if is_large_data and enable_save_long_data:
                    # 1. 保存本地CSV文件
                    if isinstance(items, list):
                        csv_filename, csv_file_path = save_large_result_to_csv(items)
                        result_items = items[:3]  # 返回前3条作为样本
                        message = f"查询结果数据量过大（共{len(items)}条数据），已将全量数据转存为临时CSV文件：{csv_file_path}，当前返回前3条数据作为样本预览。如果本次查询的结果需要作为下一步逻辑/动作的输入参数，请使用ontology_python_exec工具通过代码访问本地csv文件（你不用通过链接来访问，链接是给用户用的）并将结果存为变量，再使用变量作为逻辑/动作的入参进行执行."
                    
                    # 2. 同时启动minio异步导出
                    try:
                        from core.runtime.helpers import get_async_export_service
                        import threading
                        from datetime import datetime
                        export_service = get_async_export_service()
                        
                        timestamp = int(datetime.now().timestamp() * 1000)
                        filename = f"{ontology_name}_{timestamp}.csv"
                        download_url = export_service.generate_download_url(ontology_name, filename)
                        
                        def _export_large_data():
                            try:
                                def fetch_page(page_token):
                                    fetch_payload = {
                                        "table_name": self._table_name,
                                        "return_attrs": physical_cols_val,
                                        "where_sql": where_sql_final_val,
                                        "where_params": list(where_params_val or []),
                                        "order_by": str(order_by_val) if order_by_val else None,
                                        "page_size": 1000,
                                        "page_token": page_token,
                                        "ontology_name": ontology_name,
                                        "object_type_name": object_type_name,
                                    }
                                    # Add is_sim if track_id exists (use track_id_val from outer scope)
                                    if track_id_val:
                                        fetch_payload["is_sim"] = True
                                    return self._post_service_json("/object/find", fetch_payload)
                                
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                url = loop.run_until_complete(
                                    export_service.export_large_dataset_async(
                                        fetch_page_func=fetch_page,
                                        ontology_name=ontology_name,
                                        total_count=total_count_val,
                                        page_size=1000,
                                        predefined_filename=filename,
                                        predefined_temp_file_path=None
                                    )
                                )
                                loop.close()
                                
                                if url:
                                    logger.info(f"Large data export completed: {url}")
                            except Exception as e:
                                logger.error(f"Background export failed: {e}")
                        
                        thread = threading.Thread(target=_export_large_data, daemon=True)
                        thread.start()
                        
                        message += f" 已启动异步导出任务，所有数据将导出为CSV文件并上传到MinIO，如果用户需要下载并访问该文件，就把链接返回给用户。"
                    except Exception as e:
                        logger.error(f"Failed to start async export: {e}")
                    
                    # message += " 如果本次查询的结果需要作为下一步逻辑/动作的输入参数，请使用ontology_python_exec工具通过代码访问本地csv文件（你不用通过链接来访问，链接是给用户用的）并将结果存为变量，再使用变量作为逻辑/动作的入参进行执行"
                elif isinstance(total_count_val, int) and isinstance(page_size_val, int) and total_count_val/page_size_val > 1:
                    message = warning_msg
                    
            except Exception:
                pass
            
            result = {
                "items": result_items,
                "page_size": page_size_val,
                "next_page_token": next_token_val,
                "total_count": total_count_val,
                "message": message,
                "is_long_result": is_large_data,
            }
            
            if download_url:
                result["download_url"] = download_url
            
            # Send SIM callback at the end if is_sim is true
            if track_id_val:
                end_message = f'find请求结束:{{"object_name": "{object_type_name}"}}'
                self._send_sim_callback(track_id_val, end_message)
            
            return result

        if where_sql_raw is not None:
            # Optional helpers
            order_by = kwargs.pop("order_by", None) or kwargs.pop("order_by_column", None)
            where_params = kwargs.pop("where_params", None)
            _missing = object()
            _page_size_in = kwargs.pop("page_size", _missing)
            page_token = kwargs.pop("page_token", None)
            try:
                page_token_int = int(page_token) if page_token is not None else None
            except Exception:
                page_token_int = None

            # Determine effective page size
            if _page_size_in is _missing:
                page_size_int = 5000
            elif _page_size_in is None:
                page_size_int = None
            else:
                try:
                    page_size_int = int(_page_size_in)
                except Exception:
                    page_size_int = 5000

            # Determine selected columns (physical column names expected)
            if isinstance(return_attrs, str):
                physical_cols: Optional[Union[str, List[str]]] = return_attrs
            elif return_attrs is None:
                # When return_attrs is None, return all attributes defined in _field_map
                physical_cols = list(self._field_map.values())
            else:
                physical_cols = list(return_attrs)

            # Known enum literal mappings
            enum_literal_map: Dict[str, str] = {
                "StatusClosed": "\u5c01\u95ed",
                "StatusRestricted": "\u9650\u884c",
                "StatusNormal": "\u6b63\u5e38",
            }

            import re as _re

            # No attribute-level validation in where_sql; caller must use physical column names

            # ---------------------------
            # Cross-ontology mapping helpers
            # ---------------------------
            object_to_table: Dict[str, str] = {}
            object_attr_to_col: Dict[Tuple[str, str], str] = {}
            attr_to_cols: Dict[str, List[str]] = {}
            if isinstance(ontology_maps, dict):
                try:
                    object_to_table = dict(ontology_maps.get("object_to_table") or {})
                    object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
                    # Build attr -> unique column mapping across objects
                    for (obj, attr), col in object_attr_to_col.items():
                        attr_to_cols.setdefault(attr, [])
                        if col not in attr_to_cols[attr]:
                            attr_to_cols[attr].append(col)
                except Exception:
                    object_to_table = {}
                    object_attr_to_col = {}
                    attr_to_cols = {}

            # No unknown attribute checks; physical columns are required

            # Qualify Postgres tables with schema if nested SQL references other objects
            def _collect_objects_for_schema(sql_text: str) -> List[str]:
                if not sql_text:
                    return []
                seen: set[str] = set()
                parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", str(sql_text))
                for idx, seg in enumerate(parts):
                    if idx % 2 == 1:
                        continue  # skip quoted strings
                    for m in _re.finditer(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", seg):
                        seen.add(m.group(2))
                    for m in _re.finditer(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", seg):
                        seen.add(m.group(1))
                # Only consider objects we can map to tables
                return [o for o in seen if o in (object_to_table or {})]

            try:
                objects_in_where = set(_collect_objects_for_schema(str(where_sql_raw)))
                logger.info(f"objects_in_where: {objects_in_where}")
                # For each object referenced, fetch its dialect/schema and prefix if Postgres
                for obj_name in sorted(objects_in_where):
                    try:
                        schema_info = self._post_service_json(
                            "/object/schema/find",
                            {"ontology_name": ontology_name, "object_type_name": obj_name},
                        ) or {}
                        dialect = schema_info.get("dialect")
                        schema = schema_info.get("schema")
                        if dialect == "postgresql" and schema:
                            tbl = object_to_table.get(obj_name)
                            if tbl and not str(tbl).startswith(f"{schema}."):
                                object_to_table[obj_name] = f"{schema}.{tbl}"
                    except Exception as e:
                        # Best-effort; if service fails, proceed without schema qualification
                        logger.error(f"Error fetching schema for object {obj_name}: {e}")
                        continue
            except Exception as e:
                logger.error(f"Error collecting objects for schema: {e}")
                # If collection fails, proceed with existing mappings
                pass

            # Do not replace attributes in WHERE; only map object names to physical tables in subqueries if any
            def _replace_qualified_idents(seg: str) -> str:
                return seg

            def _replace_from_join_tables(seg: str) -> str:
                # Replace object names after FROM/JOIN/UPDATE/INTO with physical table names
                def _sub_kw(m: _re.Match[str]) -> str:
                    kw = m.group(1)
                    obj = m.group(2)
                    tbl = object_to_table.get(obj)
                    if not tbl:
                        return m.group(0)
                    return f"{kw} {tbl}"
                seg = _re.sub(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", _sub_kw, seg)
                # Also handle "DELETE FROM Object"
                def _sub_del(m: _re.Match[str]) -> str:
                    obj = m.group(1)
                    tbl = object_to_table.get(obj)
                    return f"DELETE FROM {tbl}" if tbl else m.group(0)
                seg = _re.sub(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", _sub_del, seg)
                return seg

            def _replace_unqualified_attrs(seg: str) -> str:
                return seg

            def _map_identifiers(sql_text: str) -> str:
                text = sql_text or ""
                if not text:
                    return text
                parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", text)
                def _replace_segment(seg: str) -> str:
                    if not seg:
                        return seg
                    # Replace FROM/JOIN object names first
                    seg = _replace_from_join_tables(seg)
                    # No attribute replacement
                    seg = _replace_qualified_idents(seg)
                    seg = _replace_unqualified_attrs(seg)
                    return seg
                out_parts: List[str] = []
                for idx, seg in enumerate(parts):
                    if idx % 2 == 1:
                        out_parts.append(seg)
                    else:
                        out_parts.append(_replace_segment(seg))
                return "".join(out_parts)

            def _map_literals(sql_text: str) -> str:
                if not sql_text:
                    return sql_text
                parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", sql_text)
                out_parts: List[str] = []
                for idx, seg in enumerate(parts):
                    if idx % 2 == 1:
                        quote = seg[0]
                        inner = seg[1:-1]
                        new_inner = enum_literal_map.get(inner, inner)
                        out_parts.append(f"{quote}{new_inner}{quote}")
                    else:
                        out_parts.append(seg)
                return "".join(out_parts)

            where_sql_final = _map_identifiers(str(where_sql_raw).strip())
            where_sql_final = _map_literals(where_sql_final)
            if not where_sql_final:
                where_sql_final = "1=1"

            # Normalize return_attrs: physical columns only (no quoting, server handles it)
            if isinstance(return_attrs, str):
                physical_cols = return_attrs
            elif return_attrs is None:
                # When return_attrs is None, return all attributes defined in _field_map
                physical_cols = list(self._field_map.values())
            else:
                physical_cols = list(return_attrs)
            logger.info(f"page_size: {page_size_int}")
            
            # Get track_id to determine if we should add is_sim
            track_id = get_track_id()
            
            payload = {
                "table_name": self._table_name,
                "return_attrs": physical_cols,
                "where_sql": where_sql_final,
                "where_params": list(where_params or []),
                "order_by": str(order_by) if order_by else None,
                "page_size": page_size_int,
                "page_token": page_token_int,
                "ontology_name": ontology_name,
                "object_type_name": object_type_name,
            }
            
            # Add pre_sql_rule if defined on this object
            pre_sql = getattr(self, "_pre_sql", None)
            if pre_sql:
                payload["pre_sql_rule"] = pre_sql
            
            # Add is_sim only if track_id exists
            if track_id:
                payload["is_sim"] = True
            
            resp_data = self._post_service_json("/object/find", payload)
            # Normalize
            if isinstance(resp_data, dict):
                data_items = list(resp_data.get("items") or [])
                page_size_val = resp_data.get("page_size")
                next_token_val = resp_data.get("next_page_token")
                total_count_val = resp_data.get("total_count")
            else:
                data_items = list(resp_data or [])
                page_size_val = page_size_int
                next_token_val = page_token_int
                total_count_val = None

            # Return backend data as-is (physical columns)
            return _finalize_result(
                list(data_items), 
                page_size_val, 
                next_token_val, 
                total_count_val,
                save_long_data,
                where_sql_final,
                physical_cols,
                where_params,
                order_by,
                track_id
            )
        else:
            # No WHERE provided: allow pure pagination queries
            order_by = kwargs.pop("order_by", None) or kwargs.pop("order_by_column", None)
            _missing = object()
            _page_size_in = kwargs.pop("page_size", _missing)
            page_token = kwargs.pop("page_token", None)
            try:
                page_token_int = int(page_token) if page_token is not None else None
            except Exception:
                page_token_int = None

            # Determine effective page size
            if _page_size_in is _missing:
                page_size_int = 5000
            elif _page_size_in is None:
                page_size_int = None
            else:
                try:
                    page_size_int = int(_page_size_in)
                except Exception:
                    page_size_int = 5000

            # Determine selected columns (physical)
            if isinstance(return_attrs, str):
                physical_cols = return_attrs
            elif return_attrs is None:
                # When return_attrs is None, return all attributes defined in _field_map
                physical_cols = list(self._field_map.values())
            else:
                physical_cols = list(return_attrs)

            # Order by: expect physical columns
            order_by_phys = str(order_by) if order_by else None
            logger.info(f"page_size: {page_size_int}")
            
            # Get track_id to determine if we should add is_sim
            track_id = get_track_id()
            
            payload = {
                "table_name": self._table_name,
                "return_attrs": physical_cols,
                "where_sql": None,
                "where_params": None,
                "order_by": order_by_phys,
                "page_size": page_size_int,
                "page_token": page_token_int,
                "ontology_name": ontology_name,
                "object_type_name": object_type_name,
            }
            
            # Add pre_sql_rule if defined on this object
            pre_sql = getattr(self, "_pre_sql", None)
            if pre_sql:
                payload["pre_sql_rule"] = pre_sql
            
            # Add is_sim only if track_id exists
            if track_id:
                payload["is_sim"] = True
            
            resp_data = self._post_service_json("/object/find", payload)
            # Normalize
            if isinstance(resp_data, dict):
                data_items = list(resp_data.get("items") or [])
                page_size_val = resp_data.get("page_size")
                next_token_val = resp_data.get("next_page_token")
                total_count_val = resp_data.get("total_count")
            else:
                data_items = list(resp_data or [])
                page_size_val = page_size_int
                next_token_val = page_token_int
                total_count_val = None

            # Return backend data as-is (physical columns)
            return _finalize_result(
                list(data_items), 
                page_size_val, 
                next_token_val, 
                total_count_val,
                save_long_data,
                None,
                physical_cols,
                None,
                order_by_phys,
                track_id
            )
            

    # ---------------------------
    # Advanced select with joins and aggregates
    # ---------------------------
    def complex_query(
        self,
        select: Iterable[Union[str, Tuple[str, str]]],
        *,
        where_sql: Optional[str] = None,
        joins_sql: Optional[str] = None,
        group_by: Optional[str] = None,
        having: Optional[str] = None,
        order_by: Optional[str] = None,
        page_size: Optional[Union[int, None]] = 20,
        page_token: Optional[int] = None,
        ontology_maps: Optional[Dict[str, Any]] = None,
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        执行包含 JOIN / 嵌套 / 分组 等复杂查询的通用方法。

        参数:
          - select: 选择的列或表达式集合，可为:
              * 字符串列表: 例如 "COUNT(*) AS total", "Order.amount"
              * (expr, alias) 二元组列表: 例如 ("SUM(Order.amount)", "total_amount")
          - joins_sql: 连接子句（不含 FROM 基表），支持 "LEFT JOIN Order ON Customer.id = Order.customer_id" 等。
          - where_sql: 过滤条件，既可只写条件，也可包含子查询。
          - group_by / having / order_by: 对应 SQL 片段，允许使用本体属性或 Object.Attr 标识。
          - page_size / page_token: 分页；page_size=None 表示不限制，由后端决定。
          - ontology_maps: 跨对象映射，形如 {"object_to_table": {...}, "object_attr_to_col": { (obj, attr): col }}。

        返回:
          - dict: {"items": List[Dict[str, Any]], "page_size": Optional[int], "next_page_token": Optional[str]}

        说明:
          - 本方法会将属性与对象标识替换为物理列与表名，并调用后端 /object/complex_query 执行。
          - 结果列名以显式 alias 为准；若传入原始字符串选择表达式，请自行在表达式中使用 AS 指定别名。
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"

        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object

        # Determine effective page size
        _missing = object()
        _page_size_in = page_size if page_size is not None else _missing
        if _page_size_in is _missing:
            page_size_int = 5000
        else:
            try:
                page_size_int = int(page_size) if page_size is not None else None  # type: ignore[assignment]
            except Exception:
                page_size_int = 5000

        # Build identifier mapping helpers (borrowed from find())
        import re as _re

        enum_literal_map: Dict[str, str] = {
            "StatusClosed": "\u5c01\u95ed",
            "StatusRestricted": "\u9650\u884c",
            "StatusNormal": "\u6b63\u5e38",
        }

        object_to_table: Dict[str, str] = {}
        object_attr_to_col: Dict[Tuple[str, str], str] = {}
        attr_to_cols: Dict[str, List[str]] = {}
        if isinstance(ontology_maps, dict):
            try:
                object_to_table = dict(ontology_maps.get("object_to_table") or {})
                object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
                for (obj, attr), col in object_attr_to_col.items():
                    attr_to_cols.setdefault(attr, [])
                    if col not in attr_to_cols[attr]:
                        attr_to_cols[attr].append(col)
            except Exception:
                object_to_table = {}
                object_attr_to_col = {}
                attr_to_cols = {}

        # Qualify schema for referenced objects (PostgreSQL)
        def _collect_objects_for_schema(sql_text: str) -> List[str]:
            if not sql_text:
                return []
            seen: set[str] = set()
            parts = _re.split(r"('(?:[^'\\]|\\.)*')", str(sql_text))
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    continue
                for m in _re.finditer(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", seg):
                    seen.add(m.group(2))
                for m in _re.finditer(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", seg):
                    seen.add(m.group(1))
            return [o for o in seen if o in (object_to_table or {})]

        def _collect_alias_mapping(sql_text: str) -> Dict[str, str]:
            alias_map: Dict[str, str] = {}
            if not sql_text:
                return alias_map
            parts = _re.split(r"('(?:[^'\\]|\\.)*')", str(sql_text))
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    continue
                for m in _re.finditer(r"(?i)\b(FROM|JOIN)\s+([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*)\b", seg):
                    obj = m.group(2)
                    alias = m.group(3)
                    alias_map[alias] = obj
            return alias_map


        try:
            combined_sql = " ".join(
                [s for s in [str(joins_sql or ""), str(where_sql or ""), str(group_by or ""), str(having or ""), str(order_by or "")]
                 if s]
            )
            objects_in_sql = set(_collect_objects_for_schema(combined_sql))
            for obj_name in sorted(objects_in_sql):
                try:
                    schema_info = self._post_service_json(
                        "/object/schema/find",
                        {"ontology_name": ontology_name, "object_type_name": obj_name},
                    ) or {}
                    dialect = schema_info.get("dialect")
                    schema = schema_info.get("schema")
                    if dialect == "postgresql" and schema:
                        tbl = object_to_table.get(obj_name)
                        if tbl and not str(tbl).startswith(f"{schema}."):
                            object_to_table[obj_name] = f"{schema}.{tbl}"
                except Exception as e:
                    logger.error(f"Error fetching schema for object {obj_name}: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error collecting objects for schema in complex_query: {e}")

        def _replace_schema_qualified_idents(seg: str) -> str:
            def _sub(m: _re.Match[str]) -> str:
                schema = m.group(1)
                obj = m.group(2)
                attr = m.group(3)
                col = object_attr_to_col.get((obj, attr))
                if not col:
                    return m.group(0)
                tbl = object_to_table.get(obj)
                if tbl:
                    return f"{tbl}.{col}"
                return f"{schema}.{obj}.{col}"
            return _re.sub(r"(?<![A-Za-z0-9_])([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.([A-Za-z0-9_\u4e00-\u9fa5]+)(?![A-Za-z0-9_])", _sub, seg)

        def _replace_qualified_idents(seg: str) -> str:
            def _sub(m: _re.Match[str]) -> str:
                obj = m.group(1)
                attr = m.group(2)
                base_obj = _collect_alias_mapping(str(joins_sql or "" )).get(obj, obj)
                col = object_attr_to_col.get((base_obj, attr))
                if not col:
                    return m.group(0)
                # Quote the column name for database compatibility
                quoted_col = self._quote_identifier(col)
                if obj != base_obj:
                    return f"{obj}.{quoted_col}"
                tbl = object_to_table.get(base_obj)
                if tbl:
                    return f"{tbl}.{quoted_col}"
                return quoted_col
            return _re.sub(r"(?<![A-Za-z0-9_])([A-Za-z_][\w]*)\.([A-Za-z0-9_\u4e00-\u9fa5]+)(?![A-Za-z0-9_])", _sub, seg)

        def _replace_from_join_tables(seg: str) -> str:
            def _sub_kw(m: _re.Match[str]) -> str:
                kw = m.group(1)
                obj = m.group(2)
                tbl = object_to_table.get(obj)
                if not tbl:
                    return m.group(0)
                return f"{kw} {tbl}"
            seg2 = _re.sub(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", _sub_kw, seg)
            def _sub_del(m: _re.Match[str]) -> str:
                obj = m.group(1)
                tbl = object_to_table.get(obj)
                return f"DELETE FROM {tbl}" if tbl else m.group(0)
            seg2 = _re.sub(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", _sub_del, seg2)
            return seg2

        def _replace_unqualified_attrs(seg: str) -> str:
            # Prefer this object's fields first
            attrs_sorted_self = sorted(self._field_map.keys(), key=len, reverse=True)
            for a in attrs_sorted_self:
                pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(a)}(?![A-Za-z0-9_])")
                # Quote the column name for database compatibility
                quoted_col = self._quote_identifier(self._field_map[a])
                seg = pat.sub(quoted_col, seg)
            # Then globally-unique attributes
            for attr, cols in attr_to_cols.items():
                if attr in self._field_map:
                    continue
                if len(cols) != 1:
                    continue
                col = cols[0]
                # Quote the column name for database compatibility
                quoted_col = self._quote_identifier(col)
                pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(attr)}(?![A-Za-z0-9_])")
                seg = pat.sub(quoted_col, seg)
            return seg

        def _map_identifiers(sql_text: Optional[str]) -> Optional[str]:
            if not sql_text:
                return None
            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", str(sql_text))
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    out_parts.append(seg)
                else:
                    seg = _replace_schema_qualified_idents(seg)
                    seg = _replace_qualified_idents(seg)
                    seg = _replace_from_join_tables(seg)
                    out_parts.append(seg)
            return "".join(out_parts)

        def _map_literals(sql_text: Optional[str]) -> Optional[str]:
            if not sql_text:
                return None
            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", str(sql_text))
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    quote = seg[0]
                    inner = seg[1:-1]
                    new_inner = enum_literal_map.get(inner, inner)
                    out_parts.append(f"{quote}{new_inner}{quote}")
                else:
                    out_parts.append(seg)
            return "".join(out_parts)

        # Map select expressions (support [expr, alias] or (expr, alias) or plain string)
        mapped_selects: List[str] = []
        for item in list(select or []):
            if (isinstance(item, (tuple, list)) and len(item) == 2):
                expr, alias = item[0], item[1]
                expr_mapped = _map_identifiers(str(expr)) or str(expr)
                alias_escaped = str(alias).replace('"', '""')
                mapped_selects.append(f"{expr_mapped} AS \"{alias_escaped}\"")
            else:
                expr_str = str(item)
                expr_mapped = _map_identifiers(expr_str) or expr_str
                mapped_selects.append(expr_mapped)

        mapped_joins = _map_identifiers(joins_sql)
        mapped_where = _map_literals(_map_identifiers(where_sql))
        mapped_group_by = _map_identifiers(group_by)
        mapped_having = _map_literals(_map_identifiers(having))
        mapped_order_by = _map_identifiers(order_by)

        logger.info(f"page_size: {page_size_int}")
        
        # Get track_id to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "base_table": self._table_name,
            "select_expressions": mapped_selects,
            "joins_sql": mapped_joins,
            "where_sql": mapped_where,
            "group_by_sql": mapped_group_by,
            "having_sql": mapped_having,
            "order_by_sql": mapped_order_by,
            "page_size": page_size_int,
            "page_token": page_token,
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        resp_data = self._post_service_json("/object/complex_query", payload)

        # Normalize response shape
        if isinstance(resp_data, dict):
            data_items = list(resp_data.get("items") or [])
            page_size_val = resp_data.get("page_size")
            next_token_val = resp_data.get("next_page_token")
            total_count_val = resp_data.get("total_count")
        else:
            data_items = list(resp_data or [])
            page_size_val = page_size_int
            next_token_val = page_token
            total_count_val = None
        return {"items": data_items, "page_size": page_size_val, "next_page_token": next_token_val, "total_count": total_count_val}

    def aggregate(
        self,
        aggregations: Iterable[Union[str, Tuple[str, str], Tuple[str, str, str]]],
        *,
        where_sql: Optional[str] = None,
        joins_sql: Optional[str] = None,
        group_by: Optional[str] = None,
        having: Optional[str] = None,
        order_by: Optional[str] = None,
        page_size: Optional[Union[int, None]] = None,
        page_token: Optional[str] = None,
        ontology_maps: Optional[Dict[str, Any]] = None,
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        统一的聚合查询接口。支持 count/sum/avg/min/max/distinct_count 等操作，
        并可结合 joins/group_by/having/order_by。

        参数示例:
          - aggregations=[("count", "*", "total")]
          - aggregations=[("sum", "Order.amount", "sum_amount"), ("count", "*", "cnt")] 
          - aggregations=["COUNT(DISTINCT Customer.id) AS distinct_customers"]

        说明:
          - tuple 形式为 (op, expr_or_attr[, alias])；字符串形式直接作为表达式传递（建议自行带 AS alias）。
          - 未提供 group_by 时默认仅返回一行聚合结果；提供 group_by 时按传入的分页参数返回多行。
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"

        # Normalize select expressions
        selects: List[Union[str, Tuple[str, str]]] = []
        idx_auto = 0
        for item in list(aggregations or []):
            if isinstance(item, str):
                selects.append(item)
                continue
            if not isinstance(item, (tuple, list)) or len(item) not in (2, 3):
                raise ValueError("Each aggregation must be a string or a (op, expr[, alias]) pair")
            op = str(item[0]).strip().lower()
            expr = str(item[1]).strip()
            alias = str(item[2]).strip() if len(item) == 3 else op
            if op == "count":
                expr_sql = "1" if expr in ("*", "", None) else expr
                agg_sql = f"COUNT({expr_sql})"
            elif op == "distinct_count":
                if not expr:
                    raise ValueError("distinct_count requires a non-empty expr")
                agg_sql = f"COUNT(DISTINCT {expr})"
            elif op in ("sum", "avg", "min", "max"):
                if not expr:
                    raise ValueError(f"{op} requires a non-empty expr")
                agg_sql = f"{op.upper()}({expr})"
            else:
                raise ValueError(f"Unsupported aggregation op: {op}")
            if not alias:
                idx_auto += 1
                alias = f"agg_{idx_auto}"
            selects.append((agg_sql, alias))

        # If not grouped, return a single row by default
        effective_page_size: Optional[int]
        if group_by is None:
            effective_page_size = 1
        else:
            try:
                effective_page_size = int(page_size) if page_size is not None else 20
            except Exception:
                effective_page_size = 20

        return self.complex_query(
            select=selects,
            where_sql=where_sql,
            joins_sql=joins_sql,
            group_by=group_by,
            having=having,
            order_by=order_by,
            page_size=effective_page_size,
            page_token=page_token,
            ontology_maps=ontology_maps,
            ontology_name=ontology_name,
            object_type_name=object_type_name,
        )

    def complex_sql(
        self,
        sql: str,
        *,
        ontology_name: str,
        params: Optional[Iterable[Any]] = None,
        page_size: Optional[Union[int, None]] = 20,
        page_token: Optional[int] = None,
        need_total_count: bool = True,
        ontology_maps: Optional[Dict[str, Any]] = None,
        save_long_data: bool = False,
    ) -> Dict[str, Any]:
        """
        执行完整 SQL 的高级查询接口：接受原生 SQL 文本，自动进行 Object / Attr 到表 / 字段映射，
        并支持分页与 total_count（默认开启）。

        仅允许单条 SELECT（含 WITH/CTE），不执行 DDL/DML；请使用 params 传参避免注入。
        """
        if not ontology_name:
            raise ValueError("'ontology_name' is required for complex_sql()")

        # Send SIM callback at the start if is_sim is true
        track_id = get_track_id()
        if track_id:
            start_message = f'complex_sql请求开始:{{"ontology_name": "{ontology_name}"}}'
            self._send_sim_callback(track_id, start_message)

        import re as _re

        enum_literal_map: Dict[str, str] = {
            "StatusClosed": "\u5c01\u95ed",
            "StatusRestricted": "\u9650\u884c",
            "StatusNormal": "\u6b63\u5e38",
        }

        object_to_table: Dict[str, str] = {}
        object_attr_to_col: Dict[Tuple[str, str], str] = {}
        attr_to_cols: Dict[str, List[str]] = {}
        if isinstance(ontology_maps, dict):
            try:
                object_to_table = dict(ontology_maps.get("object_to_table") or {})
                object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
                for (obj, attr), col in object_attr_to_col.items():
                    attr_to_cols.setdefault(attr, [])
                    if col not in attr_to_cols[attr]:
                        attr_to_cols[attr].append(col)
            except Exception:
                object_to_table = {}
                object_attr_to_col = {}
                attr_to_cols = {}
        
        # Debug log for object mapping
        logger.debug(f"complex_sql object_to_table mapping: {object_to_table}")

        def _collect_objects_for_schema(sql_text: str) -> List[str]:
            if not sql_text:
                return []
            seen: set[str] = set()
            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", str(sql_text))
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    continue
                # Match tables after FROM/JOIN/UPDATE/INTO keywords
                for m in _re.finditer(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", seg):
                    seen.add(m.group(2))
                # Match tables after DELETE FROM
                for m in _re.finditer(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", seg):
                    seen.add(m.group(1))
                # Match comma-separated tables (e.g., "FROM table1 a, table2 b")
                # Look for comma followed by a word that's in object_to_table
                for m in _re.finditer(r"(?i),\s+([A-Za-z_][\w]*)\b", seg):
                    candidate = m.group(1)
                    if candidate in (object_to_table or {}):
                        seen.add(candidate)
            return [o for o in seen if o in (object_to_table or {})]

        # Optional: If ontology_maps already contains schema-qualified tables, we use them directly.
        # Otherwise, try to schema-qualify tables for Postgres using object schema service
        try:
            objects_in_sql = set(_collect_objects_for_schema(str(sql)))
            logger.debug(f"Objects found in SQL: {objects_in_sql}")
            for obj_name in sorted(objects_in_sql):
                try:
                    logger.debug(f"Fetching schema for object: {obj_name}")
                    schema_info = self._post_service_json(
                        "/object/schema/find",
                        {"ontology_name": ontology_name, "object_type_name": obj_name},
                    ) or {}
                    dialect = schema_info.get("dialect")
                    schema = schema_info.get("schema")
                    logger.debug(f"Schema info for {obj_name}: dialect={dialect}, schema={schema}")
                    if dialect == "postgresql" and schema:
                        tbl = object_to_table.get(obj_name)
                        if tbl and not str(tbl).startswith(f"{schema}."):
                            old_tbl = tbl
                            object_to_table[obj_name] = f"{schema}.{tbl}"
                            logger.debug(f"Updated {obj_name}: {old_tbl} -> {object_to_table[obj_name]}")
                except Exception as e:
                    logger.error(f"Error fetching schema for object {obj_name}: {e}")
                    continue
            logger.debug(f"Final object_to_table after schema qualification: {object_to_table}")
        except Exception as e:
            logger.error(f"Error collecting objects for schema in complex_sql: {e}")

        def _collect_alias_mapping(sql_text: str) -> Dict[str, str]:
            """Collect alias -> object_name mapping from SQL"""
            alias_map: Dict[str, str] = {}
            if not sql_text:
                return alias_map
            parts = _re.split(r"('(?:[^'\\]|\\.)*')", str(sql_text))
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    continue
                # FROM obj alias (or JOIN obj alias)
                for m in _re.finditer(r"(?i)\b(FROM|JOIN)\s+([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*)\b", seg):
                    obj = m.group(2)
                    alias = m.group(3)
                    # Skip SQL keywords that might be mistaken as alias
                    if alias.upper() not in ('WHERE', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'UNION'):
                        alias_map[alias] = obj
                # FROM schema.obj alias
                for m in _re.finditer(r"(?i)\b(FROM|JOIN)\s+([A-Za-z_][\w]*\.[A-Za-z_][\w]*)\s+([A-Za-z_][\w]*)\b", seg):
                    schema_obj = m.group(2)
                    alias = m.group(3)
                    obj_only = schema_obj.split(".")[-1]
                    if alias.upper() not in ('WHERE', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'UNION'):
                        alias_map[alias] = obj_only
                # FROM obj AS alias
                for m in _re.finditer(r"(?i)\b(FROM|JOIN)\s+([A-Za-z_][\w]*)\s+AS\s+([A-Za-z_][\w]*)\b", seg):
                    obj = m.group(2)
                    alias = m.group(3)
                    alias_map[alias] = obj
                # FROM schema.obj AS alias
                for m in _re.finditer(r"(?i)\b(FROM|JOIN)\s+([A-Za-z_][\w]*\.[A-Za-z_][\w]*)\s+AS\s+([A-Za-z_][\w]*)\b", seg):
                    schema_obj = m.group(2)
                    alias = m.group(3)
                    obj_only = schema_obj.split(".")[-1]
                    alias_map[alias] = obj_only
                # Comma-separated tables: , obj alias
                for m in _re.finditer(r"(?i),\s+([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*)\b", seg):
                    obj = m.group(1)
                    alias = m.group(2)
                    # Only add if obj is in object_to_table and alias is not a keyword
                    if obj in object_to_table and alias.upper() not in ('WHERE', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'UNION'):
                        alias_map[alias] = obj
            return alias_map

        def _collect_object_to_alias_mapping(sql_text: str, alias_to_obj: Dict[str, str]) -> Dict[str, Optional[str]]:
            """Build object_name -> alias (or None) mapping"""
            obj_to_alias: Dict[str, Optional[str]] = {}
            # Reverse the alias_to_obj map
            for alias, obj in alias_to_obj.items():
                obj_to_alias[obj] = alias
            # Find objects without aliases (referenced directly)
            objects_in_sql_set = set(_collect_objects_for_schema(str(sql_text)))
            for obj in objects_in_sql_set:
                if obj not in obj_to_alias:
                    obj_to_alias[obj] = None  # No alias
            return obj_to_alias

        alias_to_object_map = _collect_alias_mapping(str(sql))
        object_to_alias_map = _collect_object_to_alias_mapping(str(sql), alias_to_object_map)

        # No attribute validation for complex_sql; caller must use physical column names
        import re as _re

        def _replace_schema_qualified_idents(seg: str) -> str:
            # Do not map schema.object.attr -> leave attributes untouched
            return seg

        def _replace_qualified_idents(seg: str) -> str:
            # Do not map alias.attr/object.attr -> leave attributes untouched
            return seg

        def _replace_from_join_tables(seg: str) -> str:
            def _sub_kw(m: _re.Match[str]) -> str:
                kw = m.group(1)
                obj = m.group(2)
                tbl = object_to_table.get(obj)
                if not tbl:
                    return m.group(0)
                return f"{kw} {tbl}"
            # First handle FROM/JOIN/UPDATE/INTO followed by table name
            seg2 = _re.sub(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", _sub_kw, seg)
            
            # Then handle comma-separated tables (e.g., "FROM table1 a, table2 b")
            # This is a simpler approach: replace any table name in object_to_table that appears
            # after a comma in a FROM/JOIN context
            def _sub_comma_table(m: _re.Match[str]) -> str:
                obj = m.group(1)
                tbl = object_to_table.get(obj)
                if not tbl:
                    return m.group(0)
                return f", {tbl}"
            # Match: comma, whitespace, table_name (that's in our mapping)
            # Use a callback to check if it's a known table
            for obj_name in sorted(object_to_table.keys(), key=len, reverse=True):
                # Match comma followed by the object name (word boundary)
                pattern = rf"(?i),(\s+){_re.escape(obj_name)}\b"
                replacement = f",\\1{object_to_table[obj_name]}"
                seg2 = _re.sub(pattern, replacement, seg2)
            
            # Handle DELETE FROM
            def _sub_del(m: _re.Match[str]) -> str:
                obj = m.group(1)
                tbl = object_to_table.get(obj)
                return f"DELETE FROM {tbl}" if tbl else m.group(0)
            seg2 = _re.sub(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", _sub_del, seg2)
            return seg2

        def _replace_unqualified_attrs(seg: str) -> str:
            attrs_sorted_self = sorted((getattr(self, "_field_map", {}) or {}).keys(), key=len, reverse=True)
            for a in attrs_sorted_self:
                try:
                    pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(a)}(?![A-Za-z0-9_])")
                    col_name = getattr(self, "_field_map", {}).get(a)
                    if col_name:
                        # Quote the column name for database compatibility
                        quoted_col = self._quote_identifier(col_name)
                        seg = pat.sub(quoted_col, seg)
                except Exception:
                    pass
            for attr, cols in attr_to_cols.items():
                if attr in (getattr(self, "_field_map", {}) or {}):
                    continue
                if len(cols) != 1:
                    continue
                col = cols[0]
                try:
                    # Quote the column name for database compatibility
                    quoted_col = self._quote_identifier(col)
                    pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(attr)}(?![A-Za-z0-9_])")
                    seg = pat.sub(quoted_col, seg)
                except Exception:
                    pass
            return seg

        def _map_identifiers(sql_text: str) -> str:
            text = sql_text or ""
            if not text:
                return text
            parts = _re.split(r"('(?:[^'\\]|\\.)*')", text)
            def _replace_segment(seg: str) -> str:
                if not seg:
                    return seg
                # Only replace FROM/JOIN/UPDATE/INTO object names to schema-qualified tables
                seg = _replace_from_join_tables(seg)
                return seg
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    out_parts.append(seg)
                else:
                    out_parts.append(_replace_segment(seg))
            return "".join(out_parts)

        def _map_literals(sql_text: str) -> str:
            if not sql_text:
                return sql_text
            parts = _re.split(r"('(?:[^'\\]|\\.)*')", sql_text)
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    quote = seg[0]
                    inner = seg[1:-1]
                    new_inner = enum_literal_map.get(inner, inner)
                    out_parts.append(f"{quote}{new_inner}{quote}")
                else:
                    out_parts.append(seg)
            return "".join(out_parts)

        try:
            mapped_sql = _map_identifiers(str(sql))
            mapped_sql = _map_literals(mapped_sql)
        except Exception:
            mapped_sql = str(sql)

        try:
            page_token_int = int(page_token) if page_token is not None else None
        except Exception:
            page_token_int = None

        # Determine a representative object_type_name for backend (first referenced object)
        try:
            objects_in_sql_for_backend = _collect_objects_for_schema(str(sql))
            object_type_name_for_backend = objects_in_sql_for_backend[0] if objects_in_sql_for_backend else None
        except Exception:
            object_type_name_for_backend = None

        # Build object_rules: new architecture that uses object name as key
        # This avoids conflicts when multiple objects map to the same physical table
        object_rules: Dict[str, Dict[str, Any]] = {}
        table_pre_sql_rules: Dict[str, str] = {}  # Keep for backward compatibility
        try:
            if ontology_name and object_to_table:
                # Collect objects actually referenced in the SQL
                objects_in_sql_set = set(_collect_objects_for_schema(str(sql)))
                
                # Only process objects that are actually used in the SQL
                for obj_name in sorted(objects_in_sql_set):
                    # Skip if object not in mapping
                    if obj_name not in object_to_table:
                        continue
                        
                    try:
                        # Dynamically import the object class
                        import importlib
                        module_path = f"core.ontology.{ontology_name}.objects.{obj_name}"
                        mod = importlib.import_module(module_path)
                        
                        # Find the class (prefer same name as object, else first OntologyObject subclass)
                        cls_candidate = None
                        if hasattr(mod, obj_name):
                            cand = getattr(mod, obj_name)
                            try:
                                if isinstance(cand, type) and issubclass(cand, OntologyObject):
                                    cls_candidate = cand
                            except Exception:
                                pass
                        
                        if cls_candidate is None:
                            for n in dir(mod):
                                c = getattr(mod, n)
                                try:
                                    if isinstance(c, type) and issubclass(c, OntologyObject):
                                        cls_candidate = c
                                        break
                                except Exception:
                                    continue
                        
                        if cls_candidate is not None:
                            inst = cls_candidate()
                            pre_sql = getattr(inst, "_pre_sql", None)
                            table_name = object_to_table.get(obj_name)
                            alias = object_to_alias_map.get(obj_name)
                            
                            # Build new object_rules structure
                            if table_name:
                                object_rules[obj_name] = {
                                    "table_name": table_name,
                                    "pre_sql": pre_sql,
                                    "alias": alias
                                }
                            
                            # Keep backward compatibility: add to table_pre_sql_rules
                            # Only if pre_sql exists and table not already in rules
                            if pre_sql and table_name:
                                if table_name not in table_pre_sql_rules:
                                    table_pre_sql_rules[table_name] = pre_sql
                    except Exception as e:
                        # Best effort: if we can't import/inspect, continue
                        logger.debug(f"Could not get pre_sql for object {obj_name}: {e}")
                        continue
                
                logger.debug(f"Built object_rules: {object_rules}")
        except Exception as e:
            logger.debug(f"Error building object_rules: {e}")

        # Get track_id to determine if we should add is_sim
        track_id = get_track_id()

        payload = {
            "raw_sql": mapped_sql,
            "params": list(params or []),
            "page_size": page_size,
            "page_token": page_token_int,
            "need_total_count": bool(need_total_count),
            "ontology_name": ontology_name,
            "object_type_name": object_type_name_for_backend,
        }
        
        # Add object_rules (new architecture) if any were collected
        if object_rules:
            payload["object_rules"] = object_rules
        
        # Add table_pre_sql_rules for backward compatibility
        if table_pre_sql_rules:
            payload["table_pre_sql_rules"] = table_pre_sql_rules
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        resp_data = self._post_service_json("/object/complex_sql", payload)

        if isinstance(resp_data, dict):
            data_items = list(resp_data.get("items") or [])
            page_size_val = resp_data.get("page_size")
            next_token_val = resp_data.get("next_page_token")
            total_count_val = resp_data.get("total_count")
        else:
            data_items = list(resp_data or [])
            page_size_val = page_size
            next_token_val = page_token_int
            total_count_val = None

        def _finalize_result(
            items: Any,
            page_size_out: Optional[int],
            next_token_out: Optional[Union[int, str]],
            total_count_out: Optional[int],
            enable_save_long_data: bool = False,
            track_id_val: Optional[str] = None,
        ) -> Dict[str, Any]:
            warning_msg = "查询结果数据较大，请使用分页逐步查询完所有数据"
            message = "查询成功"
            result_items = items
            is_large_data = False
            download_url = None
            
            try:
                char_limit = 8000
                count_limit = 1000
                
                # 检查字符数是否超过限制
                if isinstance(items, list):
                    total_chars = len(str(items))
                    if total_chars > char_limit:
                        is_large_data = True
                else:
                    if len(str(items)) > char_limit:
                        is_large_data = True
                
                # 检查数据条数是否超过限制
                if isinstance(total_count_out, int) and total_count_out > count_limit:
                    is_large_data = True
                elif isinstance(items, list) and len(items) > count_limit:
                    is_large_data = True
                
                # 如果数据量过大且启用了保存功能
                if is_large_data and enable_save_long_data:
                    # 1. 保存本地CSV文件
                    if isinstance(items, list):
                        csv_filename, csv_file_path = save_large_result_to_csv(items)
                        result_items = items[:3]  # 返回前3条作为样本
                        message = f"查询结果数据量过大（共{len(items)}条数据），已将全量数据转存为临时CSV文件：{csv_file_path}，当前返回前3条数据作为样本预览。如果本次查询的结果需要作为下一步逻辑/动作的输入参数，请使用ontology_python_exec工具通过代码访问本地csv文件（你不用通过链接来访问，链接是给用户用的）并将结果存为变量，再使用变量作为逻辑/动作的入参进行执行."
                    
                    # 2. 同时启动minio异步导出
                    try:
                        from core.runtime.helpers import get_async_export_service
                        import threading
                        from datetime import datetime
                        
                        export_service = get_async_export_service()
                        
                        timestamp = int(datetime.now().timestamp() * 1000)
                        filename = f"{ontology_name}_{timestamp}.csv"
                        download_url = export_service.generate_download_url(ontology_name, filename)
                        
                        def _export_large_data():
                            try:
                                def fetch_page(page_token):
                                    fetch_payload = {
                                        "raw_sql": mapped_sql,
                                        "params": list(params or []),
                                        "page_size": 1000,
                                        "page_token": page_token,
                                        "need_total_count": False,
                                        "ontology_name": ontology_name,
                                        "object_type_name": object_type_name_for_backend,
                                    }
                                    # Add table_pre_sql_rules if available from outer scope
                                    if table_pre_sql_rules:
                                        fetch_payload["table_pre_sql_rules"] = table_pre_sql_rules
                                    # Add is_sim if track_id exists (use track_id_val from _finalize_result parameter)
                                    if track_id_val:
                                        fetch_payload["is_sim"] = True
                                    return self._post_service_json("/object/complex_sql", fetch_payload)
                                
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                url = loop.run_until_complete(
                                    export_service.export_large_dataset_async(
                                        fetch_page_func=fetch_page,
                                        ontology_name=ontology_name,
                                        total_count=total_count_out,
                                        page_size=1000,
                                        predefined_filename=filename,
                                        predefined_temp_file_path=None
                                    )
                                )
                                loop.close()
                                
                                if url:
                                    logger.info(f"Large data export completed: {url}")
                            except Exception as e:
                                logger.error(f"Background export failed: {e}")
                        
                        thread = threading.Thread(target=_export_large_data, daemon=True)
                        thread.start()
                        
                        message += f" 已启动异步导出任务，所有数据将导出为CSV文件并上传到MinIO，下载链接：{download_url}。"
                    except Exception as e:
                        logger.error(f"Failed to start async export: {e}")
                    
                    # message += " 如果本次查询的结果需要作为下一步逻辑/动作的输入参数，请使用ontology_python_exec工具通过代码访问csv文件并将结果存为变量，再使用变量作为逻辑/动作的入参进行执行"
                elif isinstance(total_count_out, int) and isinstance(page_size_out, int) and total_count_out/page_size_out > 1:
                    message = warning_msg
                    
            except Exception:
                pass
            
            result = {
                "items": result_items,
                "page_size": page_size_out,
                "next_page_token": next_token_out,
                "total_count": total_count_out,
                "message": message,
                "is_long_result": is_large_data,
            }
            
            if download_url:
                result["download_url"] = download_url
            
            # Send SIM callback at the end if is_sim is true
            if track_id_val:
                end_message = f'complex_sql请求结束:{{"ontology_name": "{ontology_name}"}}'
                self._send_sim_callback(track_id_val, end_message)
            
            return result
            
        return _finalize_result(data_items, page_size_val, next_token_val, total_count_val, save_long_data, track_id)

    # ---------------------------
    # Mutations by primary key
    # ---------------------------
    def _get_primary_key_column(self, allow_none: bool = False) -> Tuple[Optional[str], Optional[str]]:
        """
        Resolve the primary key ontology attribute and physical column name.
        Falls back to "id" if not explicitly set and present in field map.
        
        Args:
            allow_none: If True, returns (None, None) when no primary key is found.
                       If False (default), raises KeyError when no primary key is found.
        
        Returns:
            Tuple of (ontology_attribute, physical_column) or (None, None) if allow_none=True and no PK found.
        """
        if not self._table_name or not self._field_map:
            raise ValueError("Subclass must define _table_name and _field_map")
        if self._primary_key_attr:
            pk_attr = self._primary_key_attr
            if pk_attr not in self._field_map:
                available = ", ".join(sorted(self._field_map.keys()))
                raise KeyError(f"Primary key attribute '{pk_attr}' not in field map. Available: {available}")
            return pk_attr, self._field_map[pk_attr]
        # Fallback to common default
        # if "id" in self._field_map:
        #     return "id", self._field_map["id"]
        # If no primary key found
        if allow_none:
            return None, None
        available = ", ".join(sorted(self._field_map.keys()))
        raise KeyError(f"Primary key attribute is not configured. Set _primary_key_attr or include 'id' in field map. Available: {available}")

    def _normalize_input_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize input data to use ontology attribute names.
        Supports both ontology attribute names and physical column names as input.
        
        Args:
            data: Dictionary with keys that can be either ontology attributes or physical column names
            
        Returns:
            Dictionary with all keys normalized to ontology attribute names
            
        Raises:
            KeyError: If a key is neither an ontology attribute nor a physical column name
        """
        if not self._field_map:
            raise ValueError("Subclass must define _field_map")
        
        # Build reverse mapping: physical_column -> ontology_attr
        reverse_map = {col: attr for attr, col in self._field_map.items()}
        
        normalized_data = {}
        for key, value in data.items():
            if key in self._field_map:
                # Key is already an ontology attribute name
                normalized_data[key] = value
            elif key in reverse_map:
                # Key is a physical column name, convert to ontology attribute
                normalized_data[reverse_map[key]] = value
            else:
                # Key is neither
                available_attrs = ", ".join(sorted(self._field_map.keys()))
                available_cols = ", ".join(sorted(reverse_map.keys()))
                raise KeyError(
                    f"Unknown key '{key}'. "
                    f"Available ontology attributes: {available_attrs}. "
                    f"Available physical columns: {available_cols}"
                )
        
        return normalized_data

    def update_by_pk(
        self,
        pk_value: Any,
        updates: Dict[str, Any],
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> int:
        """
        Update a single row identified by primary key with provided values.

        Args:
            pk_value: Primary key value
            updates: Mapping of ontology attributes (or physical column names) to new values (excluding the primary key)

        Returns:
            Number of affected rows (0 or 1)
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        if not isinstance(updates, dict) or not updates:
            raise ValueError("'updates' must be a non-empty dict of ontology attributes or column names to values")
        
        # Normalize input to use ontology attribute names
        normalized_updates = self._normalize_input_data(updates)
        
        pk_attr, pk_column = self._get_primary_key_column()
        if pk_attr in normalized_updates:
            raise ValueError("Updating the primary key is not allowed")
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object
        
        # Map ontology update keys -> physical columns
        physical_updates: Dict[str, Any] = {}
        for ont_attr, value in normalized_updates.items():
            physical_updates[self._field_map[ont_attr]] = value

        # Get track_id first to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "table_name": self._table_name,
            "primary_key_column": pk_column,
            "pk_value": pk_value,
            "pk_values": None,
            "updates": physical_updates,
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        data = self._post_service_json("/object/update", payload)
        
        # Log change tracking information
        try:
            affected_rows = int((data or {}).get("affected_rows", 0))
            changes = (data or {}).get("changes", [])
            
            if track_id and changes:
                logger.info(f"[TRACK_ID: {track_id}] Update operation on {self.__class__.__name__}")
                logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                
                for idx, change_record in enumerate(changes, 1):
                    pk_info = change_record.get("primary_key", {})
                    fields = change_record.get("fields", {})
                    
                    logger.info(f"[TRACK_ID: {track_id}] Change #{idx} - Primary Key: {pk_info}")
                    
                    for field_name, field_change in fields.items():
                        before_val = field_change.get("before")
                        after_val = field_change.get("after")
                        logger.info(
                            f"[TRACK_ID: {track_id}]   Field '{field_name}': "
                            f"{before_val!r} -> {after_val!r}"
                        )
                
                # Send change log to audit service
                full_data = (data or {}).get("full_data")
                self._send_change_log(
                    track_id=track_id,
                    operation_type="UPDATE",
                    object_type_name=object_type_name,
                    affected_rows=affected_rows,
                    record_count_before=None,
                    record_count_after=None,
                    change_details={"changes": changes, "full_data": full_data},
                )
            elif track_id and affected_rows > 0:
                # If no changes returned but rows were affected
                logger.info(
                    f"[TRACK_ID: {track_id}] Update operation on {self.__class__.__name__} "
                    f"affected {affected_rows} row(s), but no change details returned"
                )
            
            return affected_rows
        except Exception as e:
            logger.error(f"Error logging update changes: {e}")
            try:
                return int((data or {}).get("affected_rows", 0))
            except Exception:
                return 0

    def update(
        self,
        pk_values: Iterable[Any],
        updates: Dict[str, Any],
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
        *,
        where_sql: Optional[str] = None,
        where_params: Optional[Iterable[Any]] = None,
        ontology_maps: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Batch update rows by primary keys or by a WHERE clause.

        Behavior:
          - If `pk_values` is non-empty, updates rows whose PK is in that list.
          - If `pk_values` is empty (or None) and `where_sql` is provided, performs
            a WHERE-based update using the same identifier/literal mapping rules as `find()`.
          - If both are empty/missing, no-op (returns 0).

        Args:
            pk_values: Iterable of primary key values
            updates: Mapping of ontology attributes (or physical column names) to new values (excluding the primary key)
            where_sql: Optional raw WHERE SQL (ontology attrs allowed; will be mapped to physical columns)
            where_params: Optional parameters for the WHERE SQL (positional)
            ontology_maps: Optional cross-ontology mapping for identifier replacement
            ontology_name: Optional ontology name for downstream service
            object_type_name: Optional object type for downstream service

        Returns:
            Number of affected rows
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        values_list = list(pk_values or [])
        
        if not isinstance(updates, dict) or not updates:
            raise ValueError("'updates' must be a non-empty dict of ontology attributes or column names to values")
        
        # Normalize input to use ontology attribute names
        normalized_updates = self._normalize_input_data(updates)
        
        pk_attr, pk_column = self._get_primary_key_column()
        if pk_attr in normalized_updates:
            raise ValueError("Updating the primary key is not allowed")
        
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object
        
        # Map ontology update keys -> physical columns
        physical_updates: Dict[str, Any] = {}
        for ont_attr, value in normalized_updates.items():
            physical_updates[self._field_map[ont_attr]] = value

        # If PK list provided, prefer PK-based batch update
        if values_list:
            # Get track_id first to determine if we should add is_sim
            track_id = get_track_id()
            
            payload = {
                "table_name": self._table_name,
                "primary_key_column": pk_column,
                "pk_value": None,
                "pk_values": values_list,
                "updates": physical_updates,
                "ontology_name": ontology_name,
                "object_type_name": object_type_name,
            }
            
            # Add is_sim only if track_id exists
            if track_id:
                payload["is_sim"] = True
            
            data = self._post_service_json("/object/update", payload)
            
            # Log change tracking information
            try:
                affected_rows = int((data or {}).get("affected_rows", 0))
                changes = (data or {}).get("changes", [])
                
                if track_id and changes:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Batch update (by PK) on {self.__class__.__name__}"
                    )
                    logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                    logger.info(f"[TRACK_ID: {track_id}] Total changes: {len(changes)}")
                    
                    for idx, change_record in enumerate(changes, 1):
                        pk_info = change_record.get("primary_key", {})
                        fields = change_record.get("fields", {})
                        
                        logger.info(f"[TRACK_ID: {track_id}] Change #{idx} - Primary Key: {pk_info}")
                        
                        for field_name, field_change in fields.items():
                            before_val = field_change.get("before")
                            after_val = field_change.get("after")
                            logger.info(
                                f"[TRACK_ID: {track_id}]   Field '{field_name}': "
                                f"{before_val!r} -> {after_val!r}"
                            )
                    
                    # Send change log to audit service
                    full_data = (data or {}).get("full_data")
                    self._send_change_log(
                        track_id=track_id,
                        operation_type="UPDATE",
                        object_type_name=object_type_name,
                        affected_rows=affected_rows,
                        record_count_before=None,
                        record_count_after=None,
                        change_details={"changes": changes, "full_data": full_data},
                    )
                elif track_id and affected_rows > 0:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Batch update (by PK) on {self.__class__.__name__} "
                        f"affected {affected_rows} row(s), but no change details returned"
                    )
                
                return affected_rows
            except Exception as e:
                logger.error(f"Error logging batch update changes: {e}")
                try:
                    return int((data or {}).get("affected_rows", 0))
                except Exception:
                    return 0

        # Otherwise, allow WHERE-based updates similar to find()
        if where_sql is None or str(where_sql).strip() == "":
            return 0

        # Build identifier mapping helpers (mirrors logic in find())
        import re as _re

        enum_literal_map: Dict[str, str] = {
            "StatusClosed": "\u5c01\u95ed",
            "StatusRestricted": "\u9650\u884c",
            "StatusNormal": "\u6b63\u5e38",
        }

        object_to_table: Dict[str, str] = {}
        object_attr_to_col: Dict[Tuple[str, str], str] = {}
        attr_to_cols: Dict[str, List[str]] = {}
        if isinstance(ontology_maps, dict):
            try:
                object_to_table = dict(ontology_maps.get("object_to_table") or {})
                object_attr_to_col = dict(ontology_maps.get("object_attr_to_col") or {})  # type: ignore[assignment]
                for (obj, attr), col in object_attr_to_col.items():
                    attr_to_cols.setdefault(attr, [])
                    if col not in attr_to_cols[attr]:
                        attr_to_cols[attr].append(col)
            except Exception:
                object_to_table = {}
                object_attr_to_col = {}
                attr_to_cols = {}

        def _replace_qualified_idents(seg: str) -> str:
            def _sub(m: _re.Match[str]) -> str:
                obj = m.group(1)
                attr = m.group(2)
                col = object_attr_to_col.get((obj, attr))
                if col:
                    # Quote the column name for database compatibility
                    return self._quote_identifier(col)
                return m.group(0)
            return _re.sub(r"(?<![A-Za-z0-9_])([A-Za-z_][\w]*)\.([A-Za-z0-9_\u4e00-\u9fa5]+)(?![A-Za-z0-9_])", _sub, seg)

        def _replace_from_join_tables(seg: str) -> str:
            def _sub_kw(m: _re.Match[str]) -> str:
                kw = m.group(1)
                obj = m.group(2)
                tbl = object_to_table.get(obj)
                if not tbl:
                    return m.group(0)
                return f"{kw} {tbl}"
            seg2 = _re.sub(r"(?i)\b(FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][\w]*)\b", _sub_kw, seg)
            def _sub_del(m: _re.Match[str]) -> str:
                obj = m.group(1)
                tbl = object_to_table.get(obj)
                return f"DELETE FROM {tbl}" if tbl else m.group(0)
            seg2 = _re.sub(r"(?i)\bDELETE\s+FROM\s+([A-Za-z_][\w]*)\b", _sub_del, seg2)
            return seg2

        def _replace_unqualified_attrs(seg: str) -> str:
            attrs_sorted_self = sorted(self._field_map.keys(), key=len, reverse=True)
            for a in attrs_sorted_self:
                pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(a)}(?![A-Za-z0-9_])")
                # Quote the column name for database compatibility
                quoted_col = self._quote_identifier(self._field_map[a])
                seg = pat.sub(quoted_col, seg)
            for attr, cols in attr_to_cols.items():
                if attr in self._field_map:
                    continue
                if len(cols) != 1:
                    continue
                col = cols[0]
                # Quote the column name for database compatibility
                quoted_col = self._quote_identifier(col)
                pat = _re.compile(rf"(?<![A-Za-z0-9_\.]){_re.escape(attr)}(?![A-Za-z0-9_])")
                seg = pat.sub(quoted_col, seg)
            return seg

        def _map_identifiers(sql_text: str) -> str:
            text = sql_text or ""
            if not text:
                return text
            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", text)
            def _replace_segment(seg: str) -> str:
                if not seg:
                    return seg
                seg = _replace_from_join_tables(seg)
                seg = _replace_qualified_idents(seg)
                seg = _replace_unqualified_attrs(seg)
                return seg
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    out_parts.append(seg)
                else:
                    out_parts.append(_replace_segment(seg))
            return "".join(out_parts)

        def _map_literals(sql_text: str) -> str:
            if not sql_text:
                return sql_text
            parts = _re.split(r"('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")", sql_text)
            out_parts: List[str] = []
            for idx, seg in enumerate(parts):
                if idx % 2 == 1:
                    quote = seg[0]
                    inner = seg[1:-1]
                    new_inner = enum_literal_map.get(inner, inner)
                    out_parts.append(f"{quote}{new_inner}{quote}")
                else:
                    out_parts.append(seg)
            return "".join(out_parts)

        where_sql_final = _map_identifiers(str(where_sql).strip())
        where_sql_final = _map_literals(where_sql_final)
        if not where_sql_final:
            where_sql_final = "1=1"

        # Get track_id first to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "table_name": self._table_name,
            "primary_key_column": None,
            "pk_value": None,
            "pk_values": None,
            "updates": physical_updates,
            "where_sql": where_sql_final,
            "where_params": list(where_params or []),
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        data = self._post_service_json("/object/update", payload)
        
        # Log change tracking information
        try:
            affected_rows = int((data or {}).get("affected_rows", 0))
            changes = (data or {}).get("changes", [])
            
            if track_id and changes:
                logger.info(
                    f"[TRACK_ID: {track_id}] Batch update (by WHERE) on {self.__class__.__name__}"
                )
                logger.info(f"[TRACK_ID: {track_id}] WHERE clause: {where_sql_final}")
                logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                logger.info(f"[TRACK_ID: {track_id}] Total changes: {len(changes)}")
                
                for idx, change_record in enumerate(changes, 1):
                    pk_info = change_record.get("primary_key", {})
                    fields = change_record.get("fields", {})
                    
                    logger.info(f"[TRACK_ID: {track_id}] Change #{idx} - Primary Key: {pk_info}")
                    
                    for field_name, field_change in fields.items():
                        before_val = field_change.get("before")
                        after_val = field_change.get("after")
                        logger.info(
                            f"[TRACK_ID: {track_id}]   Field '{field_name}': "
                            f"{before_val!r} -> {after_val!r}"
                        )
                
                # Send change log to audit service
                full_data = (data or {}).get("full_data")
                self._send_change_log(
                    track_id=track_id,
                    operation_type="UPDATE",
                    object_type_name=object_type_name,
                    affected_rows=affected_rows,
                    record_count_before=None,
                    record_count_after=None,
                    change_details={"changes": changes, "full_data": full_data},
                )
            elif track_id and affected_rows > 0:
                logger.info(
                    f"[TRACK_ID: {track_id}] Batch update (by WHERE) on {self.__class__.__name__} "
                    f"affected {affected_rows} row(s), but no change details returned"
                )
            
            return affected_rows
        except Exception as e:
            logger.error(f"Error logging batch update changes: {e}")
            try:
                return int((data or {}).get("affected_rows", 0))
            except Exception:
                return 0

    def delete_by_pk(
        self,
        pk_value: Any,
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> int:
        """
        Delete a single row identified by primary key.

        Args:
            pk_value: Primary key value

        Returns:
            Number of affected rows (0 or 1)
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object
        _, pk_column = self._get_primary_key_column()
        
        # Get track_id first to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "table_name": self._table_name,
            "primary_key_column": pk_column,
            "pk_value": pk_value,
            "pk_values": None,
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        data = self._post_service_json("/object/delete", payload)
        
        # Log change tracking information
        try:
            affected_rows = int((data or {}).get("affected_rows", 0))
            changes = (data or {}).get("changes")
            
            if track_id and changes:
                count_before = changes.get("count_before")
                count_after = changes.get("count_after")
                deleted_records = changes.get("deleted_records", [])
                
                logger.info(f"[TRACK_ID: {track_id}] Delete operation on {self.__class__.__name__}")
                logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                
                if count_before is not None and count_after is not None:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Record count: {count_before} -> {count_after}"
                    )
                
                if deleted_records:
                    logger.info(f"[TRACK_ID: {track_id}] Deleted {len(deleted_records)} record(s):")
                    for idx, record in enumerate(deleted_records, 1):
                        logger.info(f"[TRACK_ID: {track_id}] Deleted record #{idx}:")
                        for field_name, field_value in record.items():
                            logger.info(f"[TRACK_ID: {track_id}]   {field_name}: {field_value!r}")
                
                # Send change log to audit service
                self._send_change_log(
                    track_id=track_id,
                    operation_type="DELETE",
                    object_type_name=object_type_name,
                    affected_rows=affected_rows,
                    record_count_before=count_before,
                    record_count_after=count_after,
                    change_details={"deleted_records": deleted_records, "full_data": deleted_records},
                )
            elif track_id and affected_rows > 0:
                logger.info(
                    f"[TRACK_ID: {track_id}] Delete operation on {self.__class__.__name__} "
                    f"affected {affected_rows} row(s), but no change details returned"
                )
            
            return affected_rows
        except Exception as e:
            logger.error(f"Error logging delete changes: {e}")
            try:
                return int((data or {}).get("affected_rows", 0))
            except Exception:
                return 0

    def delete_many_by_pk(
        self,
        pk_values: Iterable[Any],
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> int:
        """
        Batch delete rows identified by a list of primary key values.

        Args:
            pk_values: Iterable of primary key values

        Returns:
            Number of affected rows
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object
        values_list = list(pk_values or [])
        if not values_list:
            return 0
        _, pk_column = self._get_primary_key_column()
        
        # Get track_id first to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "table_name": self._table_name,
            "primary_key_column": pk_column,
            "pk_value": None,
            "pk_values": values_list,
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        data = self._post_service_json("/object/delete", payload)
        
        # Log change tracking information
        try:
            affected_rows = int((data or {}).get("affected_rows", 0))
            changes = (data or {}).get("changes")
            
            if track_id and changes:
                count_before = changes.get("count_before")
                count_after = changes.get("count_after")
                deleted_records = changes.get("deleted_records", [])
                
                logger.info(
                    f"[TRACK_ID: {track_id}] Batch delete operation on {self.__class__.__name__}"
                )
                logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                
                if count_before is not None and count_after is not None:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Record count: {count_before} -> {count_after}"
                    )
                
                if deleted_records:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Deleted {len(deleted_records)} record(s):"
                    )
                    for idx, record in enumerate(deleted_records, 1):
                        logger.info(f"[TRACK_ID: {track_id}] Deleted record #{idx}:")
                        for field_name, field_value in record.items():
                            logger.info(f"[TRACK_ID: {track_id}]   {field_name}: {field_value!r}")
                
                # Send change log to audit service
                self._send_change_log(
                    track_id=track_id,
                    operation_type="DELETE",
                    object_type_name=object_type_name,
                    affected_rows=affected_rows,
                    record_count_before=count_before,
                    record_count_after=count_after,
                    change_details={"deleted_records": deleted_records, "full_data": deleted_records},
                )
            elif track_id and affected_rows > 0:
                logger.info(
                    f"[TRACK_ID: {track_id}] Batch delete operation on {self.__class__.__name__} "
                    f"affected {affected_rows} row(s), but no change details returned"
                )
            
            return affected_rows
        except Exception as e:
            logger.error(f"Error logging batch delete changes: {e}")
            try:
                return int((data or {}).get("affected_rows", 0))
            except Exception:
                return 0

    # ---------------------------
    # Create (insert) new instance
    # ---------------------------
    def create(
        self,
        data: Dict[str, Any],
        ontology_name: Optional[str] = None,
        object_type_name: Optional[str] = None,
    ) -> int:
        """
        Insert a new row using ontology attribute names or physical column names.

        Behavior:
          - If primary key value is provided in 'data', check existence first and
            raise ValueError if it already exists.
          - If primary key is omitted, the DB's default/auto behavior applies
            (e.g., AUTO_INCREMENT id on relation tables). If the table requires a
            non-null PK without default, the DB will raise an error.
          - For objects without a primary key (e.g., intermediate tables in many-to-many
            relationships), the method will still work properly.

        Args:
          data: Mapping of ontology attributes (or physical column names) to values to insert.

        Returns:
          Number of affected rows (1 on success).
        """
        # Short-circuit: no bound data source
        if getattr(self, "_table_name", None) in (None, ""):
            return "该对象未绑定数据源，无法执行增删改查操作，请先绑定数据源"
        if not self._table_name or not self._field_map:
            raise ValueError("Subclass must define _table_name and _field_map")
        if not isinstance(data, dict) or not data:
            raise ValueError("'data' must be a non-empty dict of ontology attributes or column names to values")
        
        # Normalize input to use ontology attribute names
        normalized_data = self._normalize_input_data(data)
        
        if ontology_name is None or object_type_name is None:
            inferred_ontology, inferred_object = self._infer_ontology_and_object()
            if ontology_name is None:
                ontology_name = inferred_ontology
            if object_type_name is None:
                object_type_name = inferred_object
        # Resolve PK info (allow None for intermediate tables without primary keys)
        pk_attr, pk_column = self._get_primary_key_column(allow_none=True)

        # Map ontology attrs to physical columns
        physical_data: Dict[str, Any] = {}
        for ont_attr, value in normalized_data.items():
            physical_data[self._field_map[ont_attr]] = value

        # Get track_id first to determine if we should add is_sim
        track_id = get_track_id()
        
        payload = {
            "table_name": self._table_name,
            "data": physical_data,
            # Provide PK column so service can perform optional existence check when PK value present
            # For tables without primary keys (e.g., intermediate tables), pk_column will be None
            "primary_key_column": pk_column if (pk_attr and pk_attr in normalized_data and normalized_data.get(pk_attr) is not None) else None,
            "ontology_name": ontology_name,
            "object_type_name": object_type_name,
        }
        
        # Add is_sim only if track_id exists
        if track_id:
            payload["is_sim"] = True
        
        resp = self._post_service_json("/object/create", payload)
        
        # Log change tracking information
        try:
            affected_rows = int((resp or {}).get("affected_rows", 0))
            changes = (resp or {}).get("changes")
            
            if track_id and changes:
                count_before = changes.get("count_before")
                count_after = changes.get("count_after")
                inserted_record = changes.get("inserted_record", {})
                
                logger.info(f"[TRACK_ID: {track_id}] Create operation on {self.__class__.__name__}")
                logger.info(f"[TRACK_ID: {track_id}] Affected rows: {affected_rows}")
                
                if count_before is not None and count_after is not None:
                    logger.info(
                        f"[TRACK_ID: {track_id}] Record count: {count_before} -> {count_after}"
                    )
                
                if inserted_record:
                    logger.info(f"[TRACK_ID: {track_id}] Inserted record:")
                    for field_name, field_value in inserted_record.items():
                        logger.info(f"[TRACK_ID: {track_id}]   {field_name}: {field_value!r}")
                
                # Send change log to audit service
                full_data = (resp or {}).get("full_data")
                self._send_change_log(
                    track_id=track_id,
                    operation_type="CREATE",
                    object_type_name=object_type_name,
                    affected_rows=affected_rows,
                    record_count_before=count_before,
                    record_count_after=count_after,
                    change_details={"inserted_record": inserted_record, "full_data": full_data},
                )
            elif track_id and affected_rows > 0:
                logger.info(
                    f"[TRACK_ID: {track_id}] Create operation on {self.__class__.__name__} "
                    f"affected {affected_rows} row(s), but no change details returned"
                )
            
            return affected_rows
        except Exception as e:
            logger.error(f"Error logging create changes: {e}")
            try:
                return int((resp or {}).get("affected_rows", 0))
            except Exception:
                return 0

"""
用户友好的本体操作辅助函数

这个模块提供简化的 API 接口，让用户在代码编辑器中可以方便地调用本体相关功能，
无需手动管理 ontology_maps 等内部参数。

使用示例:
    from core.runtime.helpers import complex_sql
    
    result = complex_sql(
        ontology_name="my_ontology",
        sql="SELECT * FROM MyObject WHERE MyObject.field = %s",
        params=["value"]
    )
"""

from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import importlib


def _collect_ontology_maps(ontology_name: str) -> Dict[str, Any]:
    """
    收集指定本体的对象映射信息（对象->表名，属性->字段名等）
    
    Returns:
        包含以下键的字典:
        - object_to_table: Dict[str, str] - 对象名到表名的映射
        - object_attr_to_col: Dict[Tuple[str, str], str] - (对象名, 属性名)到字段名的映射
        - attr_sets: Dict[str, set] - 对象名到其属性集合的映射
    """
    from core.runtime.base import OntologyObject
    
    maps: Dict[str, Any] = {
        "object_to_table": {},
        "object_attr_to_col": {},
        "attr_sets": {},
    }
    
    if not ontology_name:
        return maps
    
    obj_dir = Path(f"core/ontology/{ontology_name}/objects")
    if not obj_dir.exists():
        return maps
    
    for py_file in obj_dir.iterdir():
        if not py_file.is_file() or not py_file.name.endswith(".py"):
            continue
        module_name = py_file.stem
        # 跳过 __init__ 或私有模块
        if module_name.startswith("__"):
            continue
        
        try:
            module_path = f"core.ontology.{ontology_name}.objects.{module_name}"
            module = importlib.import_module(module_path)
        except Exception:
            continue
        
        # 查找所有 OntologyObject 子类
        candidates = []
        for attr_name in dir(module):
            try:
                obj = getattr(module, attr_name)
                if isinstance(obj, type) and issubclass(obj, OntologyObject) and obj is not OntologyObject:
                    candidates.append(obj)
            except Exception:
                continue
        
        for cls_obj in candidates:
            try:
                inst = cls_obj()
                table = getattr(inst, "_table_name", None)
                field_map = getattr(inst, "_field_map", None) or {}
                
                if isinstance(table, str) and isinstance(field_map, dict) and field_map:
                    cls_name = cls_obj.__name__
                    
                    # 同时映射模块名和类名到表名
                    if module_name not in maps["object_to_table"]:
                        maps["object_to_table"][module_name] = table
                    maps["object_to_table"][cls_name] = table
                    
                    # 记录属性集合
                    maps["attr_sets"][module_name] = set(field_map.keys())
                    maps["attr_sets"][cls_name] = set(field_map.keys())
                    
                    # 建立(对象名, 属性名)到字段名的映射
                    for attr, col in field_map.items():
                        maps["object_attr_to_col"][(module_name, attr)] = col
                        maps["object_attr_to_col"][(cls_name, attr)] = col
            except Exception:
                continue
    
    return maps


def complex_sql(
    ontology_name: str,
    sql: str,
    params: Optional[List[Any]] = None,
    page_size: Optional[int] = None,
    page_token: Optional[int] = None,
    need_total_count: bool = True,
    save_long_data: bool = False,
) -> Dict[str, Any]:
    """
    执行复杂的原生 SQL 查询，用于更灵活、复杂的查询场景。
    
    这是一个简化的接口，用户只需要提供本体名和 SQL 即可，
    无需手动管理 ontology_maps 等内部参数。
    
    Args:
        ontology_name: 本体英文名
        sql: 完整的 SQL 查询语句（仅支持 SELECT，支持 WITH/CTE/子查询/窗口函数/多 JOIN 等）
             - 表名位置可使用"本体对象名"（系统会自动映射到物理表名）
             - 列名必须使用物理字段名（可通过 check_attr_mapping 获取映射关系）
             - 查询的属性需要带有对象前缀，避免解析错误
        params: 可选，与 SQL 中 %s 占位符一一对应的参数列表（建议使用参数化查询避免 SQL 注入）
        page_size: 可选，分页大小。如果不指定，默认为 5000 条/页
        page_token: 可选，分页标记（从 0 开始）
        need_total_count: 是否需要返回总数，默认 True
        save_long_data: 是否保存大数据量结果到文件，默认 False。
                       设置为 True 时，当查询结果数据量过大时，会自动保存到 CSV 文件并返回下载链接
    
    Returns:
        包含以下键的字典:
        - items: List[Dict] - 查询结果列表
        - page_size: int - 当前页大小
        - next_page_token: Optional[int] - 下一页标记，None 表示没有下一页
        - total_count: int - 总记录数（如果 need_total_count=True）
        - download_url: Optional[str] - 下载链接（当数据量过大且 save_long_data=True 时）
    
    使用示例:
        # 简单查询
        result = complex_sql(
            ontology_name="my_ontology",
            sql="SELECT Customer.cust_id, Customer.name FROM Customer"
        )
        
        # 带参数的查询
        result = complex_sql(
            ontology_name="my_ontology",
            sql="SELECT Customer.cust_id FROM Customer WHERE Customer.status = %s",
            params=["active"]
        )
        
        # 复杂的 CTE 查询
        result = complex_sql(
            ontology_name="my_ontology",
            sql=\"\"\"
                WITH recent AS (
                    SELECT Order.order_id, Order.customer_id 
                    FROM Order 
                    WHERE Order.order_date >= CURRENT_DATE - INTERVAL '30 days'
                )
                SELECT Customer.customer_id, Customer.name, COUNT(recent.order_id) AS cnt
                FROM Customer
                LEFT JOIN recent ON Customer.customer_id = recent.customer_id
                GROUP BY Customer.customer_id, Customer.name
                ORDER BY cnt DESC
            \"\"\",
            page_size=50
        )
    
    注意:
        - SQL 必须是单条 SELECT 语句（可以包含 WITH/CTE）
        - 不支持 DDL/DML 操作
        - 建议使用 params 参数进行参数化查询，避免 SQL 注入
        - 在执行前，建议先调用 check_attr_mapping 获取属性到字段名的映射关系
    """
    from core.runtime.base import OntologyObject
    
    if not ontology_name:
        raise ValueError("'ontology_name' 参数不能为空")
    
    if not sql or not sql.strip():
        raise ValueError("'sql' 参数不能为空")
    
    # 自动收集本体映射信息
    ontology_maps = _collect_ontology_maps(ontology_name)
    
    # 创建 OntologyObject 实例并调用 complex_sql
    inst = OntologyObject()
    return inst.complex_sql(
        sql=sql,
        ontology_name=ontology_name,
        params=params,
        page_size=page_size,
        page_token=page_token,
        need_total_count=need_total_count,
        ontology_maps=ontology_maps,
        save_long_data=save_long_data,
    )


def check_attr_mapping(
    ontology_name: str,
    object_names: List[str]
) -> Dict[str, Any]:
    """
    获取指定对象的属性映射信息（属性名 -> 物理字段名，以及主键信息等）
    
    在执行 complex_sql 之前，建议先调用此函数获取属性到字段名的映射关系，
    以便在 SQL 中使用正确的物理字段名。
    
    Args:
        ontology_name: 本体英文名
        object_names: 对象名列表
    
    Returns:
        包含以下键的字典:
        - objects: Dict[str, Dict] - 每个对象的映射信息
            - table_name: str - 物理表名
            - primary_keys: List[str] - 主键字段列表
            - fields: Dict[str, str] - 属性名到物理字段名的映射
    
    使用示例:
        mapping = check_attr_mapping(
            ontology_name="my_ontology",
            object_names=["Customer", "Order"]
        )
        
        # 查看 Customer 对象的映射
        customer_fields = mapping["objects"]["Customer"]["fields"]
        # 输出: {"name": "cust_name", "status": "cust_status", ...}
        
        # 使用映射信息构造 SQL
        sql = f"SELECT Customer.{customer_fields['name']} FROM Customer"
    """
    from core.runtime.base import OntologyObject
    
    if not ontology_name:
        raise ValueError("'ontology_name' 参数不能为空")
    
    if not object_names:
        raise ValueError("'object_names' 参数不能为空")
    
    # 自动收集本体映射信息
    ontology_maps = _collect_ontology_maps(ontology_name)
    
    # 调用 check_attr_mapping
    inst = OntologyObject()
    return inst.check_attr_mapping(
        object_names=list(object_names),
        ontology_name=ontology_name,
        ontology_maps=ontology_maps
    )


def find(
    ontology_name: str,
    object_name: str,
    return_attrs: Optional[Any] = None,
    page_size: Optional[int] = None,
    page_token: Optional[int] = None,
    save_long_data: bool = False,
    **conditions
) -> Any:
    """
    简化的查询接口，查询指定对象的数据
    
    Args:
        ontology_name: 本体英文名
        object_name: 对象名
        return_attrs: 可选，返回的属性列表。可以是:
            - None: 返回所有属性
            - str: 返回单个属性的值列表
            - List[str]: 返回指定属性的字典列表
        page_size: 可选，分页大小。如果不指定，默认为 5000 条/页
        page_token: 可选，分页标记
        save_long_data: 是否保存大数据量结果到文件，默认 False
        **conditions: 查询条件，以属性名=值的形式传递
    
    Returns:
        根据 return_attrs 的不同:
        - return_attrs=None: List[Dict[str, Any]] - 包含所有属性的字典列表
        - return_attrs=str: List[Any] - 单个属性的值列表
        - return_attrs=List[str]: List[Dict[str, Any]] - 包含指定属性的字典列表
    
    使用示例:
        # 查询所有客户
        customers = find(
            ontology_name="my_ontology",
            object_name="Customer"
        )
        
        # 查询特定条件的客户
        active_customers = find(
            ontology_name="my_ontology",
            object_name="Customer",
            status="active"
        )
        
        # 只返回特定属性
        customer_names = find(
            ontology_name="my_ontology",
            object_name="Customer",
            return_attrs="name"
        )
        
        # 分页查询
        result = find(
            ontology_name="my_ontology",
            object_name="Customer",
            page_size=20,
            page_token=0
        )
    """
    if not ontology_name:
        raise ValueError("'ontology_name' 参数不能为空")
    
    if not object_name:
        raise ValueError("'object_name' 参数不能为空")
    
    # 自动收集本体映射信息
    ontology_maps = _collect_ontology_maps(ontology_name)
    
    # 获取对象实例
    try:
        module_path = f"core.ontology.{ontology_name}.objects.{object_name}"
        module = importlib.import_module(module_path)
        
        # 尝试获取类
        if hasattr(module, object_name):
            cls = getattr(module, object_name)
            inst = cls()
        else:
            raise ImportError(f"对象类 '{object_name}' 未找到")
    except Exception as e:
        raise ImportError(f"无法加载对象 '{object_name}': {e}")
    
    # 调用 find 方法
    return inst.find(
        return_attrs=return_attrs,
        ontology_name=ontology_name,
        ontology_maps=ontology_maps,
        object_type_name=object_name,
        save_long_data=save_long_data,
        page_size=page_size,
        page_token=page_token,
        **conditions
    )


# =============================================================================
# MinIO 存储服务
# =============================================================================

import os
import csv
import asyncio
import tempfile
import json
from datetime import datetime
from public.public_variable import logger
from public.public_function import get_config


class MinIOService:
    """MinIO对象存储服务"""
    
    def __init__(self):
        self._client = None
        self._config = None
        self._initialized = False
    
    def _get_config(self):
        """获取MinIO配置"""
        if self._config is None:
            try:
                # 从服务端获取配置
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_closed():
                        raise RuntimeError("Event loop is closed")
                    # 检查事件循环是否正在运行
                    if loop.is_running():
                        # 事件循环正在运行，使用线程来执行异步代码
                        import concurrent.futures
                        import threading
                        
                        result_container = []
                        error_container = []
                        
                        def run_in_thread():
                            try:
                                new_loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(new_loop)
                                result = new_loop.run_until_complete(get_config('ontology_minio_info'))
                                result_container.append(result)
                                new_loop.close()
                            except Exception as e:
                                error_container.append(e)
                        
                        thread = threading.Thread(target=run_in_thread)
                        thread.start()
                        thread.join(timeout=35)  # 等待最多35秒
                        
                        if error_container:
                            raise error_container[0]
                        if not result_container:
                            raise TimeoutError("获取MinIO配置超时")
                        config_str = result_container[0]
                    else:
                        # 事件循环未运行，可以直接使用
                        config_str = loop.run_until_complete(get_config('ontology_minio_info'))
                except RuntimeError:
                    # 没有事件循环或事件循环已关闭，创建新的
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    config_str = loop.run_until_complete(get_config('ontology_minio_info'))
                
                # 解析JSON配置
                config_dict = json.loads(config_str)
                # logger.info(f"MinIO配置: {config_dict}")
                # 转换为配置对象
                class MinIOConfig:
                    def __init__(self, config_dict):
                        self.enabled = True
                        # 移除协议前缀，因为Minio客户端不需要
                        host = config_dict.get('host', '')
                        self.endpoint = host.replace('http://', '').replace('https://', '')
                        self.access_key = config_dict.get('access_key', '')
                        self.secret_key = config_dict.get('secret_key', '')
                        self.bucket_name = config_dict.get('bucket', '')
                        self.secure = config_dict.get('secure', False)
                        self.region = None
                        self.download_url_prefix = config_dict.get('download_url_prefix', '').rstrip('/')
                
                self._config = MinIOConfig(config_dict)
                # logger.info(f"已从服务端获取MinIO配置: {self._config.endpoint}")
            except Exception as e:
                logger.error(f"获取MinIO配置失败: {e}")
                # 创建默认的禁用配置
                class DisabledConfig:
                    def __init__(self):
                        self.enabled = False
                        self.endpoint = ''
                        self.access_key = ''
                        self.secret_key = ''
                        self.bucket_name = ''
                        self.secure = False
                        self.region = None
                        self.download_url_prefix = ''
                
                self._config = DisabledConfig()
        return self._config
    
    def _get_client(self):
        """获取MinIO客户端"""
        if self._client is None:
            try:
                from minio import Minio as MinioClient
                config = self._get_config()
                
                if not config.enabled:
                    raise ValueError("MinIO is not enabled in configuration")
                
                self._client = MinioClient(
                    endpoint=config.endpoint,
                    access_key=config.access_key,
                    secret_key=config.secret_key,
                    secure=config.secure,
                    region=config.region
                )
                self._initialized = True
                logger.info(f"MinIO客户端已初始化: {config.endpoint}")
            except ImportError:
                logger.exception("minio包未安装，请使用以下命令安装: pip install minio")
                raise
            except Exception as e:
                logger.exception(f"初始化MinIO客户端失败: {e}")
                raise
        return self._client
    
    def _ensure_bucket(self):
        """确保bucket存在"""
        try:
            client = self._get_client()
            config = self._get_config()
            
            buckets = client.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            
            if config.bucket_name not in bucket_names:
                client.make_bucket(config.bucket_name)
                logger.info(f"已创建MinIO存储桶: {config.bucket_name}")
        except Exception as e:
            logger.exception(f"确保存储桶存在失败: {e}")
            raise
    
    def upload_file(self, local_file_path: str, minio_file_path: str, object_name: str) -> str:
        """
        上传文件到MinIO
        
        Args:
            local_file_path: 本地文件路径
            minio_file_path: MinIO文件路径（如：/open/ontology/本体名称/tempdata）
            object_name: MinIO对象名称
        
        Returns:
            下载URL
        """
        try:
            client = self._get_client()
            config = self._get_config()
            
            self._ensure_bucket()
            
            # MinIO对象名：移除前导斜杠
            minio_object_name = f"{minio_file_path}/{object_name}".lstrip('/')
            
            client.fput_object(
                bucket_name=config.bucket_name,
                object_name=minio_object_name,
                file_path=local_file_path
            )
            
            # 生成下载URL时添加斜杠
            download_url = f"{config.download_url_prefix}/{minio_object_name}"
            logger.info(f"文件已上传到MinIO: {minio_object_name}")
            
            return download_url
        except Exception as e:
            logger.exception(f"上传文件到MinIO失败: {e}")
            raise
    
    def is_enabled(self) -> bool:
        """检查MinIO是否启用"""
        try:
            config = self._get_config()
            return config.enabled
        except Exception:
            return False


class AsyncDataExportService:
    """异步数据导出服务"""
    
    def __init__(self):
        self.minio_service = MinIOService()
    
    def create_temp_csv_file(self, ontology_name: str) -> str:
        """
        创建临时CSV文件并返回文件路径
        
        Args:
            ontology_name: 本体名称
        
        Returns:
            临时文件路径
        """
        timestamp = int(datetime.now().timestamp() * 1000)
        filename = f"{ontology_name}_{timestamp}.csv"
        temp_file_path = tempfile.mktemp(suffix='.csv')
        
        with open(temp_file_path, mode='w', newline='', encoding='utf-8-sig') as csv_file:
            pass
        
        logger.info(f"已创建临时文件: {temp_file_path}")
        return temp_file_path
    
    def generate_download_url(self, ontology_name: str, filename: str) -> str:
        """
        生成MinIO下载URL，无需实际上传文件
        
        Args:
            ontology_name: 本体名称
            filename: 文件名
        
        Returns:
            下载URL
        """
        config = self.minio_service._get_config()
        minio_file_path = f"/open/ontology/{ontology_name}/tempdata"
        # MinIO对象名：移除前导斜杠
        minio_object_name = f"{minio_file_path}/{filename}".lstrip('/')
        # 生成下载URL时添加斜杠
        download_url = f"{config.download_url_prefix}/{minio_object_name}"
        return download_url
    
    async def export_large_dataset_async(
        self,
        fetch_page_func,
        ontology_name: str,
        total_count: int,
        page_size: int = 1000,
        predefined_filename: Optional[str] = None,
        predefined_temp_file_path: Optional[str] = None
    ) -> Optional[str]:
        """
        异步导出大数据集到CSV，边查询边写文件，避免内存溢出
        
        Args:
            fetch_page_func: 分页查询函数，接受page_token参数，返回查询结果
            ontology_name: 本体名称
            total_count: 总数据量
            page_size: 每页大小
            predefined_filename: 预定义的文件名，如果提供则使用该文件名
            predefined_temp_file_path: 预定义的临时文件路径，如果提供则使用该路径
        
        Returns:
            下载URL
        """
        if not self.minio_service.is_enabled():
            logger.warning("MinIO未启用，跳过异步导出")
            return None
        
        temp_file_path = predefined_temp_file_path
        csv_file = None
        writer = None
        fieldnames = None
        records_count = 0
        
        try:
            if predefined_filename:
                filename = predefined_filename
            else:
                timestamp = int(datetime.now().timestamp() * 1000)
                filename = f"{ontology_name}_{timestamp}.csv"
            
            logger.info(f"开始异步导出{ontology_name}，总记录数: {total_count}")
            
            page_token = 0
            first_page = True
            
            while True:
                result = await asyncio.get_event_loop().run_in_executor(
                    None, fetch_page_func, page_token
                )
                
                if not result or not isinstance(result, dict):
                    break
                
                items = result.get('items', [])
                if not items:
                    break
                
                if first_page:
                    first_page = False
                    fieldnames = list(items[0].keys()) if items else []
                    
                    if not temp_file_path:
                        temp_file_path = tempfile.mktemp(suffix='.csv')
                    csv_file = open(temp_file_path, mode='w', newline='', encoding='utf-8-sig')
                    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                    writer.writeheader()
                
                if writer:
                    writer.writerows(items)
                    csv_file.flush()
                
                records_count += len(items)
                
                next_page_token = result.get('next_page_token')
                if next_page_token is None:
                    break
                
                page_token = next_page_token
                
                logger.info(f"Fetched and wrote {records_count}/{total_count} records")
            
            if csv_file:
                csv_file.close()
            
            if records_count == 0:
                logger.warning("未获取到导出数据")
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                return None
            
            minio_file_path = f"/open/ontology/{ontology_name}/tempdata"
            download_url = self.minio_service.upload_file(temp_file_path, minio_file_path, filename)
            
            # if temp_file_path and os.path.exists(temp_file_path):
            #     os.unlink(temp_file_path)
            
            logger.info(f"异步导出完成: {download_url}, 总记录数: {records_count}")
            return download_url
            
        except Exception as e:
            logger.exception(f"异步导出大数据集失败: {e}")
            if csv_file:
                try:
                    csv_file.close()
                except:
                    pass
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            return None


# 全局服务实例
_async_export_service: Optional[AsyncDataExportService] = None


def get_async_export_service() -> AsyncDataExportService:
    """获取异步导出服务实例"""
    global _async_export_service
    if _async_export_service is None:
        _async_export_service = AsyncDataExportService()
    return _async_export_service


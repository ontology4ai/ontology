import json
import csv
import random
import string
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List
import os
import aiohttp
from public.public_variable import logger
import ssl

def _cleanup_expired_csv_files(temp_dir: Path, max_age_minutes: int = 30) -> None:
    """
    清理超过指定时间的CSV文件。
    
    Args:
        temp_dir: temp目录路径
        max_age_minutes: 文件最大存活时间（分钟），默认30分钟
    """
    if not temp_dir.exists():
        return
    
    now = datetime.now()
    for filepath in temp_dir.glob("*.csv"):
        try:
            file_mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
            if now - file_mtime > timedelta(minutes=max_age_minutes):
                filepath.unlink()
                logger.info(f"已删除过期的临时CSV文件: {filepath.name}")
        except Exception as e:
            logger.warning(f"清理临时文件失败: {filepath.name}, 错误: {e}")


def save_large_result_to_csv(items: List[Dict[str, Any]]) -> str:
    """
    将大数据量结果保存为CSV文件到temp目录。
    
    Args:
        items: 查询结果列表
        
    Returns:
        保存的CSV文件名
    """
    # 确保temp目录存在
    temp_dir = Path(__file__).parent.parent / "temp"
    temp_dir.mkdir(exist_ok=True)
    
    # 先清理过期的CSV文件
    _cleanup_expired_csv_files(temp_dir)
    
    # 生成精确到秒的时间戳 + 3个随机字符的文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=3))
    filename = f"{timestamp}_{random_chars}.csv"
    filepath = temp_dir / filename
    
    # 写入CSV文件
    if items and isinstance(items, list) and len(items) > 0:
        # 获取所有可能的字段名
        if isinstance(items[0], dict):
            fieldnames = list(items[0].keys())
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for item in items:
                    writer.writerow(item)
        else:
            # 如果不是字典列表，直接写入单列
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['value'])
                for item in items:
                    writer.writerow([item])
    else:
        # 空数据情况
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            csvfile.write('')
    
    return filename, filepath


async def get_config(config_name: str, timeout: int = 30) -> str:
    """
    从服务端异步获取配置项信息
    
    Args:
        config_name: 配置项名称
        timeout: 请求超时时间（秒），默认30秒
        
    Returns:
        str: 配置项的值（config_value）
        
    Raises:
        ValueError: 当配置项不存在或请求失败时抛出
        aiohttp.ClientError: 当HTTP请求出错时抛出
    """
    # 构造服务端地址，参考 base.py 的方式
    base_url = (
        f"{os.getenv('NET_GATE', 'http://localhost:9080')}/"
        f"{os.getenv('ONTOLOGY_BACKEND_SERVER', 'ontology_backend_server')}"
    ).rstrip("/")
    
    url = f"{base_url}/api/v1/ontology/config/get"
    
    # 构造请求体
    payload = {"config_name": config_name}
    
    try:
        logger.info(f"正在获取配置项: {config_name}")
        
        # 使用 aiohttp 发送异步请求
        timeout_obj = aiohttp.ClientTimeout(total=timeout)
        
        # 创建 SSL context，跳过证书验证
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(timeout=timeout_obj, connector=connector) as session:
            async with session.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.text()
                result = json.loads(response_data)
                
                # 检查响应状态
                if result.get("status") == "success" and result.get("code") == "200":
                    config_value = result.get("data", {}).get("config_value")
                    logger.info(f"成功获取配置项 '{config_name}'")
                    return config_value
                else:
                    # 处理失败响应
                    message = result.get("message", "未知错误")
                    logger.error(f"获取配置项失败: {message}")
                    raise ValueError(f"获取配置项 '{config_name}' 失败: {message}")
                    
    except aiohttp.ClientError as e:
        error_msg = f"HTTP请求错误: {e}"
        logger.error(f"获取配置项 '{config_name}' 时发生HTTP错误: {error_msg}")
        raise
    except json.JSONDecodeError as e:
        error_msg = f"JSON解析失败: {e}"
        logger.error(f"解析配置项响应时出错: {error_msg}")
        raise ValueError(error_msg)
    except Exception as e:
        logger.error(f"获取配置项 '{config_name}' 时发生未知错误: {e}")
        raise

def extract_json(text):
    import re
    # 匹配被 ```json 和 ``` 包围的内容（修正正则表达式）
    pattern = r"```json(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)
    
    results = []
    for match in matches:
        try:
            # 去除首尾空白并解析
            cleaned = match.strip()
            json_data = json.loads(cleaned)
            results.append(json_data)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON解析失败: {e}，内容：{cleaned}")
        except Exception as e:
            logger.error(f"意外错误: {e}")
    
    # 如果没有匹配到代码块，尝试直接解析整个文本
    if not results:
        try:
            results.append(json.loads(text.strip()))
        except:
            pass
    
    return results


def export_to_minio(
    data: List[Dict[str, Any]], 
    ontology_name: str,
    filename: str = None
) -> Dict[str, Any]:
    """
    将数据导出到MinIO并返回下载链接。
    
    该函数用于在ontology_python_exec中将大量数据转存到MinIO存储，
    避免直接返回大数据量导致的性能问题。
    
    Args:
        data: 要导出的数据列表，每个元素为字典
        ontology_name: 本体名称，用于构造MinIO存储路径
        filename: 可选的文件名，如果不提供则自动生成（格式：{ontology_name}_{timestamp}.csv）
        
    Returns:
        包含导出结果的字典：
        {
            "success": bool,           # 是否成功
            "download_url": str,       # MinIO下载链接（成功时）
            "filename": str,           # 文件名（成功时）
            "records_count": int,      # 导出的记录数（成功时）
            "message": str,            # 状态消息
            "error": str               # 错误信息（失败时）
        }
        
    Raises:
        ValueError: 当数据格式不正确时
        
    Example:
        >>> data = [{"id": 1, "name": "张三"}, {"id": 2, "name": "李四"}]
        >>> result = export_to_minio(data, "my_ontology")
        >>> print(result["download_url"])
        https://minio.example.com/open/ontology/my_ontology/tempdata/my_ontology_1234567890.csv
    """
    import tempfile
    
    # 参数验证
    if not isinstance(data, list):
        return {
            "success": False,
            "error": "data参数必须是列表类型",
            "message": "数据格式错误"
        }
    
    if not data:
        return {
            "success": False,
            "error": "data列表为空，无数据可导出",
            "message": "无数据"
        }
    
    if not isinstance(ontology_name, str) or not ontology_name.strip():
        return {
            "success": False,
            "error": "ontology_name必须是非空字符串",
            "message": "参数错误"
        }
    
    try:
        # 导入MinIO服务
        from core.runtime.helpers import get_async_export_service
        
        export_service = get_async_export_service()
        
        # 检查MinIO是否启用
        if not export_service.minio_service.is_enabled():
            return {
                "success": False,
                "error": "MinIO服务未启用，无法导出数据",
                "message": "MinIO未启用"
            }
        
        # 生成文件名
        if not filename:
            timestamp = int(datetime.now().timestamp() * 1000)
            filename = f"{ontology_name}_{timestamp}.csv"
        else:
            # 检查并修正文件名后缀
            if not filename.lower().endswith('.csv'):
                # 移除原有后缀（如果有）并添加 .csv
                if '.' in filename:
                    filename = filename.rsplit('.', 1)[0] + '.csv'
                else:
                    filename = filename + '.csv'
        
        # 创建临时CSV文件
        temp_file_path = tempfile.mktemp(suffix='.csv')
        
        try:
            # 写入CSV文件
            if not isinstance(data[0], dict):
                return {
                    "success": False,
                    "error": "data列表中的元素必须是字典类型",
                    "message": "数据格式错误"
                }
            
            fieldnames = list(data[0].keys())
            
            with open(temp_file_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            
            logger.info(f"已创建临时CSV文件: {temp_file_path}，记录数: {len(data)}")
            
            # 上传到MinIO
            minio_file_path = f"/open/ontology/{ontology_name}/tempdata"
            download_url = export_service.minio_service.upload_file(
                temp_file_path, 
                minio_file_path, 
                filename
            )
            
            logger.info(f"数据已成功导出到MinIO: {download_url}")
            
            return {
                "success": True,
                "download_url": download_url,
                "filename": filename,
                "records_count": len(data),
                "message": f"成功导出 {len(data)} 条记录到MinIO"
            }
            
        finally:
            # 清理临时文件
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    logger.debug(f"已删除临时文件: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"删除临时文件失败: {temp_file_path}, 错误: {e}")
    
    except ImportError as e:
        return {
            "success": False,
            "error": f"导入MinIO服务失败: {str(e)}",
            "message": "服务导入错误"
        }
    except Exception as e:
        logger.exception(f"导出到MinIO时发生错误: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "导出失败"
        }
import json
from public.public_variable import logger
import os
import aiohttp
import ssl

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
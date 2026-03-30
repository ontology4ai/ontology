import json
from public.public_variable import logger

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
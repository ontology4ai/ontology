"""
通过 FastAPI 自动导出 OpenAPI 规范文件（openapi.json）
运行方式：python export_openapi.py
"""

from app import app
import json

if __name__ == "__main__":
    # 获取 FastAPI 自动生成的 OpenAPI 规范
    openapi_schema = app.openapi()
    # 保存到项目根目录
    with open("openapi.json", "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, ensure_ascii=False, indent=2)
    print("已通过 FastAPI 自动导出 openapi.json 到项目根目录")

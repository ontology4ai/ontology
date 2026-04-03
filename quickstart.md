# 🚀 快速开始指南

本指南将帮助你在 5 分钟内完成环境配置、服务启动与首次查询。

## ✅ 前置要求
- Docker 20.10+ & Docker Compose V2
- 内存32GB，200GB 可用磁盘

## 📥 1. 克隆项目
```bash
git lfs install
git clone https://github.com/ontology4ai/ontology.git
# 若克隆后大文件仍是指针（未下载实际内容）
cd <项目目录>
git lfs fetch --all
git lfs checkout

cd ontology
🐳 2. Docker 一键启动（推荐）
# 修改.env环境变量

默认已经给出一份.env环境变量配置，原则上您不需要做任何改动可以一键启动
如果您有特殊的需要，请谨慎修改.env文件
常见的环境变量配置

# 构建并启动所有服务
docker compose up -d

# 查看服务日志
docker compose logs -f 服务名

🔍 3. 验证安装
通过浏览器，访问http://localhost:9080/_common_/login
默认用户名/密码：admin/admin
 
📦 4. 智能体平台
本体提供了标准的提示词输出和MCP SERVER输出，如果想要执行，需要依托于智能体平台，推荐以下智能体平台，该部分不在本次开源范围内，请自行选择

| 中间件名称 | 版本要求 | 启动方式 | 来源 | 是否必选 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AAP** | >= 1.0 | Docker | 官方镜像 | ❌ 否 | 亚信自有智能体平台 |
| **Dify** | >= 1.9.0 | Docker | 官方镜像 | ❌ 否 | dify智能体平台 |


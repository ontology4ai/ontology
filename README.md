
# Asiainfo Ontology (数智本体平台)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)]()

**Asiainfo Ontology** 是一个企业级的数智本体管理平台。它提供了从本体设计、发布、服务化到图谱交互的全生命周期管理能力。本项目开源了核心管理态、数据网关、图谱API服务以及沙箱开发环境，助力开发者快速构建基于本体的数据智能应用。

> **注意**：本项目为开源版本，部分高级特性（如数据集成、任务调度、高级仿真等）属于企业版特性，未在此仓库中提供。

## 📖 目录

- [核心功能](#核心功能)
- [项目架构与模块](#项目架构与模块)
- [技术栈](#技术栈)
- [环境依赖](#环境依赖)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [开源协议](#开源协议)

---

## ✨ 核心功能

*   **本体全生命周期管理**：支持本体的设计、发布、服务化及仿真（基础版）。
*   **统一数据网关**：提供标准化的数据访问与路由能力。
*   **图谱交互服务**：提供图谱数据的导入导出及核心查询API。
*   **在线开发沙箱**：基于 VS Code Web 版，提供本体 MCP 及 API 服务的在线开发与调试环境。
*   **数据源管理**：支持多数据源连接、数据处理与查询。

---

## 🏗 项目架构与模块

本项目采用微服务架构，主要包含以下模块。请注意区分**开源模块**与**企业版特性**。

### 2.1 核心模块 (开源)

| 模块名称 | 语言 | 功能描述 | 开源形式 |
| :--- | :--- | :--- | :--- |
| **ontology** | Java | **本体核心管理态**：包括本体设计、发布、服务、基础仿真等。*(注：已移除测试对话、用例运行等模块)* | 源码开源 |
| **common** | Java | **管理台框架**：包括系统管理、菜单管理、认证鉴权等基础能力。 | Jar包开源 |
| **dataps** | Java | **数据服务**：数据源管理、数据处理、数据查询能力。 | Jar包开源 |
| **links** | Java | **统一数据网关**：负责流量的统一接入与路由。 | Jar包开源 |
| **code_gen** | Python | **开发沙箱**：搭载 VS Code Web 版，负责开发和发布沙箱环境，承载本体 MCP 及 API 服务。*(注：已移除 OAG 相关部分)* | 源码开源 |
| **ontology-graph** | Python | **图谱核心服务**：与 Java 管理态互动，提供导入导出、图谱获取等 API。*(注：已移除自动化构建及测试相关功能)* | 源码开源 |
| **ontology-backend** | Python | **后台配置管理**：负责统一后台配置及沙箱服务访问数据源的中间转发。 | 源码开源 |

### 2.2 企业版特性 (未开源)

以下模块为企业版专有功能，不包含在此开源仓库中：
*   **datastash**: 数据集成能力。
*   **dataflow**: 任务调度与任务监控。
*   **ontology-simulation**: 高级本体仿真后台。

---

## 🛠 技术栈

*   **后端框架**: Java (Spring Boot), Python
*   **前端/脚本**: TypeScript, JavaScript
*   **网关**: Apache APISIX
*   **容器化**: Docker, Docker Compose

---

## 📦 环境依赖 (中间件)

项目启动需要依赖部分中间件，在一键启动脚本中已经内置默认版本镜像，如果需要使用已有的服务，请注意版本要求

| 中间件名称 | 版本要求 | 启动方式 | 来源 | 是否必选 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Redis** | >= 5.0 | Docker | 官方镜像 | ✅ 是 | 缓存服务 |
| **MySQL** | >= 5.7 | Docker | 官方镜像 | ✅ 是 | 核心数据库 |
| **APISIX** | - | Docker | 固定镜像包 | ✅ 是 | API 网关 |
| **Code Server** | - | Docker | 固定镜像包 | ✅ 是 | 在线开发环境 |
| **MinIO** | >= 2025.02.07 | Docker | 官方镜像 | ✅ 是 | 对象存储 |
---

## 🚀 快速开始

参考 [快速开始指南](https://github.com/ontology4ai/ontology/blob/main/quickstart.md)

---

## 📂 目录结构

```text
ontology/
├── apisix/              # APISIX 网关配置
├── common/              # 公共组件 (Jar包)
├── dataps/              # 数据处理服务 (Jar包)
├── links/               # 数据网关服务 (Jar包)
├── mysql/init/          # 数据库初始化脚本
├── ontology/            # 本体核心管理服务 (Java源码)
├── ontology-backend/    # 后台配置转发服务 (Python源码)
├── ontology-graph/      # 图谱API服务 (Python源码)
├── ontology-sandbox/    # 沙箱环境相关
├── docker-compose.yml   # Docker 编排文件
└── README.md
```

---

## 📜 开源协议

本项目遵循双重开源协议：
*   **Apache License 2.0**
*   **MIT License**

详情请参阅根目录下的 `LICENSE` 文件。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进本项目。

1.  Fork 本仓库
2.  创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  开启一个 Pull Request
```

```

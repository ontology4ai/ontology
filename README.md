# Asiainfo Ontology (数智本体平台)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)]()

**Asiainfo Ontology Platform** 是一个企业级的数智本体管理平台。平台聚焦**本体全生命周期管理**，提供从语义建模、一键服务化、图谱交互到扩展开发的完整闭环，助力开发者与业务人员快速构建基于本体与知识图谱的数据智能应用。

> **说明**：本项目为开源核心版，聚焦本体建模与服务化能力。数据集成、高级任务调度等企业级增强功能由商业版提供。

## 📖 目录

- [核心能力](#核心能力)
- [开源模块说明](#开源模块说明)
- [技术栈与运行环境](#技术栈与运行环境)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [开源协议](#开源协议)
- [贡献指南](#贡献指南)

---

## ✨ 核心能力

*   **可视化语义建模**：提供图形化本体设计器，支持类、属性、关系、约束及业务规则的直观定义，大幅降低知识建模与图谱构建门槛。
*   **本体服务**：设计完成的本体模型可一键发布，自动转化为标准的 RESTful API 与 MCP（Model Context Protocol）服务，实现“建模即交付，发布即可用”。
*   **图谱数据交互引擎**：内置高性能图谱查询与数据同步服务，支持复杂关系网络的高效检索、批量导入与结构化导出，无缝对接上层 AI 与业务系统。
*   **扩展开发工作台**：集成免配置的云端代码环境，提供本体插件开发、自定义逻辑编写与服务调试的一站式空间，降低二次开发与集成成本。

---

## 🏗 开源模块说明

本项目采用微服务架构，开源版本聚焦核心本体链路：

| 模块名称 | 语言 | 核心职责 |
| :--- | :--- | :--- |
| **ontology** | Java | **本体管理态核心**：语义建模、模型发布、服务路由。 |
| **ontology-graph** | Python | **图谱交互服务**：图谱数据持久化、核心查询 API 与数据导入导出。 |
| **ontology-backend** | Python | **配置与路由中枢**：支撑管理态与底层服务的数据协同与请求转发。 |
| **code_gen** | Python | **扩展开发工作台**：承载自定义逻辑与 API 服务的编写、调试与发布。 |

> 📦 **基础组件说明**：`common`（管理台框架）、`dataps`（数据服务）、`links`（网关路由）等底层支撑模块已以编译包（Jar）形式提供，开箱即用，无需二次编译。

---

---

## 🛠 技术栈与运行环境

### 📦 技术栈

*   **后端框架**: Java (Spring Boot), Python
*   **前端/脚本**: JavaScript
*   **网关**: Apache APISIX
*   **容器化**: Docker, Docker Compose

---

### 📦 环境依赖 (中间件)

项目启动需要依赖部分中间件，在一键启动脚本中已经内置默认版本镜像，如果需要使用已有的服务，请注意版本要求

| 中间件名称 | 版本要求 | 启动方式 | 来源 | 是否必选 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Redis** | >= 5.0 | Docker | 官方镜像 | ✅ 是 | 缓存服务 |
| **MySQL** | >= 5.7 | Docker | 官方镜像 | ✅ 是 | 核心数据库 |
| **APISIX** | - | Docker | 官方镜像 | ✅ 是 | API 网关 |
| **Code Server** | - | Docker | 官方镜像 | ✅ 是 | 扩展开发工作台 |
| **MinIO** | >= 2025.02.07 | Docker | 官方镜像 | ✅ 是 | 对象存储 |
---

## 🚀 快速开始

完整部署与使用说明请参考：[快速开始指南](https://github.com/ontology4ai/ontology/blob/main/quickstart.md)

---

## 📂 目录结构

```text
ontology/
├── apisix/              # APISIX 网关路由配置
├── mysql/init/          # 数据库初始化脚本
├── ontology/            # 本体核心管理服务 (Java 源码)
├── ontology-graph/      # 图谱 API 服务 (Python 源码)
├── ontology-backend/    # 后台配置与路由服务 (Python 源码)
├── code_gen/            # 扩展开发工作台 (Python 源码)
├── common/              # 公共组件 (已提供 Jar)
├── dataps/              # 数据服务组件 (已提供 Jar)
├── links/               # 网关路由组件 (已提供 Jar)
├── docker-compose.yml   # 容器编排文件
└── README.md
```

---

## 📜 开源协议

本项目遵循双重开源协议：
*   **Apache License 2.0**
*   **MIT License**

详情请参阅根目录下的 `LICENSE` 文件。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进本项目。

1.  Fork 本仓库
2.  创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  开启一个 Pull Request
```

```

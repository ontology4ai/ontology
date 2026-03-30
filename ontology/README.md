# Ontology Management System

## 项目简介

本体管理系统(Ontology Management System)是一个基于Spring Boot开发的企业级知识图谱本体管理平台，旨在为用户提供完整的本体构建、管理和维护解决方案。系统支持本体的创建、版本控制、对象类型定义、关系映射以及与多种数据源的集成。

### 核心功能

- **本体管理**：支持本体的创建、编辑、版本管理和发布
- **对象类型管理**：定义和管理本体中的实体类型及其属性
- **关系类型管理**：配置实体间的关联关系和约束规则
- **数据源集成**：支持MySQL、API接口等多种数据源的本体映射
- **提示词管理**：集成AI能力，支持智能提示词配置和管理
- **可视化界面**：提供直观的图形化本体编辑和浏览界面
- **API服务**：提供完整的RESTful API接口供第三方系统集成

### 主要特性

- 🚀 **高性能**：基于Spring Boot 2.7.10，支持高并发访问
- 🔧 **模块化设计**：清晰的模块分离，便于扩展和维护
- 📦 **容器化部署**：支持Docker容器化，便于云端部署
- 🔗 **多数据源支持**：灵活的数据源集成能力
- 🎯 **企业级**：完整的权限管理和版本控制机制
- 🌐 **微服务友好**：支持与DataOS生态系统无缝集成

## 系统架构

### 项目结构

```
ontology/
├── ontology/                    # 核心业务模块
│   ├── src/main/java/
│   │   └── com/asiainfo/
│   │       ├── audit/          # 审计功能
│   │       ├── common/         # 通用常量和枚举
│   │       ├── config/         # 配置管理
│   │       ├── dto/            # 数据传输对象
│   │       ├── event/          # 事件处理
│   │       ├── feign/          # 外部服务调用
│   │       ├── minio/          # 文件存储
│   │       ├── po/             # 持久化对象
│   │       ├── repo/           # 数据访问层
│   │       ├── serivce/        # 业务逻辑层
│   │       ├── util/           # 工具类
│   │       ├── vo/             # 视图对象
│   │       └── web/            # Web控制层
│   └── src/main/resources/
│       └── template/           # 本体模板文件
└── ontology_deploy/             # 部署模块
    ├── sql/                    # 数据库脚本
    │   └── mysql/              # MySQL初始化脚本
    └── src/main/resources/
        ├── frontend/           # 前端静态资源
        └── application/        # 应用配置
```

### 技术架构

- **框架层**：Spring Boot 2.7.10, Spring Web, Spring Data JPA
- **数据层**：MySQL, PostgreSQL(pgvector), 数据源连接池(Druid)
- **文件存储**：MinIO对象存储
- **服务调用**：OpenFeign HTTP客户端
- **构建工具**：Gradle 7.x
- **容器化**：Docker, 基于debian-bullseye-jdk8镜像

## 环境要求

### 基础环境

- **JDK**: 1.8+
- **MySQL**: 5.7+ 或 8.0+
- **MinIO**: 最新稳定版
- **Gradle**: 7.x+ (可选，项目包含wrapper)

### 推荐配置

- **内存**: 2GB+ (生产环境推荐4GB+)
- **CPU**: 2核+ 
- **存储**: 20GB+ 可用空间
- **网络**: 稳定的网络连接(需访问maven仓库)

## 快速开始

### 1. 环境准备

#### 安装MySQL
```bash
# 使用Docker安装MySQL
docker run -d \
  --name mysql-ontology \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=ontology \
  -p 3306:3306 \
  mysql:8.0
```

#### 安装MinIO
```bash
# 使用Docker安装MinIO
docker run -d \
  --name minio-ontology \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 2. 数据库初始化

```bash
# 执行数据库初始化脚本
mysql -u root -p ontology < ontology_deploy/sql/mysql/init.sql

# 如有版本升级，执行对应的升级脚本
mysql -u root -p ontology < ontology_deploy/sql/mysql/upgrade_20260104.sql
```

### 3. 配置文件

修改 `ontology_deploy/src/main/resources/application.yaml`：

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ontology?useUnicode=true&characterEncoding=utf8
    username: root
    password: root123

# MinIO配置
modo:
  file-upload:
    minio:
      address: http://127.0.0.1:9000
      accessKey: minioadmin
      secretKey: minioadmin
      defaultBucketName: modo
```

### 4. 本地开发运行

```bash
# 克隆项目
git clone <repository-url>
cd ontology

# 编译项目
./gradlew build

# 运行应用
cd ontology_deploy
../gradlew bootRun

# 或直接运行jar包
java -jar build/libs/ontology_deploy-1.0.0.jar
```

访问系统：http://localhost:8018/ontology

### 5. Docker容器化部署

```bash
# 构建Docker镜像
docker build -t ontology:1.0.0 .

# 运行容器
docker run -d \
  --name ontology-app \
  -p 8373:8373 \
  -e MYSQL_HOST=mysql-host \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWORD=password \
  -e MINIO_URL=http://minio-host:9000 \
  -e MINIO_USER=minioadmin \
  -e MINIO_PWD=minioadmin \
  ontology:1.0.0
```

## 配置说明

### 核心配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `server.port` | 应用端口 | 8018 |
| `server.servlet.context-path` | 应用上下文路径 | /ontology |
| `modo.links.host` | API网关地址 | http://10.19.28.145:8333 |
| `modo.file-upload.minio.address` | MinIO服务地址 | http://127.0.0.1:9000 |
| `logging.level.com.asiainfo` | 日志级别 | debug |

### 环境变量

| 环境变量 | 说明 | 示例 |
|----------|------|------|
| `APISIX_GATEWAY_HOST` | API网关主机 | http://gateway:8333 |
| `MINIO_URL` | MinIO服务地址 | http://minio:9000 |
| `MINIO_USER` | MinIO用户名 | minioadmin |
| `MINIO_PWD` | MinIO密码 | minioadmin |
| `DEPLOY_MODE` | 部署模式 | jar |

## 核心功能模块

### 本体管理

本体管理是系统的核心功能，支持：

- **本体创建**：创建新的本体定义，包括名称、标签、描述等基本信息
- **版本管理**：支持本体的版本控制，跟踪变更历史
- **状态管理**：支持启用/禁用状态，推荐标记等
- **权限控制**：基于工作空间和用户的权限管理

```java
// 本体对象示例
OntologyDto ontology = new OntologyDto();
ontology.setOntologyName("customer");
ontology.setOntologyLabel("客户本体");
ontology.setOntologyDesc("客户关系管理本体定义");
ontology.setWorkspaceId("workspace-001");
```

### 对象类型管理

定义本体中的实体类型：

- **类型定义**：定义对象类型的基本信息和属性
- **数据源映射**：关联数据库表或API接口
- **属性管理**：配置对象的属性字段和约束
- **动作配置**：定义对象可执行的操作

### 关系类型管理

配置实体间的关联关系：

- **关系定义**：定义对象间的关联类型
- **方向控制**：支持单向和双向关系
- **约束规则**：配置关系的约束条件

### 提示词管理

集成AI能力的提示词配置：

- **提示词类型**：支持OAG提示词和普通提示词
- **默认模板**：提供系统默认的提示词模板
- **自定义配置**：支持用户自定义提示词内容

## API文档

### 主要接口

#### 本体管理接口

```bash
# 获取本体列表
GET /ontology/api/ontology/list

# 创建本体
POST /ontology/api/ontology/create
Content-Type: application/json
{
  "ontologyName": "customer",
  "ontologyLabel": "客户本体",
  "ontologyDesc": "客户关系管理本体",
  "workspaceId": "workspace-001"
}

# 更新本体
PUT /ontology/api/ontology/update/{id}

# 删除本体
DELETE /ontology/api/ontology/delete/{id}
```

#### 对象类型接口

```bash
# 获取对象类型列表
GET /ontology/api/objectType/list?ontologyId={ontologyId}

# 创建对象类型
POST /ontology/api/objectType/create
```

### 响应格式

系统统一使用以下响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 响应数据
  },
  "timestamp": "2026-02-02T11:44:24"
}
```

## 开发指南

### 项目结构说明

- **ontology模块**：核心业务逻辑，提供API和服务
- **ontology_deploy模块**：部署模块，包含启动类和配置

### 开发规范

1. **代码规范**：遵循阿里巴巴Java开发手册
2. **注释规范**：使用Javadoc格式注释
3. **数据库规范**：统一使用下划线命名，添加中文注释
4. **API规范**：遵循RESTful设计原则

### 扩展开发

#### 添加新的对象类型

1. 在`dto`包中定义数据传输对象
2. 在`po`包中定义持久化对象
3. 在`repo`包中定义数据访问接口
4. 在`service`包中实现业务逻辑
5. 在`web`包中定义REST接口

#### 集成新的数据源

1. 实现数据源连接器接口
2. 添加数据源类型枚举
3. 配置数据源映射关系
4. 测试数据源连接和数据读取

## 运维部署

### 生产环境部署

#### 使用Docker Compose

```yaml
version: '3.8'
services:
  ontology:
    image: ontology:1.0.0
    ports:
      - "8373:8373"
    environment:
      - MYSQL_HOST=mysql
      - MYSQL_USER=root
      - MYSQL_PASSWORD=password
      - MINIO_URL=http://minio:9000
    depends_on:
      - mysql
      - minio

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: ontology
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  mysql_data:
  minio_data:
```

### 性能调优

#### JVM参数调优

```bash
java -Xmx2048m -Xms1024m \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -jar ontology_deploy-1.0.0.jar
```

#### 数据库优化

1. **索引优化**：为常用查询字段创建索引
2. **连接池调优**：合理配置Druid连接池参数
3. **查询优化**：避免N+1查询，使用批量操作

### 监控配置

#### 应用监控

```yaml
# application-prod.yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

#### 日志配置

```yaml
logging:
  level:
    com.asiainfo: info
    org.springframework: warn
  pattern:
    file: '%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n'
  file:
    name: logs/ontology.log
```

## 常见问题

### 部署问题

**Q: 启动时提示数据库连接失败？**

A: 检查以下配置：
1. 数据库服务是否正常启动
2. 数据库连接配置是否正确
3. 网络是否可达

**Q: MinIO连接失败？**

A: 确认以下配置：
1. MinIO服务地址是否正确
2. 访问密钥是否匹配
3. 存储桶是否存在

### 开发问题

**Q: 如何添加新的本体字段？**

A: 
1. 修改数据库表结构
2. 更新对应的DTO和PO类
3. 修改前端界面
4. 更新API文档

**Q: 如何自定义提示词模板？**

A: 在提示词管理界面创建自定义提示词，或通过API接口批量导入。

### 性能问题

**Q: 系统响应慢怎么办？**

A: 
1. 检查数据库查询性能
2. 增加必要的索引
3. 调整JVM内存参数
4. 优化SQL查询

## 版本历史

- **v1.0.0** (2026-01-16): 初始版本发布
  - 基础本体管理功能
  - 对象类型和关系管理
  - 数据源集成支持
  - Docker部署支持

## 许可证

本项目采用企业内部许可证，仅供内部使用。

## 联系我们

如有问题或建议，请联系开发团队：

- **项目负责人**：AsiaInfo Ontology Team
- **技术支持**：通过内部技术支持渠道
- **文档更新**：请提交PR或Issue

---

*最后更新时间：2026年2月2日*

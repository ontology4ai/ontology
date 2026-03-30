-- 本体管理表
CREATE TABLE ontology_manage
(
    id             VARCHAR(100)         NOT NULL COMMENT '本体管理器唯一ID',
    ontology_name  VARCHAR(100)         NULL COMMENT '本体管理器英文名',
    ontology_label VARCHAR(100)         NULL COMMENT '本体管理器中文名',
    ontology_desc  TEXT                 NULL COMMENT '本体管理器描述',
    workspace_id   VARCHAR(100)         NULL COMMENT '工作空间/团队名',
    owner_id       VARCHAR(100)         NULL COMMENT '拥有者标识',
    status         INT                  NULL COMMENT '状态，1为启用，0为禁用',
    create_time    DATETIME             NULL COMMENT '创建时间',
    last_update    DATETIME             NULL COMMENT '修改时间',
    sync_status    INT                  NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
    sync_label     INT                  NULL COMMENT '同步标记',
    is_favorite    TINYINT(1) DEFAULT 0 NULL COMMENT '推荐标识，1为推荐，0为不推荐',
    oper_status    INT                  NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
    latest_version VARCHAR(100)         NULL COMMENT '最新版本号',
    publish_time   DATETIME             NULL COMMENT '发布时间',
    publish_user   VARCHAR(100)         NULL COMMENT '发布人',
    is_recommend   INT                  NULL COMMENT '推荐标识，1为推荐，0为不推荐',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 本体发布发布表
CREATE TABLE ontology_manage_his
(
    id             VARCHAR(32)  NOT NULL COMMENT '主键ID',
    ontology_id    VARCHAR(100) NULL COMMENT '本体ID',
    ontology_name  VARCHAR(100) NULL COMMENT '本体管理器英文名',
    ontology_label VARCHAR(100) NULL COMMENT '本体管理器中文名',
    ontology_desc  TEXT         NULL COMMENT '本体管理器描述',
    workspace_id   VARCHAR(100) NULL COMMENT '工作空间/团队名',
    owner_id       VARCHAR(100) NULL COMMENT '拥有者标识',
    status         INT          NULL COMMENT '状态，1为启用，0为禁用',
    is_favorite    INT          NULL COMMENT '状态，1为收藏，0为不收藏',
    is_recommend   INT          NULL COMMENT '推荐状态，1为推荐，0为不推荐',
    latest_version VARCHAR(100) NULL COMMENT '最新版本号',
    publish_user   VARCHAR(100) NULL COMMENT '发布人',
    publish_time   DATETIME     NULL COMMENT '发布时间',
    create_time    DATETIME     NULL COMMENT '创建时间',
    last_update    DATETIME     NULL COMMENT '修改时间',
    oper_status    INT          NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
    sync_status    INT          NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
    sync_label     INT          NULL COMMENT '同步标记',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 本体对象表
CREATE TABLE ontology_object_type
(
    id                VARCHAR(32)   NOT NULL COMMENT '对象类型唯一ID',
    object_type_name  VARCHAR(100)  NULL COMMENT '本体对象类型英文名',
    object_type_label VARCHAR(100)  NULL COMMENT '本体对象类型中文名',
    object_type_desc  TEXT          NULL COMMENT '本体对象类型描述',
    status            INT           NULL COMMENT '状态，1为启用，0为禁用',
    icon              VARCHAR(100)  NULL COMMENT '图标',
    ds_id             VARCHAR(100)  NULL COMMENT '数据源ID',
    ds_name           VARCHAR(100)  NULL COMMENT '数据源名',
    ds_schema         VARCHAR(100)  NULL COMMENT '数据源schema',
    table_name        VARCHAR(100)  NULL COMMENT '表名',
    ontology_id       VARCHAR(100)  NULL COMMENT '本体管理器ID',
    owner_id          VARCHAR(100)  NULL COMMENT '拥有者标识',
    interface_id      VARCHAR(100)  NULL COMMENT '接口ID',
    interface_icon    VARCHAR(100)  NULL COMMENT '接口图标',
    link_type_id      VARCHAR(100)  NULL COMMENT '链接类型ID，不为空当前对象为虚拟对象',
    api_id            VARCHAR(100)  NULL COMMENT 'API接口ID',
    ds_type           INT DEFAULT 0 NULL COMMENT '是否是自定义类型: 1为自定义，0为默认',
    custom_sql        TEXT          NULL COMMENT '自定义sql'
    create_time       DATETIME      NULL COMMENT '创建时间',
    last_update       DATETIME      NULL COMMENT '修改时间',
    sync_status       INT           NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
    oper_status       INT           NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 本体对象发布表
CREATE TABLE ontology_object_type_his
(
    id                VARCHAR(32)  NOT NULL COMMENT '对象类型唯一id',
    object_type_id    VARCHAR(100) NULL COMMENT '对象类型ID',
    object_type_name  VARCHAR(100) NULL COMMENT '本体对象类型英文名',
    object_type_label VARCHAR(100) NULL COMMENT '本体对象类型中文名',
    object_type_desc  TEXT         NULL COMMENT '本体对象类型描述',
    status            INT          NULL COMMENT '状态，1为启用，0为禁用',
    latest_version    VARCHAR(100) NULL COMMENT '最新版本号',
    icon              VARCHAR(100) NULL COMMENT '图标',
    ds_id             VARCHAR(100) NULL COMMENT '数据源id',
    ds_name           VARCHAR(100) NULL COMMENT '数据源名',
    ds_schema         VARCHAR(100) NULL COMMENT '数据源schema',
    table_name        VARCHAR(100) NULL COMMENT '数据源表名',
    ontology_id       VARCHAR(100) NULL COMMENT '本体管理器id',
    owner_id          VARCHAR(100) NULL COMMENT '拥有者标识',
    interface_id      VARCHAR(100) NULL COMMENT '接口Id',
    interface_icon    VARCHAR(100) NULL COMMENT '接口图标',
    link_type_id      VARCHAR(100) NULL COMMENT '链接类型ID，不为空当前对象为虚拟对象',
    api_id            VARCHAR(100) NULL COMMENT 'API接口ID',
    create_time       DATETIME     NULL COMMENT '创建时间',
    last_update       DATETIME     NULL COMMENT '修改时间',
    oper_status       INT          NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
    sync_status       INT          NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 本体提示词表
CREATE TABLE ontology_prompt
(
    id             VARCHAR(32)   NOT NULL COMMENt '主键ID',
    prompt_name    VARCHAR(100)  NULL COMMENT '提示词名称',
    prompt_desc    VARCHAR(1000) NULL COMMENT '提示词说明',
    prompt_content LONGTEXT      NULL COMMENT '提示词内容',
    prompt_type    INT           NULL COMMENT '提示词类型: 1-OAG提示词, 0-普通提示词',
    default_type   INT           NULL COMMENT '默认提示词: 1-默认, 0-自定义',
    ontology_id    VARCHAR(100)  NULL COMMENT '本体id',
    owner_id       VARCHAR(100)  NOT NULL COMMENt '创建用户',
    workspace_id   VARCHAR(100)  NOT NULL COMMENt '工作空间',
    create_time    DATETIME      NULL COMMENT '创建时间',
    last_update    DATETIME      NULL COMMENT '更新时间',
    sync_status    INT           NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
    oper_status    INT           NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


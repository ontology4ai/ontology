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


-- 默认提示词
DELETE FROM ontology_prompt WHERE default_type  = '1' AND prompt_type = 0;

INSERT INTO ontology_prompt(id, prompt_name, prompt_desc, prompt_content, prompt_type, default_type, ontology_id, owner_id, workspace_id, create_time, last_update, sync_status, oper_status)
SELECT REPLACE(UUID(), '-', ''), t1.ontology_label, '由系统自动生成的默认提示词，适用于本体中不限定具体场景的通用性问答', NULL, 0, 1, t1.id, t1.owner_id, NULL, NOW(), NOW(), 1, 0 FROM ontology_manage t1 WHERE t1.oper_status < 3 AND NOT EXISTS (SELECT 1 FROM ontology_prompt t2 WHERE t2.ontology_id = t1.id AND t2.default_type = '1' AND t2.prompt_type = 0);

DELETE FROM ontology_prompt WHERE default_type  = '1' AND prompt_type = 1;

INSERT INTO ontology_prompt(id, prompt_name, prompt_desc, prompt_content, prompt_type, default_type, ontology_id, owner_id, workspace_id, create_time, last_update, sync_status, oper_status)
SELECT REPLACE(UUID(), '-', ''), t1.ontology_label, '由系统自动生成的默认提示词，适用于本体中不限定具体场景的通用性问答', NULL, 1, 1, t1.id, t1.owner_id, NULL, NOW(), NOW(), 1, 0 FROM ontology_manage t1 WHERE t1.oper_status < 3 AND NOT EXISTS (SELECT 1 FROM ontology_prompt t2 WHERE t2.ontology_id = t1.id AND t2.default_type = '1' AND t2.prompt_type = 1);


-- 仿真数据变更表
ALTER TABLE ontology_data_change_log ADD COLUMN `order` bigint;


-- 对象类型表变更
ALTER TABLE ontology_object_type ADD COLUMN ds_type INT DEFAULT 0 COMMENT '是否是自定义类型: 1为自定义，0为默认';
ALTER TABLE ontology_object_type ADD COLUMN custom_sql TEXT COMMENT '自定义sql';

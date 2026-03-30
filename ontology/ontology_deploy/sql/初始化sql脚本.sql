INSERT INTO atlas_dev.ontology_config
(id, config_key, config_value, description, status, create_time, last_update, sync_status, oper_status, config_type)
VALUES('0512c4679040424f8b6c94535205bcac', 'agent_type', 'dify', NULL, 1, '2025-10-23 14:48:46', '2025-10-23 14:48:46', 1, 0, 'agent');
INSERT INTO atlas_dev.ontology_config
(id, config_key, config_value, description, status, create_time, last_update, sync_status, oper_status, config_type)
VALUES('1231241234', 'mcp_info', '[
    {
        "label": "地址",
        "value": "/sandbox_pro/ontology/mcp"
    },
    {
        "label": "传输类型",
        "value": "Streamable HTTP"
    },
    {
        "label": "描述",
        "value": "调用本体动作和全局函数的工具集合"
    }
]', NULL, 1, '2025-10-23 14:48:46', '2025-10-23 14:48:46', 1, 0, 'publish');
INSERT INTO atlas_dev.ontology_config
(id, config_key, config_value, description, status, create_time, last_update, sync_status, oper_status, config_type)
VALUES('132423141234', 'mcp_tool', '[
    [
      {
        "label": "名称",
        "value": "ontology_object_action_run"
      },
      {
        "label": "功能",
        "value": "在本体对象上执行动作，支持 CREATE、UPDATE、DELETE 操作"
      },
      {
        "label": "参数",
        "value": "- `ontology_name` (string, 必填) - 本体的英文名 \\n - `params` (dict, 可选) - 动作的参数，例如 `{\\"name\\": \\"张三\\"}` \\n - `action_name` (string, 必填) - 动作的英文名 \\n - `object_name` (string, 必填) - 对象的英文名"
      },
      {
        "label": "示例",
        "value": "```json\\n          {\\n            \\"ontology_name\\": \\"test_ontology\\",\\n            \\"params\\": {\\n              \\"数量\\": 26,\\n              \\"编号\\": 1\\n            },\\n            \\"action_name\\": \\"createOrder\\",\\n            \\"object_name\\": \\"Order\\"\\n          }\\n          ```"
      }
    ],
    [
      {
        "label": "名称",
        "value": "ontology_object_find"
      },
      {
        "label": "功能",
        "value": "从本体对象中查找数据行"
      },
      {
        "label": "参数",
        "value": "- `ontology_name` (string, 必填) - 本体英文名称\\n            - `object_name` (string, 必填) - 对象英文名称\\n            - `return_attrs` (list[string], 可选) - 期望返回的属性名称\\n            - `where_sql` (string, 可选) - WHERE 条件的 SQL 语句，允许使用属性作为过滤条件\\n            - `where_params` (list[any], 可选) - WHERE SQL 中的变量值\\n            - `order_by` (string, 可选) - 排序规则\\n            - `page_size` (int, 可选) - 分页大小\\n            - `page_token` (string, 可选) - 翻页标识"
      },
      {
        "label": "示例",
        "value": "```json\\n          {\\n            \\"ontology_name\\": \\"test_ontology\\",\\n            \\"object_name\\": \\"DisasterEvent\\",\\n            \\"return_attrs\\": [\\"eventID\\"],\\n            \\"where_sql\\": \\"typhoonName LIKE %s\\",\\n            \\"where_params\\": [\\"%苏帕%\\"]\\n          }\\n          ```"
      }
    ],
    [
      {
        "label": "名称",
        "value": "ontology_object_function_run"
      },
      {
        "label": "功能",
        "value": "执行本体全局函数"
      },
      {
        "label": "参数",
        "value": "- `ontology_name` (string, 必填) - 本体英文名称\\n        - `function_name` (string, 必填) - 函数英文名\\n        - `params` (dict, 可选) - 函数入参"
      },
      {
        "label": "示例",
        "value": "```json\\n          {\\n            \\"ontology_name\\": \\"test_ontology\\",\\n            \\"function_name\\": \\"get_vip_customer\\",\\n            \\"params\\": {}\\n          }\\n          ```"
      }
    ]
  ]', NULL, 1, '2025-10-23 14:48:46', '2025-10-23 14:48:46', 1, 0, 'publish');
INSERT INTO atlas_dev.ontology_config
(id, config_key, config_value, description, status, create_time, last_update, sync_status, oper_status, config_type)
VALUES('efafdasffadsf', 'agent_prompt', 'Respond to the human as helpfully and accurately as possible.

{{prompt}}

You have access to the following tools:

{{tools}}

Use a json blob to specify a tool by providing an {{TOOL_NAME_KEY}} key (tool name) and an {{ACTION_INPUT_KEY}} key (tool input).
Valid "{{TOOL_NAME_KEY}}" values: "Final Answer" or {{tool_names}}

Provide only ONE action per $JSON_BLOB, as shown:

```
{
"{{TOOL_NAME_KEY}}": $TOOL_NAME,
"{{ACTION_INPUT_KEY}}": $ACTION_INPUT
}
```

Follow this format:

Question: input question to answer
Thought: consider previous and subsequent steps
Action:
```
$JSON_BLOB
```
Observation: action result
... (repeat Thought/Action/Observation N times)
Thought: I know what to respond
Action:
```
{
"{{TOOL_NAME_KEY}}": "Final Answer",
"{{ACTION_INPUT_KEY}}": "Final response to human"
}
```

Begin! Reminder to ALWAYS respond with a valid json blob of a single action. Use tools if necessary. Respond directly if appropriate. Format is Action:```$JSON_BLOB```then Observation:.

', NULL, 1, '2025-10-23 14:48:46', '2025-10-23 14:48:46', 1, 0, 'prompt');
INSERT INTO atlas_dev.ontology_config
(id, config_key, config_value, description, status, create_time, last_update, sync_status, oper_status, config_type)
VALUES('ffasdgsdgfd', 'agent_token', '0JTSGlvNho8RgQww', NULL, 1, '2025-10-23 14:48:46', '2025-10-23 14:48:46', 1, 0, 'agent');

-- 新增推荐标记字段，历史和主表都需要补齐，默认0表示不推荐
ALTER TABLE atlas_dev.ontology_manage
    ADD COLUMN IF NOT EXISTS is_recommend smallint DEFAULT 0;
ALTER TABLE atlas_dev.ontology_manage_his
    ADD COLUMN IF NOT EXISTS is_recommend smallint DEFAULT 0;

-- 新增配置分组
CREATE TABLE atlas_dev.ontology_config_group (
     id varchar(32) NOT NULL COMMENT '主键',
     create_time datetime DEFAULT NULL COMMENT '创建时间',
     last_update datetime DEFAULT NULL COMMENT '修改时间',
     oper_status int DEFAULT NULL COMMENT '操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除',
     sync_status int DEFAULT NULL COMMENT '待同步状态，1为新建，2为修改，3为删除，0为已同步',
     code varchar(100) DEFAULT NULL COMMENT '分组编码',
     name varchar(200) DEFAULT NULL COMMENT '分组名称',
     status int DEFAULT NULL COMMENT '状态，1为启用，0为禁用',
     PRIMARY KEY (id)
);

-- 增加默认配置分组
INSERT INTO atlas_dev.ontology_config_group (id,create_time,last_update,oper_status,sync_status,code,name,status)
VALUES ('92a19a37baab4de299e0dc6aa69b8928','2025-11-20 16:35:22','2025-11-20 16:35:22',0,1,'agent','智能体',1);
INSERT INTO atlas_dev.ontology_config_group (id,create_time,last_update,oper_status,sync_status,code,name,status)
VALUES ('e0a7a9d2bfda4cb2951e48074a5f6ba8','2025-11-20 16:34:49','2025-11-20 16:34:49',0,1,'aapRegister','AAP注册信息',1);
INSERT INTO atlas_dev.ontology_config_group (id,create_time,last_update,oper_status,sync_status,code,name,status)
VALUES ('e0a7a9d2bfda4cb2951e48074a5f6ba9','2025-11-20 16:34:49','2025-11-20 16:34:49',0,1,'difyRegister','DIFY注册信息',1);
INSERT INTO atlas_dev.ontology_config_group (id,create_time,last_update,oper_status,sync_status,code,name,status)
VALUES ('4dee3b88d174483d850ecc60f5ca747b','2025-11-20 16:35:35','2025-11-20 16:35:35',0,1,'publish','发布信息',1);
INSERT INTO atlas_dev.ontology_config_group (id,create_time,last_update,oper_status,sync_status,code,name,status)
VALUES ('ab4f9af341044f24b1a4c85aa7f75faa','2025-11-20 16:35:49','2025-11-20 16:35:49',0,1,'prompt','提示词',1);

INSERT INTO atlas_dev.ontology_config (id,create_time,last_update,oper_status,sync_status,config_key,config_type,config_value,description,status)
VALUES ('7ca7774712724716a3e856d55b18b7ce','2025-11-21 14:10:57','2025-11-21 14:10:57',0,1,'dify.host','difyRegister','10.19.93.128',NULL,1);
INSERT INTO atlas_dev.ontology_config (id,create_time,last_update,oper_status,sync_status,config_key,config_type,config_value,description,status)
VALUES ('838f81db3dfc4a719fd049a6b3065688','2025-11-21 13:51:46','2025-11-21 13:51:46',0,1,'aap.port','aapRegister','30015',NULL,1);
INSERT INTO atlas_dev.ontology_config (id,create_time,last_update,oper_status,sync_status,config_key,config_type,config_value,description,status)
VALUES ('8ed6ee99b2ed4a48b512bd9452c649ca','2025-11-21 13:51:46','2025-11-21 13:51:46',0,1,'aap.host','aapRegister','10.19.93.128',NULL,1);
INSERT INTO atlas_dev.ontology_config (id,create_time,last_update,oper_status,sync_status,config_key,config_type,config_value,description,status)
VALUES ('c6921e39aace40009151a60050faaf34','2025-11-21 14:10:57','2025-11-21 14:10:57',0,1,'dify.port','difyRegister','30015',NULL,1);

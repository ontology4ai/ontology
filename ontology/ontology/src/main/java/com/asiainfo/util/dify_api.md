# dify 登录接口
## 请求
    curl --location --request POST 'http://10.21.20.170:1909/console/api/login' \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "email": "dify@163.com",
    "password": "a12345678"
    }'
### 请求参数说明
    email: 用户邮箱
    password： 密码
## 响应
    {
    "result": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiM2MwM2FlOWQtM2ZjMC00Mzc5LTgyMDYtZDc5MGZhYWJhNmM3IiwiZXhwIjoxNzY1MzU2MzE3LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.y549X3eiaOXW1XwuDVtlBXpH1Gp9WfEyFKb7qfsNqfo",
        "refresh_token": "b38d1c08482dbaa914589c20b2703283e1f07c84a3363c87e1d744291b30bb0dd3a7197a206a53bacc78d99d3c80c7cbe8d9462632c40deb818fec8f384cc848"
        }
    }
### 响应参数说明
    access_token：Bearer认证token

# 创建agent接口
## 请求
    curl --location --request POST 'http://10.21.20.170:1909/console/api/apps' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiM2MwM2FlOWQtM2ZjMC00Mzc5LTgyMDYtZDc5MGZhYWJhNmM3IiwiZXhwIjoxNzY1MzU2MzE3LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.y549X3eiaOXW1XwuDVtlBXpH1Gp9WfEyFKb7qfsNqfo' \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "name": "卢超测试应用",
    "mode": "agent-chat",
    "description": "卢超测试应用的描述"
    }'
### 请求参数说明
    name：智能体名称
    mode：智能体类型，默认为agent-chat
    description：智能体描述
## 响应
    {
    "id": "020d7135-4b2b-4190-ad41-dc6dfa6a3246",
    "name": "卢超测试应用",
    "description": "卢超测试应用的描述",
    "mode": "agent-chat",
    "icon": null,
    "icon_background": null,
    "enable_site": true,
    "enable_api": true,
    "model_config": {
    "opening_statement": null,
    "suggested_questions": [],
    "suggested_questions_after_answer": {
    "enabled": false
    },
    "speech_to_text": {
    "enabled": false
    },
    "text_to_speech": {
    "enabled": false
    },
    "retriever_resource": {
    "enabled": true
    },
    "annotation_reply": {
    "enabled": false
    },
    "more_like_this": {
    "enabled": false
    },
    "sensitive_word_avoidance": {
    "enabled": false,
    "type": "",
    "configs": []
    },
    "external_data_tools": [],
    "model": {
    "provider": "langgenius/deepseek/deepseek",
    "name": "deepseek-chat",
    "mode": "chat",
    "completion_params": {}
    },
    "user_input_form": [],
    "dataset_query_variable": null,
    "pre_prompt": null,
    "agent_mode": {
    "enabled": false,
    "strategy": null,
    "tools": [],
    "prompt": null
    },
    "prompt_type": "simple",
    "chat_prompt_config": {},
    "completion_prompt_config": {},
    "dataset_configs": {
    "retrieval_model": "multiple"
    },
    "file_upload": {
    "image": {
    "enabled": false,
    "number_limits": 3,
    "detail": "high",
    "transfer_methods": [
    "remote_url",
    "local_file"
    ]
    }
    },
    "created_by": "3c03ae9d-3fc0-4379-8206-d790faaba6c7",
    "created_at": 1765352801,
    "updated_by": "3c03ae9d-3fc0-4379-8206-d790faaba6c7",
    "updated_at": 1765352801
    },
    "workflow": null,
    "tracing": null,
    "use_icon_as_answer_icon": false,
    "created_by": "3c03ae9d-3fc0-4379-8206-d790faaba6c7",
    "created_at": 1765352801,
    "updated_by": "3c03ae9d-3fc0-4379-8206-d790faaba6c7",
    "updated_at": 1765352801,
    "access_mode": null,
    "tags": []
    }

### 响应参数
    id：创建的智能体ID

# 获取智能体appToken
## 请求
    curl --location --request GET 'http://10.21.20.170:1909/console/api/apps/020d7135-4b2b-4190-ad41-dc6dfa6a3246/api-keys' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiM2MwM2FlOWQtM2ZjMC00Mzc5LTgyMDYtZDc5MGZhYWJhNmM3IiwiZXhwIjoxNzY1MzU2MzE3LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.y549X3eiaOXW1XwuDVtlBXpH1Gp9WfEyFKb7qfsNqfo' \
    --data-raw ''
## 响应
    {
        "data": [
            {
                "id": "23b6a30b-4a3e-4bd4-8399-e12fb0e26cd4",
                "type": "app",
                "token": "app-iI2b9NYttQ9yjziCbryzyHC6",
                "last_used_at": null,
                "created_at": 1765353058
            }
        ]
    }
### 响应参数
    token 需要返回的的appToken

# 创建新的智能体appToken
## 请求
    curl --location --request POST 'http://10.21.20.170:1909/console/api/apps/020d7135-4b2b-4190-ad41-dc6dfa6a3246/api-keys' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiM2MwM2FlOWQtM2ZjMC00Mzc5LTgyMDYtZDc5MGZhYWJhNmM3IiwiZXhwIjoxNzY1MzU2MzE3LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.y549X3eiaOXW1XwuDVtlBXpH1Gp9WfEyFKb7qfsNqfo' \
    --data-raw ''
## 响应
    {
        "id": "23b6a30b-4a3e-4bd4-8399-e12fb0e26cd4",
        "type": "app",
        "token": "app-iI2b9NYttQ9yjziCbryzyHC6",
        "last_used_at": null,
        "created_at": 1765353058
    }
### 响应参数
    token 需要返回的的appToken
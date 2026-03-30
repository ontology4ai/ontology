{
  "properties" : { },
  "id" : "b7781b0d9e69472b9267f4040dd58def",
  "script" : null,
  "groupId" : "beda2e33e47a4a7ab0f32c484f3047dc",
  "name" : "llmInfo",
  "createTime" : 1715138259138,
  "updateTime" : null,
  "lock" : null,
  "createBy" : null,
  "updateBy" : null,
  "path" : "llmInfo",
  "description" : null,
  "returnType" : null,
  "mappingPath" : null,
  "parameters" : [ {
    "name" : "model",
    "value" : null,
    "description" : "模型名称",
    "required" : false,
    "dataType" : "String",
    "type" : null,
    "defaultValue" : null,
    "validateType" : null,
    "error" : null,
    "expression" : null,
    "children" : null
  } ]
}
================================
var lmInfoMap = {
    "duowen-3b-chat":{ //duowen-3b-chat
        "url":"http://10.1.251.110:3000/v1/chat/completions",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "qwen-14b-chat":{
        "url":"http://10.1.251.110:3000/v1/chat/completions",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "qwen":{
        "url":"http://10.1.251.110:3000/v1/chat/completions",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "qwen-72b-chat":{
        "url":"http://10.1.251.110:3000/v1/chat/completions",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "sqlcoder":{
        "url":"http://10.1.251.110:3000/sqlcoder/inference"
    },
    "embeddings":{
        "url":"http://10.1.251.110:3000/v1/embeddings",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "deepseek-7b-train":{
        "url":"http://10.1.251.110:3000/v1/chat/completions",
        "token":"Bearer sk-t6bAw31nIfa2ONFI5dBeD59bFfB04194917fF1A15f5286F3"
    },
    "liurui":{ //duowen-3b-chat
        "url":"http://10.19.32.158:8815/call/flow"
    }
}
return lmInfoMap[model];
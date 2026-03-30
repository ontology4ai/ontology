{
  "properties" : { },
  "id" : "7d08a22b21b54a5592899f0be5a10bd1",
  "script" : null,
  "groupId" : "beda2e33e47a4a7ab0f32c484f3047dc",
  "name" : "调用刘睿大模型",
  "createTime" : 1715138170832,
  "updateTime" : 1715141435000,
  "lock" : null,
  "createBy" : null,
  "updateBy" : null,
  "path" : "callliurui",
  "description" : null,
  "returnType" : null,
  "mappingPath" : null,
  "parameters" : [ {
    "name" : "content",
    "value" : null,
    "description" : "提示词内容",
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
import http;
import log;
import "@/llm/llmInfo" as lminfo


//var model = 'liurui';
var model = 'qwen'
log.info(content)
    //"name": "数据开发_SQL纠错_v2",
var bodyParamData = {
    "model": "yi-34b-chat-int4",
    "name": "dataps_sql_generate_v1",
    "meta_db": "DataOS副驾",
    "question": content
}

log.info(model+":"+lminfo(model));
log.info(bodyParamData);

var url="http://10.19.32.158:8815/call/flow";
var returnData = http.connect(url)
    .body(bodyParamData)
    //.header("Authorization",info(model).token)
    .post().getBody();    
//    .choices[0].message.content;
return returnData;
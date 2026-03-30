{
  "properties" : { },
  "id" : "copy1715141469012d11277",
  "script" : null,
  "groupId" : "beda2e33e47a4a7ab0f32c484f3047dc",
  "name" : "调用大模型",
  "createTime" : 1715138170832,
  "updateTime" : 1715141582045,
  "lock" : null,
  "createBy" : null,
  "updateBy" : null,
  "path" : "callLM",
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

var url=lminfo(model);
var returnData = http.connect(url)
    .body(bodyParamData)
    //.header("Authorization",info(model).token)
    .post().getBody();    
//    .choices[0].message.content;
return returnData;
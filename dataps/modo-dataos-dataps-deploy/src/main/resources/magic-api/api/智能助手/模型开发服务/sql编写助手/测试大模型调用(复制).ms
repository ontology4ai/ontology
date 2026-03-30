{
  "properties" : { },
  "id" : "copy1715139023150d64226",
  "script" : null,
  "groupId" : "f90df6421e5f4ab5878e9e29d32fa9cc",
  "name" : "测试大模型调用(复制)",
  "createTime" : null,
  "updateTime" : 1715140044992,
  "lock" : null,
  "createBy" : null,
  "updateBy" : null,
  "path" : "generateSQL",
  "method" : "POST",
  "parameters" : [ ],
  "options" : [ ],
  "requestBody" : "",
  "headers" : [ ],
  "paths" : [ ],
  "responseBody" : "{\n    \"requestId\": \"d475a57be453440c94e1cd9bb0aece3e\",\n    \"code\": \"200\",\n    \"data\": {\n        \"code\": 9999,\n        \"msg\": \"invalid decimal literal (<string>, line 1)\",\n        \"res\": \"\"\n    },\n    \"success\": true,\n    \"message\": \"success\",\n    \"devMsg\": null,\n    \"hasPrivilege\": true\n}",
  "description" : null,
  "requestBodyDefinition" : null,
  "responseBodyDefinition" : {
    "name" : "",
    "value" : "",
    "description" : "",
    "required" : false,
    "dataType" : "Object",
    "type" : null,
    "defaultValue" : null,
    "validateType" : "",
    "error" : "",
    "expression" : "",
    "children" : [ {
      "name" : "requestId",
      "value" : "c7e7a8ee16cc4b80a6e0786a46c9e4e3",
      "description" : "",
      "required" : false,
      "dataType" : "String",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    }, {
      "name" : "code",
      "value" : "200",
      "description" : "",
      "required" : false,
      "dataType" : "String",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    }, {
      "name" : "data",
      "value" : "",
      "description" : "",
      "required" : false,
      "dataType" : "Object",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ {
        "name" : "code",
        "value" : "9999",
        "description" : "",
        "required" : false,
        "dataType" : "Integer",
        "type" : null,
        "defaultValue" : null,
        "validateType" : "",
        "error" : "",
        "expression" : "",
        "children" : [ ]
      }, {
        "name" : "msg",
        "value" : "invalid decimal literal (<string>, line 1)",
        "description" : "",
        "required" : false,
        "dataType" : "String",
        "type" : null,
        "defaultValue" : null,
        "validateType" : "",
        "error" : "",
        "expression" : "",
        "children" : [ ]
      }, {
        "name" : "res",
        "value" : "",
        "description" : "",
        "required" : false,
        "dataType" : "String",
        "type" : null,
        "defaultValue" : null,
        "validateType" : "",
        "error" : "",
        "expression" : "",
        "children" : [ ]
      } ]
    }, {
      "name" : "success",
      "value" : "true",
      "description" : "",
      "required" : false,
      "dataType" : "Boolean",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    }, {
      "name" : "message",
      "value" : "success",
      "description" : "",
      "required" : false,
      "dataType" : "String",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    }, {
      "name" : "devMsg",
      "value" : "null",
      "description" : "",
      "required" : false,
      "dataType" : "Object",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    }, {
      "name" : "hasPrivilege",
      "value" : "true",
      "description" : "",
      "required" : false,
      "dataType" : "Boolean",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
    } ]
  }
}
================================
import '@/llm/callliurui' as callliurui;
import log
var content="""请生成一个SQL语句,将源表Orders的数据复制到目标表Orders_Archive.源表包含列OrderID|OrderDate|CustomerID|TotalAmount.目标表需要包含所有这些列,并且只复制过去一周内的订单记录.结果需要按OrderDate降序排列,并限制结果集最多返回1000条记录."""
log.info(content)
var re=callliurui(content)
return re
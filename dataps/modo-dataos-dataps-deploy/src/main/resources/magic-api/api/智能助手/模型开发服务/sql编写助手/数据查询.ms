{
  "properties" : { },
  "id" : "copy1715423455599d14930",
  "script" : null,
  "groupId" : "f90df6421e5f4ab5878e9e29d32fa9cc",
  "name" : "数据查询",
  "createTime" : null,
  "updateTime" : 1715756877478,
  "lock" : null,
  "createBy" : null,
  "updateBy" : null,
  "path" : "seach",
  "method" : "GET",
  "parameters" : [ {
    "name" : "table_name",
    "value" : null,
    "description" : null,
    "required" : false,
    "dataType" : "String",
    "type" : null,
    "defaultValue" : null,
    "validateType" : "pass",
    "error" : null,
    "expression" : null,
    "children" : null
  } ],
  "options" : [ ],
  "requestBody" : "",
  "headers" : [ ],
  "paths" : [ ],
  "responseBody" : "{\n    \"requestId\": \"35df6e93ee68442c87a7e651c9e3833f\",\n    \"code\": \"200\",\n    \"data\": \"\",\n    \"success\": true,\n    \"message\": \"success\",\n    \"devMsg\": null,\n    \"hasPrivilege\": true\n}",
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
      "value" : "e132d18b5b4a48f9b16c7bca64e86757",
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
      "dataType" : "String",
      "type" : null,
      "defaultValue" : null,
      "validateType" : "",
      "error" : "",
      "expression" : "",
      "children" : [ ]
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

names = table_name.split("/,/")
print(names)
var text = ""
for (each_name in names) {
    fields = db.select("SELECT gmtf.field_name,gmtf.field_label,gmtf.data_type FROM modo_dataos.go_meta_tab_field gmtf,modo_dataos.go_meta_tab gmt where gmtf.tab_id = gmt.tab_id and gmt.tab_name='" + table_name +"'")

    if (fields.length > 0){
        text = "\n    表名：" + each_name + "\n    字段信息：\n        |字段名| 数据类型| 描述|\n        |---|---|---|\n        "
        for (item in fields) {
            text += "|" + item["field_name"] + "|" + item["data_type"] + "|" + item["field_label"] + "|\n        "
        }

    } 
}

return text



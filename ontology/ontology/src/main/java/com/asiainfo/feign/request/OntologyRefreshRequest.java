package com.asiainfo.feign.request;

import lombok.Data;

import java.util.List;

/**
 * @Author luchao
 * @Date 2025/9/2
 * @Description
 */

@Data
public class OntologyRefreshRequest {
    /**
     * {
     *     "name": "YuanGongInfo",
     *     "table_name": "ontology_yg_computer",
     *     "doc": "员工基本信息",
     *     "fields": [
     *         {"name": "id", "type": "string",  "primary_key" : true},
     *         {"name": "name", "type": "string"},
     *         {"name": "computer_no", "type": "string"}
     *     ]
     * }
     */

    private String ontology_name;

    private String name;

    private String table_name;

    private String doc;

    private List<FieldInfo> fields;

    private Integer status;

    private String pre_sql;

}

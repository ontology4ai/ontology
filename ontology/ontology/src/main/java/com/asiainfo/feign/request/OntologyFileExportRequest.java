package com.asiainfo.feign.request;

import lombok.Data;

import java.util.List;
import java.io.Serializable;


/**
 * 本体导出对象请求体
 */
@Data
public class OntologyFileExportRequest implements Serializable {

    private String ontology_id;
    // 非必填 可选owl/compact 默认owl
    private String format;
    private List<String> object_type_id;

}
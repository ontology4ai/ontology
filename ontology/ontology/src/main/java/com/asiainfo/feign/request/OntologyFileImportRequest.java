package com.asiainfo.feign.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;


/**
 * 本体导入对象请求体
 */
@Data
public class OntologyFileImportRequest implements Serializable {

    private String ontology_id;

    private String owner_id;

    private String owl_url;

}
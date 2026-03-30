package com.asiainfo.feign.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;


/**
 * 创建本体对象请求体
 */
@Data
public class OntologyObjectCreateRequest implements Serializable {

    private String ontology_id;

}
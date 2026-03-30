package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;


/**
 * 本体迁出请求体
 */
@Data
public class OntologyMigrateOutRequest implements Serializable {

    private String ontology_id;

}
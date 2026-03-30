package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;


/**
 * 本体迁入请求体
 */
@Data
public class OntologyMigrateInRequest implements Serializable {

    private String tar_url;

    private String owner_id;

    private String workspace_id;

    private String ontology_name;

    private String ontology_label;

    private String ontology_desc;

}
package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;
import java.util.List;


/**
 * 本体图谱对象请求体
 */
@Data
public class OntologyGraphRequest implements Serializable {

    private String ontology_id;
    private Integer nodes_amount;
    private List<String> node_names;
    private String pub_version;
}
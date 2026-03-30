package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyGraphSearchVo extends BaseSearchVo {
    private String ontologyId;
    private Integer nodesAmount;
    private String nodeNames;
    private String pubVersion;
}

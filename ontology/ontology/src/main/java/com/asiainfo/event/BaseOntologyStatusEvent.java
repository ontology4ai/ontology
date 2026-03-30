package com.asiainfo.event;

import com.asiainfo.po.OntologyPo;
import lombok.Getter;

/**
 * 本体状态事件基类
 */
@Getter
public abstract class BaseOntologyStatusEvent {

    private final String ontologyId;
    private final String operatorId;
    private final OntologyPo ontology;

    protected BaseOntologyStatusEvent(String ontologyId, String operatorId, OntologyPo ontology) {
        this.ontologyId = ontologyId;
        this.operatorId = operatorId;
        this.ontology = ontology;
    }
}

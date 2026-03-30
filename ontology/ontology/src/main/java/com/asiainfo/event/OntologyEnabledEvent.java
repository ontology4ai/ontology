package com.asiainfo.event;

import com.asiainfo.po.OntologyPo;

/**
 * 本体启用事件
 */
public class OntologyEnabledEvent extends BaseOntologyStatusEvent {

    public OntologyEnabledEvent(String ontologyId, String operatorId, OntologyPo ontology) {
        super(ontologyId, operatorId, ontology);
    }
}

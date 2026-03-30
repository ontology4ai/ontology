package com.asiainfo.event;

import com.asiainfo.po.OntologyPo;

/**
 * 本体禁用事件
 */
public class OntologyDisabledEvent extends BaseOntologyStatusEvent {

    public OntologyDisabledEvent(String ontologyId, String operatorId, OntologyPo ontology) {
        super(ontologyId, operatorId, ontology);
    }
}

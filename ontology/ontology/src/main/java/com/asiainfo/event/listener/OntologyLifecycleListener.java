package com.asiainfo.event.listener;

import com.asiainfo.event.OntologyEnabledEvent;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.serivce.OntologyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Collections;

/**
 * 本体生命周期事件监听器
 */
@Component
@Slf4j
public class OntologyLifecycleListener {

    @Autowired
    private OntologyService ontologyService;

    /**
     * 监听启用事件并触发发布流程
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEnabled(OntologyEnabledEvent event) {
        OntologyPo ontologyPo = event.getOntology();
        String ontologyId = ontologyPo.getId();
        String operatorId = event.getOperatorId();
        log.info("监听到本体启用事件，ontologyId={}, operatorId={}", ontologyId, operatorId);
        try {
            ontologyService.publish(Collections.singletonList(ontologyId), operatorId);
            log.info("本体启用触发自动发布成功，ontologyId={}", ontologyId);
        } catch (Exception ex) {
            log.error("本体启用触发自动发布失败，ontologyId={}", ontologyId, ex);
            // 发布失败时保留禁用状态，记录告警或后续补偿
            throw ex;
        }
    }
}

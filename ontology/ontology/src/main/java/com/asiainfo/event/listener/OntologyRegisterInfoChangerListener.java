package com.asiainfo.event.listener;

import com.asiainfo.common.ApisixReg;
import com.asiainfo.config.RouteRegister;
import com.asiainfo.event.OntologyRegisterInfoChangeEvent;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class OntologyRegisterInfoChangerListener {
    @Autowired
    private RouteRegister routeRegister;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOntologyRegisterInfoChange(OntologyRegisterInfoChangeEvent event) {
        log.info("OntologyRegisterInfoChangeEvent: {}", event);
        routeRegister.registerRoute(event.getAgentType(), event.getHost(), event.getPort(), StringUtils.defaultIfEmpty(event.getReg(), ApisixReg.AAP_REG));
    }
}

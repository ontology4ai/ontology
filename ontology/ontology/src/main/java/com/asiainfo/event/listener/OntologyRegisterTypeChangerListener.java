package com.asiainfo.event.listener;

import com.asiainfo.config.RegisterFactory;
import com.asiainfo.event.OntologyRegisterTypeChangeEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class OntologyRegisterTypeChangerListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOntologyRegisterTypeChange(OntologyRegisterTypeChangeEvent event) {
        log.info("OntologyRegisterTypeChangeEvent: {}", event);
        RegisterFactory.getRegister(event.getAgentType()).registerRoute();
    }
}

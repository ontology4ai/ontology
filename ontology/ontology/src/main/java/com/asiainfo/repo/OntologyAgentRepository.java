package com.asiainfo.repo;

import com.asiainfo.po.OntologyAgentPo;
import com.asiainfo.po.OntologyHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyPo JPA仓库接口
 */
@Repository
public interface OntologyAgentRepository extends JpaRepository<OntologyAgentPo, String>, JpaSpecificationExecutor<OntologyAgentPo> {
        OntologyAgentPo findByOntologyId(String ontologyId);
}

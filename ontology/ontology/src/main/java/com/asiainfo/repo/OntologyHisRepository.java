package com.asiainfo.repo;

import com.asiainfo.po.OntologyHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyPo JPA仓库接口
 */
@Repository
public interface OntologyHisRepository extends JpaRepository<OntologyHisPo, String>, JpaSpecificationExecutor<OntologyHisPo> {

}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfaceConstraintHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyInterfaceConstraintHisPo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceConstraintHisRepository extends JpaRepository<OntologyInterfaceConstraintHisPo, String>, JpaSpecificationExecutor<OntologyInterfaceConstraintHisPo> {

}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfaceAttributeHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;


/**
 * OntologyInterfaceAttributeHisPo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceAttributeHisRepository extends JpaRepository<OntologyInterfaceAttributeHisPo, String>, JpaSpecificationExecutor<OntologyInterfaceAttributeHisPo> {

}

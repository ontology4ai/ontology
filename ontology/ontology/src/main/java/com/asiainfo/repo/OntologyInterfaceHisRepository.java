package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfaceHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;


/**
 * OntologyInterfaceHisPo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceHisRepository extends JpaRepository<OntologyInterfaceHisPo, String>, JpaSpecificationExecutor<OntologyInterfaceHisPo> {

}

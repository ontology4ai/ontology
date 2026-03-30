package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeAttributeHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologyObjectTypeAttributeHisRepository extends JpaRepository<OntologyObjectTypeAttributeHisPo, String>, JpaSpecificationExecutor<OntologyObjectTypeAttributeHisPo> {

}

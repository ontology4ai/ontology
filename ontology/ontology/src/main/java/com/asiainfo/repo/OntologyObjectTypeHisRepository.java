package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyObjectTypeHisRepository extends JpaRepository<OntologyObjectTypeHisPo, String>, JpaSpecificationExecutor<OntologyObjectTypeHisPo> {

}

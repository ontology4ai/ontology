package com.asiainfo.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.asiainfo.po.OntologyApiFunctionPo;

/**
 * API参数 Repository
 */
@Repository
public interface OntologyApiFunctionRepository
        extends JpaRepository<OntologyApiFunctionPo, String>, JpaSpecificationExecutor<OntologyApiFunctionPo> {

}

package com.asiainfo.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.asiainfo.po.OntologyDataChangeLogPo;

@Repository
public interface OntologyDataChangeRepository
        extends JpaRepository<OntologyDataChangeLogPo, String>, JpaSpecificationExecutor<OntologyDataChangeLogPo> {

}

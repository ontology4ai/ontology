package com.asiainfo.repo;

import com.asiainfo.po.OntologyChangeLogPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyChangeLogPo JPA仓库接口
 */
@Repository
public interface OntologyChangeLogRepository extends JpaRepository<OntologyChangeLogPo, String>, JpaSpecificationExecutor<OntologyChangeLogPo> {

}

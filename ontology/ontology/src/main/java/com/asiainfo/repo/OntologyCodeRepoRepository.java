package com.asiainfo.repo;

import com.asiainfo.po.OntologyCodeRepoPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * 代码仓库 Repository
 */
@Repository
public interface OntologyCodeRepoRepository extends JpaRepository<OntologyCodeRepoPo, String>, JpaSpecificationExecutor<OntologyCodeRepoPo> {

}

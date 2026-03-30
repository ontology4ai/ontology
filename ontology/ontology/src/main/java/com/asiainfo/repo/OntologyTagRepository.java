package com.asiainfo.repo;

import com.asiainfo.po.OntologyTagPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyTagPo JPA仓库接口
 *
 * @author hulin
 * @since 2025-09-09
 */
@Repository
public interface OntologyTagRepository extends JpaRepository<OntologyTagPo, String>, JpaSpecificationExecutor<OntologyTagPo> {
}

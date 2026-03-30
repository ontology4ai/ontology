package com.asiainfo.repo;

import com.asiainfo.po.OntologyPromptConfigPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * OntologyPromptConfigPo JPA仓库接口
 */
@Repository
public interface OntologyPromptConfigRepository
      extends JpaRepository<OntologyPromptConfigPo, String>, JpaSpecificationExecutor<OntologyPromptConfigPo> {

}

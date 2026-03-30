package com.asiainfo.repo;

import com.asiainfo.po.OntologyPublishApiPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OntologyPublishApiRepository extends JpaRepository<OntologyPublishApiPo, String>, JpaSpecificationExecutor<OntologyPublishApiPo> {
    // 可根据需要添加自定义查询方法

    int deleteByOntologyId(String ontologyId);
}
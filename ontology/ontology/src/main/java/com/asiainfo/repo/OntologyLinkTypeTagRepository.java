package com.asiainfo.repo;

import com.asiainfo.po.OntologyLinkTypeTagPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyLinkTypeTagPo JPA仓库接口
 */
@Repository
public interface OntologyLinkTypeTagRepository extends JpaRepository<OntologyLinkTypeTagPo, String>, JpaSpecificationExecutor<OntologyLinkTypeTagPo> {

    void deleteByLinkTypeId(String linkTypeId);

    List<OntologyLinkTypeTagPo> findByLinkTypeIdAndLinkDirect(String linkTypeId, String linkDirect);

    List<OntologyLinkTypeTagPo> findByLinkTypeIdIn(List<String> linkTypeIds);
}

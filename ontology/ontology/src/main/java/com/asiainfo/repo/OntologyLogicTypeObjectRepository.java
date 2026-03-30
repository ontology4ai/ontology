package com.asiainfo.repo;

import com.asiainfo.po.OntologyLogicTypeObjectPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 逻辑类型对象
 */
@Repository
public interface OntologyLogicTypeObjectRepository
        extends JpaRepository<OntologyLogicTypeObjectPo, String>, JpaSpecificationExecutor<OntologyLogicTypeObjectPo> {

    List<OntologyLogicTypeObjectPo> findByLogicTypeId(String logicTypeId);

    @Query("select p from OntologyLogicTypeObjectPo p where p.ontologyId = :ontologyId and p.objectTypeId = :objectTypeId")
    List<OntologyLogicTypeObjectPo> findRelationByObjectTypeId(@Param("ontologyId") String ontologyId,
            @Param("objectTypeId") String objectTypeId);

    @Query("select p from OntologyLogicTypeObjectPo p where p.ontologyId = :ontologyId and p.logicTypeId in (:logicTypeIds)")
    List<OntologyLogicTypeObjectPo> findByLogicTypeIdIn(@Param("ontologyId") String ontologyId, @Param("logicTypeIds") List<String> logicTypeIds);
}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeActionPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.po.OntologySharedAttributePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologySharedAttributeRepository extends JpaRepository<OntologySharedAttributePo, String>, JpaSpecificationExecutor<OntologySharedAttributePo> {

    @Modifying
    @Query("update OntologySharedAttributePo o set o.syncStatus = 3 where o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);

    @Query("select  o from OntologySharedAttributePo o  where o.syncStatus < 3 and o.ontologyId = :oid")
    List<OntologySharedAttributePo> findExistByOntologyId(@Param("oid") String oid);

}
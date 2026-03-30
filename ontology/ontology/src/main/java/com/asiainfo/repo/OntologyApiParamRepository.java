package com.asiainfo.repo;

import com.asiainfo.po.OntologyApiParamPo;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * API参数 Repository
 */
@Repository
public interface OntologyApiParamRepository
        extends JpaRepository<OntologyApiParamPo, String>, JpaSpecificationExecutor<OntologyApiParamPo> {
    @Query("select p from OntologyApiParamPo p where p.apiId = :apiId")
    List<OntologyApiParamPo> findApiParambyApiId(@Param("apiId") String apiId);

    void deleteByApiId(String apiId);

    @Query("select p from OntologyApiParamPo p left join OntologyApiParamPo q on p.parentId = q.id and p.apiId = q.apiId and q.paramType = 'array' where p.id = :id and p.apiId = :apiId and q.id IS NOT NULL")
    List<OntologyApiParamPo> findVirtualApiParamList(@Param("apiId") String apiId, @Param("id") String id);
}

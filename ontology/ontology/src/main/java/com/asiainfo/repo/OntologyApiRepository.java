package com.asiainfo.repo;

import com.asiainfo.po.OntologyApiPo;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * api Repository
 */
@Repository
public interface OntologyApiRepository
                extends JpaRepository<OntologyApiPo, String>, JpaSpecificationExecutor<OntologyApiPo> {
        @Query("select p from OntologyApiPo p where p.workspaceId = :workspaceId order by p.lastUpdate desc")
        List<OntologyApiPo> findAvailableApibyWorkspaceId(@Param("workspaceId") String workspaceId);

        @Query("select p from OntologyApiPo p where p.workspaceId = :workspaceId and p.apiName = :apiName")
        List<OntologyApiPo> findAvailableApibyApiName(@Param("workspaceId") String workspaceId,
                        @Param("apiName") String apiName);
}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyActionProcessDetailPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyActionProcessDetailPo JPA仓库接口
 */
@Repository
public interface OntologyActionProcessDetailRepository extends JpaRepository<OntologyActionProcessDetailPo, String>, JpaSpecificationExecutor<OntologyActionProcessDetailPo> {
    List<OntologyActionProcessDetailPo> findByTaskId(String taskId);

    @Modifying
    @Query("DELETE FROM OntologyActionProcessDetailPo WHERE taskId = :taskId")
    void deleteByTaskId(@Param("taskId") String taskId);
}

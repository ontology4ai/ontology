package com.asiainfo.repo;

import com.asiainfo.po.OntologyActionProcessPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyPo JPA仓库接口
 */
@Repository
public interface OntologyActionProcessRepository extends JpaRepository<OntologyActionProcessPo, String>, JpaSpecificationExecutor<OntologyActionProcessPo> {
    OntologyActionProcessPo findByTaskId(String taskId);


    @Query("select  p from OntologyActionProcessPo p where p.taskName like :query or p.message like :query")
    List<OntologyActionProcessPo> findByKeyWord(@Param("query") String query);

    @Modifying
    @Query("update OntologyActionProcessPo p set p.operStatus = 3 where p.id in (:ids)")
    void deleteByIds(@Param("ids") List<String> ids);
}

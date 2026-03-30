package com.asiainfo.repo;

import com.asiainfo.po.OntologyInitDataTaskPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 *
 *
 * @author hulin
 * @since 2025-12-25
 */
@Repository
public interface OntologyInitDataTaskRepository extends JpaRepository<OntologyInitDataTaskPo, String>, JpaSpecificationExecutor<OntologyInitDataTaskPo> {
    List<OntologyInitDataTaskPo> findByTaskId(String taskId);

    @Transactional
    @Modifying
    @Query("update OntologyInitDataTaskPo p set p.status = :status, p.message = :message where p.taskId = :taskId and p.jobCode in (:jobCodeList)")
    void updateTaskStatus(@Param("taskId") String taskId, @Param("jobCodeList") List<String> jobCodeList, @Param("status") Integer status, @Param("message") String message);

    @Transactional
    @Modifying
    @Query("update OntologyInitDataTaskPo p set p.status = :status, p.message = :message where p.taskId = :taskId and p.jobCode = :jobCode")
    void updateTaskStatus(@Param("taskId") String taskId, @Param("jobCode") String jobCode, @Param("status") Integer status, @Param("message") String message);
}

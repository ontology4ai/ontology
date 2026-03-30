package com.asiainfo.repo;

import com.asiainfo.dto.GroupDifyTaskDto;
import com.asiainfo.po.OntologyDifyTaskPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * OntologyDifyTaskPo JPA仓库接口
 */
@Repository
public interface OntologyDifyTaskRepository
      extends JpaRepository<OntologyDifyTaskPo, String>, JpaSpecificationExecutor<OntologyDifyTaskPo> {

    @Query("select p from OntologyDifyTaskPo p where p.batchNum = :batchNum")
    List<OntologyDifyTaskPo> findByBatchNum(@Param("batchNum") String batchNum);

    @Query("select p.id from OntologyDifyTaskPo p where p.batchNum = :batchNum")
    List<String> findIdsByBatchNum(@Param("batchNum") String batchNum);

    @Query(value = "select * from ontology_dify_task where batch_num=:batchNum and batch_idx = 1", nativeQuery = true)
    Optional<OntologyDifyTaskPo> findTopByBatchNum(@Param("batchNum") String batchNum);

    @Query("select max(p.batchIndex) from OntologyDifyTaskPo p where p.batchNum = :batchNum")
    Integer findCaseTotalByBatchNum(@Param("batchNum") String batchNum);

    @Query(value = "select * from ontology_dify_task " +
            "where case_id =:caseId " +
            "and type = 1 " +
            "and status = 2 " +
            "or status = 3 " +
            "order by create_time desc " +
            "limit 1",
            nativeQuery = true)
    Optional<OntologyDifyTaskPo> findTopByCaseId(@Param("caseId") String caseId);

    @Query(value = "select * from ontology_dify_task " +
            "where case_id =:caseId " +
            "and prompt_type = :promptType " +
            "and type = 1 " +
            "order by create_time desc " +
            "limit 1",
            nativeQuery = true)
    Optional<OntologyDifyTaskPo> findLastTask(@Param("caseId") String caseId, @Param("promptType") Integer promptType);

    @Query(value = "select * from ontology_dify_task " +
            "where case_id =:caseId " +
            "and type = 1 " +
            "and prompt_type = :promptType " +
            "and (status = 2 or status = 3) " +
            "and create_time < :createTime " +
            "order by create_time desc " +
            "limit 1",
            nativeQuery = true)
    Optional<OntologyDifyTaskPo> findLastByCaseId(@Param("caseId") String caseId,
                                                  @Param("promptType") Integer promptType,
                                                  @Param("createTime") String createTime);

    @Query("select p.lastExecDetail from OntologyDifyTaskPo p where p.id = :id")
    String findDetailById(@Param("id") String id);

    @Query(value = "SELECT new com.asiainfo.dto.GroupDifyTaskDto(o.batchNum, o.createTime) FROM OntologyDifyTaskPo o WHERE o.execUser = :execUser and o.promptType = :promptType GROUP BY o.batchNum, o.createTime ORDER BY o.createTime DESC",
            countQuery = "SELECT COUNT(DISTINCT o.batchNum) FROM OntologyDifyTaskPo o WHERE o.execUser = :execUser and o.promptType = :promptType")
    Page<GroupDifyTaskDto> findBatchNumByUser(@Param("execUser") String execUser, @Param("promptType") Integer promptType, Pageable pageable);
}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyUseCasePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyUseCasePo JPA仓库接口
 */
@Repository
public interface OntologyUseCaseRepository
      extends JpaRepository<OntologyUseCasePo, String>, JpaSpecificationExecutor<OntologyUseCasePo> {

    @Query("select p.question from OntologyUseCasePo p where p.id = :caseId")
    String findQuestionById(@Param("caseId") String caseId);

    @Query("select p.expectedResult from OntologyUseCasePo p where p.id = :caseId")
    String findExpectedById(@Param("caseId") String caseId);

    @Query("select p from OntologyUseCasePo p where p.ontologyId = :ontologyId and  p.workspaceId=:workspaceId order by p.createTime desc")
    List<OntologyUseCasePo> findByOwner(@Param("ontologyId") String ontologyId, @Param("workspaceId") String workspaceId);
}

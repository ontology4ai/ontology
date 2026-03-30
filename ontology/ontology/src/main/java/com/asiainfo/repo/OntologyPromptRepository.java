package com.asiainfo.repo;

import com.asiainfo.po.OntologyPromptPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyPromptPo JPA仓库接口
 */
@Repository
public interface OntologyPromptRepository
      extends JpaRepository<OntologyPromptPo, String>, JpaSpecificationExecutor<OntologyPromptPo> {

    @Modifying
    @Query("update OntologyPromptPo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
    int deleteByIds(@Param("ids") List<String> ids);

    @Query("select count(p.id) from OntologyPromptPo p where p.ontologyId=:ontologyId and p.promptType=:promptType and p.promptName=:promptName and p.operStatus < 3 and p.syncStatus < 3")
    int countByPromptName(@Param("ontologyId") String ontologyId, @Param("promptType") Integer promptType, @Param("promptName") String promptName);

    @Query("select p from OntologyPromptPo p where p.ontologyId=:ontologyId and p.promptType=:promptType and p.promptName=:promptName and p.operStatus < 3 and p.syncStatus < 3")
    OntologyPromptPo findByPromptName(@Param("ontologyId") String ontologyId, @Param("promptType") Integer promptType, @Param("promptName") String promptName);

    @Query("select p from OntologyPromptPo p where p.ontologyId=:ontologyId and (p.workspaceId=:workspaceId or p.workspaceId is Null) and p.promptType=:promptType and p.operStatus < 3 and p.syncStatus < 3 order by p.promptName")
    List<OntologyPromptPo> findByPromptType(@Param("ontologyId") String ontologyId, @Param("workspaceId") String workspaceId, @Param("promptType") Integer promptType);

    @Query("select p.id from OntologyPromptPo p where p.ontologyId=:ontologyId and p.defaultType=1 and (p.workspaceId=:workspaceId or p.workspaceId is Null) and p.promptType=:promptType and p.operStatus < 3 and p.syncStatus < 3")
    String findDefaultPromptByType(@Param("ontologyId") String ontologyId, @Param("workspaceId") String workspaceId, @Param("promptType") Integer promptType);

    @Query("select p.promptName from OntologyPromptPo p where p.id=:id")
    String findNameById(@Param("id") String id);

    @Query(value = "select distinct owner_id from ontology_prompt where ontology_id = :ontologyId and (workspace_id=:workspaceId or workspace_id is Null) and owner_id is not null", nativeQuery = true)
    List<String> findOwnerByOntologyId(@Param("ontologyId") String ontologyId, @Param("workspaceId") String workspaceId);

    @Query("select count(p.id) from OntologyPromptPo p where p.ontologyId=:ontologyId and (p.workspaceId=:workspaceId or p.workspaceId is Null) and p.operStatus < 3 and p.syncStatus < 3")
    int countByOntologyId(@Param("ontologyId") String ontologyId, @Param("workspaceId") String workspaceId);

}

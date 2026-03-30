package com.asiainfo.repo;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.asiainfo.po.OntologySimuScenePo;

@Repository
public interface OntologySimuSceneRepository
                extends JpaRepository<OntologySimuScenePo, String>, JpaSpecificationExecutor<OntologySimuScenePo> {
        List<OntologySimuScenePo> findAllByWorkspaceId(String workspaceId);

        @Query(value = "select o from OntologySimuScenePo o where o.ontologyId=:ontologyId and o.workspaceId = :workspaceId ")
        List<OntologySimuScenePo> findAllByOntologyId(String ontologyId, String workspaceId);

        // 启用/禁用本体时需要同步仿真场景的status
        @Modifying
        @Query("update OntologySimuScenePo scene set scene.status = :status where scene.ontologyId = :ontologyId and scene.workspaceId = :workspaceId")
        int updateStatusByOntologyId(@Param("workspaceId") String workspaceId, @Param("ontologyId") String ontologyId,
                        @Param("status") Integer status);

        @Modifying
        @Query("update OntologySimuScenePo scene set scene.canvasId = :canvasId where scene.workspaceId = :workspaceId and scene.id = :sceneId")
        int updateCanvasId(@Param("workspaceId") String workspaceId, @Param("sceneId") String sceneId,
                        @Param("canvasId") String canvasId);

        @Query(value = "select o from OntologySimuScenePo o where o.canvasId=:canvasId and o.workspaceId = :workspaceId ")
        List<OntologySimuScenePo> findByCanvasId(@Param("workspaceId") String workspaceId,
                        @Param("canvasId") String canvasId);
}

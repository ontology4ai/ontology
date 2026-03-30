package com.asiainfo.repo;

import com.asiainfo.po.OntologyPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * OntologyPo JPA仓库接口
 */
@Repository
public interface OntologyRepository extends JpaRepository<OntologyPo, String>, JpaSpecificationExecutor<OntologyPo> {

        /**
         * 批量软删除，将sync_status字段设为3
         * 
         * @param ids 需要删除的id列表
         * @return 更新条数
         */
        @Modifying
        @Query("update OntologyPo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
        int softDeleteByIds(@Param("ids") List<String> ids);

        @Modifying
        @Query("update OntologyPo o set o.isFavorite = :isFavorite where o.id = :id")
        int favoriteById(@Param("id") String id, @Param("isFavorite") Integer isFavorite);

        @Query("select count(*) from OntologyPo p where p.ontologyName = :ontologyName and p.operStatus < 3 and p.workspaceId = :workspaceId")
        long countByName(@Param("ontologyName") String ontologyName, @Param("workspaceId") String workspaceId);

        @Query("select count(*) from OntologyPo p where p.ontologyName = :ontologyName and p.operStatus < 3 and p.workspaceId = :workspaceId and p.id != :ontologyId")
        long countByName(@Param("ontologyId") String ontologyId, @Param("ontologyName") String ontologyName,
                        @Param("workspaceId") String workspaceId);

        @Query("select count(*) from OntologyPo p where p.ontologyLabel = :ontologyLabel and p.operStatus < 3 and p.workspaceId = :workspaceId")
        long countByLabel(@Param("ontologyLabel") String ontologyLabel, @Param("workspaceId") String workspaceId);

        @Query("select count(*) from OntologyPo p where p.ontologyLabel = :ontologyLabel and p.operStatus < 3 and p.workspaceId = :workspaceId and p.id != :ontologyId")
        long countByLabel(@Param("ontologyId") String ontologyId, @Param("ontologyLabel") String ontologyLabel,
                        @Param("workspaceId") String workspaceId);

        /**
         * 根据英文名查询本体
         * 
         * @param ontologyName 本体英文名
         * @return 匹配的本体
         */
        @Query(value = "select * from ontology_manage o where o.ontology_name = :ontologyName and o.oper_status < :operStatus order by o.last_update desc limit 1", nativeQuery = true)
        Optional<OntologyPo> findFirstByOntologyName(@Param("ontologyName") String ontologyName,
                        @Param("operStatus") Integer operStatus);

        @Modifying
        @Query("update OntologyPo o set o.lastUpdate = :lastUpdate where o.id = :id")
        void updateLastUpdateById(@Param("lastUpdate") LocalDateTime lastUpdate, @Param("id") String id);

        @Query(value = "select o from OntologyPo o where o.operStatus < 3 and o.workspaceId = :workspaceId ")
        List<OntologyPo> findAllByWorkspaceId(@Param("workspaceId") String workspaceId);
}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeActionPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologyObjectTypeActionRepository extends JpaRepository<OntologyObjectTypeActionPo, String>,
                JpaSpecificationExecutor<OntologyObjectTypeActionPo> {

        @Query("select p from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.operStatus < 3")
        List<OntologyObjectTypeActionPo> findAllByOntologyId(@Param("ontologyId") String ontologyId);

        @Modifying
        @Query("update OntologyObjectTypeActionPo o set o.syncStatus = 3, o.operStatus = 3 where o.operStatus < 3 and o.objectTypeId in :ids")
        int softDeleteByObjectTypeIds(@Param("ids") List<String> ids);

        @Modifying
        @Query("update OntologyObjectTypeActionPo o set o.status = 0, o.syncStatus = 2, o.operStatus = 1 where o.operStatus < 3 and o.status = 1 and o.objectTypeId in :ids")
        int disableByObjectTypeIds(@Param("ids") List<String> ids);

        @Modifying
        @Query("update OntologyObjectTypeActionPo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
        int softDeleteByIds(@Param("ids") List<String> ids);

        List<OntologyObjectTypeActionPo> findByObjectTypeIdAndSyncStatusIsNot(String objectTypeId, Integer syncStatus);

        @Query("select  o from OntologyObjectTypeActionPo o  where o.operStatus < 3 and o.objectTypeId in :oids")
        List<OntologyObjectTypeActionPo> findByObjectTypeIdExists(@Param("oids") List<String> oids);

        List<OntologyObjectTypeActionPo> findByObjectTypeIdAndSyncStatusLessThan(String objectTypeId,
                        Integer syncStatusIsLessThan);

        OntologyObjectTypeActionPo findByActionName(String actionName);

        @Query("select count(*) from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.actionName = :actionName and p.operStatus < 3")
        long countByName(@Param("ontologyId") String ontologyId, @Param("actionName") String actionName);

        @Query("select count(*) from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.actionName = :actionName and p.operStatus < 3 and p.id != :id")
        long countByName(@Param("ontologyId") String ontologyId, @Param("id") String id,
                        @Param("actionName") String actionName);

        @Query("select count(*) from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.actionLabel = :actionLabel and p.operStatus < 3")
        long countByLabel(@Param("ontologyId") String ontologyId, @Param("actionLabel") String actionName);

        @Query("select count(*) from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.actionLabel = :actionLabel and p.operStatus < 3 and p.id != :id")
        long countByLabel(@Param("ontologyId") String ontologyId, @Param("id") String id,
                        @Param("actionLabel") String actionLabel);

        @Query("select p from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.status = 1 and p.operStatus < 3")
        List<OntologyObjectTypeActionPo> findAvailableByOntologyId(@Param("ontologyId") String ontologyId);

        @Query("select p from OntologyObjectTypeActionPo p where p.status = 1 and p.operStatus < 3 and p.objectTypeId in :objectTypeIds")
        List<OntologyObjectTypeActionPo> findAvailableByObjecTypeIds(
                        @Param("objectTypeIds") List<String> objectTypeIds);

        @Query("select p from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.buildType = 'function' and p.operStatus < 3")
        List<OntologyObjectTypeActionPo> findAllWithFunction(@Param("ontologyId") String ontologyId);

        @Query("select count(o.id) from OntologyObjectTypeActionPo o  where o.ontologyId = :oid and o.operStatus < 3")
        Long countByOntologyId(@Param("oid") String oid);

        @Query("select count(o.id) from OntologyObjectTypeActionPo o  where o.ontologyId = :oid and o.buildType = 'function' and o.operStatus < 3")
        Long countFunctionByOntologyId(@Param("oid") String oid);

        @Query("select count(o.id) from OntologyObjectTypeActionPo o  where o.ontologyId = :oid and o.actionType = 'create' and o.operStatus < 3")
        Long countCreateByOntologyId(@Param("oid") String oid);

        @Query("select count(o.id) from OntologyObjectTypeActionPo o  where o.ontologyId = :oid and o.actionType = 'update' and o.operStatus < 3")
        Long countUpdateByOntologyId(@Param("oid") String oid);

        @Query("select count(o.id) from OntologyObjectTypeActionPo o  where o.ontologyId = :oid and o.actionType = 'delete' and o.operStatus < 3")
        Long countDeleteByOntologyId(@Param("oid") String oid);

        @Query("select count(*) from OntologyObjectTypeActionPo p left join OntologyObjectTypePo o on o.id = p.objectTypeId where p.id = :actionId and (o.operStatus = 3 or o.status = 0)")
        Long countDeletedOrDisabledObjectType(@Param("actionId") String actionId);

        @Query("select p from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.status = 1 and p.operStatus < 3")
        List<OntologyObjectTypeActionPo> findAvailablebyOntologyId(@Param("ontologyId") String ontologyId);

        @Query("select p from OntologyObjectTypeActionPo p where p.ontologyId = :ontologyId and p.objectTypeId = :objectTypeId and p.status = 1 and p.operStatus < 3")
        List<OntologyObjectTypeActionPo> findRelationbyObjectTypeId(@Param("ontologyId") String ontologyId,
                        @Param("objectTypeId") String objectTypeId);
}

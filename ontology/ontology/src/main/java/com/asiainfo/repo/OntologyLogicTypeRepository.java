package com.asiainfo.repo;

import com.asiainfo.po.OntologyLogicTypePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 逻辑类型
 */
@Repository
public interface OntologyLogicTypeRepository extends JpaRepository<OntologyLogicTypePo, String>, JpaSpecificationExecutor<OntologyLogicTypePo> {

    boolean existsByOntologyIdAndLogicTypeNameAndSyncStatusLessThan(String ontologyId, String logicTypeName, Integer syncStatusIsLessThan);

    boolean existsByOntologyIdAndLogicTypeLabelAndSyncStatusLessThan(String ontologyId, String logicTypeLabel, Integer syncStatusIsLessThan);

    /**
     * 根据英文名查询有效逻辑类型
     */
    @Query("select p from OntologyLogicTypePo p where p.ontologyId = :ontologyId and p.logicTypeName = :logicTypeName and p.operStatus < 3")
    Optional<OntologyLogicTypePo> findFirstByOntologyIdAndLogicTypeName(@Param("ontologyId") String ontologyId,
                                                                        @Param("logicTypeName") String logicTypeName);

    @Modifying
    @Query("update OntologyLogicTypePo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);

    List<OntologyLogicTypePo> findByOntologyIdAndSyncStatusLessThan(String ontologyId, Integer syncStatusIsLessThan);

    @Query("select p from OntologyLogicTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3")
    List<OntologyLogicTypePo> findAllByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select p from OntologyLogicTypePo p where p.ontologyId = :ontologyId and p.status = 1 and p.operStatus < 3")
    List<OntologyLogicTypePo> findAvailablebyOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select count(o.id) from OntologyLogicTypePo o  where o.ontologyId = :oid and o.operStatus < 3")
    Long countByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyLogicTypePo o  where o.ontologyId = :oid and exists (select to.id from OntologyLogicTypeObjectPo to where to.logicTypeId = o.id and to.ontologyId = :oid) and o.operStatus < 3")
    Long countRefObjectByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyLogicTypePo o  where o.ontologyId = :oid and not exists (select to.id from OntologyLogicTypeObjectPo to where to.logicTypeId = o.id and to.ontologyId = :oid) and o.operStatus < 3")
    Long countNotRefObjectByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyLogicTypePo o  where o.ontologyId = :oid and o.buildType = 'function' and o.operStatus < 3")
    Long countFunctionByOntologyId(@Param("oid") String oid);

    @Query("select p from OntologyLogicTypePo p left join OntologyLogicTypeObjectPo o on o.logicTypeId = p.id where p.status = 1 and p.operStatus < 3 and o.objectTypeId in :objectTypeIds")
    List<OntologyLogicTypePo> findAvailableByObjectTypeIds(@Param("objectTypeIds") List<String> objectTypeIds);

    @Modifying
    @Query("update OntologyLogicTypePo p set p.syncStatus = 3, p.operStatus = 3 where p.operStatus < 3 and exists (select o.id from OntologyLogicTypeObjectPo o where o.logicTypeId = p.id and o.objectTypeId in :objectTypeIds)")
    int softDeleteByObjectTypeIds(@Param("objectTypeIds") List<String> objectTypeIds);

    @Modifying
    @Query("update OntologyLogicTypePo p set p.status = 0 where exists (select o.id from OntologyLogicTypeObjectPo o where p.status = 1 and o.logicTypeId = p.id and o.objectTypeId in :objectTypeIds)")
    int disableByObjectTypeIds(@Param("objectTypeIds") List<String> objectTypeIds);

    /**
     * 查询指定的逻辑类型关联已经删除或禁用的对象类型的数量
     */
    @Query("select count(*) from OntologyLogicTypeObjectPo p where p.logicTypeId = :logicTypeId and exists (select o.id from OntologyObjectTypePo o where o.id = p.objectTypeId and (o.operStatus = 3 or o.status = 0))")
    Long countDeletedOrDisabledObjectType(@Param("logicTypeId") String logicTypeId);

    @Query("select p from OntologyLogicTypePo p where p.apiId = :apiId and p.operStatus < 3")
    List<OntologyLogicTypePo> findByApiId(@Param("apiId") String apiId);

}

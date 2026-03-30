package com.asiainfo.repo;

import com.asiainfo.dto.GroupObjectTypeDto;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.vo.search.SharedAttributeCountVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * OntologyObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyObjectTypeRepository
        extends JpaRepository<OntologyObjectTypePo, String>, JpaSpecificationExecutor<OntologyObjectTypePo> {

    @Query("select p from OntologyObjectTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3")
    List<OntologyObjectTypePo> findAllByOntologyId(@Param("ontologyId") String ontologyId);


    List<OntologyObjectTypePo> findByIdIn(List<String> ids);

    @Modifying
    @Query("update OntologyObjectTypePo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);

    @Query("select new com.asiainfo.vo.search.SharedAttributeCountVo(a.sharedAttributeId, count(*))  from OntologyObjectTypeAttributePo a join OntologyObjectTypePo o on a.objectTypeId=o.id where o.operStatus < 3 and a.operStatus < 3 and a.sharedAttributeId in :aids group by a.sharedAttributeId")
    List<SharedAttributeCountVo> countBySharedAttributeId(@Param("aids") List<String> aids);

    @Query("select  o from OntologyObjectTypePo o  where o.operStatus < 3 and o.status = 1 and o.ontologyId = :oid")
    List<OntologyObjectTypePo> findAvaliableByOntologyId(@Param("oid") String oid);

    @Query("select  o from OntologyObjectTypePo o  where o.operStatus < 3 and o.status = 1 and o.ontologyId = :oid and o.linkTypeId is null")
    List<OntologyObjectTypePo> findObjectTypeByOntologyId(@Param("oid") String oid);

    @Query("select  o from OntologyObjectTypePo o  where o.operStatus < 3 and o.ontologyId = :oid and o.linkTypeId is null")
    List<OntologyObjectTypePo> findExistByOntologyId(@Param("oid") String oid);

    List<OntologyObjectTypePo> findByOntologyId(String oid);

    Optional<OntologyObjectTypePo> findFirstById(String id);

    boolean existsByObjectTypeNameAndOntologyIdAndSyncStatusLessThan(String objectTypeName, String ontologyId,
            Integer syncStatusIsLessThan);

    boolean existsByObjectTypeLabelAndOntologyIdAndSyncStatusLessThan(String objectTypeLabel, String ontologyId,
            Integer syncStatusIsLessThan);

    List<OntologyObjectTypePo> findByOntologyIdAndObjectTypeNameAndSyncStatusLessThan(String ontologyId,
            String objectTypeName, Integer syncStatusIsLessThan);

    @Query("select p from OntologyObjectTypePo p where p.ontologyId = :ontologyId and p.objectTypeName = :objectTypeName and p.operStatus < 3")
    Optional<OntologyObjectTypePo> findByName(@Param("ontologyId") String ontologyId,
            @Param("objectTypeName") String objectTypeName);

    @Query("select new com.asiainfo.dto.GroupObjectTypeDto(o.objectTypeLabel, count(o.objectTypeLabel)) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.status = 1 and o.operStatus < 3 group by o.objectTypeLabel")
    List<GroupObjectTypeDto> countObjectTypeWithLabel(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.operStatus < 3 and o.linkTypeId is null")
    Long countByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.dsId is not null and o.operStatus < 3 and o.linkTypeId is null")
    Long countHasDsByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.dsId is null and o.operStatus < 3 and o.linkTypeId is null")
    Long countNoDsByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.interfaceId is not null and o.operStatus < 3 and o.linkTypeId is null")
    Long countHasInterfaceByOntologyId(@Param("oid") String oid);

    @Query("select count(o.id) from OntologyObjectTypePo o  where o.ontologyId = :oid and o.interfaceId is null and o.operStatus < 3 and o.linkTypeId is null")
    Long countNoInterfaceByOntologyId(@Param("oid") String oid);

    @Query("select p from OntologyObjectTypePo p where p.ontologyId = :ontologyId and p.operStatus in (0, 1)")
    List<OntologyObjectTypePo> listToBePublished(@Param("ontologyId") String ontologyId);

    @Modifying
    @Query("update OntologyObjectTypePo o set o.interfaceId = null where o.interfaceId = :interfaceId and o.id in (:ids)")
    int removeOntologyObjectTypeInterfaceById(@Param("interfaceId") String interfaceId, @Param("ids") List<String> ids);

    @Modifying
    @Query("update OntologyObjectTypePo o set o.interfaceId = null where o.interfaceId = :interfaceId ")
    int removeOntologyObjectTypeInterface(@Param("interfaceId") String interfaceId);

    @Query("select p from OntologyObjectTypePo p where p.interfaceId = :interfaceId and p.operStatus < 3")
    List<OntologyObjectTypePo> findExtendedByInterfaceId(@Param("interfaceId") String interfaceId);

    @Query("select p from OntologyObjectTypePo p where p.interfaceId = :interfaceId and p.ontologyId = :ontologyId and p.operStatus < 3")
    List<OntologyObjectTypePo> findExtendedByInterfaceId(@Param("interfaceId") String interfaceId, @Param("ontologyId") String ontologyId);

    @Query("select p from OntologyObjectTypePo p where p.linkTypeId in :linkTypeIds and p.operStatus < 3")
    List<OntologyObjectTypePo> findByLinkTypeId(@Param("linkTypeIds") List<String> linkTypeId);

    @Query("select p from OntologyObjectTypePo p where p.objectTypeName = :objectTypeName and p.ontologyId = :oid and p.operStatus < 3 ")
    List<OntologyObjectTypePo> findByObjectTypeName(@Param("objectTypeName") String objectTypeName, @Param("oid") String oid);
}


/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
package com.asiainfo.repo;

import com.asiainfo.dto.GroupLinkTypeDto;
import com.asiainfo.po.OntologyLinkTypePo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.vo.search.SharedAttributeCountVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyLinkTypeRepository
        extends JpaRepository<OntologyLinkTypePo, String>, JpaSpecificationExecutor<OntologyLinkTypePo> {

    @Modifying
    @Query("update OntologyLinkTypePo o set o.syncStatus = 3, o.operStatus = 3 where o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);

    @Modifying
    @Query("update OntologyLinkTypePo o set o.syncStatus = 3, o.operStatus = 3 where o.sourceObjectTypeId in :ids or o.targetObjectTypeId in :ids ")
    int softDeleteByObjectIds(@Param("ids") List<String> ids);

    @Modifying
    @Query("update OntologyLinkTypePo o set o.status = 0, o.syncStatus = 2, o.operStatus = 1 where o.operStatus < 3 and (o.sourceObjectTypeId in :ids or o.targetObjectTypeId in :ids) ")
    int disabledByObjectIds(@Param("ids") List<String> ids);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and (p.sourceObjectTypeId = :objectTypeId or p.targetObjectTypeId = :objectTypeId) and p.operStatus < 3")
    List<OntologyLinkTypePo> findAvailableByObjectTypeId(@Param("ontologyId") String ontologyId,
            @Param("objectTypeId") String objectTypeId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId  and p.operStatus < 3")
    List<OntologyLinkTypePo> findByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select new com.asiainfo.dto.GroupLinkTypeDto(p.sourceLabel, count(p.sourceLabel)) from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3 group by p.sourceLabel")
    List<GroupLinkTypeDto> countLinkTypeWithSourceLabel(@Param("ontologyId") String ontologyId);

    @Query("select new com.asiainfo.dto.GroupLinkTypeDto(p.targetLabel, count(p.targetLabel)) from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3 group by p.targetLabel")
    List<GroupLinkTypeDto> countLinkTypeWithTargetLabel(@Param("ontologyId") String ontologyId);

    @Query("select new com.asiainfo.dto.GroupLinkTypeDto(p.sourceObjectTypeId, count(p.sourceObjectTypeId)) from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3 group by p.sourceObjectTypeId")
    List<GroupLinkTypeDto> countLinkTypeWithSourceTypeId(@Param("ontologyId") String ontologyId);

    @Query("select new com.asiainfo.dto.GroupLinkTypeDto(p.targetObjectTypeId, count(p.targetObjectTypeId)) from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.operStatus < 3 group by p.targetObjectTypeId")
    List<GroupLinkTypeDto> countLinkTypeWithTargetTypeId(@Param("ontologyId") String ontologyId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.status = 1 and p.operStatus < 3")
    List<OntologyLinkTypePo> findAvailableByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.sourceObjectTypeId = :sourceTypeId and p.targetObjectTypeId =:targetTypeId and p.operStatus < 3")
    List<OntologyLinkTypePo> findLinkListByIds(@Param("ontologyId") String ontologyId,
            @Param("sourceTypeId") String sourceTypeId, @Param("targetTypeId") String targetTypeId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.sourceObjectTypeId = :objectTypeId and p.operStatus < 3 and p.status = 1")
    List<OntologyLinkTypePo> findSorceRelationtByObjectTypeId(@Param("ontologyId") String ontologyId,
            @Param("objectTypeId") String objectTypeId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and p.targetObjectTypeId =:objectTypeId and p.operStatus < 3 and p.status = 1")
    List<OntologyLinkTypePo> findTargetRelationtByObjectTypeId(@Param("ontologyId") String ontologyId,
            @Param("objectTypeId") String objectTypeId);

    @Query("select p from OntologyLinkTypePo p where p.ontologyId = :ontologyId and (p.targetObjectTypeId in (:objectTypeIds) or p.sourceObjectTypeId in (:objectTypeIds)) and p.operStatus < 3")
    List<OntologyLinkTypePo> findByObjectTypeIds(@Param("ontologyId") String ontologyId, @Param("objectTypeIds") List<String> objectTypeIds);
}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeAttributePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologyObjectTypeAttributeRepository extends JpaRepository<OntologyObjectTypeAttributePo, String> {

    @Modifying
    @Query("update OntologyObjectTypeAttributePo o set o.syncStatus = 3, o.operStatus = 3 where o.operStatus < 3 and o.objectTypeId in :ids")
    int softDeleteByObjectIds(@Param("ids") List<String> ids);


    @Modifying
    @Query("update OntologyObjectTypeAttributePo o set o.syncStatus = 3, o.operStatus = 3 where o.operStatus < 3 and o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);


    List<OntologyObjectTypeAttributePo> findByObjectTypeIdAndSyncStatusIsNot(String objectTypeId, Integer syncStatus);

    @Query("select p from OntologyObjectTypeAttributePo p where p.operStatus < 3 and p.objectTypeId = :oid")
    List<OntologyObjectTypeAttributePo> findAvaliableByTypeId(@Param("oid") String oid);

    @Query("select p from OntologyObjectTypeAttributePo p where p.operStatus < 3 and p.objectTypeId in :ids")
    List<OntologyObjectTypeAttributePo> findAvaliableByTypeIdList(@Param("ids") List<String> ids);

    @Query("select p from OntologyObjectTypeAttributePo p where p.operStatus < 3 and p.status = 1 and p.objectTypeId = :oid")
    List<OntologyObjectTypeAttributePo> findAvaliableAndEnableByTypeId(@Param("oid") String oid);

    @Query("select p from OntologyObjectTypeAttributePo p where p.operStatus < 3 and p.status = 1 and p.objectTypeId in :ids")
    List<OntologyObjectTypeAttributePo> findAvaliableAndEnableByTypeIds(@Param("ids") List<String> ids);

    List<OntologyObjectTypeAttributePo> findByObjectTypeIdAndSyncStatusLessThan(String objectTypeId, Integer syncStatusIsLessThan);

    @Query("select p.attributeName from OntologyObjectTypeAttributePo p where p.objectTypeId = :objectTypeId and p.isPrimaryKey = 1 and p.operStatus < 3 and p.status = 1")
    String findFirstByObjectTypeId(@Param("objectTypeId") String objectTypeId);

    @Modifying
    @Query("update OntologyObjectTypeAttributePo o set o.interfaceAttrId = null, o.interfaceType = null where o.objectTypeId in (:ids)")
    int removeInterfaceByObjectIds(@Param("ids") List<String> ids);

    @Modifying
    @Query("update OntologyObjectTypeAttributePo o set o.interfaceAttrId = null, o.interfaceType = null where o.objectTypeId in (select t.id from OntologyObjectTypePo t where t.interfaceId = :interfaceId)")
    int removeInterfaceByInterfaceId(@Param("interfaceId") String interfaceId);

    @Query("select p from OntologyObjectTypeAttributePo p where p.operStatus < 3 and p.status = 1 and p.objectTypeId = :objectTypeId and p.interfaceAttrId = :interfaceAttrId")
    List<OntologyObjectTypeAttributePo> findByTypeIdAndInterAttrId(@Param("objectTypeId") String objectTypeId, @Param("interfaceAttrId") String interfaceAttrId);

}

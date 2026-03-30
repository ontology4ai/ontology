package com.asiainfo.repo;

import com.asiainfo.po.OntologyCenterPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyCenterPo JPA仓库接口
 */
@Repository
public interface OntologyCenterRepository
      extends JpaRepository<OntologyCenterPo, String>, JpaSpecificationExecutor<OntologyCenterPo> {

   @Query("select count(center.id) from OntologyCenterPo center where center.parentId = :parentId and center.status = 1 and center.syncStatus != 3")
   Long countAllById(@Param("parentId") String parentId);

   @Query("select center from OntologyCenterPo center where center.parentId = :parentId and center.status = 1 and center.syncStatus != 3 order by center.lastUpdate desc")
   List<OntologyCenterPo> findAllByParentId(@Param("parentId") String parentId);

   @Modifying
   @Query("update OntologyCenterPo center set center.syncStatus = 3 where center.id = :centerId")
   int updateSyncStatusById(@Param("centerId") String centerId);

   @Modifying
   @Query(value = "update ontology_share_center set is_leaf = :isLeaf where id = :centerId", nativeQuery = true)
   int updateLeafStatusById(@Param("centerId") String centerId, @Param("isLeaf") Integer isLeaf);

}

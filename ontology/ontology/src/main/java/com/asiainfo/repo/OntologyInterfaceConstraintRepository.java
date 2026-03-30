package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfaceConstraintPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyInterfaceConstraintPo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceConstraintRepository extends JpaRepository<OntologyInterfaceConstraintPo, String>, JpaSpecificationExecutor<OntologyInterfaceConstraintPo> {

    @Modifying
    @Query("update OntologyInterfaceConstraintPo constraint set constraint.operStatus = 3 where constraint.id = :constraintId")
    int deleteByConstraintId(@Param("constraintId") String constraintId);

    @Query("select constraint from OntologyInterfaceConstraintPo constraint where constraint.interfaceId = :interfaceId and constraint.operStatus != 3 ")
    List<OntologyInterfaceConstraintPo> findAllByInterfaceId(@Param("interfaceId") String interfaceId);

}

package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeActionParamPo;
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
public interface OntologyObjectTypeActionParamRepository extends JpaRepository<OntologyObjectTypeActionParamPo, String> {

    List<OntologyObjectTypeActionParamPo> findByActionId(String actionId);

    @Modifying
    @Query("delete from OntologyObjectTypeActionParamPo p where p.id in :ids")
    void deleteByIds(@Param("ids") List<String> ids);

    void deleteByActionId(String actionId);
}
package com.asiainfo.repo;

import com.asiainfo.po.OntologyConfigGroupPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
// import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 配置分组 Repository
 */
@Repository
public interface OntologyConfigGroupRepository
        extends JpaRepository<OntologyConfigGroupPo, String>, JpaSpecificationExecutor<OntologyConfigGroupPo> {
    // @Modifying
    // @Query("update OntologyConfigGroupPo g set g.syncStatus = 3, g.operStatus = 3
    // where g.id in :ids")
    // void softDeleteByIds(@Param("ids") List<String> ids);

    @Query("select count(*) from OntologyConfigGroupPo g where g.code = :code and g.operStatus < 3")
    long countByCode(@Param("code") String code);

    @Query("select count(*) from OntologyConfigGroupPo g where g.code = :code and g.id != :id and g.operStatus < 3")
    long countByCode(@Param("code") String code, @Param("id") String id);

    Optional<OntologyConfigGroupPo> findByStatus(Integer status);
}
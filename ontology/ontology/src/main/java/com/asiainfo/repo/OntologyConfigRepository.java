package com.asiainfo.repo;

import com.asiainfo.po.OntologyConfigPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyConfigPo JPA仓库接口
 */
@Repository
public interface OntologyConfigRepository
        extends JpaRepository<OntologyConfigPo, String>, JpaSpecificationExecutor<OntologyConfigPo> {

    @Query("select config from OntologyConfigPo config where config.operStatus != 3 and config.configSource is null")
    List<OntologyConfigPo> findAll();

    @Query("select config from OntologyConfigPo config where config.configKey = :configKey and config.operStatus != 3 and config.configSource is null")
    OntologyConfigPo findKey(@Param("configKey") String configKey);

    @Query("select config.configValue from OntologyConfigPo config where config.configKey = :configKey and config.operStatus != 3")
    String findValueByKey(@Param("configKey") String configKey);

    // @Modifying
    // @Query("update OntologyConfigPo g set g.syncStatus = 3, g.operStatus = 3
    // where g.configType = :configType")
    // void softDeleteByConfigType(@Param("configType") String configType);

    @Query("select config from OntologyConfigPo config where config.configKey = :configKey")
    List<OntologyConfigPo> findConfigs(@Param("configKey") String configKey);

    @Query("select p from OntologyConfigPo p where p.configType = :configType and p.configSource = 'group'")
    List<OntologyConfigPo> findByGroup(@Param("configType") String configType);

    @Modifying
    @Query("delete from OntologyConfigPo g where g.configType=:configType and g.configSource=:configSource")
    int deleteByConfigType(@Param("configType") String configType, @Param("configSource") String configSource);

    int deleteByConfigType(String configType);
}

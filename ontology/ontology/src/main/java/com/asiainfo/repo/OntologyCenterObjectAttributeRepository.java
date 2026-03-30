package com.asiainfo.repo;

import com.asiainfo.po.OntologyCenterObjectAttributePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * OntologyCenterObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyCenterObjectAttributeRepository
        extends JpaRepository<OntologyCenterObjectAttributePo, String>,
        JpaSpecificationExecutor<OntologyCenterObjectAttributePo> {

    @Query("select  attribute from OntologyCenterObjectAttributePo attribute  where attribute.objectTypeId = :objectTypeId")
    List<OntologyCenterObjectAttributePo> findByObjectTypeId(@Param("objectTypeId") String objectTypeId);

}

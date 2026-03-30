package com.asiainfo.repo;

import com.asiainfo.po.OntologyCenterObjectTypePo;
import com.asiainfo.po.OntologyObjectTypePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


/**
 * OntologyCenterObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyCenterObjectTypeRepository
        extends JpaRepository<OntologyCenterObjectTypePo, String>,
        JpaSpecificationExecutor<OntologyCenterObjectTypePo> {

}

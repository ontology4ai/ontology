package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfaceAttributePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyInterfaceAttributePo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceAttributeRepository extends JpaRepository<OntologyInterfaceAttributePo, String>, JpaSpecificationExecutor<OntologyInterfaceAttributePo> {

    @Query("select arrribute from OntologyInterfaceAttributePo arrribute where arrribute.interfaceId = :interfaceId and arrribute.operStatus != 3 order by arrribute.lastUpdate desc")
    List<OntologyInterfaceAttributePo> findAllByInterfaceId(@Param("interfaceId") String interfaceId);
}

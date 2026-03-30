package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeActionHisPo;
import com.asiainfo.po.OntologyObjectTypeActionPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologyObjectTypeActionHisRepository extends JpaRepository<OntologyObjectTypeActionHisPo, String>, JpaSpecificationExecutor<OntologyObjectTypeActionHisPo> {

    @Query("select p from OntologyObjectTypeActionHisPo p join OntologyPo ot on ot.id = p.ontologyId where ot.latestVersion = p.latestVersion and  p.ontologyId = :ontologyId ")
    List<OntologyObjectTypeActionHisPo> findPub(@Param("ontologyId") String ontologyId);
}

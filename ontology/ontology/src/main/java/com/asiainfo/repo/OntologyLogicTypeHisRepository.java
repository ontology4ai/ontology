package com.asiainfo.repo;

import com.asiainfo.po.OntologyLogicTypeHisPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 逻辑类型
 */
@Repository
public interface OntologyLogicTypeHisRepository extends JpaRepository<OntologyLogicTypeHisPo, String>, JpaSpecificationExecutor<OntologyLogicTypeHisPo> {

    @Query("select p from OntologyLogicTypeHisPo p join OntologyPo ot on ot.id = p.ontologyId where ot.latestVersion = p.latestVersion and  p.ontologyId = :ontologyId ")
    List<OntologyLogicTypeHisPo> findPub(@Param("ontologyId") String ontologyId);
}

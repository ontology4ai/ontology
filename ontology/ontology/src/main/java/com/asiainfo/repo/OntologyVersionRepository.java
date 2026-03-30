package com.asiainfo.repo;

import com.asiainfo.po.OntologyVersionPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * OntologyTagPo JPA仓库接口
 *
 * @author hulin
 * @since 2025-09-09
 */
@Repository
public interface OntologyVersionRepository extends JpaRepository<OntologyVersionPo, String>, JpaSpecificationExecutor<OntologyVersionPo> {
    List<OntologyVersionPo> findByOntologyId(String ontologyId);

    List<OntologyVersionPo> findByOntologyIdAndLatest(String ontologyId, Integer latest);

    List<OntologyVersionPo> findByLatestAndOntologyIdIn(Integer latest, Collection<String> ontologyIds);

    @Query(value = "select o.version_name from ontology_version o where o.ontology_id = :oid and o.latest = 1 and o.sync_status < 3 order by o.last_update desc limit 1", nativeQuery = true)
    String findFirstByOntologyId(@Param("oid") String oid);
}

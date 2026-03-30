package com.asiainfo.repo;

import com.asiainfo.po.OntologyInterfacePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyInterfacePo JPA仓库接口
 */
@Repository
public interface OntologyInterfaceRepository extends JpaRepository<OntologyInterfacePo, String>, JpaSpecificationExecutor<OntologyInterfacePo> {

    @Modifying
    @Query("update OntologyInterfacePo interface set interface.operStatus = 3 where interface.id = :interfaceId")
    int updateOperStatusById(@Param("interfaceId") String interfaceId);

    @Query("select interface from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and interface.operStatus != 3 order by interface.lastUpdate desc")
    List<OntologyInterfacePo> findAllByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select count(interface.id) from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and interface.name = :name and interface.operStatus < 3")
    Long countAllByName(@Param("ontologyId") String ontologyId, @Param("name") String name);

    @Query("select count(interface.id) from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and interface.label = :label and interface.operStatus < 3")
    Long countAllByLabel(@Param("ontologyId") String ontologyId, @Param("label") String label);

    @Query("select count(interface.id) from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and interface.operStatus < 3")
    Long countByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select count(interface.id) from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and exists (select ot.id from OntologyObjectTypePo ot where ot.interfaceId = interface.id and ot.ontologyId = :ontologyId and ot.operStatus < 3) and interface.operStatus < 3")
    Long countExtendObjectByOntologyId(@Param("ontologyId") String ontologyId);

    @Query("select count(interface.id) from OntologyInterfacePo interface where interface.ontologyId = :ontologyId and not exists (select ot.id from OntologyObjectTypePo ot where ot.interfaceId = interface.id and ot.ontologyId = :ontologyId and ot.operStatus < 3) and interface.operStatus < 3")
    Long countNotExtendObjectByOntologyId(@Param("ontologyId") String ontologyId);

}

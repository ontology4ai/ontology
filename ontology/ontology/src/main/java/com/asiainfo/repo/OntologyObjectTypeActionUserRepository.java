package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeActionUserPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 本体对象类型属性 Repository
 */
@Repository
public interface OntologyObjectTypeActionUserRepository extends JpaRepository<OntologyObjectTypeActionUserPo, String> {

    void deleteByActionId(String actionId);
}
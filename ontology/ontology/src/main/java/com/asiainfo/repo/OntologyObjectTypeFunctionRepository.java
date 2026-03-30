
/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
package com.asiainfo.repo;

import com.asiainfo.po.OntologyFunctionPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.vo.search.SharedAttributeCountVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyObjectTypePo JPA仓库接口
 */
@Repository
public interface OntologyObjectTypeFunctionRepository extends JpaRepository<OntologyFunctionPo, String>, JpaSpecificationExecutor<OntologyFunctionPo> {


    List<OntologyFunctionPo> findByNameAndOntologyId(String name, String ontologyId);
}

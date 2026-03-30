
/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
package com.asiainfo.repo;

import com.asiainfo.po.OntologyObjectTypeGroupPo;
import com.asiainfo.po.OntologyObjectTypePo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OntologyObjectTypeGroupPo JPA仓库接口
 */
@Repository
public interface OntologyObjectTypeGroupRepository extends JpaRepository<OntologyObjectTypeGroupPo, String>, JpaSpecificationExecutor<OntologyObjectTypeGroupPo> {


    @Modifying
    @Query("update OntologyObjectTypeGroupPo o set o.syncStatus = 3 where o.id in :ids")
    int softDeleteByIds(@Param("ids") List<String> ids);

    @Query("select  o from OntologyObjectTypeGroupPo o  where o.syncStatus != 3  and o.id in :gids")
    List<OntologyObjectTypeGroupPo> findByIds(@Param("gids") List<String> gids);
}

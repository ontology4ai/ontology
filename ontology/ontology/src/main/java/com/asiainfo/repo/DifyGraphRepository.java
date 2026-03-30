package com.asiainfo.repo;

import com.asiainfo.po.DifyGraphPo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DifyGraphPo JPA仓库接口
 */
@Repository
public interface DifyGraphRepository
      extends JpaRepository<DifyGraphPo, String>, JpaSpecificationExecutor<DifyGraphPo> {

    @Query("select p from DifyGraphPo p where p.conversationId = :conversationId")
    List<DifyGraphPo> findByConversationId(@Param("conversationId") String conversationId);
}

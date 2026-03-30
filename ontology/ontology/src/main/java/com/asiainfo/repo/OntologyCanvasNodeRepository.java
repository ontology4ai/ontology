package com.asiainfo.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.asiainfo.po.OntologyCanvasNodePo;

import java.util.List;

@Repository
public interface OntologyCanvasNodeRepository
        extends JpaRepository<OntologyCanvasNodePo, String>, JpaSpecificationExecutor<OntologyCanvasNodePo> {
    int deleteByCanvasId(String canvasId);

    List<OntologyCanvasNodePo> findByCanvasId(String canvasId);
}

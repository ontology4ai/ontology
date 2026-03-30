package com.asiainfo.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.asiainfo.po.OntologySimuCanvasPo;

@Repository
public interface OntologySimuCanvasRepository
        extends JpaRepository<OntologySimuCanvasPo, String>, JpaSpecificationExecutor<OntologySimuCanvasPo> {

}

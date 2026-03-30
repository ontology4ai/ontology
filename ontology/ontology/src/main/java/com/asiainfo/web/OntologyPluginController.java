package com.asiainfo.web;

import com.asiainfo.feign.DataosFeign;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 *
 *
 * @author hulin
 * @since 2025-12-09
 */
@Slf4j
@RestController
@RequestMapping("/_api/ontology")
public class OntologyPluginController {
    @Autowired
    private DataosFeign dataosFeign;

    @PostMapping("/object/apis/find")
    public Object findObject(@RequestBody Map<String, Object> param) {
        log.info("param = {}", param);
        return dataosFeign.findObject(param);
    }
}

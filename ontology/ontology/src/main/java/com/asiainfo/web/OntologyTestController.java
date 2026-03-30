package com.asiainfo.web;

import com.asiainfo.serivce.OntologyTestService;
import com.asiainfo.vo.operation.ChatVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

/**
 * 本体测试Controller
 *
 * @author hulin
 * @since 2025-12-17
 */
@RestController
@RequestMapping("/_api/test")
public class OntologyTestController {
    @Autowired
    private OntologyTestService ontologyTestService;

    @PostMapping(value = "/chat-messages")
    public void chat(HttpServletRequest request, @RequestBody ChatVo chatVo) {
        ontologyTestService.chat(chatVo);
    }
}

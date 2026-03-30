package com.asiainfo.web;

import com.asiainfo.serivce.OntologyApiService;
import com.asiainfo.vo.operation.SearchApiFunctionVo;

import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/ontology/api_function")
@Slf4j
public class OntologyApiFunctionController {
    @Autowired
    private OntologyApiService ontologyApiService;

    @GetMapping({ "/search" })
    @Operation(summary = "获取API")
    public Response search(HttpServletRequest request, SearchApiFunctionVo functionVo) {
        logSearch(functionVo);
        try {
            return Response.ok(ontologyApiService.findOntologyApiFunctionList(functionVo));
        } catch (Exception e) {
            log.error("获取API函数失败", e);
            return Response.error("获取API函数失败", e.getMessage());
        }
    }

    @GetMapping({ "/sync" })
    @Operation(summary = "同步API function")
    public Response syncFunction(HttpServletRequest request) {
        try {
            return Response.ok(ontologyApiService.syncApiFunction());
        } catch (Exception e) {
            log.error("同步API函数失败", e);
            return Response.error("同步API函数失败", e.getMessage());
        }
    }

    private void logSearch(SearchApiFunctionVo apiVo) {
        log.debug("search() functionName:{}", apiVo.getFunctionName());
        log.debug("search() functionId:{}", apiVo.getId());
    }
}

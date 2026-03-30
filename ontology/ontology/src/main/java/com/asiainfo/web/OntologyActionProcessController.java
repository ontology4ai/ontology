package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyActionProcessService;
import com.asiainfo.vo.search.OntologyActionProcessSearchVo;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/_api/ontology/action/process")
@Slf4j
public class OntologyActionProcessController {

    @Autowired
    OntologyActionProcessService service;

    @PostMapping({"/start"})
    @Operation(summary = "启动API")
    public Map<String, Object> start(HttpServletRequest request, @RequestBody Map<String, Object> params) throws JsonProcessingException {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        return service.startProcess(params, identity);
    }

    @PostMapping({"/query"})
    @Operation(summary = "查询状态")
    public Map<String, Object> query(HttpServletRequest request, @RequestBody String taskId) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        return service.queryProcess(taskId);
    }

    @GetMapping({"/search"})
    public Response search(OntologyActionProcessSearchVo searchVo) {
        try {
            return Response.ok(service.search(searchVo));
        } catch (Exception e) {
            log.error("导入/导出任务查询失败", e);
            return Response.error("查询失败: " + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/detail")
    public Response detial(OntologyActionProcessSearchVo searchVo) {
        return Response.ok(service.detail(searchVo));
    }

    @PostMapping("/delete")
    public Response delete(@RequestBody Map<String, List<String>> params) {
        try {
            service.delete(params);
            return Response.ok("删除成功");
        } catch (Exception e) {
            log.error("删除失败", e);
            return Response.error("删除失败: " + e.getMessage(), e.getMessage());
        }
    }
}

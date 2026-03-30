package com.asiainfo.web;

import com.asiainfo.serivce.OntologyActionProcessService;
import com.asiainfo.vo.operation.ActionCallbackVo;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/open/process")
@Slf4j
public class OntologyActionProcessCallBackController {

    @Autowired
    OntologyActionProcessService service;

    @PostMapping({"/end"})
    @Operation(summary = "结束API回调")
    public Map<String, Object> end(@RequestBody ActionCallbackVo callbackVo) {
        log.info("收到请求processEnd:{}:{}", callbackVo.getTask_id(), callbackVo.getStatus());
        return service.endProcess(callbackVo);
    }

    @GetMapping({"/stop"})
    @Operation(summary = "结束API回调")
    public Map<String, Object> stop(HttpServletRequest request, @RequestParam String processId) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        return service.killProcess(processId);
    }
}

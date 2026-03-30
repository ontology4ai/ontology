package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyImportPromptService;
import com.asiainfo.serivce.OntologyPromptConfigService;
import com.asiainfo.vo.operation.PromptConfigVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/v1/prompt/config/")
@Slf4j
public class OntologyPromptConfigController {

    @Autowired
    private OntologyPromptConfigService promptConfigService;

    @PostMapping({"/save"})
    @Operation(summary = "保存提示词配置")
    public Response save(HttpServletRequest request, @RequestBody PromptConfigVo promptConfigVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptConfigVo.setOwnerId(identity.getUserId());
            promptConfigVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptConfigService.save(promptConfigVo));
        } catch (Exception e) {
            log.error("保存提示词配置异常", e);
            return Response.error("保存提示词配置异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/detail"})
    @Operation(summary = "获取提示词配置详情")
    public Response findByUser(HttpServletRequest request, @RequestBody PromptConfigVo promptConfigVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptConfigVo.setOwnerId(identity.getUserId());
            promptConfigVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptConfigService.findByUser(promptConfigVo));
        } catch (Exception e) {
            log.error("获取提示词配置详情异常", e);
            return Response.error("获取提示词配置详情异常，" + e.getMessage(), e.getMessage());
        }
    }
}

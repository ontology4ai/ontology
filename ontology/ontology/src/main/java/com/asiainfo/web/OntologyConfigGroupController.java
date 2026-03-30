package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyConfigGroupService;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;
import com.asiainfo.vo.search.OntologyConfigGroupSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/_api/ontology/config/group")
@Slf4j
public class OntologyConfigGroupController {
    @Autowired
    private OntologyConfigGroupService sharedConfigService;

    @GetMapping({ "/search" })
    @Operation(summary = "配置分组分页查询")
    public Response search(HttpServletRequest request, OntologyConfigGroupSearchVo searchVo) {
        try {
            return Response.ok(sharedConfigService.search(searchVo));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("查询配置分组失败", e.getMessage());
        }
    }

    @GetMapping({ "/view/{id}" })
    @Operation(summary = "查询配置分组")
    public Response view(HttpServletRequest request, @PathVariable("id") String id) {
        try {
            return Response.ok(sharedConfigService.view(id));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("查询配置分组失败", e.getMessage());
        }
    }

    @GetMapping({ "/get" })
    @Operation(summary = "查询配置分组")
    public Response get(HttpServletRequest request, @RequestParam("code") String code) {
        try {
            return Response.ok(sharedConfigService.get(code));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("查询配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/save" })
    @Operation(summary = "新增配置分组")
    public Response save(HttpServletRequest request, @Valid @RequestBody OntologyConfigGroupVo sharedConfigVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        sharedConfigVo.setOwnerId(identity.getUserId());
        try {
            return Response.ok(sharedConfigService.save(sharedConfigVo));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("新增配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/update/{id}" })
    @Operation(summary = "修改配置分组")
    public Response update(HttpServletRequest request, @PathVariable String id,
            @Valid @RequestBody OntologyConfigGroupVo ontologyConfigGroupVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyConfigGroupVo.setOwnerId(identity.getUserId());
        try {
            return Response.ok(sharedConfigService.update(id, ontologyConfigGroupVo));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("修改配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/enable/{id}" })
    @Operation(summary = "启用配置分组")
    public Response enable(HttpServletRequest request, @PathVariable String id) {
        try {
            log.debug("enable() id:{}", id);
            return Response.ok(sharedConfigService.enable(id));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("启用配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/disable/{id}" })
    @Operation(summary = "禁用配置分组")
    public Response disable(HttpServletRequest request, @PathVariable String id) {
        try {
            log.debug("disable() id:{}", id);
            return Response.ok(sharedConfigService.disable(id));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("禁用配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/delete" })
    @Operation(summary = "删除配置分组")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids) {
        try {
            log.debug("delete() ids:{}", ids);
            return Response.ok(sharedConfigService.delete(ids));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("删除配置分组失败", e.getMessage());
        }
    }

    @GetMapping({ "/checkExists" })
    @Operation(summary = "校验分组编码")
    public Response checkExists(HttpServletRequest request, @RequestParam("code") String code) {
        try {
            log.debug("checkExists() code:{}", code);
            return Response.ok(sharedConfigService.checkExists(code));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("校验分组编码失败", e.getMessage());
        }
    }

    @GetMapping({ "/getEnabledAgentPlatform" })
    @Operation(summary = "查询正在启用的Agent平台配置")
    public Response getEnabledAgentPlatform(HttpServletRequest request) {
        try {
            return Response.ok(sharedConfigService.getEnabledAgentPlatformMap());
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("校验分组编码失败", e.getMessage());
        }
    }
}

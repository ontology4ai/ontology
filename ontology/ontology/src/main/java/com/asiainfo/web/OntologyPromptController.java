package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.repo.OntologyPromptRepository;
import com.asiainfo.serivce.OntologyPromptService;
import com.asiainfo.serivce.OntologyImportPromptService;
import com.asiainfo.vo.operation.PromptVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/v1/prompt")
@Slf4j
public class OntologyPromptController {

    @Autowired
    private OntologyPromptService promptService;

    @Autowired
    private OntologyPromptRepository promptRepository;

    @Autowired
    private OntologyImportPromptService importPromptService;

    @PostMapping({"/save"})
    @Operation(summary = "保存提示词")
    public Response save(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptVo.setOwnerId(identity.getUserId());
            promptVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptService.save(promptVo));
        } catch (Exception e) {
            log.error("保存提示词异常", e);
            return Response.error("保存提示词异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/edit"})
    @Operation(summary = "编辑提示词")
    public Response update(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            return Response.ok(promptService.update(promptVo));
        } catch (Exception e) {
            log.error("编辑提示词异常", e);
            return Response.error("编辑提示词异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "删除提示词")
    public Response delete(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            return Response.ok(promptService.deleteAllById(promptVo.getIdList()));
        } catch (Exception e) {
            log.error("删除提示词异常", e);
            return Response.error("删除提示词异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/detail"})
    @Operation(summary = "获取提示词详情")
    public Response getById(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            return Response.ok(promptService.findById(promptVo.getId()));
        } catch (Exception e) {
            log.error("获取提示词详情异常", e);
            return Response.error("获取提示词详情异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/explorePage")
    @Operation(summary = "分页查询提示词")
    public Response explorePage(HttpServletRequest request,
                                @RequestBody PromptVo promptVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptVo.setOwnerId(identity.getUserId());
            promptVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptService.explorePage(promptVo));
        } catch (Exception e) {
            log.error("分页查询提示词异常", e);
            return Response.error("分页查询提示词异常", e.getMessage());
        }
    }

    @PostMapping({"/importFile"})
    @Operation(summary = "提示词批量导入")
    public Response importFile(HttpServletRequest request,
                               @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.error("导入文件不能为空", null);
        }

        try {
            return Response.ok(importPromptService.importFile(file));
        } catch (Exception e) {
            log.error("提示词批量导入失败", e);
            return Response.error("提示词批量导入失败", e.getMessage());
        }
    }

    @PostMapping({"/batchSave"})
    @Operation(summary = "批量保存提示词")
    public Response batchSave(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptVo.setOwnerId(identity.getUserId());
            promptVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptService.batchSave(promptVo));
        } catch (Exception e) {
            log.error("批量保存提示词异常", e);
            return Response.error("批量保存提示词异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/listByType"})
    @Operation(summary = "按类型获取提示词列表")
    public Response findByPromptType(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            promptVo.setOwnerId(identity.getUserId());
            promptVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(promptService.findByPromptType(promptVo));
        } catch (Exception e) {
            log.error("按类型获取提示词列表异常", e);
            return Response.error("按类型获取提示词列表异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/listOwner"})
    @Operation(summary = "获取所有者列表")
    public Response listOwner(HttpServletRequest request, @RequestBody PromptVo promptVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            return Response.ok(promptRepository.findOwnerByOntologyId(promptVo.getOntologyId(), identity.getTeamName()));
        } catch (Exception e) {
            log.error("获取所有者列表异常", e);
            return Response.error("获取所有者列表异常，" + e.getMessage(), e.getMessage());
        }
    }
}

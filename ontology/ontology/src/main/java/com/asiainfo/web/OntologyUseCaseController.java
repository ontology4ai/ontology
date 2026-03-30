package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyImportCaseService;
import com.asiainfo.serivce.OntologyUseCaseService;
import com.asiainfo.vo.operation.CaseTemplateVo;
import com.asiainfo.vo.operation.UseCaseVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

@RestController
@RequestMapping("/_api/v1/case")
@Slf4j
public class OntologyUseCaseController {

    @Autowired
    private OntologyUseCaseService useCaseService;

    @Autowired
    OntologyImportCaseService importCaseService;

    @PostMapping({"/save"})
    @Operation(summary = "保存用例")
    public Response save(HttpServletRequest request, @RequestBody UseCaseVo useCaseVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            useCaseVo.setOwnerId(identity.getUserId());
            useCaseVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(useCaseService.save(useCaseVo));
        } catch (Exception e) {
            log.error("保存用例异常", e);
            return Response.error("保存用例异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/edit"})
    @Operation(summary = "更新用例")
    public Response update(HttpServletRequest request, @RequestBody UseCaseVo useCaseVo) {
        try {
            return Response.ok(useCaseService.update(useCaseVo));
        } catch (Exception e) {
            log.error("更新用例异常", e);
            return Response.error("更新用例异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "删除用例")
    public Response delete(HttpServletRequest request, @RequestBody UseCaseVo useCaseVo) {
        try {
            return Response.ok(useCaseService.deleteAllById(useCaseVo.getCaseIdList()));
        } catch (Exception e) {
            log.error("删除用例异常", e);
            return Response.error("删除用例异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/explorePage")
    @Operation(summary = "分页查询用例库")
    public Response explorePage(HttpServletRequest request,
                                @RequestBody UseCaseVo useCaseVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            useCaseVo.setOwnerId(identity.getUserId());
            useCaseVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(useCaseService.explorePage(useCaseVo));
        } catch (Exception e) {
            log.error("分页查询用例库异常", e);
            return Response.error("分页查询用例库异常", e.getMessage());
        }
    }

    @PostMapping("/listAll")
    @Operation(summary = "查询用例库")
    public Response listAll(HttpServletRequest request,
                                @RequestBody UseCaseVo useCaseVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            useCaseVo.setOwnerId(identity.getUserId());
            useCaseVo.setWorkspaceId(identity.getTeamName());
            return Response.ok(useCaseService.listAll(useCaseVo));
        } catch (Exception e) {
            log.error("分页查询用例库异常", e);
            return Response.error("分页查询用例库异常", e.getMessage());
        }
    }

    @PostMapping({"/importFile"})
    @Operation(summary = "用例批量导入")
    public Response importFile(HttpServletRequest request,
                               @RequestParam("file") MultipartFile file,
                               @RequestParam("ontologyId") String ontologyId) {
        if (file.isEmpty()) {
            return Response.error("导入文件不能为空", null);
        }

        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            List<CaseTemplateVo> caseList = importCaseService.importFile(file);

            if (!importCaseService.validateTemplate(ontologyId, caseList)) {
                return Response.failure("用例文件存在问题",caseList);
            }

            return Response.ok(useCaseService.saveBatch(ontologyId, caseList, identity.getUserId(), identity.getTeamName()));
        } catch (Exception e) {
            log.error("用例批量导入失败", e);
            return Response.error("用例批量导入失败", e.getMessage());
        }
    }

    @GetMapping(value = "/downTemplate", produces = "application/octet-stream")
    @Operation(summary = "用例模版下载")
    public void downTemplate(HttpServletRequest request,
                             HttpServletResponse response) {
        try {
            ClassPathResource resource = new ClassPathResource("template/usecase.xlsx");
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream();
                     OutputStream outputStream = response.getOutputStream()) {
                    // 明确二进制输出，避免中间件按文本转码导致文件损坏
                    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=usecase.xlsx");
                    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(resource.contentLength()));
                    StreamUtils.copy(inputStream, outputStream);
                    response.flushBuffer();
                }
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "用例模版文件不存在");
            }
        } catch (Exception e) {
            log.error("用例模版下载失败", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

}

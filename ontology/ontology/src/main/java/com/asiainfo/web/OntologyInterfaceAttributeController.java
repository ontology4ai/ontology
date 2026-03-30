package com.asiainfo.web;

import com.asiainfo.serivce.OntologyInterfaceAttributeService;
import com.asiainfo.vo.operation.OntologyInterfaceAttributeVo;
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
@RequestMapping("/_api/ontology/interface/attribute")
@Slf4j
public class OntologyInterfaceAttributeController {

    @Autowired
    OntologyInterfaceAttributeService interfaceAttributeService;

    @PostMapping({"/importFile"})
    @Operation(summary = "接口属性模版导入")
    public Response importFile(HttpServletRequest request,
                               @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.error("导入文件不能为空", null);
        }

        try {
            return Response.ok(interfaceAttributeService.importFile(file));
        } catch (Exception e) {
            log.error("接口属性导入失败", e);
            return Response.error("接口属性导入失败", e.getMessage());
        }
    }

    @GetMapping(value = "/downTemplate", produces = "application/octet-stream")
    @Operation(summary = "接口属性模版下载")
    public void downTemplate(HttpServletRequest request,
                             HttpServletResponse response) {
        try {
            ClassPathResource resource = new ClassPathResource("template/attributes.xlsx");
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream();
                     OutputStream outputStream = response.getOutputStream()) {
                    // 明确二进制输出，避免中间件按文本转码导致文件损坏
                    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attributes.xlsx");
                    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(resource.contentLength()));
                    StreamUtils.copy(inputStream, outputStream);
                    response.flushBuffer();
                }
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "接口属性模版文件不存在");
            }
        } catch (Exception e) {
            log.error("接口属性模版文件下载失败", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

}

package com.asiainfo.web;

import com.asiainfo.serivce.MinioProxyService;
import com.asiainfo.serivce.MinioProxyService.MinioFileNotFoundException;
import com.asiainfo.serivce.MinioProxyService.MinioFileObject;
import com.asiainfo.serivce.MinioProxyService.MinioProxyException;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description Minio 文件代理控制器
 */
@RestController
@RequestMapping("/api/open/minio")
@Slf4j
public class MinioProxyController {

    private final MinioProxyService minioProxyService;

    public MinioProxyController(MinioProxyService minioProxyService) {
        this.minioProxyService = minioProxyService;
    }

    @GetMapping("/file/info")
    @Operation(summary = "获取 Minio 文件详情")
    public ResponseEntity<InputStreamResource> getFileInfo(@RequestParam("teamId") String teamId,
                                                           @RequestParam("ontologyName") String ontologyName,
                                                           @RequestParam("filePath") String filePath,
                                                           @RequestParam(value = "bucket", required = false) String bucket,
                                                           @RequestParam(value = "inline", defaultValue = "false") boolean inline) {
        try {
            MinioFileObject fileObject = minioProxyService.getOntologyFile(teamId, ontologyName, filePath, bucket);
            HttpHeaders headers = buildHeaders(fileObject, inline);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(fileObject.getResponse()));
        } catch (MinioFileNotFoundException e) {
            log.warn("Minio 文件不存在, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (MinioProxyException e) {
            log.error("获取 Minio 文件失败, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }

    @GetMapping("/file/attr")
    @Operation(summary = "获取 Minio 文件属性")
    public Response getFileAttr(@RequestParam("teamId") String teamId,
                                @RequestParam("ontologyName") String ontologyName,
                                @RequestParam("filePath") String filePath,
                                @RequestParam(value = "bucket", required = false) String bucket) {
        try {
            return Response.ok(minioProxyService.getOntologyFileAttr(teamId, ontologyName, filePath, bucket));
        } catch (MinioFileNotFoundException e) {
            log.warn("Minio 文件不存在, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("文件不存在", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("文件路径参数不合法, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("获取文件属性失败, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("获取文件属性失败", e.getMessage());
        }
    }

    @GetMapping("/file/list")
    @Operation(summary = "获取 Minio 目录文件列表")
    public Response listFiles(@RequestParam("teamId") String teamId,
                              @RequestParam("ontologyName") String ontologyName,
                              @RequestParam(value = "dirPath", required = false) String dirPath,
                              @RequestParam(value = "bucket", required = false) String bucket) {
        try {
            return Response.ok(minioProxyService.listOntologyDirectory(teamId, ontologyName, dirPath, bucket));
        } catch (MinioFileNotFoundException e) {
            log.warn("Minio 目录不存在, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("目录不存在", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("目录参数不合法, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("获取目录文件列表失败, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("获取目录文件列表失败", e.getMessage());
        }
    }

    @PostMapping("/file/save")
    @Operation(summary = "上传 Minio 文件")
    public Response saveFile(@RequestParam("teamId") String teamId,
                             @RequestParam("ontologyName") String ontologyName,
                             @RequestParam("filePath") String filePath,
                             @RequestParam("file") MultipartFile file,
                             @RequestParam(value = "bucket", required = false) String bucket) {
        if (file == null || file.isEmpty()) {
            return Response.error("文件内容不能为空", null);
        }
        try {
            Map<String, String> metadata = buildMetadata(file);
            minioProxyService.saveOntologyFile(teamId, ontologyName, filePath,
                    file.getInputStream(), file.getSize(), bucket, file.getContentType(), metadata);
            return Response.ok("上传成功");
        } catch (MinioFileNotFoundException e) {
            log.warn("上传文件失败，路径不存在, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("路径不存在", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("上传文件参数不合法, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("上传文件失败, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("上传失败", e.getMessage());
        } catch (Exception e) {
            log.error("上传文件失败, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("上传失败", e.getMessage());
        }
    }

    @PostMapping("/file/createDir")
    @Operation(summary = "创建 Minio 目录")
    public Response createDirectory(@RequestParam("teamId") String teamId,
                                    @RequestParam("ontologyName") String ontologyName,
                                    @RequestParam("dirPath") String dirPath,
                                    @RequestParam(value = "bucket", required = false) String bucket) {
        try {
            minioProxyService.createOntologyDirectory(teamId, ontologyName, dirPath, bucket);
            return Response.ok("目录创建成功");
        } catch (IllegalArgumentException e) {
            log.warn("目录参数不合法, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("创建目录失败, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("创建目录失败", e.getMessage());
        }
    }

    @PostMapping("/file/delete")
    @Operation(summary = "删除 Minio 文件")
    public Response deleteFile(@RequestParam("teamId") String teamId,
                               @RequestParam("ontologyName") String ontologyName,
                               @RequestParam("filePath") String filePath,
                               @RequestParam(value = "bucket", required = false) String bucket) {
        try {
            minioProxyService.deleteOntologyFile(teamId, ontologyName, filePath, bucket);
            return Response.ok("删除成功");
        } catch (MinioFileNotFoundException e) {
            log.warn("删除文件失败，文件不存在, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("文件不存在", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("删除文件参数不合法, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("删除文件失败, teamId={}, ontologyName={}, filePath={}", teamId, ontologyName, filePath, e);
            return Response.error("删除失败", e.getMessage());
        }
    }

    @PostMapping("/file/deleteDir")
    @Operation(summary = "删除 Minio 目录")
    public Response deleteDirectory(@RequestParam("teamId") String teamId,
                                    @RequestParam("ontologyName") String ontologyName,
                                    @RequestParam("dirPath") String dirPath,
                                    @RequestParam(value = "bucket", required = false) String bucket) {
        try {
            minioProxyService.deleteOntologyDirectory(teamId, ontologyName, dirPath, bucket);
            return Response.ok("目录删除成功");
        } catch (MinioFileNotFoundException e) {
            log.warn("删除目录失败，目录不存在, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("目录不存在", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("删除目录参数不合法, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("参数不合法", e.getMessage());
        } catch (MinioProxyException e) {
            log.error("删除目录失败, teamId={}, ontologyName={}, dirPath={}", teamId, ontologyName, dirPath, e);
            return Response.error("删除目录失败", e.getMessage());
        }
    }

    private HttpHeaders buildHeaders(MinioFileObject fileObject, boolean inline) {
        HttpHeaders headers = new HttpHeaders();
        String filename = resolveFilename(fileObject.getObjectName());
        ContentDisposition contentDisposition = ContentDisposition.builder(inline ? "inline" : "attachment")
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        headers.setContentDisposition(contentDisposition);
        headers.setContentType(MediaType.parseMediaType(fileObject.getContentType()));
        if (fileObject.getSize() >= 0) {
            headers.setContentLength(fileObject.getSize());
        }
        fileObject.getUserMetadata().forEach((key, value) -> headers.add("X-Minio-Meta-" + key, value));
        return headers;
    }

    private String resolveFilename(String objectPath) {
        String normalized = objectPath.replace('\\', '/');
        int index = normalized.lastIndexOf('/');
        if (index >= 0 && index < normalized.length() - 1) {
            return normalized.substring(index + 1);
        }
        return normalized;
    }

    private Map<String, String> buildMetadata(MultipartFile file) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("filename", file.getOriginalFilename());
        metadata.put("size", String.valueOf(file.getSize()));
        return metadata;
    }
}

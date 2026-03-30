package com.asiainfo.web;

import com.asiainfo.feign.response.OntologyMigrateInResponse;
import com.asiainfo.feign.response.OntologyMigrateOutResponse;
import com.asiainfo.minio.MinioConfig;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.feign.response.OntologyFileExportResponse;
import com.asiainfo.feign.response.OntologyFileImportResponse;
import com.asiainfo.serivce.OntologyService;
import com.asiainfo.vo.search.OntologyGraphExportVo;
import com.asiainfo.vo.search.OntologyGraphSearchVo;
import com.asiainfo.vo.search.OntologySearchVo;
import com.asiainfo.vo.operation.OntologyVo;
import com.asiainfo.vo.search.OntologyVersionSearchVo;
import io.github.suanchou.web.Response;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
@RestController
@RequestMapping("/_api/ontology")
@Slf4j
public class OntologyController {

    @Autowired
    OntologyService ontologyService;

    @Autowired
    MinioConfig minioConfig;

    @GetMapping({"/list"})
    @Operation(summary = "本体分页查询")
    public Response search(HttpServletRequest request, OntologySearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyService.search(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/findAll"})
    @Operation(summary = "本体查询")
    public Response findAll(HttpServletRequest request, OntologySearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

//        searchVo.setOwnerId(identity.getUserId());
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyService.findAll(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/findOne"})
    @Operation(summary = "本体单条查询")
    public Response findOne(HttpServletRequest request, @RequestParam("ontologyId") String ontologyId) {
        if (StringUtils.isBlank(ontologyId)) {
            return Response.error("本体ID不能为空", null);
        }

        try {
            OntologyDto data = ontologyService.findOne(ontologyId);
            if (data == null) {
                return Response.error("未查询到对应本体", null);
            }

            return Response.ok(data);
        } catch (Exception e) {
            log.error("查询单个本体失败", e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/view/{id}"})
    @Operation(summary = "本体预览")
    public Response view(HttpServletRequest request, @PathVariable String id) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            return Response.ok(ontologyService.view(id, identity.getTeamName()));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @PostMapping({"/save"})
    @Operation(summary = "本体新增")
    public Response save(HttpServletRequest request, @RequestBody OntologyVo ontologyVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyVo.setOwnerId(identity.getUserId());
        ontologyVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyService.save(ontologyVo));
        } catch (Exception e) {
            log.error("新增本体失败", e);
            return Response.error("新增本体失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/update/{id}"})
    @Operation(summary = "本体修改")
    public Response update(HttpServletRequest request, @PathVariable String id, @RequestBody OntologyVo ontologyUpdateVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyUpdateVo.setOwnerId(identity.getUserId());
        ontologyUpdateVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyService.update(id, ontologyUpdateVo));
        } catch (Exception e) {
            log.error("修改本体失败", e);
            return Response.error("修改失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "本体删除")
    public Response delete(@RequestBody List<String> ids) {
        try {
            return Response.ok(ontologyService.delete(ids));
        } catch (Exception e) {
            log.error("删除本体失败", e);
            return Response.error("删除失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping({"/sync/{id}"})
    @Operation(summary = "本体同步")
    public Response sync(HttpServletRequest request, @PathVariable String id

    ) {

        try {
            return Response.ok(ontologyService.sync(id, null));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("同步本体失败", e.getMessage());
        }
    }

    @PostMapping("/publish")
    @Operation(summary = "本体发布")
    public Response publish(HttpServletRequest request, @RequestBody List<String> ids) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String userId = identity.getUserId();
        try {
            String taskId = ontologyService.publish(ids, userId);
            Map<String, String> result = new HashMap<>();
            result.put("taskId", taskId);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("本体发布失败", e);
            return Response.error("本体发布失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/checkExists")
    @Operation(summary = "检查本体名称是否存在")
    public Response checkExists(HttpServletRequest request, OntologyVo ontologyVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String workspaceId = identity.getTeamName();
        ontologyVo.setWorkspaceId(workspaceId);

        if (StringUtils.isBlank(ontologyVo.getOntologyName()) && StringUtils.isBlank(ontologyVo.getOntologyLabel())) {
            return Response.error("英文名和中文名不能同时为空", null);
        }
        try {
            return Response.ok(ontologyService.checkExists(ontologyVo));
        } catch (Exception e) {
            log.error("检查本体名称是否存在失败", e);
            return Response.error("检查本体名称是否存在失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/version/list")
    @Operation(summary = "本体版本列表")
    public Response listVersion(OntologyVersionSearchVo searchVo) {
        try {
            return Response.ok(ontologyService.listVersion(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/prompt")
    @Operation(summary = "获取本体提示词")
    public Response getPrompt(String id) {
        try {
            Map<String, String> result = new HashMap<>();
            String prompt = ontologyService.getPrompt(id);
            result.put("prompt", prompt);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/prompt/basic")
    @Operation(summary = "获取本体提示词")
    public Response getBasicPrompt(String id) {
        try {
            Map<String, String> result = new HashMap<>();
//            String prompt = ontologyService.getBasicPrompt(id);
            String prompt = ontologyService.getPrompt(id);
            result.put("prompt", prompt);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/prompt/rdf")
    @Operation(summary = "获取RDF提示词内容")
    public Response getRdfPrompt(String id) {
        try {
            Map<String, String> result = new HashMap<>();
            String prompt = ontologyService.getRDFPrompt(id);
            result.put("prompt", prompt);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("获取RDF内容失败", e);
            return Response.error("获取RDF内容失败", e.getMessage());
        }
    }

    @GetMapping("/prompt/agent")
    @Operation(summary = "获取dify本体提示词")
    public Response getPromptAgent(String id) {
        try {
            Map<String, String> result = new HashMap<>();
            String prompt = ontologyService.getPromptAgent(id);
            result.put("prompt", prompt);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @PostMapping("/favorite")
    @Operation(summary = "本体收藏")
    public Response getGraphByOntologyId(HttpServletRequest request,
                                         @RequestParam("ontologyId") String ontologyId,
                                         @RequestParam("isFavorite") Integer isFavorite) {
        try {
            ontologyService.favoriteById(ontologyId, isFavorite);
            return Response.ok();
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/getGraph")
    @Operation(summary = "获取图谱描述信息")
    public Response getGraphByOntologyId(HttpServletRequest request,
                                         OntologyGraphSearchVo searchVo) {
        try {
            return Response.ok(ontologyService.getGraphByOntologyId(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/expandGraphNode")
    @Operation(summary = "获取图谱节点展开信息")
    public Response expandGraphNodeByTypeId(HttpServletRequest request,
                                         @RequestParam("objectTypeId") String objectTypeId,
                                         @RequestParam("pubVersion") String pubVersion) {
        try {
            return Response.ok(ontologyService.expandGraphNodeByTypeId(objectTypeId, pubVersion));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/graphOverview")
    @Operation(summary = "获取本体图谱概览")
    public Response getGraphOverview(HttpServletRequest request,
                                         @RequestParam("ontologyId") String ontologyId) {
        try {
            return Response.ok(ontologyService.getGraphOverview(ontologyId));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @PostMapping({"/migrateIn"})
    @Operation(summary = "本体迁入")
    public Response ontologyMigrateIn(HttpServletRequest request,
                                      @RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "ontologyName", required = false) String ontologyName,
                                      @RequestParam(value = "ontologyLabel", required = false) String ontologyLabel,
                                      @RequestParam(value = "ontologyDesc", required = false) String ontologyDesc) {
        if (file.isEmpty()) {
            return Response.error("导入文件不能为空", null);
        }

        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String userId = identity.getUserId();

        String fileName = file.getOriginalFilename();

        try {
            OntologyMigrateInResponse result = ontologyService.ontologyMigrateIn(file,
                    userId,
                    identity.getTeamName(),
                    ontologyName,
                    ontologyLabel,
                    ontologyDesc);
            if ("success".equalsIgnoreCase(result.getStatus())) {
                String ontologyId = MapUtils.getString(result.getData(), "ontologyId");
                ontologyService.saveActionProcess(ontologyId, null, fileName, userId, "本体迁入成功", "ontology_import");
                return Response.ok("本体迁入成功");
            }
            return Response.error("本体迁入调用失败", result.getMessage());
        } catch (Exception e) {
            log.error("本体迁入异常", e);
            return Response.error("本体迁入异常", e.getMessage());
        }
    }

    @GetMapping({"/migrateOut"})
    @Operation(summary = "本体迁出")
    public void ontologyMigrateOut(HttpServletRequest request,
                                   HttpServletResponse response,
                                   @RequestParam("ontologyId") String ontologyId) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String userId = identity.getUserId();
        try {
            OntologyMigrateOutResponse result = ontologyService.ontologyMigrateOut(ontologyId);

            if ("success".equalsIgnoreCase(result.getStatus())) {
                Map<String, String> storageMap = (HashMap) result.getData().get("storage");
                String bucketName = storageMap.get("bucket");
                String objectName = storageMap.get("object_name");

                long contentLength = 0;
                try (InputStream inputStream = readFromMinio(bucketName, objectName);
                     OutputStream os = response.getOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        os.write(buffer, 0, bytesRead);
                        contentLength += bytesRead;
                    }
                    os.flush();
                }

                String fileName = new File(objectName).getName();
                response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName);
                response.setContentType("application/octet-stream");
                response.setContentLengthLong(contentLength);

                ontologyService.saveActionProcess(ontologyId, null, fileName, userId, "本体迁出成功", "ontology_export");
            } else {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, result.getMessage());
                log.error("本体迁出调用失败: {}", result.getMessage());
                ontologyService.saveActionProcess(ontologyId, null, userId, "本体迁出失败: " + result.getMessage(), "ontology_export");
            }
        } catch (Exception e) {
            log.error("本体迁出失败", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private MinioClient getMinioClient() {
        return MinioClient.builder()
                .endpoint(minioConfig.getEndpoint())
                .credentials(minioConfig.getAccessKey(), minioConfig.getSecretKey())
                .build();
    }

    private InputStream readFromMinio(String bucketName, String objectName) throws Exception {
        try {
            // TODO —— [版本升级]minio依赖的版本低,没有连接释放接口close
            MinioClient minioClient = getMinioClient();
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!bucketExists) {
                log.error("bucket " + bucketName + "不存在");
                return null;
            }

            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            // 其他异常（如网络超时、文件不存在）
            log.error("本体迁出读取minio异常", e);
            throw e;
        }
    }

    @PostMapping("/uploadFile")
    @Operation(summary = "上传文件")
    public Response uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.error("上传文件不能为空", null);
        }

        try {
            String url = ontologyService.uploadToMinio(file);
            Map<String, String> resultMap = new HashMap<>();
            resultMap.put("url", url);
            return Response.ok("文件上传成功", resultMap);
        } catch (Exception e) {
            log.error("文件上传失败", e);
            return Response.error("文件上传失败", e.getMessage());
        }
    }

    @PostMapping({"/importFile"})
    @Operation(summary = "本体文件导入")
    public Response importFile(HttpServletRequest request,
                               @RequestParam("ontologyId") String ontologyId,
                               @RequestParam("ownerId") String ownerId,
                               @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Response.error("导入文件不能为空", null);
        }

        try {
            OntologyFileImportResponse result = ontologyService.importFile(ontologyId, ownerId, file);
            if ("success".equalsIgnoreCase(result.getStatus())) {
                return Response.ok("本体文件导入成功");
            }
            return Response.error("本体文件导入接口调用失败", result.getMessage());
        } catch (Exception e) {
            log.error("本体文件导入失败", e);
            return Response.error("本体文件导入失败", e.getMessage());
        }
    }

    @PostMapping({"/exportFile"})
    @Operation(summary = "本体文件导出")
    public void exportFile(HttpServletRequest request,
                           HttpServletResponse response,
                           @RequestBody OntologyGraphExportVo graphExportVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String userId = identity.getUserId();
        try {
            OntologyFileExportResponse result = ontologyService.exportFile(graphExportVo);

            String fileName = "oontology" + graphExportVo.getOntologyId() + ".owl";
            if ("success".equalsIgnoreCase(result.getStatus())) {
                String content = (String) result.getData().get("ttl");
                byte[] byteArray = content.getBytes(StandardCharsets.UTF_8);

                response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName);
                response.setContentType("application/octet-stream");
                response.setContentLengthLong(content.length());

                try (InputStream inputStream = new ByteArrayInputStream(byteArray);
                     OutputStream os = response.getOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        os.write(buffer, 0, bytesRead);
                    }
                    os.flush();
                }

                ontologyService.saveActionProcess(graphExportVo.getOntologyId(), graphExportVo.getObjectTypeIdList(), fileName, userId, "RDF导出成功", "owl_export");
            } else {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, result.getMessage());
                log.error("本体文件导出接口调用失败: {}", result.getMessage());
                ontologyService.saveActionProcess(graphExportVo.getOntologyId(), fileName, userId, "RDF导出失败: " + result.getMessage(), "owl_export");
            }
        } catch (Exception e) {
            log.error("本体文件导出失败", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping({"/downTemplate"})
    @Operation(summary = "本体RDF文件模版下载")
    public void downTemplate(HttpServletRequest request,
                           @RequestParam(value = "type", required = false) String type,
                           HttpServletResponse response) {
        try {
            String templatePath = "template/template.owl";
            String fileName = "template.owl";
            if ("excel".equals(type)) {
                templatePath = "template/template.xlsx";
                fileName = "数智本体文档导入模板.xlsx";
            }

            ClassPathResource resource = new ClassPathResource(templatePath);
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream();
                     OutputStream outputStream = response.getOutputStream();) {
                    // 对文件名进行 URL 编码以支持中文字符
                    String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString());
                    // 使用 RFC 5987 标准格式设置文件名，同时保持向后兼容
                    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName);
                    response.setHeader(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
                    response.setContentType("application/octet-stream");
                    response.setContentLengthLong(inputStream.available());

                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.flush();
                }
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "RDF模版文件不存在");
            }
        } catch (Exception e) {
            log.error("RDF模版文件下载失败", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/agent")
    @Operation(summary = "获取本体智能体")
    public Response getAgent(HttpServletRequest request,
                                     @RequestParam("ontologyId") String ontologyId) {
        try {
            return Response.ok(ontologyService.getAgentWithAuth(request, ontologyId));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping("/agent/token")
    @Operation(summary = "获取智能体访问凭证")
    public Response getAgentToken(@RequestParam("username") String username) {
        try {
            if (StringUtils.isBlank(username)) {
                return Response.error("用户名不能为空", null);
            }
            return Response.ok(ontologyService.fetchTokenByUsername(username));
        } catch (Exception e) {
            log.error("获取智能体访问凭证失败", e);
            return Response.error("", e.getMessage());
        }
    }

    @GetMapping({"/recommend"})
    @Operation(summary = "推荐本体")
    public Response recommend(HttpServletRequest request, OntologySearchVo searchVo) {
        try {
            searchVo.setIsRecommend(1);
            return Response.ok(ontologyService.search(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/listChanged"})
    @Operation(summary = "最新变更本体")
    public Response listChanged(HttpServletRequest request, OntologySearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyService.search(searchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询变更本体失败", e.getMessage());
        }
    }
}

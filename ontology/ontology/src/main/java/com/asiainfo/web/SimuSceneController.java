package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.modo.app.web.flux.WebFluxClient;
import com.asiainfo.serivce.OntologySimuService;
import com.asiainfo.vo.operation.InitDataVo;
import com.asiainfo.vo.operation.OntologySimuVo;
import com.asiainfo.vo.operation.SearchSimuVo;
import com.asiainfo.vo.operation.SimulateRunVo;

import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/_api/ontology/simu/scene")
@Slf4j
public class SimuSceneController {

    private final static String SIMULATE_RUN_URL = "/simulation/_api/monitor/sse/run?clientId=%s";

    @Value("${suanchou.microservice.gateway.host:localhost}")
    private String gatewayHost;

    @Autowired
    private WebFluxClient webFluxClient;

    @Autowired
    private OntologySimuService ontologySimuService;

    /**
     * 新增仿真场景
     */
    @PostMapping({ "/save" })
    @Operation(summary = "新增仿真场景")
    public Response save(HttpServletRequest request, @Valid @RequestBody OntologySimuVo simuVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        simuVo.setOwnerId(identity.getUserId());
        simuVo.setWorkspaceId(identity.getTeamName());
        try {

            return Response.ok(ontologySimuService.save(simuVo));
        } catch (Exception e) {
            log.error("新增仿真场景失败", e);
            return Response.error("新增仿真场景失败", e.getMessage());
        }
    }

    /**
     * 更新仿真场景
     */
    @PostMapping({ "/update/{id}" })
    @Operation(summary = "更新仿真场景")
    public Response update(HttpServletRequest request, @PathVariable String id,
            @Valid @RequestBody OntologySimuVo simuVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        simuVo.setOwnerId(identity.getUserId());
        simuVo.setWorkspaceId(identity.getTeamName());
        simuVo.setId(id);
        try {

            return Response.ok(ontologySimuService.update(simuVo));
        } catch (Exception e) {
            log.error("更新仿真场景失败", e);
            return Response.error("更新仿真场景失败", e.getMessage());
        }
    }

    /**
     * 删除仿真场景
     */
    @PostMapping({ "/delete" })
    @Operation(summary = "删除仿真场景")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {

            return Response.ok(ontologySimuService.delete(ids));
        } catch (Exception e) {
            log.error("删除仿真场景失败", e);
            return Response.error("删除仿真场景失败", e.getMessage());
        }
    }

    /**
     * 获取仿真场景
     */
    @GetMapping({ "/search" })
    @Operation(summary = "获取仿真场景")
    public Response search(HttpServletRequest request, SearchSimuVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            log.debug("search() searchVo:{}", searchVo);
            return Response.ok(ontologySimuService.findAllByWorkspaceId(searchVo));
        } catch (Exception e) {
            log.error("获取仿真场景失败", e);
            return Response.error("获取仿真场景失败", e.getMessage());
        }
    }

    @GetMapping({ "/isLabelExists" })
    @Operation(summary = "校验仿真场景中文名称")
    public Response isLabelExists(HttpServletRequest request, SearchSimuVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("isLabelExists() sceneLabel:{}", searchVo.getSceneLabel());
        try {
            if (StringUtils.isBlank(searchVo.getSceneLabel())) {
                return Response.error("校验仿真场景中文名称失败", "仿真场景中文名称不能为空");
            }
            return Response.ok(ontologySimuService.isLabelExists(searchVo));
        } catch (Exception e) {
            log.error("校验仿真场景中文名称失败", e);
            return Response.error("校验仿真场景中文名称失败", e.getMessage());
        }
    }

    @GetMapping({ "/isNameExists" })
    @Operation(summary = "校验仿真场景英文名称")
    public Response isNameExists(HttpServletRequest request, SearchSimuVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("isNameExists() sceneName:{}", searchVo.getSceneName());
        try {
            if (StringUtils.isBlank(searchVo.getSceneName())) {
                return Response.error("校验仿真场景英文名称失败", "仿真场景英文名称不能为空");
            }
            return Response.ok(ontologySimuService.isNameExists(searchVo));
        } catch (Exception e) {
            log.error("校验仿真场景英文名称失败", e);
            return Response.error("校验仿真场景英文名称失败", e.getMessage());
        }
    }

    @GetMapping({ "/findAvaliableObjects/{ontologyId}" })
    @Operation(summary = "导入本体下所有对象、逻辑和动作")
    public Response findAvaliableObjects(HttpServletRequest request, @PathVariable String ontologyId) {

        log.debug("finddAvaliableObjects() ontologyId:{}", ontologyId);
        try {
            return Response.ok(ontologySimuService.findAvaliableObjects(ontologyId));
        } catch (Exception e) {
            log.error("导入本体下所有对象、逻辑和动作失败", e);
            return Response.error("导入本体下所有对象、逻辑和动作失败", e.getMessage());
        }
    }

    @GetMapping({ "/findAvaliableObject" })
    @Operation(summary = "导入指定对象及逻辑和动作")
    public Response findAvaliableObject(HttpServletRequest request, String[] objectTypeIds) {

        log.debug("findAvaliableObject() objectTypeIds:{}", objectTypeIds);
        try {
            return Response.ok(ontologySimuService.findAvaliableObject(objectTypeIds));
        } catch (Exception e) {
            log.error("导入本体下所有对象、逻辑和动作失败", e);
            return Response.error("导入本体下所有对象、逻辑和动作失败", e.getMessage());
        }
    }

    @GetMapping({ "/list" })
    @Operation(summary = "获取分页仿真场景")
    public Response list(HttpServletRequest request, SearchSimuVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("page: {}", searchVo.getPage());
        log.debug("size: {}", searchVo.getLimit());
        try {
            if (searchVo.getPage() == null || searchVo.getPage() <= 0) {
                searchVo.setPage(1);
            }
            if (searchVo.getLimit() == null || searchVo.getLimit() <= 0) {
                searchVo.setLimit(10);
            }
            log.debug("list() searchVo:{}", searchVo);
            return Response.ok(ontologySimuService.list(searchVo));
        } catch (Exception e) {
            log.error("获取分页仿真场景失败", e);
            return Response.error("获取分页仿真场景失败", e.getMessage());
        }
    }

    @GetMapping({ "/find/{id}" })
    @Operation(summary = "获取单个仿真场景")
    public Response find(HttpServletRequest request, @PathVariable String id) {
        try {

            return Response.ok(ontologySimuService.findById(id));
        } catch (Exception e) {
            log.error("获取分页仿真场景失败", e);
            return Response.error("获取分页仿真场景失败", e.getMessage());
        }
    }

    @PostMapping("/initData")
    @Operation(summary = "初始化本体仿真数据")
    public Response initSimulationData(HttpServletRequest request, @RequestBody InitDataVo initDataVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        initDataVo.setWorkspaceName(identity.getTeamName());
        initDataVo.setOwnerId(identity.getUserId());
        try {
            String taskId = ontologySimuService.initData(initDataVo);
            Map<String, String> result = new HashMap<>();
            result.put("taskId", taskId);
            return Response.ok("数据初始化任务创建成功", result);
        } catch (Exception e) {
            log.error("本体仿真数据初始化失败", e);
            return Response.error("本体仿真数据初始化失败", e.getMessage());
        }
    }

    @PostMapping("/initData/status")
    @Operation(summary = "查询本体仿真数据初始化任务状态")
    public Response initSimulationDataStatus(HttpServletRequest request, @RequestBody InitDataVo initDataVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        initDataVo.setWorkspaceName(identity.getTeamName());
        initDataVo.setOwnerId(identity.getUserId());
        try {
            List<Map<String, Object>> result = ontologySimuService.initDataStatus(initDataVo);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("本体仿真数据初始化失败", e);
            return Response.error("本体仿真数据初始化失败", e.getMessage());
        }
    }

    @PostMapping("/run")
    @Operation(summary = "本体仿真执行")
    public SseEmitter run(HttpServletRequest request, @RequestBody SimulateRunVo runVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        SseEmitter emitter = new SseEmitter(600_000L); // 600秒超时

        // 异步发送事件
        CompletableFuture.runAsync(() -> {
            try {
                runSimulation(String.format(SIMULATE_RUN_URL, identity.getUserId()), runVo, emitter);
                emitter.complete();
            } catch (Exception e) {
                log.error(e.getMessage());
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private Map<String, Object> toRequestMap(SimulateRunVo runRequest) {
        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", runRequest.getOntologyName());
        params.put("action_name", runRequest.getActionName());
        params.put("object_name", runRequest.getObjectName());

        if (StringUtils.isNotBlank(runRequest.getEventName())) {
            params.put("eventName", runRequest.getEventName());
        }
        if (null != runRequest.getParams()) {
            params.put("params", runRequest.getParams());
        }

        return params;
    }

    private void sendEvent(SseEmitter emitter, Object event) {
        try {
            emitter.send(event);
        } catch (Exception e) {
            log.warn(e.getMessage());
        }
    }

    public void runSimulation(String url, SimulateRunVo runRequest, SseEmitter emitter) {
        Disposable subscribe = null;
        AtomicBoolean stopFlag = new AtomicBoolean(false);
        try {
            Map<String, String> headers = new HashMap<>();
            subscribe = webFluxClient.post(String.format("%s%s", gatewayHost, url), headers, toRequestMap(runRequest),
                    resp -> {
                        if (StringUtils.isBlank(resp))
                            return;

                        log.debug("response: {}", resp);
                        sendEvent(emitter, resp);

                        // 获取事件类型并做对应操作
                        if (resp.startsWith("仿真执行结束")) {
                            stopFlag.set(true);
                        }
                    });

            while (!stopFlag.get()) {
                Thread.sleep(100L);
            }
        } catch (Exception e) {
            log.error("--trace--" + e.getMessage());
        } finally {
            // 请求结束
            if (null != subscribe && !subscribe.isDisposed()) {
                subscribe.dispose();
            }
        }
    }
}

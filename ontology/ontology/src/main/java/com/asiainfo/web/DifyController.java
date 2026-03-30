package com.asiainfo.web;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.DifyEnum;
import com.asiainfo.common.DifyTaskStatusEnum;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.DifyChatRequest;
import com.asiainfo.feign.request.DifyConversationRequest;
import com.asiainfo.feign.request.DifyMessageRequest;
import com.asiainfo.feign.response.CommonDifyResponse;
import com.asiainfo.feign.response.ConversationDeleteResponse;
import com.asiainfo.flux.CustomWebFluxClient; // import com.asiainfo.modo.app.web.flux.WebFluxClient;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.po.OntologyDifyTaskPo;
import com.asiainfo.repo.OntologyConfigRepository;
import com.asiainfo.repo.OntologyDifyTaskRepository;
import com.asiainfo.serivce.DifyService;
import com.asiainfo.serivce.OntologyConfigService;
import com.asiainfo.serivce.OntologyDifyTaskService;
import com.asiainfo.serivce.OntologyService;
import com.asiainfo.vo.operation.DifyChatTaskVo;
import com.asiainfo.vo.operation.DifyChatVo;
import com.asiainfo.vo.operation.DifyGraphVo;
import com.asiainfo.vo.operation.DifyVo;
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
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/_api/v1/dify")
@Slf4j
public class DifyController {

    private static final String DIFY_CHAT_URL = "/ontology_back/api/v1/ontology/agent/chat";

    private static final String DIFY_USER = "%s-%s";

    private static final String DIFY_CONCURRENT_LIMIT = "dify.concurrent.limit";

    private static final AtomicInteger COUNTER = new AtomicInteger(0);

    @Autowired
    private CustomWebFluxClient webFluxClient;

    @Autowired
    private DifyService difyService;

    @Autowired
    private OntologyService ontologyService;

    @Autowired
    private OntologyDifyTaskService difyTaskService;

    @Autowired
    private OntologyDifyTaskRepository difyTaskRepository;

    @Autowired
    private OntologyConfigRepository configRepository;

    @Autowired
    private OntologyConfigService configService;

    @Autowired
    private DataosFeign dataosFeign;

    @Value("${suanchou.microservice.gateway.host:localhost}")
    private String gatewayHost;

    @PostMapping({"/messages"})
    @Operation(summary = "获取会话历史消息")
    public CommonDifyResponse messages(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            DifyMessageRequest messageRequest = new DifyMessageRequest();
            messageRequest.setUser(String.format(DIFY_USER, identity.getTeamName(), difyVo.getOntologyName()));
            messageRequest.setLimit(difyVo.getLimit());
            messageRequest.setConversation_id(difyVo.getConversationId());
            messageRequest.setFirst_id(difyVo.getFirstId());
            messageRequest.setAgent_mode(difyVo.getPromptType());
            return dataosFeign.getDifyMessages(messageRequest);
        } catch (Exception e) {
            log.error("获取会话历史消息失败", e);
            return toCommonDifyResponse(e);
        }
    }

    @PostMapping({"/conversations"})
    @Operation(summary = "获取会话列表")
    public CommonDifyResponse conversations(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            DifyConversationRequest conversationRequest = new DifyConversationRequest();
            conversationRequest.setUser(String.format(DIFY_USER, identity.getTeamName(), difyVo.getOntologyName()));
            conversationRequest.setLimit(difyVo.getLimit());
            conversationRequest.setLast_id(difyVo.getLastId());
            conversationRequest.setPinned(difyVo.getPinned());
            conversationRequest.setAgent_mode(difyVo.getPromptType());
            return dataosFeign.getDifyConversations(conversationRequest);
        } catch (Exception e) {
            log.error("获取会话列表失败", e);
            return toCommonDifyResponse(e);
        }
    }

    @PostMapping({"/saveGraph"})
    @Operation(summary = "保存会话图谱")
    public Response saveGraph(HttpServletRequest request, @RequestBody DifyGraphVo graphVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            return Response.ok(difyService.save(graphVo));
        } catch (Exception e) {
            log.error("保存会话图谱异常", e);
            return Response.error("保存会话图谱异常，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping({"/getGraph"})
    public Response getGraph(HttpServletRequest request, @RequestParam("conversationId") String conversationId) {
        try {
            return Response.ok(difyService.findByConversationId(conversationId));
        } catch (Exception e) {
            log.error("获取会话图谱异常",e);
            return Response.error("获取会话图谱异常", e.getMessage());
        }
    }

    @GetMapping({"/getPromptId"})
    public Response getPromptId(HttpServletRequest request,
                              @RequestParam("conversationId") String conversationId,
                              @RequestParam("messageId") String messageId) {
        try {
            return Response.ok(ontologyService.readFromMinio(conversationId, messageId));
        } catch (Exception e) {
            return Response.error("获取会话提示词异常", e.getMessage());
        }
    }

    @GetMapping({"/getLifecycle"})
    public Response getLifecycle(HttpServletRequest request) {
        try {
            return Response.ok(ontologyService.getLifecycleRule());
        } catch (Exception e) {
            log.error("获取会话提示词异常",e);
            return Response.error("获取会话提示词异常", e.getMessage());
        }
    }

    @PostMapping({"/updateLifecycle"})
    @Operation(summary = "更新会话提示词保存的生命周期")
    public Response updateLifecycle(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        try {
            return Response.ok(ontologyService.updateLifecycleRule(difyVo.getExpireDay()));
        } catch (Exception e) {
            return Response.error("更新会话提示词保存生命周期异常", e.getMessage());
        }
    }

    @GetMapping({"/getConcurrentLimit"})
    public Response getConcurrentLimit(HttpServletRequest request) {
        try {
            return Response.ok(getLimit());
        } catch (Exception e) {
            log.error("获取并发数限制异常", e);
            return Response.error("获取并发数限制异常", e.getMessage());
        }
    }

    @PostMapping({"/updateConcurrentLimit"})
    @Operation(summary = "更新并发数限制")
    public Response updateConcurrentLimit(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        try {
            return Response.ok(configService.save(DIFY_CONCURRENT_LIMIT, String.valueOf(difyVo.getConcurrentLimit())));
        } catch (Exception e) {
            return Response.error("更新并发数限制异常", e.getMessage());
        }
    }

    @PostMapping({"/conversation/delete"})
    @Operation(summary = "删除历史会话")
    public ConversationDeleteResponse deleteConversationById(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            DifyConversationRequest conversationRequest = new DifyConversationRequest();
            conversationRequest.setUser(String.format(DIFY_USER, identity.getTeamName(), difyVo.getOntologyName()));
            conversationRequest.setConversation_id(difyVo.getConversationId());
            conversationRequest.setAgent_mode(difyVo.getPromptType());
            return dataosFeign.deleteConversationById(conversationRequest);
        } catch (Exception e) {
            log.error("删除历史会话异常", e);
            ConversationDeleteResponse errorResponse = new ConversationDeleteResponse();
            errorResponse.setMessage(e.getMessage());
            errorResponse.setStatus("failed");
            errorResponse.setCode("500");
            return errorResponse;
        }
    }

    @PostMapping({"/chat/stop"})
    @Operation(summary = "停止当前会话")
    public CommonDifyResponse stopChatting(HttpServletRequest request, @RequestBody DifyVo difyVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            DifyChatRequest chatRequest = new DifyChatRequest();
            chatRequest.setUser(String.format(DIFY_USER, identity.getTeamName(), difyVo.getOntologyName()));
            chatRequest.setAgent_mode(difyVo.getPromptType());
            return dataosFeign.stopChatWithDify(difyVo.getTaskId(), chatRequest);
        } catch (Exception e) {
            log.error("停止当前会话异常", e);
            return toCommonDifyResponse(e);
        }
    }

    private CommonDifyResponse toCommonDifyResponse(Exception e) {
        CommonDifyResponse errorResponse = new CommonDifyResponse();
        errorResponse.setMessage(e.getMessage());
        errorResponse.setStatus("failed");
        errorResponse.setCode("500");
        return errorResponse;
    }

    @PostMapping("/chat")
    public SseEmitter chat(HttpServletRequest request, @RequestBody DifyChatVo chatVo) {
        if (getLimit() <= COUNTER.intValue() ) {
            log.warn("并发数超限,请稍后");
            return null;
        }

        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        SseEmitter emitter = new SseEmitter(1800_000L); // 30*60秒超时
        // 异步发送事件
        CompletableFuture.runAsync(() -> {
            try {
                COUNTER.incrementAndGet();
                chatWithDify(toChatRequest(identity, chatVo), emitter);
                emitter.complete();
            } catch (Exception e) {
                log.error(e.getMessage());
                emitter.completeWithError(e);
            } finally {
                COUNTER.decrementAndGet();
            }
        });

        return emitter;
    }

    private int getLimit() {
        try {
            String value = configRepository.findValueByKey(DIFY_CONCURRENT_LIMIT);
            return Integer.valueOf(value);
        } catch (Exception e) {
            return 5; // default value
        }
    }

    private DifyChatRequest toChatRequest(ModoWebUtils.CookieIdentity identity, DifyChatVo chatVo) {
        DifyChatRequest chatRequest = new DifyChatRequest();
        chatRequest.setUser(String.format(DIFY_USER, identity.getTeamName(), chatVo.getOntologyName()));
        chatRequest.setWorkspace_id(identity.getTeamName());
        chatRequest.setQuery(chatVo.getQuery());
        chatRequest.setOntology_name(chatVo.getOntologyName());
        chatRequest.setSys_prompt(chatVo.getSysPrompt());
        chatRequest.setResponse_mode(chatVo.getResponseMode());
        chatRequest.setConversation_id(chatVo.getConversationId());
        chatRequest.setParent_message_id(chatVo.getParentMessageId());
        chatRequest.setAgent_mode(chatVo.getPromptType());
        chatRequest.setPrompt_id(chatVo.getPromptId());

        return chatRequest;
    }

    private Map<String,Object> toRequestMap(DifyChatRequest chatRequest) {
        Map<String, Object> params = new HashMap<>();
        params.put("query", chatRequest.getQuery());
        params.put("response_mode", "streaming");
        params.put("user", chatRequest.getUser());
        params.put("workspace_id", chatRequest.getWorkspace_id());
        params.put("ontology_name", chatRequest.getOntology_name());
        params.put("agent_mode", chatRequest.getAgent_mode());
        if (StringUtils.isNotBlank(chatRequest.getSys_prompt())) {
            params.put("sys_prompt", chatRequest.getSys_prompt());
        }
        if (StringUtils.isNotBlank(chatRequest.getConversation_id())) {
            params.put("conversation_id", chatRequest.getConversation_id());
        }
        if (StringUtils.isNotBlank(chatRequest.getParent_message_id())) {
            params.put("parent_message_id", chatRequest.getParent_message_id());
        }

        return params;
    }

    private void sendEvent(SseEmitter emitter, Object event) {
        try {
            emitter.send(event);
        } catch(Exception e) {
            log.warn(e.getMessage());
        }
    }

    private OntologyDifyTaskPo saveDifyTask(DifyChatRequest chatRequest) {
        if (StringUtils.isNotEmpty(chatRequest.getConversation_id())) {
            return null;
        }

        DifyChatTaskVo difyChatTaskVo = new DifyChatTaskVo();
        difyChatTaskVo.setQuestion(chatRequest.getQuery());
        difyChatTaskVo.setExecUser(chatRequest.getUser());
        difyChatTaskVo.setPromptType(chatRequest.getAgent_mode());

        return difyTaskService.save(difyChatTaskVo);
    }

    public void chatWithDify(DifyChatRequest chatRequest, SseEmitter emitter) {
        Disposable subscribe = null;
        AtomicBoolean stopFlag = new AtomicBoolean(false);
        AtomicBoolean isInit = new AtomicBoolean(false);
        OntologyDifyTaskPo difyTaskPo = saveDifyTask(chatRequest);

        try {
            Map<String, String> headers = new HashMap<>();
            subscribe = webFluxClient.post(String.format("%s%s", gatewayHost, DIFY_CHAT_URL), headers, toRequestMap(chatRequest), resp -> {
                if (StringUtils.isBlank(resp)) return;

                log.debug("response: {}", resp);
                JSONObject respMap = JSON.parseObject(resp);
                sendEvent(emitter, respMap);

                // 获取事件类型并做对应操作
                String event = respMap.getString(DifyEnum.EVENT.toString());
                if (!isInit.get()) {
                    isInit.set(true);
                    if (null != difyTaskPo) {
                        difyTaskPo.setConversationId(respMap.getString("conversation_id"));
                        difyTaskPo.setTaskId(respMap.getString("task_id"));
                    }
                    // 保存会话提示词
                    if (StringUtils.isNotBlank(chatRequest.getPrompt_id())) {
                        savePrompt(respMap.getString("conversation_id"),
                                respMap.getString("message_id"),
                                chatRequest.getPrompt_id());
                    }
                }

                if (DifyEnum.EVENT_END.equals(event)) {
                    stopFlag.set(true);
                    // 更新dify任务表
                    if (null != difyTaskPo) {
                        difyTaskPo.setStatus(DifyTaskStatusEnum.FINISHED.getValue());
                        difyTaskRepository.save(difyTaskPo);
                    }
                }

                if (DifyEnum.EVENT_ERROR.equals(event)) {
                    stopFlag.set(true);
                    // 更新dify任务表
                    if (null != difyTaskPo) {
                        difyTaskPo.setStatus(DifyTaskStatusEnum.ERROE.getValue());
                        difyTaskPo.setConversationId(respMap.getString("conversation_id"));
                        difyTaskRepository.save(difyTaskPo);
                    }
                }

                // {"status":"failed","message":"Dify configuration (common agent) not found in settings","data":null,"code":"500"}
                if ("failed".equals(respMap.getString("status"))) {
                    stopFlag.set(true);
                    // 更新dify任务表
                    if (null != difyTaskPo) {
                        difyTaskPo.setStatus(DifyTaskStatusEnum.ERROE.getValue());
                        difyTaskPo.setLastExecResult(respMap.getString("message"));
                        difyTaskRepository.save(difyTaskPo);
                    }
                }
            });

            while (!stopFlag.get()) {
                Thread.sleep(100L);
            }
        } catch(Exception e) {
            log.error(e.getMessage());
            if (null != difyTaskPo) {
                difyTaskPo.setStatus(DifyTaskStatusEnum.ERROE.getValue());
                difyTaskRepository.save(difyTaskPo);
            }
        }finally {
            // 请求结束
            if (null != subscribe && !subscribe.isDisposed()) {
                subscribe.dispose();
            }
        }
    }

    private void savePrompt(String conversationId, String messageId, String promptContent) {
        CompletableFuture.runAsync(() -> {
            ontologyService.uploadToMinio(conversationId, messageId, promptContent);
        });
    }
}

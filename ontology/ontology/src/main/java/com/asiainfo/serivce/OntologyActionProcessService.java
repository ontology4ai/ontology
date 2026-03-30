package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.ProcessStateEnum;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.OntologyFileImportRequest;
import com.asiainfo.feign.response.CommonResponse;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.po.OntologyActionProcessDetailPo;
import com.asiainfo.po.OntologyActionProcessPo;
import com.asiainfo.po.OntologyConfigPo;
import com.asiainfo.repo.OntologyActionProcessDetailRepository;
import com.asiainfo.repo.OntologyActionProcessRepository;
import com.asiainfo.repo.OntologyConfigRepository;
import com.asiainfo.util.JsonHelper;
import com.asiainfo.vo.operation.ActionCallbackVo;
import com.asiainfo.vo.search.OntologyActionProcessSearchVo;
import com.asiainfo.vo.search.OntologyActionProcessVo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyActionProcessService {
    @Value("${suanchou.microservice.gateway.host}")
    private String gatewayHost;

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    OntologyConfigRepository configRepository;

    @Autowired
    private OntologyActionProcessRepository repository;
    @Autowired
    private OntologyActionProcessDetailRepository detailRepository;

    @Autowired
    DataosFeign dataosFeign;
    //    ExecutorService executorService = Executors.newFixedThreadPool(10);
    ExecutorService executorService = Executors.newSingleThreadExecutor();

    public OntologyActionProcessService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public Map<String, Object> queryProcess(String taskId) {
        Map<String, Object> result = new HashMap<>();
        OntologyActionProcessPo po = repository.findByTaskId(taskId);
        result.put("taskId", po.getTaskId());
        result.put("taskName", po.getTaskName());
        result.put("taskType", po.getTaskType());
        result.put("message", po.getMessage());
        result.put("state", ProcessStateEnum.getLabel(po.getState()));
        result.put("startTime", po.getStartTime());
        result.put("endTime", po.getEndTime());
        result.put("fileName", po.getFileName());
        return result;
    }

    public Page<OntologyActionProcessVo> search(OntologyActionProcessSearchVo searchVo) {
        Sort sort = Sort.by(
                Sort.Order.desc("startTime")
        );
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyActionProcessPo> taskPoPage = repository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.isNotBlank(searchVo.getTaskType())) {
                predicates.add(cb.equal(root.get("taskType").as(String.class), searchVo.getTaskType()));
            }
            if (StringUtils.isNotBlank(searchVo.getState())) {
                predicates.add(cb.equal(root.get("state").as(String.class), searchVo.getState()));
            }
            // 添加基于 query 的模糊查询逻辑
            if (StringUtils.isNotBlank(searchVo.getQuery())) {
                String queryPattern = "%" + searchVo.getQuery() + "%";
                Predicate taskIdPredicate = cb.like(root.get("taskId").as(String.class), queryPattern);
                Predicate fileNamePredicate = cb.like(root.get("fileName").as(String.class), queryPattern);
                predicates.add(cb.or(taskIdPredicate, fileNamePredicate));
            }
            predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        List<OntologyActionProcessVo> taskVoList = taskPoPage.getContent().stream().map(po -> {
            OntologyActionProcessVo taskVo = new OntologyActionProcessVo();
            BeanUtils.copyProperties(po, taskVo);

            List<OntologyActionProcessDetailPo> taskDetailPoList = detailRepository.findByTaskId(po.getTaskId());
            Map<String, Long> map = taskDetailPoList.stream()
                    .collect(Collectors.groupingBy(
                            OntologyActionProcessDetailPo::getResourceType,
                            Collectors.counting()
                    ));
            JSONObject resourceInfo = new JSONObject();
            resourceInfo.put("object", map.get("object") == null ? 0 : map.get("object"));
            resourceInfo.put("link", map.get("link") == null ? 0 : map.get("link"));
            resourceInfo.put("logic", map.get("logic") == null ? 0 : map.get("logic"));
            resourceInfo.put("action", map.get("action") == null ? 0 : map.get("action"));
            resourceInfo.put("interface", map.get("interface") == null ? 0 : map.get("interface"));
            taskVo.setResourceInfo(resourceInfo);

            return taskVo;
        }).collect(Collectors.toList());

        return new PageImpl<>(taskVoList, taskPoPage.getPageable(), taskPoPage.getTotalElements());
    }

    public Page<OntologyActionProcessDetailPo> detail(OntologyActionProcessSearchVo searchVo) {
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10);
        Page<OntologyActionProcessDetailPo> taskDetailPoList = detailRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("taskId").as(String.class), searchVo.getTaskId()));
            predicates.add(cb.equal(root.get("resourceType").as(String.class), searchVo.getResourceType()));
            if ("attr".equals(searchVo.getResourceType()) && StringUtils.isNotBlank(searchVo.getObjectTypeId())) {
                predicates.add(cb.equal(root.get("parentId").as(String.class), searchVo.getObjectTypeId()));
            }

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        return taskDetailPoList;
    }

    @Transactional
    public void delete(Map<String, List<String>> params) {
        List<String> ids = params.get("ids");
        repository.deleteByIds(ids);
    }

    public Map<String, Object> startProcess(Map<String, Object> param, ModoWebUtils.CookieIdentity identity) throws JsonProcessingException {

        String uuid = UUID.randomUUID().toString();
        Map<String, Object> result = new HashMap<>();
        OntologyActionProcessPo po = new OntologyActionProcessPo();
        po.setId(uuid);
        po.setCreateUser(identity.getUserId());
        po.setStartTime(LocalDateTime.now());
        po.setOntologyId(MapUtils.getString(param, "ontology_id"));
        po.setFileName(MapUtils.getString(param, "file_name"));
        po.setTaskType(MapUtils.getString(param, "task_type"));
        po.setTaskId(uuid);

        String callBackUrl = gatewayHost + "/ontology/api/open/process/end";
        param.put("callback_url", callBackUrl);
        param.putIfAbsent("task_id", uuid);
        // 使用 ObjectMapper 确保正确转义
        ObjectMapper objectMapper = new ObjectMapper();
        String paramString = objectMapper.writeValueAsString(param);
        log.debug("请求体 JSON: {}", paramString);

        po.setApiParam(paramString);
        po.setOperStatus(OperStatusEnum.CREATED.getCode());
        po.setState(ProcessStateEnum.START.getValue());
        repository.saveAndFlush(po);


        try {
            Map<String,Object> response = dataosFeign.runProccessImport(param);
            // 这里处理 HTTP 200 的情况
            if("success".equals(response.get("status"))) {
                if (response.containsKey("message")) {
                    po.setMessage(response.get("message") + "");
                }
                result.put("success", true);
            } else {
                po.setState(ProcessStateEnum.FAILED.getValue());
                po.setMessage(JsonHelper.getInstance().write(response));
                result.put("success", false);
            }
            result.put("message", po.getMessage());
            result.put("taskId", po.getTaskId());
        } catch (FeignException e) {
            String responseBody = e.contentUTF8();
            result.put("success", false);
            result.put("message", responseBody);
        }
        repository.saveAndFlush(po);
        return result;
    }

    public Map<String, Object> endProcess(ActionCallbackVo callbackVo) {
        sendToProcess(callbackVo.getTask_id(), "收到任务执行完成通知,任务执行结果" + callbackVo.getStatus());
        //TODO 执行pythonurl
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        OntologyActionProcessPo po = repository.findByTaskId(callbackVo.getTask_id());
        if (po == null) {
            result.put("success", false);
            result.put("messsage", "task不存在");
            return result;
        }
        po.setEndTime(LocalDateTime.now());
        po.setMessage(callbackVo.getMessage());
        po.setState(ProcessStateEnum.getValue(callbackVo.getStatus()));
        repository.saveAndFlush(po);

        String ontologyId = po.getOntologyId();
        JSONObject resultJson = callbackVo.getResult_json();
        if (resultJson != null) {
            saveDetail(resultJson, ontologyId, callbackVo.getTask_id());
        }
        sendToProcess(callbackVo.getTask_id(), "任务结束:" + callbackVo.getMessage());

        result.put("success", true);
        return result;
    }

    public Map<String, Object> killProcess(String id) {
        sendToProcess(id, "收到任务中止通知");
        //TODO 执行pythonurl
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        OntologyActionProcessPo po = repository.findByTaskId(id);
        if (po == null) {
            result.put("success", false);
            result.put("messsage", "task不存在");
            return result;
        }
        po.setEndTime(LocalDateTime.now());
        po.setState(ProcessStateEnum.FAILED.getValue());
        repository.saveAndFlush(po);
        sendToProcess(id, "任务结束");
        result.put("success", true);
        return result;
    }

    public void sendToProcess(String processId, Object payload) {
        String destination = "/action/websocket/" + processId;
        // 将消息发送到订阅此目的地的所有客户端
        messagingTemplate.convertAndSend(destination, payload);
        log.info("[" + processId + "]:" + payload);
    }


    private static RestTemplate buildRestTemplateByUrl(String url) {
        if (url != null && url.toLowerCase().startsWith("https")) {
            try {
                // 测试环境：信任所有证书 + 跳过域名校验
                SSLContext sslContext = new SSLContextBuilder()
                        .loadTrustMaterial(null, (chain, authType) -> true)
                        .build();

                SSLConnectionSocketFactory socketFactory =
                        new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);

                CloseableHttpClient httpClient = HttpClients.custom()
                        .setSSLSocketFactory(socketFactory)
                        .build();

                HttpComponentsClientHttpRequestFactory requestFactory =
                        new HttpComponentsClientHttpRequestFactory(httpClient);
                // 可选：设置超时
                requestFactory.setConnectTimeout(10_000);
                requestFactory.setReadTimeout(30_000);

                return new RestTemplate(requestFactory);
            } catch (Exception e) {
                throw new RuntimeException("构建HTTPS RestTemplate失败", e);
            }
        } else {
            // 普通HTTP
            RestTemplate restTemplate = new RestTemplate();
            return restTemplate;
        }
    }

    public String getConfig(String key) {
        String result = null;
        List<OntologyConfigPo> configs = configRepository.findConfigs(key);
        if (configs != null && !configs.isEmpty()) {
            for (OntologyConfigPo config : configs) {
                result = config.getConfigValue();
            }
        }
        return result;
    }

    private void saveDetail(JSONObject resultJson, String ontologyId, String taskId) {
        log.info("[{}]: {}", taskId, resultJson);
        // 对象类型
        JSONArray objectArray = resultJson.getJSONArray("object");
        Map<String, JSONObject> objectMap = new HashMap<>();
        for (int i = 0; i < objectArray.size(); i++) {
            JSONObject object = objectArray.getJSONObject(i);
            objectMap.put(object.getString("objectTypeName"), object);
            String objectTypeId = object.getString("id");
            OntologyActionProcessDetailPo detailPo = new OntologyActionProcessDetailPo();
            detailPo.setId(StringUtil.genUuid(32));
            detailPo.setOntologyId(ontologyId);
            detailPo.setTaskId(taskId);
            detailPo.setResourceType("object");
            detailPo.setState(object.getBoolean("is_exist") ? 0 : 1);
            JSONObject content = new JSONObject();
            content.put("id", objectTypeId);
            content.put("name", object.getString("objectTypeName"));
            content.put("label", object.getString("objectTypeLabel"));
            content.put("desc", object.getString("objectTypeDesc"));
            detailPo.setContent(content.toJSONString());
            detailRepository.save(detailPo);

            // 对象属性
            JSONArray attributeArray = object.getJSONArray("attributes");
            for (int j = 0; j < attributeArray.size(); j++) {
                JSONObject attribute = attributeArray.getJSONObject(j);
                OntologyActionProcessDetailPo attrDetailPo = new OntologyActionProcessDetailPo();
                attrDetailPo.setId(StringUtil.genUuid(32));
                attrDetailPo.setOntologyId(ontologyId);
                attrDetailPo.setTaskId(taskId);
                attrDetailPo.setParentId(objectTypeId);
                attrDetailPo.setResourceType("attr");
                attrDetailPo.setState(attribute.getBoolean("is_exist") ? 0 : 1);
                JSONObject attrContent = new JSONObject();
                attrContent.put("id", objectTypeId);
                attrContent.put("name", attribute.getString("fieldName"));
                attrContent.put("label", attribute.getString("attributeName"));
                attrContent.put("desc", attribute.getString("attributeDesc"));
                attrContent.put("isTitle", attribute.getBooleanValue("isTitle") ? 1 : 0);
                attrContent.put("isPrimaryKey", attribute.getBooleanValue("isPrimaryKey") ? 1 : 0);
                attrDetailPo.setContent(attrContent.toJSONString());
                detailRepository.save(attrDetailPo);
            }
        }

        // 关系类型
        JSONArray tagArray = resultJson.getJSONArray("tag");
        Map<String, JSONObject> tagMap = new HashMap<>();
        for (int i = 0; i < tagArray.size(); i++) {
            JSONObject tag = tagArray.getJSONObject(i);
            String tagName = tag.getString("tagName");
            tagMap.put(tagName, tag);
        }
        JSONArray linkArray = resultJson.getJSONArray("link");
        for (int i = 0; i < linkArray.size(); i++) {
            JSONObject link = linkArray.getJSONObject(i);
            OntologyActionProcessDetailPo linkDetailPo = new OntologyActionProcessDetailPo();
            linkDetailPo.setId(StringUtil.genUuid(32));
            linkDetailPo.setOntologyId(ontologyId);
            linkDetailPo.setTaskId(taskId);
            linkDetailPo.setResourceType("link");
            linkDetailPo.setState(link.getBoolean("is_exist") ? 0 : 1);
            JSONObject content = new JSONObject();
            content.put("id", link.getString("id"));
            content.put("sourceName", link.getString("sourcename"));
            content.put("sourceLabel", link.getString("sourcelabel"));
            content.put("targetName", link.getString("targetname"));
            content.put("targetLabel", link.getString("targetlabel"));
            String sourceTagName = link.getString("op_name_source");
            JSONObject sourceTag = tagMap.get(sourceTagName);
            if (sourceTag != null) {
                content.put("sourceTagName", sourceTagName);
                content.put("sourceTagLabel", sourceTag.getString("tagLabel"));
            }
            String targetTagName = link.getString("op_name_target");
            JSONObject targetTag = tagMap.get(targetTagName);
            if (targetTag != null) {
                content.put("targetTagName", targetTagName);
                content.put("targetTagLabel", targetTag.getString("tagLabel"));
            }
            linkDetailPo.setContent(content.toJSONString());
            detailRepository.save(linkDetailPo);
        }

        // 逻辑类型
        JSONArray logicArray = resultJson.getJSONArray("logic");
        for (int i = 0; i < logicArray.size(); i++) {
            JSONObject logic = logicArray.getJSONObject(i);
            OntologyActionProcessDetailPo logicDetailPo = new OntologyActionProcessDetailPo();
            logicDetailPo.setId(StringUtil.genUuid(32));
            logicDetailPo.setOntologyId(ontologyId);
            logicDetailPo.setTaskId(taskId);
            logicDetailPo.setResourceType("logic");
            logicDetailPo.setState(logic.getBoolean("is_exist") ? 0 : 1);
            JSONObject content = new JSONObject();
            content.put("id", logic.getString("id"));
            content.put("name", logic.getString("function_name"));
            content.put("label", logic.getString("function_label"));
            content.put("desc", logic.getString("fun_desc"));
            content.put("buildType", logic.getString("buildType"));
            content.put("fileName", logic.getString("file_name"));
            JSONArray objectNames = logic.getJSONArray("used_objects");
            if (objectNames == null || objectNames.isEmpty()) {
                content.put("objectNames", null);
                content.put("objectLabels", null);
            } else {
                JSONArray objectLabels = new JSONArray();
                for (int j = 0; j < objectNames.size(); j++) {
                    String objectName = objectNames.getString(j);
                    JSONObject object = objectMap.get(objectName);
                    if (object != null) {
                        objectLabels.add(object.getString("objectTypeLabel"));
                    }
                }
                content.put("objectNames", logic.getJSONArray("used_objects"));
                content.put("objectLabels", objectLabels);
            }
            logicDetailPo.setContent(content.toJSONString());
            detailRepository.save(logicDetailPo);
        }

        // 动作类型
        JSONArray actionArray = resultJson.getJSONArray("action");
        for (int i = 0; i < actionArray.size(); i++) {
            JSONObject action = actionArray.getJSONObject(i);
            OntologyActionProcessDetailPo actionDetailPo = new OntologyActionProcessDetailPo();
            actionDetailPo.setId(StringUtil.genUuid(32));
            actionDetailPo.setOntologyId(ontologyId);
            actionDetailPo.setTaskId(taskId);
            actionDetailPo.setResourceType("action");
            actionDetailPo.setState(action.getBoolean("is_exist") ? 0 : 1);
            JSONObject content = new JSONObject();
            content.put("id", action.getString("id"));
            content.put("name", action.getString("action_name"));
            content.put("label", action.getString("action_label"));
            content.put("desc", action.getString("action_desc"));
            content.put("buildType", action.getString("buildType"));
            content.put("fileName", action.getString("file_name"));
            String objectName = action.getString("object_name");
            content.put("objectName", objectName);
            JSONObject object = objectMap.get(objectName);
            if (object != null) {
                content.put("objectLabel", object.getString("objectTypeLabel"));
            }
            actionDetailPo.setContent(content.toJSONString());
            detailRepository.save(actionDetailPo);
        }

        // 接口类型
    }
}

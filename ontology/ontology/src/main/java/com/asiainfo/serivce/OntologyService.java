package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.*;
import com.asiainfo.dto.*;
import com.asiainfo.event.OntologyEnabledEvent;
import com.asiainfo.feign.request.FieldInfo;
import com.asiainfo.feign.request.OntologyFileExportRequest;
import com.asiainfo.feign.request.OntologyFileImportRequest;
import com.asiainfo.feign.request.OntologyGraphRequest;
import com.asiainfo.feign.request.OntologyMigrateInRequest;
import com.asiainfo.feign.request.OntologyMigrateOutRequest;
import com.asiainfo.feign.request.OntologyObjectCreateRequest;
import com.asiainfo.feign.request.OntologyRefreshRequest;
import com.asiainfo.feign.response.*;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.minio.LifecycleRulesBuilder;
import com.asiainfo.minio.MinioConfig;
import com.asiainfo.modo.app.usersystem.user.ModoUser;
import com.asiainfo.modo.app.usersystem.user.ModoUserRepo;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;
import com.asiainfo.vo.search.OntologyGraphExportVo;
import com.asiainfo.vo.search.OntologyGraphSearchVo;
import com.asiainfo.vo.search.OntologySearchVo;
import com.asiainfo.vo.operation.OntologyVo;
import com.asiainfo.vo.search.OntologyVersionSearchVo;
import io.github.suanchou.utils.JsonUtil;
import io.github.suanchou.utils.StringUtil;
import io.minio.BucketExistsArgs;
import io.minio.GetBucketLifecycleArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.SetBucketLifecycleArgs;
import io.minio.http.Method;
import io.minio.messages.Expiration;
import io.minio.messages.LifecycleConfiguration;
import io.minio.messages.LifecycleRule;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.persistence.criteria.Predicate;
import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@Service
@Slf4j
public class OntologyService {
    @Autowired
    OntologyRepository ontologyRepository;
    @Autowired
    ModoUserRepo modoUserRepo;
    @Autowired
    DataosFeign dataosFeign;
    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;
    @Autowired
    OntologySharedAttributeRepository sharedAttributeRepository;
    @Autowired
    OntologyObjectTypeActionRepository actionRepository;
    @Autowired
    OntologyLinkTypeRepository linkTypeRepository;
    @Autowired
    OntologyLinkTypeTagRepository linkTypeTagRepository;
    @Autowired
    OntologyTagRepository tagRepository;
    @Autowired
    OntologyLogicTypeRepository logicTypeRepository;
    @Autowired
    OntologyLogicTypeObjectRepository logicTypeObjectRepository;
    @Autowired
    OntologyVersionRepository versionRepository;
    @Autowired
    OntologyPublishService ontologyPublishService;
    @Autowired
    LogicTypeService logicTypeService;
    @Autowired
    MinioConfig minioConfig;
    @Autowired
    OntologyPublishApiService publishApiService;
    @Autowired
    OntologyAgentRepository agentRepository;
    @Autowired
    OntologyConfigService configService;
    @Autowired
    ApplicationEventPublisher eventPublisher;
    @Autowired
    OntologyInterfaceRepository interfaceRepository;
    @Autowired
    private OntologyConfigGroupService configGroupService;
    @Autowired
    private AgentPlatformUtils agentPlatformUtils;
    @Autowired
    OntologyDefaultPromptService defaultPromptService;
    @Autowired
    private OntologyActionProcessRepository actionProcessRepository;
    @Autowired
    private OntologyActionProcessDetailRepository actionProcessDetailRepository;
    @Value("${suanchou.microservice.gateway.host:localhost}")
    String gatewayHost;
    @Autowired
    private OntologyPromptRepository promptRepository;

    public static final String promptName = "agent_prompt";

    public static final String BUCKET_PROMPT_NAME = "ontology-conversation-prompt";

    ExecutorService executorService = Executors.newFixedThreadPool(10);

    private static final int GRAPH_OVERVIEW_NODE_LIMIT = 150;

    public Page<OntologyDto> search(OntologySearchVo searchVo) {

        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyPo> ontologyPage = ontologyRepository.findAll((Specification<OntologyPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("ontologyName").as(String.class)), "%" + keyword + "%");
                Predicate labelLike = cb.like(root.get("ontologyLabel").as(String.class), "%" + keyword + "%");
                Predicate descLike = cb.like(cb.lower(root.get("ontologyDesc").as(String.class)), "%" + keyword + "%");
                predicates.add(cb.or(nameLike, labelLike, descLike));
            }

            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if (searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            if (searchVo.getIsRecommend() != null) {
                predicates.add(cb.equal(root.get("isRecommend").as(Integer.class), searchVo.getIsRecommend()));
            }

            if (searchVo.getPublished() != null && searchVo.getPublished() == 1) {
                predicates.add(cb.isNotNull(root.get("latestVersion").as(Integer.class)));
            }

            predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        List<String> userIdList = new ArrayList<>();
        ontologyPage.getContent().forEach(ontologyPo -> {
            userIdList.add(ontologyPo.getOwnerId());
        });

        // 查询关联的所有用户
        List<ModoUser> all = modoUserRepo.findUserByUserIdAll(userIdList);
        Map<String, String> userMap = new HashMap<>();
        for (ModoUser modoUser : all) {
            userMap.put(modoUser.getUserId(), modoUser.getUserName());
        }

        final List<OntologyDto> collect = ontologyPage.getContent().stream().map(ontologyPo -> {
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            ontologyDto.setOwner(userMap.get(ontologyPo.getOwnerId()));
            ontologyDto.setVersionName(ontologyPo.getLatestVersion());
            return ontologyDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, ontologyPage.getPageable(), ontologyPage.getTotalElements());
    }

    @Transactional
    public OntologyPo save(OntologyVo ontologyVo) {
        // 校验名称是否重复
        String ontologyName = ontologyVo.getOntologyName();
        String ontologyLabel = ontologyVo.getOntologyLabel();
        String workspaceId = ontologyVo.getWorkspaceId();
        if (existsByName(null, ontologyName, workspaceId)) {
            throw new RuntimeException("英文名已存在");
        }
        if (existsByLabel(null, ontologyLabel, workspaceId)) {
            throw new RuntimeException("中文名已存在");
        }

        OntologyPo ontologyPo = new OntologyPo();
        BeanUtils.copyProperties(ontologyVo, ontologyPo);
        ontologyPo.setIsRecommend(ontologyVo.getIsRecommend() == null ? 0 : ontologyVo.getIsRecommend());
        ontologyPo.setId(StringUtil.genUuid(32));
        ontologyPo.setStatus(StatusEnum.DISABLED.getCode());
        ontologyPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        ontologyPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        ontologyRepository.save(ontologyPo);
        defaultPromptService.initDefaultPrompt(ontologyPo);

        return ontologyPo;
    }

    @Transactional
    public OntologyPo update(String id, OntologyVo ontologyUpdateVo) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElse(null);
        if (ontologyPo == null || ontologyPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("本体不存在");
        }
        Integer originalStatus = ontologyPo.getStatus();
        boolean statusChangedToEnabled = false;

        String ontologyName = ontologyUpdateVo.getOntologyName();
        String ontologyLabel = ontologyUpdateVo.getOntologyLabel();
        String workspaceId = ontologyUpdateVo.getWorkspaceId();
        if (existsByName(id, ontologyName, workspaceId)) {
            throw new RuntimeException("英文名已存在");
        }
        if (existsByLabel(id, ontologyLabel, workspaceId)) {
            throw new RuntimeException("中文名已存在");
        }

        boolean needUpdate = false;
        if (!StringUtils.equals(ontologyUpdateVo.getOntologyLabel(), ontologyPo.getOntologyLabel())) {
            needUpdate = true;
            ontologyPo.setOntologyLabel(ontologyUpdateVo.getOntologyLabel());
        }
        if (!StringUtils.equals(ontologyUpdateVo.getOntologyDesc(), ontologyPo.getOntologyDesc())) {
            needUpdate = true;
            ontologyPo.setOntologyDesc(ontologyUpdateVo.getOntologyDesc());
        }
        if (!StringUtils.equals(ontologyUpdateVo.getOntologyName(), ontologyPo.getOntologyName())) {
            needUpdate = true;
            ontologyPo.setOntologyName(ontologyUpdateVo.getOntologyName());
        }
        if (ontologyUpdateVo.getStatus() != null && !ontologyUpdateVo.getStatus().equals(ontologyPo.getStatus())) {
            needUpdate = true;
            ontologyPo.setStatus(ontologyUpdateVo.getStatus());
            statusChangedToEnabled = Objects.equals(ontologyUpdateVo.getStatus(), StatusEnum.ENABLED.getCode())
                    && !Objects.equals(originalStatus, ontologyUpdateVo.getStatus());
        }
        if (ontologyUpdateVo.getIsRecommend() != null
                && !Objects.equals(ontologyUpdateVo.getIsRecommend(), ontologyPo.getIsRecommend())) {
            needUpdate = true;
            ontologyPo.setIsRecommend(ontologyUpdateVo.getIsRecommend());
        }

        if (needUpdate) {
            ontologyPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            ontologyPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            ontologyRepository.save(ontologyPo);
            if (statusChangedToEnabled) {
                eventPublisher.publishEvent(new OntologyEnabledEvent(
                        ontologyPo.getId(),
                        ontologyUpdateVo.getOwnerId(),
                        ontologyPo));
            }
        }
        return ontologyPo;
    }

    @Transactional
    public Boolean delete(List<String> ids) {

        ontologyRepository.softDeleteByIds(ids);

        // 调用接口删除开发目录
        for (String id : ids) {
            OntologyPo ontologyPo = ontologyRepository.findById(id).orElse(null);
            if (ontologyPo != null) {
                Map<String, Object> params = new HashMap<>();
                params.put("ontology_name", ontologyPo.getOntologyName());
                log.info("删除本体调用接口删除目录请求: {}", JsonUtil.getInstance().write(params));
                Map<String, Object> response = dataosFeign.deleteOntology(params);
                log.info("删除本体调用接口删除目录返回: {}", JsonUtil.getInstance().write(response));
                if ("failed".equals(response.get("status"))) {
                    throw new RuntimeException("本体删除失败，" + MapUtils.getString(response, "message"));
                }
            }
        }

        return true;
    }

    @Transactional
    public String publish(List<String> ids, String userId) {
        String taskId = StringUtil.genUuid(32);
        for (String id : ids) {
            publish(id, userId, taskId);
        }

        return taskId;
    }

    public void publish(String id, String userId, String taskId) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElse(null);
        if (ontologyPo == null || ontologyPo.getOperStatus() >= OperStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("本体不存在");
        }

        // todo: 发布时同步一次逻辑
        logicTypeService.syncFunction(ontologyPo, userId);
        // todo: 发布时同步一次动作

        // 记录版本数据
        ontologyPo.setPublishUser(userId);
        ontologyPublishService.publish(ontologyPo, taskId);

        // 调用同步接口
        Map<String, Object> params = new HashMap<>();
        params.put("folder_name", ontologyPo.getOntologyName());
        log.info("调用同步生产环境请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.publishOntology(params);
        log.info("调用同步生产环境返回: {}", JsonUtil.getInstance().write(response));
        if (!"200".equals(response.get("code"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }

        publishApiService.generateOntologyApi(id);

        // 发布成功后记录版本信息，复用同步流程的版本生成逻辑
        saveOntologyVersion(id, userId);
    }

    @Transactional
    public boolean sync(String id, String userId) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElse(null);
        if (ontologyPo == null || ontologyPo.getOperStatus() >= OperStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("本体不存在");
        }
        if (ontologyPo.getStatus() == StatusEnum.DISABLED.getCode()) {
            throw new RuntimeException("本体已禁用");
        }

        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository.findByOntologyId(id);

        List<OntologyRefreshRequest> reqs = new ArrayList<>();
        for (OntologyObjectTypePo objectTypePo : objectTypePos) {
            try {
                OntologyRefreshRequest request = new OntologyRefreshRequest();
                request.setDoc(objectTypePo.getObjectTypeLabel());
                request.setTable_name(objectTypePo.getTableName());
                request.setName(objectTypePo.getObjectTypeName());
                if (StringUtils.isEmpty(objectTypePo.getTableName())) {
                    log.warn("未配置数据源，不进行同步");
                    continue;
                }
                List<OntologyObjectTypeAttributePo> attributePos = attributeRepository
                        .findAvaliableAndEnableByTypeId(objectTypePo.getId());

                if (attributePos.isEmpty()) {
                    log.warn("没有启用的属性，不进行同步");
                    continue;
                }
                List<FieldInfo> fieldInfos = attributePos.stream()
                        .filter(attributePo -> StringUtils.isNotBlank(attributePo.getFieldType())
                                && StringUtils.isNotBlank(attributePo.getFieldName()))
                        .map(attributePo -> {
                            FieldInfo fieldInfo = new FieldInfo();
                            fieldInfo.setName(attributePo.getFieldName());
                            fieldInfo.setType(attributePo.getFieldType());
                            fieldInfo.setPrimary_key(attributePo.getIsPrimaryKey() == 1);
                            fieldInfo.setProperty(attributePo.getAttributeName());
                            return fieldInfo;
                        }).collect(Collectors.toList());
                request.setFields(fieldInfos);

                int status = 0;
                if (objectTypePo.getSyncStatus() <= ChangeStatusEnum.DELETED.getCode()
                        && objectTypePo.getStatus() == StatusEnum.ENABLED.getCode()) {
                    status = 1;
                }
                request.setOntology_name(ontologyPo.getOntologyName());
                request.setStatus(status);
                reqs.add(request);
            } catch (Exception e) {
                log.error("", e);
            }
        }

        log.info("{}", JSONArray.toJSON(reqs));

        Map<String, Object> param = new HashMap<>();
        param.put("ontology_json", reqs);
        dataosFeign.refreshOntology(param);

        try {

            ontologyPo.setSyncLabel(SyncStatusEnum.SYNCING.getCode());
            ontologyRepository.save(ontologyPo);
            OntologyObjectCreateRequest request = new OntologyObjectCreateRequest();
            request.setOntology_id(id);

            executorService.submit(() -> {

                try {
                    final OntologyObjectCreateResponse ontologyObject = dataosFeign.createOntologyObject(request);

                    if ("success".equals(ontologyObject.getStatus())) {
                        ontologyPo.setSyncLabel(SyncStatusEnum.SYNC_SUCCESS.getCode());
                        ontologyRepository.save(ontologyPo);
                    } else {
                        ontologyPo.setSyncLabel(SyncStatusEnum.SYNC_FAILED.getCode());
                        ontologyRepository.save(ontologyPo);
                    }
                } catch (Exception e) {
                    log.error("", e);
                }

            });

            saveOntologyVersion(id, userId);

        } catch (Exception e) {
            ontologyPo.setSyncLabel(SyncStatusEnum.SYNC_FAILED.getCode());
            ontologyRepository.save(ontologyPo);
            throw new RuntimeException(e);
        }

        return true;
    }

    @Transactional
    public Object view(String id, String workspaceId) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElseThrow(() -> new RuntimeException("本体管理器不存在"));

        OntologyViewDto ontologyViewDto = new OntologyViewDto();
        BeanUtils.copyProperties(ontologyPo, ontologyViewDto);

        Map<String, OntologyObjectTypeDto> objectTypeDtoMap = new HashMap<>();

        // 对象类型
        List<String> oids = new ArrayList<>();
        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository.findExistByOntologyId(id);
        List<OntologyObjectTypeDto> typeDtos = objectTypePos.stream().map(objectTypePo -> {
            OntologyObjectTypeDto typeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo, typeDto);
            oids.add(objectTypePo.getId());
            objectTypeDtoMap.put(objectTypePo.getId(), typeDto);
            return typeDto;
        }).collect(Collectors.toList());
        ontologyViewDto.setObjectTypes(typeDtos);

        // 共享属性
        List<OntologySharedAttributePo> sharedAttributePos = sharedAttributeRepository.findExistByOntologyId(id);
        List<OntologySharedAttributeDto> sharedAttributeDtos = sharedAttributePos.stream().map(sharedAttributePo -> {
            OntologySharedAttributeDto sharedAttributeDto = new OntologySharedAttributeDto();
            BeanUtils.copyProperties(sharedAttributePo, sharedAttributeDto);
            return sharedAttributeDto;
        }).collect(Collectors.toList());
        ontologyViewDto.setSharedAttributes(sharedAttributeDtos);

        // 关系类型
        List<OntologyLinkTypePo> linkTypePos = linkTypeRepository.findByOntologyId(id);
        List<OntologyLinkTypeDto> linkTypeDtos = linkTypePos.stream().filter(linkTypePo -> {
            OntologyObjectTypeDto sourceTypeDto = objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId());
            OntologyObjectTypeDto targetTypeDto = objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId());
            return sourceTypeDto != null && targetTypeDto != null;
        }).map(linkTypePo -> {
            OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
            BeanUtils.copyProperties(linkTypePo, linkTypeDto);
            linkTypeDto.setSourceObjectType(objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId()));
            linkTypeDto.setTargetObjectType(objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId()));
            return linkTypeDto;
        }).collect(Collectors.toList());

        ontologyViewDto.setLinkTypes(linkTypeDtos);

        // 动作类型？
        List<OntologyObjectTypeActionPo> actionPos = actionRepository.findAllByOntologyId(id);
        List<OntologyObjectTypeActionDto> actionDtos = actionPos.stream().map(OntologyObjectTypeActionDto::transform)
                .collect(Collectors.toList());
        ontologyViewDto.setActionDtos(actionDtos);

        // 接口类型
        List<OntologyInterfacePo> interfacePoList = interfaceRepository.findAllByOntologyId(id);
        List<OntologyInterfaceDto> interfaceDtoList = interfacePoList.stream().map(interfacePo -> {
            OntologyInterfaceDto interfaceDto = new OntologyInterfaceDto();
            BeanUtils.copyProperties(interfacePo, interfaceDto);
            return interfaceDto;
        }).collect(Collectors.toList());
        ontologyViewDto.setInterfaces(interfaceDtoList);

        // 逻辑类型
        List<OntologyLogicTypePo> logicTypeList = logicTypeRepository.findAllByOntologyId(id);
        List<LogicTypeDto> logicTypeDtoList = logicTypeList.stream().map(logicTypePo -> {
            LogicTypeDto logicTypeDto = new LogicTypeDto();
            BeanUtils.copyProperties(logicTypePo, logicTypeDto);
            return logicTypeDto;
        }).collect(Collectors.toList());
        ontologyViewDto.setLogicTypes(logicTypeDtoList);

        // 提示词总量
        ontologyViewDto.setPromptTotal(promptRepository.countByOntologyId(id, workspaceId));

        return ontologyViewDto;
    }

    public Map<String, Object> checkExists(OntologyVo ontologyVo) {
        String id = ontologyVo.getId();
        String ontologyName = ontologyVo.getOntologyName();
        String ontologyLabel = ontologyVo.getOntologyLabel();
        String workspaceId = ontologyVo.getWorkspaceId();
        if (StringUtils.isNotBlank(ontologyName)) {
            boolean exists = existsByName(id, ontologyName, workspaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("exists", exists);
            result.put("ontologyName", ontologyName);
            return result;
        } else if (StringUtils.isNotBlank(ontologyLabel)) {
            boolean exists = existsByLabel(id, ontologyLabel, workspaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("exists", exists);
            result.put("ontologyLabel", ontologyLabel);
            return result;
        } else {
            throw new RuntimeException("英文名和中文名不能同时为空");
        }
    }

    public String getPrompt(String id) throws Exception {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElseThrow(() -> new RuntimeException("本体不存在"));
        CommonResponse response = dataosFeign.getPrompt();
        log.info("调用提示词模版接口返回: {}", JsonUtil.getInstance().write(response));
        if (!"success".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }
        String prompt = MapUtils.getString(response.getData(), "prompt");

        OntologyFileExportRequest request = new OntologyFileExportRequest();
        request.setOntology_id(ontologyPo.getId());
        request.setFormat("compact");
        log.info("导出RDF文件接口请求: {}", JsonUtil.getInstance().write(request));
        OntologyFileExportResponse exportResponse = dataosFeign.exportOntologyFile(request);
        log.info("导出RDF文件接口返回: {}", JsonUtil.getInstance().write(exportResponse));
        if (!"success".equals(exportResponse.getStatus())) {
            throw new Exception(exportResponse.getMessage());
        }
        prompt += "\n\n" + MapUtils.getString(exportResponse.getData(), "ttl");
        return prompt;
    }

    /**
     * 获取通用基础提示词
     */
    public String getCommonPrompt(String id) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElseThrow(() -> new RuntimeException("本体不存在"));
        CommonResponse response = dataosFeign.getPrompt();
        log.info("调用提示词模版接口返回: {}", JsonUtil.getInstance().write(response));
        if (!"success".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }
        return MapUtils.getString(response.getData(), "prompt");
    }

    /**
     * 获取通用RDF提示词
     */
    public String getRDFPrompt(String id) {
        OntologyPo ontologyPo = ontologyRepository.findById(id).orElseThrow(() -> new RuntimeException("本体不存在"));
        OntologyFileExportRequest request = new OntologyFileExportRequest();
        request.setOntology_id(ontologyPo.getId());
        request.setFormat("compact");
        log.info("导出RDF文件接口请求: {}", JsonUtil.getInstance().write(request));
        OntologyFileExportResponse exportResponse = dataosFeign.exportOntologyFile(request);
        log.info("导出RDF文件接口返回: {}", JsonUtil.getInstance().write(exportResponse));
        if (!"success".equals(exportResponse.getStatus())) {
            throw new RuntimeException(exportResponse.getMessage());
        }
        return MapUtils.getString(exportResponse.getData(), "ttl");
    }

    public String getOagPrompt(String id) {
        CommonResponse response = dataosFeign.getOagPrompt(id);
        log.info("调用提示词模版接口返回: {}", JsonUtil.getInstance().write(response));
        if (!"success".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }

        return MapUtils.getString(response.getData(), "prompt");
    }

    public String getPromptAgent(String id) throws Exception {
        String prompt = getPrompt(id);

        OntologyConfigPo configPo = configService.findKey(promptName);
        if (StringUtils.isNotBlank(configPo.getConfigValue())) {
            return configPo.getConfigValue().replace("{{prompt}}", prompt);
        }
        return prompt;
    }

    public Object listVersion(OntologyVersionSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "versionName");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyVersionPo> versionPoPage = versionRepository
                .findAll((Specification<OntologyVersionPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();
                    if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                        predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
                    }
                    predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();

                }, request);

        List<String> userIdList = versionPoPage.getContent()
                .stream()
                .map(OntologyVersionPo::getOwnerId)
                .collect(Collectors.toList());
        List<ModoUser> all = modoUserRepo.findUserByUserIdAll(userIdList);

        Map<String, String> userMap = new HashMap<>();
        for (ModoUser modoUser : all) {
            userMap.put(modoUser.getUserId(), modoUser.getUserName());
        }
        final List<OntologyVersionDto> collect = versionPoPage.getContent().stream().map(versionPo -> {
            OntologyVersionDto versionDto = new OntologyVersionDto();
            BeanUtils.copyProperties(versionPo, versionDto);
            versionDto.setOwner(userMap.get(versionPo.getOwnerId()));
            return versionDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, versionPoPage.getPageable(), versionPoPage.getTotalElements());
    }

    private boolean saveOntologyVersion(String id, String userId) {
        String versionName = "V1.0";
        // 查询最新版本
        List<OntologyVersionPo> ontologyVersionPoList = versionRepository.findByOntologyIdAndLatest(id, 0);
        if (ontologyVersionPoList != null && !ontologyVersionPoList.isEmpty()) {
            for (OntologyVersionPo ontologyVersionPo : ontologyVersionPoList) {
                ontologyVersionPo.setLatest(1);
                versionRepository.save(ontologyVersionPo);
            }
            String latestVersion = ontologyVersionPoList.get(0).getVersionName();
            versionName = incrementVersion(latestVersion);
        }

        OntologyVersionPo versionPo = new OntologyVersionPo();
        versionPo.setId(StringUtil.genUuid(32));
        versionPo.setVersionName(versionName);
        versionPo.setOntologyId(id);
        versionPo.setLatest(0);
        versionPo.setOwnerId(userId);
        versionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        versionRepository.save(versionPo);

        return true;
    }

    /**
     * 将版本号增加 0.1
     * 
     * @param version 原始版本号，如 "V1.0"
     * @return 增加后的版本号
     */
    private static String incrementVersion(String version) {
        if (version == null || !version.startsWith("V")) {
            throw new IllegalArgumentException("版本号格式错误，必须以 V 开头，如 V1.0");
        }

        // 去掉前缀 V
        String numberPart = version.substring(1);

        // 拆分整数部分和小数部分
        String[] parts = numberPart.split("\\.");
        if (parts.length != 2) {
            throw new IllegalArgumentException("版本号格式错误，必须为 Vx.y");
        }

        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);

        // 小数部分 +1
        minor++;

        return "V" + major + "." + minor;
    }

    public OntologyGraphResponse getGraphByOntologyId(OntologyGraphSearchVo searchVo) {
        try {
            OntologyGraphRequest request = new OntologyGraphRequest();
            request.setOntology_id(searchVo.getOntologyId());
            request.setNodes_amount(searchVo.getNodesAmount());
            if (null != searchVo.getNodeNames()) {
                request.setNode_names(Arrays.asList(searchVo.getNodeNames().split(",")));
            }
            if (null != searchVo.getPubVersion()) {
                request.setPub_version(searchVo.getPubVersion());
            }

            return dataosFeign.getGraphByOntologyId(request);
        } catch (Exception e) {
            OntologyGraphResponse errorResponse = new OntologyGraphResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            errorResponse.setCode("500");
            return errorResponse;
        }
    }

    public OntologyGraphResponse expandGraphNodeByTypeId(String objectTypeId, String pubVersion) {
        try {
            return dataosFeign.expandGraphNodeByTypeId(objectTypeId, pubVersion);
        } catch (Exception e) {
            OntologyGraphResponse errorResponse = new OntologyGraphResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            errorResponse.setCode("500");
            return errorResponse;
        }
    }

    public OntologyGraphViewDto getGraphOverview(String ontologyId) {
        OntologyPo ontologyPo = ontologyRepository.findById(ontologyId)
                .orElseThrow(() -> new RuntimeException("本体管理器不存在"));
        OntologyGraphViewDto graphViewDto = new OntologyGraphViewDto();
        BeanUtils.copyProperties(ontologyPo, graphViewDto);

        // graphViewDto.setVersion(versionRepository.findFirstByOntologyId(ontologyId));
        graphViewDto.setVersion(ontologyPo.getLatestVersion());
        graphViewDto.setObjectTypes(objectTypeRepository.countByOntologyId(ontologyId));
        graphViewDto.setDatasourceObjectTypes(objectTypeRepository.countHasDsByOntologyId(ontologyId));
        graphViewDto.setNotDatasourceObjectTypes(objectTypeRepository.countNoDsByOntologyId(ontologyId));
        graphViewDto.setInterfaceObjectTypes(objectTypeRepository.countHasInterfaceByOntologyId(ontologyId));
        graphViewDto.setNotInterfaceObjectTypes(objectTypeRepository.countNoInterfaceByOntologyId(ontologyId));

        graphViewDto.setObjectActions(actionRepository.countByOntologyId(ontologyId));
        graphViewDto.setFunctionObjectActions(actionRepository.countFunctionByOntologyId(ontologyId));
        graphViewDto.setCreateObjectActions(actionRepository.countCreateByOntologyId(ontologyId));
        graphViewDto.setUpdateObjectActions(actionRepository.countUpdateByOntologyId(ontologyId));
        graphViewDto.setDeleteObjectActions(actionRepository.countDeleteByOntologyId(ontologyId));

        graphViewDto.setLogicTypes(logicTypeRepository.countByOntologyId(ontologyId));
        graphViewDto.setRefObjectLogicTypes(logicTypeRepository.countRefObjectByOntologyId(ontologyId));
        graphViewDto.setNotRefObjectLogicTypes(logicTypeRepository.countNotRefObjectByOntologyId(ontologyId));
        graphViewDto.setFunctionLogicTypes(logicTypeRepository.countFunctionByOntologyId(ontologyId));

        graphViewDto.setInterfaces(interfaceRepository.countByOntologyId(ontologyId));
        graphViewDto.setExtendObjectInterfaces(interfaceRepository.countExtendObjectByOntologyId(ontologyId));
        graphViewDto.setNotExtendObjectInterfaces(interfaceRepository.countNotExtendObjectByOntologyId(ontologyId));

        List<GroupLinkTypeDto> linkList = Stream
                .concat(linkTypeRepository.countLinkTypeWithSourceTypeId(ontologyId).stream(),
                        linkTypeRepository.countLinkTypeWithTargetTypeId(ontologyId).stream())
                .collect(Collectors.toList());
        // 合并source&target关系
        Map<String, GroupLinkTypeDto> linkMap = new HashMap<>();
        for (GroupLinkTypeDto linkDto : linkList) {
            GroupLinkTypeDto tmpDto = linkMap.get(linkDto.getColumn());
            if (null != tmpDto) {
                tmpDto.setColumnCount(tmpDto.getColumnCount() + linkDto.getColumnCount());
                continue;
            }

            linkMap.put(linkDto.getColumn(), linkDto);
        }

        for (String objectTypeId : linkMap.keySet()) {
            Optional<OntologyObjectTypePo> objectTypePo = objectTypeRepository.findById(objectTypeId);
            if (objectTypePo.isPresent()) {
                linkMap.get(objectTypeId).setColumn(objectTypePo.get().getObjectTypeLabel());
            }
        }

        graphViewDto.setLinkTypes(linkMap.values().stream().collect(Collectors.toList()));
        graphViewDto.setEdgeStatistics(buildEdgeStatistics(ontologyId));
        return graphViewDto;
    }

    /**
     * 根据图谱边信息统计关系出现次数
     * 
     * @param ontologyId 本体ID
     * @return 关系统计列表
     */
    private List<EdgeStatisticDto> buildEdgeStatistics(String ontologyId) {
        try {
            OntologyGraphRequest request = new OntologyGraphRequest();
            request.setOntology_id(ontologyId);
            request.setNodes_amount(GRAPH_OVERVIEW_NODE_LIMIT);
            request.setPub_version("true");

            OntologyGraphResponse response = dataosFeign.getGraphByOntologyId(request);
            if (response == null) {
                log.warn("获取图谱数据失败，响应为空, ontologyId={}", ontologyId);
                return Collections.emptyList();
            }
            if (!"success".equalsIgnoreCase(response.getStatus())) {
                log.warn("获取图谱数据状态异常, ontologyId={}, status={}, message={}", ontologyId, response.getStatus(),
                        response.getMessage());
            }
            if (MapUtils.isEmpty(response.getData())) {
                log.warn("获取图谱数据返回空data, ontologyId={}, code={}, message={}", ontologyId, response.getCode(),
                        response.getMessage());
                return Collections.emptyList();
            }

            Map<String, Object> responseData = response.getData();
            Map<?, ?> graphData = resolveGraphDataMap(ontologyId, responseData);
            if (MapUtils.isEmpty(graphData)) {
                log.warn("图谱数据结构解析失败，无法识别有效的 nodes/edges, ontologyId={}, keys={}", ontologyId, responseData.keySet());
                return Collections.emptyList();
            }

            Object edgesObj = graphData.get("edges");
            if (!(edgesObj instanceof List)) {
                log.warn("图谱数据中未找到合法的 edges 列表, ontologyId={}, edgesType={}", ontologyId,
                        edgesObj == null ? "null" : edgesObj.getClass().getName());
                return Collections.emptyList();
            }

            Map<String, EdgeStatisticDto> statisticMap = new LinkedHashMap<>();
            for (Object edgeObj : (List<?>) edgesObj) {
                if (!(edgeObj instanceof Map)) {
                    continue;
                }

                Object edgeDataObj = ((Map<?, ?>) edgeObj).get("data");
                if (!(edgeDataObj instanceof Map)) {
                    continue;
                }

                Map<?, ?> edgeData = (Map<?, ?>) edgeDataObj;
                String edgeType = StringUtils.defaultIfBlank(toStringSafe(edgeData.get("edge_type")), "unknown");
                String label = StringUtils.defaultIfBlank(toStringSafe(edgeData.get("label")), edgeType);
                String key = edgeType + "::" + label;

                EdgeStatisticDto dto = statisticMap.computeIfAbsent(key,
                        k -> new EdgeStatisticDto(label, edgeType, 0L));
                dto.setCount(dto.getCount() + 1);
            }

            return new ArrayList<>(statisticMap.values());
        } catch (Exception e) {
            log.warn("构建图谱关系统计失败, ontologyId={}", ontologyId, e);
            return Collections.emptyList();
        }
    }

    /**
     * 兼容多种图谱数据结构返回形式
     */
    @SuppressWarnings("unchecked")
    private Map<?, ?> resolveGraphDataMap(String ontologyId, Map<String, Object> responseData) {
        if (MapUtils.isEmpty(responseData)) {
            return Collections.emptyMap();
        }

        Object dataField = responseData.get("data");
        if (dataField instanceof Map) {
            return (Map<?, ?>) dataField;
        }
        if (dataField instanceof List) {
            for (Object candidate : (List<?>) dataField) {
                if (candidate instanceof Map) {
                    return (Map<?, ?>) candidate;
                }
            }
            log.warn("图谱数据 data 字段为列表但未包含可识别的 Map, ontologyId={}, dataSize={}", ontologyId,
                    ((List<?>) dataField).size());
        }
        if (responseData.containsKey("nodes") || responseData.containsKey("edges")) {
            return responseData;
        }
        log.warn("图谱数据缺少 data/nodes/edges 关键字段, ontologyId={}, keys={}", ontologyId, responseData.keySet());
        return Collections.emptyMap();
    }

    private String toStringSafe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    public OntologyFileImportResponse importFile(String ontologyId, String ownerId, MultipartFile file) {
        try {
            OntologyFileImportRequest request = new OntologyFileImportRequest();
            request.setOntology_id(ontologyId);
            request.setOwner_id(ownerId);
            request.setOwl_url(uploadToMinio(file));
            return dataosFeign.importOntologyFile(request);
        } catch (Exception e) {
            OntologyFileImportResponse errorResponse = new OntologyFileImportResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            return errorResponse;
        }
    }

    public OntologyFileExportResponse exportFile(OntologyGraphExportVo graphExportVo) {
        try {
            OntologyFileExportRequest request = new OntologyFileExportRequest();
            request.setOntology_id(graphExportVo.getOntologyId());
            request.setObject_type_id(graphExportVo.getObjectTypeIdList());
            return dataosFeign.exportOntologyFile(request);
        } catch (Exception e) {
            OntologyFileExportResponse errorResponse = new OntologyFileExportResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            return errorResponse;
        }
    }

    public OntologyMigrateInResponse ontologyMigrateIn(MultipartFile file,
            String ownerId,
            String workspaceId,
            String ontologyName,
            String ontologyLabel,
            String ontologyDesc) {
        try {
            OntologyMigrateInRequest request = new OntologyMigrateInRequest();
            request.setTar_url(uploadToMinio(file));
            request.setOwner_id(ownerId);
            request.setWorkspace_id(workspaceId);
            request.setOntology_name(ontologyName);
            request.setOntology_label(ontologyLabel);
            request.setOntology_desc(ontologyDesc);
            OntologyMigrateInResponse response = dataosFeign.ontologyMigrateIn(request);
            Optional<OntologyPo> OntologyOpt = ontologyRepository.findFirstByOntologyName(ontologyName, OperStatusEnum.DELETED.getCode());
            if (OntologyOpt.isPresent()) {
                defaultPromptService.initDefaultPrompt(OntologyOpt.get());
                response.getData().put("ontologyId", OntologyOpt.get().getId());
            }
            return response;
        } catch (Exception e) {
            OntologyMigrateInResponse errorResponse = new OntologyMigrateInResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            errorResponse.setCode("500");
            return errorResponse;
        }
    }

    public OntologyMigrateOutResponse ontologyMigrateOut(String ontologyId) {
        try {
            OntologyMigrateOutRequest request = new OntologyMigrateOutRequest();
            request.setOntology_id(ontologyId);
            return dataosFeign.ontologyMigrateOut(request);
        } catch (Exception e) {
            OntologyMigrateOutResponse errorResponse = new OntologyMigrateOutResponse();
            errorResponse.setStatus("failed");
            errorResponse.setMessage(e.getMessage());
            errorResponse.setCode("500");
            return errorResponse;
        }
    }

    public String uploadToMinio(MultipartFile file) throws Exception {
        try {
            String bucketName = minioConfig.getBucketName();
            // TODO —— [版本升级]minio依赖的版本低,没有连接释放接口close
            MinioClient minioClient = getMinioClient();
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .object(file.getName())
                    .contentType(file.getContentType())
                    .build());

            String fileUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(file.getName())
                            .expiry(60 * 5) // 设置URL过期时间
                            .build());
            log.info("本体文件导入临时url(5分钟有效期):" + fileUrl);
            return fileUrl;
        } catch (Exception e) {
            // 其他异常（如网络超时、文件不存在）
            log.error("本体文件导入minio异常", e);
            throw e;
        }
    }

    public boolean updateLifecycleRule(int expireDay) throws Exception {
        try {
            // TODO —— [版本升级]minio依赖的版本低,没有连接释放接口close
            MinioClient minioClient = getMinioClient();
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(BUCKET_PROMPT_NAME).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(BUCKET_PROMPT_NAME).build());
            }

            minioClient.setBucketLifecycle(SetBucketLifecycleArgs.builder()
                    .bucket(BUCKET_PROMPT_NAME)
                    .config(new LifecycleConfiguration(LifecycleRulesBuilder.buildExpirationRules(expireDay)))
                    .build());

            return true;
        } catch (Exception e) {
            // 其他异常（如网络超时、文件不存在）
            log.error("更新会话提示词生命周期异常", e);
            throw e;
        }
    }

    public int getLifecycleRule() throws Exception {
        MinioClient minioClient = getMinioClient();
        LifecycleConfiguration config = minioClient.getBucketLifecycle(
                GetBucketLifecycleArgs.builder()
                        .bucket(BUCKET_PROMPT_NAME)
                        .build()
        );

        if (null == config) {
            throw new Exception(String.format("当前Bucket[%s]没有配置生命周期", BUCKET_PROMPT_NAME));
        }

        List<LifecycleRule> rules = config.rules();
        for(LifecycleRule rule :  rules) {
            if (null != rule.expiration()) {
                Expiration expiration = rule.expiration();
                if (null != expiration.days()) {
                    return expiration.days();
                }
            }
        }

        return -1;
    }

    public void deleteFromMinio(String conversationId) {
        try {
            MinioClient minioClient = getMinioClient();
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(BUCKET_PROMPT_NAME)
                    .object(conversationId)
                    .build());
        } catch (Exception e) {
        }
    }

    public boolean uploadToMinio(String conversationId, String messageId, String promptId) {
        try {
            // TODO —— [版本升级]minio依赖的版本低,没有连接释放接口close
            MinioClient minioClient = getMinioClient();
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(BUCKET_PROMPT_NAME).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(BUCKET_PROMPT_NAME).build());
                minioClient.setBucketLifecycle(SetBucketLifecycleArgs.builder()
                        .bucket(BUCKET_PROMPT_NAME)
                        .config(new LifecycleConfiguration(LifecycleRulesBuilder.buildExpirationRules(LifecycleRulesBuilder.DEFAULT_EXPIRED_DAY)))
                        .build());
            }

            byte[] contentBytes = promptId.getBytes("UTF-8");
            ByteArrayInputStream inputStream = new ByteArrayInputStream(contentBytes);

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(BUCKET_PROMPT_NAME)
                    .stream(inputStream, contentBytes.length, -1)
                    .object(String.format("%s-%s", conversationId, messageId))
                    .contentType("text/plain; charset=utf-8")
                    .build());
            return true;
        } catch (Exception e) {
            // 其他异常（如网络超时、文件不存在）
            log.error(String.format("写入minio文件异常[%s]", conversationId), e);
            return false;
        }
    }

    public String readFromMinio(String conversationId, String messageId) throws Exception {
        try {
            // TODO —— [版本升级]minio依赖的版本低,没有连接释放接口close
            MinioClient minioClient = getMinioClient();
            StringBuilder stringBuilder = new StringBuilder();
            try(InputStream inputStream = minioClient.getObject(
                    GetObjectArgs.builder().bucket(BUCKET_PROMPT_NAME).object(String.format("%s-%s", conversationId, messageId)).build());
                BufferedReader bufferedReader = new BufferedReader(
                        new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                String line;
                boolean firstLine = true;
                while ((line = bufferedReader.readLine()) != null) {
                    if (firstLine) {
                        firstLine = false;
                    } else {
                        stringBuilder.append(System.lineSeparator());
                    }

                    stringBuilder.append(line);
                }
            }

            return stringBuilder.toString();
        } catch (io.minio.errors.ErrorResponseException | io.minio.errors.InvalidResponseException e) {
            log.error(String.format("ResponseException[%s %s]", conversationId, messageId), e);
            return null;
        } catch (Exception e) {
            // 其他异常（如网络超时）
            log.error(String.format("读取minio文件异常[%s %s]", conversationId, messageId), e);
            throw e;
        }
    }

    private MinioClient getMinioClient() {
        return MinioClient.builder()
                .endpoint(minioConfig.getEndpoint())
                .credentials(minioConfig.getAccessKey(), minioConfig.getSecretKey())
                .build();
    }

    public Object findAll(OntologySearchVo searchVo) {

        List<OntologyPo> all = ontologyRepository.findAll((Specification<OntologyPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (null != searchVo.getIsFavorite() && searchVo.getIsFavorite() > 0) {
                predicates.add(cb.equal(root.get("isFavorite").as(Integer.class), searchVo.getIsFavorite()));
            }
            if (searchVo.getIsRecommend() != null) {
                predicates.add(cb.equal(root.get("isRecommend").as(Integer.class), searchVo.getIsRecommend()));
            }
            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if (searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }

            if (searchVo.getPublished() != null && searchVo.getPublished() == 1) {
                predicates.add(cb.isNotNull(root.get("latestVersion").as(Integer.class)));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        });

        final List<OntologyDto> collect = all.stream().map(ontologyPo -> {
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            ontologyDto.setOwner(ontologyPo.getOwnerId());
            return ontologyDto;
        }).collect(Collectors.toList());
        return collect;
    }

    public OntologyDto findOne(String ontologyId) {
        if (StringUtils.isBlank(ontologyId)) {
            return null;
        }
        Optional<OntologyPo> ontologyOptional = ontologyRepository.findById(ontologyId);
        if (!ontologyOptional.isPresent()) {
            return null;
        }
        OntologyPo ontologyPo = ontologyOptional.get();
        if (ontologyPo.getSyncStatus() != null && ontologyPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            return null;
        }
        OntologyDto ontologyDto = new OntologyDto();
        BeanUtils.copyProperties(ontologyPo, ontologyDto);
        ontologyDto.setOwner(ontologyPo.getOwnerId());
        return ontologyDto;
    }

    @Transactional
    public Boolean favoriteById(String ontologyId, Integer isFavorite) {
        ontologyRepository.favoriteById(ontologyId, isFavorite);
        return true;
    }

    private boolean existsByName(String ontologyId, String ontologyName, String workspaceId) {
        if (StringUtils.isBlank(ontologyId)) {
            return ontologyRepository.countByName(ontologyName, workspaceId) > 0;
        } else {
            return ontologyRepository.countByName(ontologyId, ontologyName, workspaceId) > 0;
        }
    }

    private boolean existsByLabel(String ontologyId, String ontologyLabel, String workspaceId) {
        if (StringUtils.isBlank(ontologyId)) {
            return ontologyRepository.countByLabel(ontologyLabel, workspaceId) > 0;
        } else {
            return ontologyRepository.countByLabel(ontologyId, ontologyLabel, workspaceId) > 0;
        }
    }

    private java.util.Map createAgentRequest(String agentUrl,
            org.springframework.http.HttpHeaders agentHeaders,
            String agentName,
            String agentNameZh,
            org.springframework.web.client.RestTemplate restTemplate) {
        JSONObject agentJson = new JSONObject();
        agentJson.put("name", agentName);
        agentJson.put("name_zh", agentNameZh);
        agentJson.put("catalog", "single");
        agentJson.put("assistant_type", "self_recursion");
        agentJson.put("create_method", "normal");
        String agentBody = agentJson.toJSONString();
        log.info("创建AAP智能体：{}", agentBody);
        org.springframework.http.HttpEntity<String> agentEntity = new org.springframework.http.HttpEntity<>(agentBody,
                agentHeaders);
        try {
            org.springframework.http.ResponseEntity<java.util.Map> agentResp = restTemplate.postForEntity(agentUrl,
                    agentEntity, java.util.Map.class);
            java.util.Map agentMap = agentResp.getBody();
            if (agentMap == null) {
                throw new RuntimeException("创建AAP智能体返回为空");
            }
            log.info("返回结果: {}", agentMap);
            return agentMap;
        } catch (Exception e) {
            log.error(e.getMessage());
            Map agentMap = new HashMap();
            agentMap.put("status_code", 5000);
            agentMap.put("message", e.getMessage());
            return agentMap;
        }
    }

    public String fetchTokenByUsername(String username) {
        OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
        String aapContextPath = agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_CONTEXT_PATH);
        String tokenUrl = String.format("%s/console/api/v1/user/third/dologin", gatewayHost);
        if (StringUtils.isNotBlank(aapContextPath)) {
            tokenUrl = String.format("%s/%s/console/api/v1/user/third/dologin", gatewayHost, aapContextPath);
        }
        String newEncryptedMessage = buildAuth(username);
        String tokenBody = "{\"auth\":\"" + newEncryptedMessage + "\"}";
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(tokenBody,
                    headers);
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(tokenUrl,
                    entity, java.util.Map.class);
            java.util.Map respMap = response.getBody();
            if (respMap != null && respMap.containsKey("data")) {
                Object dataObj = respMap.get("data");
                if (dataObj instanceof java.util.Map) {
                    String token = (String) ((java.util.Map) dataObj).get("access_token");
                    if (StringUtils.isNotBlank(token)) {
                        return token;
                    }
                }
            }
        } catch (Exception e) {
            log.error("获取第三方token失败", e);
            throw new RuntimeException("获取第三方token失败");
        }
        throw new RuntimeException("第三方token为空");
    }

    private String buildAuth(String username) {
        OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
        String userUsername = agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_USER_USERNAME);
        String pem = agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_SECURITY_PEM);
        log.debug("config: {}", JSONObject.toJSONString(configVo));
        log.debug("username: {}", username);
        log.debug("default username: {}", userUsername);
        log.debug("pem: {}", pem);

        JSONObject newAuthInfo = new JSONObject();
        String loginUsername = StringUtils.isNotBlank(username) ? username : userUsername;
        newAuthInfo.put("user_name", loginUsername);
        String newEncryptedMessage;
        try {
            newEncryptedMessage = com.asiainfo.util.RSAPublicKeyEncode.encryptStr(pem, newAuthInfo.toString());
        } catch (Exception e) {
            log.error("生成第三方登录密钥失败", e);
            throw new RuntimeException("生成第三方登录密钥失败");
        }
        return newEncryptedMessage;
    }

    public OntologyAgentDto getAgentWithAuth(HttpServletRequest request, String ontologyId) throws Exception {
        return OntologyAgentDto.builder()
                .agentId(getAgent(request, ontologyId))
                .auth(buildAuth(null))
                .build();
    }

    public String getAgent(HttpServletRequest request, String ontologyId) throws Exception {

        OntologyAgentPo agentPo = agentRepository.findByOntologyId(ontologyId);
        OntologyPo ontologyPo = ontologyRepository.findById(ontologyId)
                .orElseThrow(() -> new RuntimeException("未找到本体"));

        if (agentPo != null && StringUtils.isNotBlank(agentPo.getAgentId())) {
            return agentPo.getAgentId();
        } else {
            // 获取当前请求IP、端口
            String host = request.getServerName();
            int port = request.getServerPort();
            String token = fetchTokenByUsername(null);

            // 构造 agentId 请求 URL
            OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
            String aapContextPath = agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_CONTEXT_PATH);
            String agentUrl = String.format("%s/console/api/v2/assistant", gatewayHost);
            if (StringUtils.isNotBlank(aapContextPath)) {
                agentUrl = String.format("%s/%s/console/api/v1/user/third/dologin", gatewayHost, aapContextPath);
            }
            org.springframework.http.HttpHeaders agentHeaders = new org.springframework.http.HttpHeaders();
            agentHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            agentHeaders.set("Authorization", "Bearer " + token);
            agentHeaders.set("Accept", "*/*");
            agentHeaders.set("Host", host + ":" + port);
            agentHeaders.set("Connection", "keep-alive");
            agentHeaders.set("x-workspace-id", AgentPlatformUtils.WorkspaceHolder.workspaceId);
            int maxLength = 50;

            String ontologyLabel = ontologyPo.getOntologyLabel();
            String agentNameZh = ontologyLabel.length() > maxLength ? ontologyLabel.substring(0, maxLength)
                    : ontologyLabel;
            String originalAgentName = agentNameZh;
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            String agentId = null;
            try {
                java.util.Map agentMap = createAgentRequest(agentUrl, agentHeaders, originalAgentName, agentNameZh,
                        restTemplate);
                Object statusCodeObj = agentMap.get("status_code");
                int statusCode = statusCodeObj instanceof Number ? ((Number) statusCodeObj).intValue() : 0;
                if (statusCode == 5000) {
                    long unixTimestamp = System.currentTimeMillis() / 1000;
                    String suffix = "_" + unixTimestamp;
                    int availableLength = Math.max(maxLength - suffix.length(), 0);
                    String baseName = originalAgentName;
                    if (baseName.length() > availableLength) {
                        baseName = baseName.substring(0, availableLength);
                    }
                    String retryAgentName = baseName + suffix;
                    log.warn("agent名称已存在，使用新名称重试：{}", retryAgentName);
                    agentMap = createAgentRequest(agentUrl, agentHeaders, retryAgentName, agentNameZh, restTemplate);
                    statusCodeObj = agentMap.get("status_code");
                    statusCode = statusCodeObj instanceof Number ? ((Number) statusCodeObj).intValue() : 0;
                    if (statusCode == 5000) {
                        String msg = agentMap.get("message") != null ? agentMap.get("message").toString()
                                : "Assistant name already exists";
                        log.error("agent创建失败: {}", msg);
                        throw new RuntimeException(msg);
                    }
                }
                if (agentMap.containsKey("data")) {
                    Object dataObj = agentMap.get("data");
                    if (dataObj instanceof java.util.Map) {
                        agentId = (String) ((java.util.Map) dataObj).get("id");
                    }
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.error("获取agentId失败", e);
                throw new RuntimeException("获取agentId失败");
            }
            if (StringUtils.isBlank(agentId)) {
                throw new RuntimeException("agentId为空");
            }

            // 保存 agentId 到数据库
            if (agentPo == null) {
                agentPo = new OntologyAgentPo();
                agentPo.setOntologyId(ontologyId);
                agentPo.setId(StringUtil.genUuid(32));
            }
            agentPo.setAgentId(agentId);
            agentRepository.save(agentPo);

            return agentId;
        }
    }

    @Transactional
    public void saveActionProcess(String ontologyId, String fileName, String userId, String message, String type) {
        OntologyActionProcessPo processPo = new OntologyActionProcessPo();
        String uuid = UUID.randomUUID().toString();
        processPo.setId(uuid);
        processPo.setTaskId(uuid);
        processPo.setOntologyId(ontologyId);
        processPo.setTaskType(type);
        processPo.setFileName(fileName);
        processPo.setCreateUser(userId);
        processPo.setMessage(message);
        processPo.setState(-1);
        LocalDateTime now = LocalDateTime.now();
        processPo.setCreateTime(now);
        processPo.setLastUpdate(now);
        processPo.setStartTime(now);
        processPo.setEndTime(now);
        processPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        actionProcessRepository.save(processPo);
    }

    @Transactional
    public void saveActionProcess(String ontologyId, List<String> objectTypeIdList, String fileName, String userId, String message, String type) {
        long startTime = System.currentTimeMillis();
        log.info("saveActionProcess start, ontologyId: {}", ontologyId);
        
        OntologyActionProcessPo processPo = new OntologyActionProcessPo();
        String uuid = UUID.randomUUID().toString();
        processPo.setId(uuid);
        processPo.setTaskId(uuid);
        processPo.setOntologyId(ontologyId);
        processPo.setTaskType(type);
        processPo.setFileName(fileName);
        processPo.setCreateUser(userId);
        processPo.setMessage(message);
        processPo.setState(1);
        LocalDateTime now = LocalDateTime.now();
        processPo.setCreateTime(now);
        processPo.setLastUpdate(now);
        processPo.setStartTime(now);
        processPo.setEndTime(now);
        processPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        actionProcessRepository.save(processPo);
        
        List<OntologyActionProcessDetailPo> allDetails = new ArrayList<>();
        
        // 对象类型
        List<OntologyObjectTypePo> objectTypePoList;
        if (objectTypeIdList != null) {
            objectTypePoList = objectTypeRepository.findByIdIn(objectTypeIdList);
        } else {
            objectTypePoList = objectTypeRepository.findAllByOntologyId(ontologyId);
        }
        for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
            JSONObject content = new JSONObject();
            content.put("id", objectTypePo.getId());
            content.put("name", objectTypePo.getObjectTypeName());
            content.put("label", objectTypePo.getObjectTypeLabel());
            content.put("desc", objectTypePo.getObjectTypeDesc());
            allDetails.add(createDetailPo(ontologyId, uuid, "object", content));
            
            // 对象属性
            List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableByTypeId(objectTypePo.getId());
            for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                JSONObject attrContent = new JSONObject();
                attrContent.put("id", attributePo.getId());
                attrContent.put("name", attributePo.getFieldName());
                attrContent.put("label", attributePo.getAttributeName());
                attrContent.put("desc", attributePo.getAttributeDesc());
                attrContent.put("isTitle", attributePo.getIsTitle());
                attrContent.put("isPrimaryKey", attributePo.getIsPrimaryKey());
                allDetails.add(createDetailPoWithParent(ontologyId, uuid, "attr", objectTypePo.getId(), attrContent));
            }
        }
        
        // 关系类型
        List<OntologyLinkTypePo> linkTypePoList;
        if (objectTypeIdList != null) {
            linkTypePoList = linkTypeRepository.findByObjectTypeIds(ontologyId, objectTypeIdList);
        } else {
            linkTypePoList = linkTypeRepository.findByOntologyId(ontologyId);
        }
        List<String> linkTypeIdList = linkTypePoList.stream().map(OntologyLinkTypePo::getId).collect(Collectors.toList());
        List<OntologyLinkTypeTagPo> linkTypeTagPoList = linkTypeTagRepository.findByLinkTypeIdIn(linkTypeIdList);
        List<String> tagIdList = linkTypeTagPoList.stream().map(OntologyLinkTypeTagPo::getTagId).collect(Collectors.toList());
        // 查询对应的标签数据
        List<OntologyTagPo> tagPoList = tagRepository.findAllById(tagIdList);
        Map<String, OntologyTagPo> tagPoMap = new HashMap<>();
        for (OntologyTagPo tagPo : tagPoList) {
            tagPoMap.put(tagPo.getId(), tagPo);
        }
        // 整合关系对应的标签
        Map<String, JSONObject> linkTypeTagMap = new HashMap<>();
        for (OntologyLinkTypeTagPo linkTypeTagPo : linkTypeTagPoList) {
            JSONObject linkTypeTag = linkTypeTagMap.computeIfAbsent(linkTypeTagPo.getLinkTypeId(), k -> new JSONObject());
            OntologyTagPo tagPo = tagPoMap.get(linkTypeTagPo.getTagId());
            if (tagPo == null) continue; // 如果标签为空，直接跳过
            if (LinkDirectionEnum.SOURCE.getDirection().equals(linkTypeTagPo.getLinkDirect())) {
                linkTypeTag.put("sourceTagName", tagPo.getTagName());
                linkTypeTag.put("sourceTagLabel", tagPo.getTagLabel());
            } else if (LinkDirectionEnum.TARGET.getDirection().equals(linkTypeTagPo.getLinkDirect())) {
                linkTypeTag.put("targetTagName", tagPo.getTagName());
                linkTypeTag.put("targetTagLabel", tagPo.getTagLabel());
            }
        }
        for (OntologyLinkTypePo linkTypePo : linkTypePoList) {
            JSONObject content = new JSONObject();
            content.put("id", linkTypePo.getId());
            content.put("sourceName", linkTypePo.getSourceName());
            content.put("sourceLabel", linkTypePo.getSourceLabel());
            content.put("targetName", linkTypePo.getTargetName());
            content.put("targetLabel", linkTypePo.getTargetLabel());
            JSONObject linkTypeTag = linkTypeTagMap.get(linkTypePo.getId());
            if (linkTypeTag != null) {
                content.put("sourceTagName", linkTypeTag.getString("sourceTagName"));
                content.put("sourceTagLabel", linkTypeTag.getString("sourceTagLabel"));
                content.put("targetTagName", linkTypeTag.getString("targetTagName"));
                content.put("targetTagLabel", linkTypeTag.getString("targetTagLabel"));
            }
            allDetails.add(createDetailPo(ontologyId, uuid, "link", content));
        }

        // 先缓存所有的对象类型，后续逻辑类型和动作类型使用
        List<OntologyObjectTypePo> allObjectTypePoList = objectTypeRepository.findAllByOntologyId(ontologyId);
        Map<String, OntologyObjectTypePo> allObjectTypePoMap = new HashMap<>();
        for (OntologyObjectTypePo objectTypePo : allObjectTypePoList) {
            allObjectTypePoMap.put(objectTypePo.getId(), objectTypePo);
        }

        // 逻辑类型
        List<OntologyLogicTypePo> logictypePoList = logicTypeRepository.findAllByOntologyId(ontologyId);
        List<String> logicTypeIdList = logictypePoList.stream().map(OntologyLogicTypePo::getId).collect(Collectors.toList());
        List<OntologyLogicTypeObjectPo> logicTypeObjectPoList = logicTypeObjectRepository.findByLogicTypeIdIn(ontologyId, logicTypeIdList);
        Map<String, List<OntologyObjectTypePo>> logicTypeObjectMap = new HashMap<>();
        for (OntologyLogicTypeObjectPo logicTypeObjectPo : logicTypeObjectPoList) {
            String logicTypeId = logicTypeObjectPo.getId();
            OntologyObjectTypePo objectTypePo = allObjectTypePoMap.get(logicTypeId);
            if (objectTypePo == null) continue;
            List<OntologyObjectTypePo> list = logicTypeObjectMap.computeIfAbsent(logicTypeId, k -> new ArrayList<>());
            list.add(objectTypePo);
        }

        for (OntologyLogicTypePo logicTypePo : logictypePoList) {
            JSONObject content = new JSONObject();
            content.put("id", logicTypePo.getId());
            content.put("name", logicTypePo.getLogicTypeName());
            content.put("label", logicTypePo.getLogicTypeLabel());
            content.put("desc", logicTypePo.getLogicTypeDesc());
            content.put("buildType", logicTypePo.getBuildType());
            content.put("fileName", logicTypePo.getFileName());
            List<OntologyObjectTypePo> list = logicTypeObjectMap.get(logicTypePo.getId());
            if (list != null && !list.isEmpty()) {
                JSONArray objectNames = new JSONArray();
                JSONArray objectLabels = new JSONArray();
                for (OntologyObjectTypePo objectTypePo : list) {
                    objectNames.add(objectTypePo.getObjectTypeName());
                    objectLabels.add(objectTypePo.getObjectTypeLabel());
                }
                content.put("objectNames", objectNames);
                content.put("objectLabels", objectLabels);
            }
            allDetails.add(createDetailPo(ontologyId, uuid, "logic", content));
        }
        
        // 动作类型
        List<OntologyObjectTypeActionPo> actionPoList = actionRepository.findAllByOntologyId(ontologyId);
        for (OntologyObjectTypeActionPo actionPo : actionPoList) {
            JSONObject content = new JSONObject();
            content.put("id", actionPo.getId());
            content.put("name", actionPo.getActionName());
            content.put("label", actionPo.getActionLabel());
            content.put("desc", actionPo.getActionDesc());
            content.put("buildType", actionPo.getBuildType());
            content.put("fileName", actionPo.getFileName());
            String objectTypeId = actionPo.getObjectTypeId();
            OntologyObjectTypePo objectTypePo = allObjectTypePoMap.get(objectTypeId);
            if (objectTypePo != null) {
                content.put("objectName", objectTypePo.getObjectTypeName());
                content.put("objectLabel", objectTypePo.getObjectTypeLabel());
            }
            allDetails.add(createDetailPo(ontologyId, uuid, "action", content));
        }
        
        if (!allDetails.isEmpty()) {
            actionProcessDetailRepository.saveAll(allDetails);
        }
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("saveActionProcess completed, ontologyId: {}, detailCount: {}, duration: {}ms",
                 ontologyId, allDetails.size(), duration);
    }
    
    private OntologyActionProcessDetailPo createDetailPo(String ontologyId, String taskId, 
                                                          String resourceType, Object data) {
        OntologyActionProcessDetailPo detailPo = new OntologyActionProcessDetailPo();
        detailPo.setId(StringUtil.genUuid(32));
        detailPo.setOntologyId(ontologyId);
        detailPo.setTaskId(taskId);
        detailPo.setResourceType(resourceType);
        detailPo.setState(0);
        detailPo.setContent(JSON.toJSONString(data));
        return detailPo;
    }
    
    private OntologyActionProcessDetailPo createDetailPoWithParent(String ontologyId, String taskId, 
                                                                     String resourceType, String parentId, Object data) {
        OntologyActionProcessDetailPo detailPo = createDetailPo(ontologyId, taskId, resourceType, data);
        detailPo.setParentId(parentId);
        return detailPo;
    }
}

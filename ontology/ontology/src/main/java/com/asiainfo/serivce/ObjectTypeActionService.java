package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.*;
import com.asiainfo.dto.*;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.response.CommonResponse;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.operation.ApiParamVo;
import com.asiainfo.vo.operation.ApiVo;
import com.asiainfo.vo.operation.ObjectTypeActionParamVo;
import com.asiainfo.vo.operation.ObjectTypeActionVo;
import com.asiainfo.vo.operation.ObjectTypeVo;
import com.asiainfo.vo.search.ObjectTypeActionSearchVo;
import io.github.suanchou.utils.JsonUtil;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/22
 * @Description
 */

@Service
@Slf4j
public class ObjectTypeActionService {
    @Autowired
    OntologyRepository ontologyRepository;
    @Autowired
    OntologyObjectTypeActionRepository actionRepository;
    @Autowired
    OntologyObjectTypeActionParamRepository paramRepository;
    @Autowired
    OntologyObjectTypeActionUserRepository userRepository;
    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;
    @Autowired
    private OntologyApiRepository apiRepository;
    @Autowired
    private OntologyApiParamRepository apiParamRepository;
    @Autowired
    private OntologyApiFunctionRepository apiFunctionRepository;
    @Autowired
    DataosFeign dataosFeign;

    public static final String createFormat = "创建[%s]对象实例";

    public static final String updateFormat = "更新[%s]对象实例";

    public static final String deleteFormat = "删除[%s]对象实例";

    public Object listFile(String ontologyName) {
        if (StringUtils.isBlank(ontologyName)) {
            throw new RuntimeException("本体名称为空");
        }
        log.info("查询动作类型文件列表请求: {}", ontologyName);
        Map<String, Object> response = dataosFeign.listActionFiles(ontologyName);
        log.info("查询动作类型文件列表返回: {}", JsonUtil.getInstance().write(response));
        Object dataNode = response.get("data");
        Map<String, Object> data = dataNode instanceof Map ? (Map<String, Object>) dataNode : null;
        if (data != null && data.containsKey("files")) {
            return data.get("files");
        }
        return response.get("files");
    }

    public Object list(ObjectTypeActionSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);
        Page<OntologyObjectTypeActionPo> actionPoPage = actionRepository
                .findAll((Specification<OntologyObjectTypeActionPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                        String keyword = searchVo.getKeyword().toLowerCase();
                        String pattern = "%" + keyword + "%";
                        Predicate nameLike = cb.like(cb.lower(root.get("actionName").as(String.class)), pattern);
                        Predicate labelLike = cb.like(cb.lower(root.get("actionLabel").as(String.class)), pattern);
                        predicates.add(cb.or(nameLike, labelLike));
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
                    if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                        predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
                    }
                    if (searchVo.getPublished() == null) {
                        predicates
                                .add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
                    } else if (searchVo.getPublished()) {
                        predicates.add(
                                cb.equal(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
                    } else {
                        predicates.add(
                                cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
                        predicates.add(cb.equal(root.get("status").as(Integer.class), StatusEnum.ENABLED.getCode()));
                    }

                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();
                }, request);

        // 查询所有对象类型
        List<OntologyObjectTypeDto> objectTypeDtoList = findAllObjectType();
        Map<String, OntologyObjectTypeDto> map = new HashMap<>();
        for (OntologyObjectTypeDto dto : objectTypeDtoList) {
            map.put(dto.getId(), dto);
        }

        List<OntologyObjectTypeActionListDto> actionDtoList = actionPoPage.getContent().stream().map(po -> {
            OntologyObjectTypeActionListDto actionDto = OntologyObjectTypeActionListDto.transform(po);

            actionDto.setObjectType(map.get(po.getObjectTypeId()));
            actionDto.setCodeUrl("/ontology_ontology_dev_dev/?folder=/home/coder/code_gen/core/ontology/");

            return actionDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(actionDtoList, actionPoPage.getPageable(), actionPoPage.getTotalElements());
    }

    public Object get(String id) {
        OntologyObjectTypeActionPo actionPo = actionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("action不存在"));

        OntologyObjectTypeActionDto actionDto = new OntologyObjectTypeActionDto();
        BeanUtils.copyProperties(actionPo, actionDto);

        String ontologyName = null;
        if (StringUtils.isNotBlank(actionPo.getOntologyId())) {
            OntologyPo ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                    .orElseThrow(() -> new RuntimeException("本体不存在"));
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            actionDto.setOntology(ontologyDto);
            ontologyName = ontologyPo.getOntologyName();
        }

        if (StringUtils.isNotBlank(actionPo.getObjectTypeId())) {
            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId()).orElse(null);
            if (objectTypePo != null) {
                OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                if ("api".equals(actionPo.getBuildType())) {
                    OntologyApiPo apiPo = apiRepository.findById(objectTypePo.getApiId())
                            .orElseThrow(() -> new RuntimeException("API不存在"));
                    List<OntologyApiParamPo> paramPoList = apiParamRepository
                            .findApiParambyApiId(objectTypePo.getApiId());
                    List<ApiParamVo> apiParamVoList = paramPoList.stream()
                            .map(paramPo -> {
                                ApiParamVo apiParamVo = new ApiParamVo();
                                BeanUtils.copyProperties(paramPo, apiParamVo);
                                return apiParamVo;
                            }).collect(Collectors.toList());
                    ApiVo apiVo = new ApiVo();
                    BeanUtils.copyProperties(apiPo, apiVo);
                    apiVo.setParams(apiParamVoList);
                    objectTypeDto.setApiInfo(apiVo);
                }

                actionDto.setObjectType(objectTypeDto);
            }
        }

        if ("function".equals(actionPo.getBuildType())) {
            String storagePath = ontologyName == null ? null : ontologyName + "/actions/" + actionPo.getFileName();
            actionDto.setStoragePath(storagePath);

            actionDto.setCodeUrl("/ontology_ontology_dev_dev/?folder=/home/coder/code_gen/core/ontology/");
        } else {
            // 查询对象类型所有属性
            List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository
                    .findAvaliableByTypeId(actionPo.getObjectTypeId());
            Map<String, OntologyObjectTypeAttributePo> map = new HashMap<>();
            for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                map.put(attributePo.getId(), attributePo);
            }

            List<OntologyObjectTypeActionParamPo> actionParamPoList = paramRepository.findByActionId(actionPo.getId());
            List<OntologyObjectTypeActionParamDto> paramDtoList = actionParamPoList.stream()
                    .map(po -> {
                        OntologyObjectTypeActionParamDto paramDto = new OntologyObjectTypeActionParamDto();
                        BeanUtils.copyProperties(po, paramDto);
                        OntologyObjectTypeAttributePo attributePo = map.get(po.getAttributeId());
                        if (attributePo != null) {
                            paramDto.setAttributeName(attributePo.getAttributeName());
                        }
                        return paramDto;
                    }).collect(Collectors.toList());
            actionDto.setParams(paramDtoList);
        }

        return actionDto;
    }

    public Object checkExists(ObjectTypeActionVo actionVo) {
        String id = actionVo.getId();
        String ontologyId = actionVo.getOntologyId();
        String actionName = actionVo.getActionName();
        String actionLabel = actionVo.getActionLabel();

        if (StringUtils.isBlank(id)) {
            if (StringUtils.isNotBlank(actionName)) {
                boolean exists = actionRepository.countByName(ontologyId, actionName) > 0;
                Map<String, Object> result = new HashMap<>();
                result.put("exists", exists);
                result.put("ontologyId", ontologyId);
                result.put("actionName", actionName);
                return result;
            } else {
                boolean exists = actionRepository.countByLabel(ontologyId, actionLabel) > 0;
                Map<String, Object> result = new HashMap<>();
                result.put("exists", exists);
                result.put("ontologyId", ontologyId);
                result.put("actionLabel", actionLabel);
                return result;
            }

        } else {
            if (StringUtils.isNotBlank(actionName)) {
                boolean exists = actionRepository.countByName(ontologyId, id, actionName) > 0;
                Map<String, Object> result = new HashMap<>();
                result.put("exists", exists);
                result.put("ontologyId", ontologyId);
                result.put("id", id);
                result.put("actionName", actionName);
                return result;
            } else {
                boolean exists = actionRepository.countByLabel(ontologyId, id, actionLabel) > 0;
                Map<String, Object> result = new HashMap<>();
                result.put("exists", exists);
                result.put("ontologyId", ontologyId);
                result.put("actionLabel", actionLabel);
                return result;
            }
        }
    }

    @Transactional
    public OntologyObjectTypeActionPo save(ObjectTypeActionVo objectTypeActionVo) {
        if ("function".equals(objectTypeActionVo.getBuildType()) || "api".equals(objectTypeActionVo.getBuildType())) {
            return saveWithFunction(objectTypeActionVo);
        }

        List<String> actionUsers = objectTypeActionVo.getActionUsers();
        List<ObjectTypeActionParamVo> params = objectTypeActionVo.getParams();

        OntologyObjectTypeActionPo actionPo = new OntologyObjectTypeActionPo();
        BeanUtils.copyProperties(objectTypeActionVo, actionPo);
        actionPo.setId(StringUtil.genUuid(32));
        actionPo.setStatus(StatusEnum.ENABLED.getCode());
        actionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        actionPo.setOperStatus(OperStatusEnum.CREATED.getCode());

        actionRepository.save(actionPo);

        // 保存映射参数
        List<OntologyObjectTypeActionParamPo> paramPoList = new ArrayList<>();
        for (ObjectTypeActionParamVo param : params) {
            OntologyObjectTypeActionParamPo paramPo = new OntologyObjectTypeActionParamPo();
            BeanUtils.copyProperties(param, paramPo);
            paramPo.setId(StringUtil.genUuid(32));
            paramPo.setActionId(actionPo.getId());
            paramRepository.save(paramPo);
            paramPoList.add(paramPo);
        }

        // 保存授权用户
        for (String actionUser : actionUsers) {
            OntologyObjectTypeActionUserPo actionUserPo = new OntologyObjectTypeActionUserPo();
            actionUserPo.setId(StringUtil.genUuid(32));
            actionUserPo.setActionId(actionPo.getId());
            actionUserPo.setUserId(actionUser);
            userRepository.save(actionUserPo);
        }

        createObject(actionPo, paramPoList);

        return actionPo;
    }

    @Transactional
    public OntologyObjectTypeActionPo update(String id, ObjectTypeActionVo objectTypeActionVo) {
        OntologyObjectTypeActionPo actionPo = actionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("动作类型不存在"));
        actionPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        actionPo.setOperStatus(OperStatusEnum.UPDATED.getCode());

        if ("function".equals(objectTypeActionVo.getBuildType())) {
            actionPo.setActionName(objectTypeActionVo.getActionName());
            actionPo.setActionLabel(objectTypeActionVo.getActionLabel());
            actionPo.setActionDesc(objectTypeActionVo.getActionDesc());
            OntologyObjectTypeActionPo saved = actionRepository.save(actionPo);

            return saved;
        }

        BeanUtils.copyProperties(objectTypeActionVo, actionPo);
        actionRepository.save(actionPo);

        List<String> actionUsers = objectTypeActionVo.getActionUsers();
        List<ObjectTypeActionParamVo> params = objectTypeActionVo.getParams();

        // 保存映射参数
        List<OntologyObjectTypeActionParamPo> paramPoList = new ArrayList<>();
        paramRepository.deleteByActionId(actionPo.getId());
        for (ObjectTypeActionParamVo param : params) {
            OntologyObjectTypeActionParamPo paramPo = new OntologyObjectTypeActionParamPo();
            BeanUtils.copyProperties(param, paramPo);
            if (paramPo.getId() == null) {
                paramPo.setId(StringUtil.genUuid(32));
            }
            paramPo.setActionId(actionPo.getId());
            paramRepository.save(paramPo);
            paramPoList.add(paramPo);
        }

        // 保存授权用户，先删除用户
        userRepository.deleteByActionId(actionPo.getId());
        if (actionUsers != null && !actionUsers.isEmpty()) {
            for (String actionUser : actionUsers) {
                OntologyObjectTypeActionUserPo actionUserPo = new OntologyObjectTypeActionUserPo();
                actionUserPo.setId(StringUtil.genUuid(32));
                actionUserPo.setActionId(actionPo.getId());
                actionUserPo.setUserId(actionUser);
                userRepository.save(actionUserPo);
            }
        }

        return actionPo;
    }

    @Transactional
    public boolean changeStatus(ObjectTypeActionVo actionVo) {
        if (actionVo.getIds() == null || actionVo.getIds().isEmpty()) {
            throw new RuntimeException("动作类型ID不能为空");
        }
        Map<String, OntologyObjectTypeActionPo> actionPoMap = new HashMap<>();
        // 先判断是否关联了已删除或禁用的对象类型
        for (String id : actionVo.getIds()) {
            OntologyObjectTypeActionPo actionPo = actionRepository.findById(id).orElse(null);
            actionPoMap.put(id, actionPo);
            if (actionVo.getStatus() == StatusEnum.ENABLED.getCode() && actionPo != null) {
                Long num = actionRepository.countDeletedOrDisabledObjectType(id);
                if (num > 0) {
                    throw new RuntimeException("[" + actionPo.getActionLabel() + "]关联的对象类型已删除或禁用");
                }
            }
        }
        for (String id : actionVo.getIds()) {
            OntologyObjectTypeActionPo actionPo = actionPoMap.get(id);
            if (actionPo != null) {
                actionPo.setStatus(actionVo.getStatus());
                actionPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
                actionPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
                actionRepository.save(actionPo);

                // 20260205: 动作类型修改状态只变更数据库，不调 Python 接口
//                if (actionVo.getStatus() == StatusEnum.ENABLED.getCode()) {
//                    if ("function".equals(actionPo.getBuildType())) {
//                        createFunction(actionPo);
//                    } else {
//                        createObject(actionPo);
//                    }
//                }
            }
        }

        return true;
    }

    @Transactional
    public boolean delete(List<String> ids) {
        actionRepository.softDeleteByIds(ids);
        deleteAction(ids);
        return true;
    }

    @Transactional
    public boolean deleteParam(List<String> ids) {
        paramRepository.deleteByIds(ids);
        return true;
    }

    public boolean deleteByObjectTypeIds(List<String> ids) {
        // 根据对象类型ID查询所有需要删除的动作类型
        List<OntologyObjectTypeActionPo> actionPoList = actionRepository.findAvailableByObjecTypeIds(ids);
        // 根据对象类型ID删除对应的动作类型
        int num = actionRepository.softDeleteByObjectTypeIds(ids);
        // 调用后台删除接口
        if (num > 0) {
            actionPoList.forEach(this::deleteAction);
        }

        return true;
    }

    public boolean disableByObjectTypeIds(List<String> ids) {
        // 根据对象类型ID查询所有需要禁用的动作类型
        List<OntologyObjectTypeActionPo> actionPoList = actionRepository.findAvailableByObjecTypeIds(ids);
        // 根据对象类型ID禁用对应的动作类型
        int num = actionRepository.disableByObjectTypeIds(ids);
        // 调用后台删除接口
        if (num > 0) {
            actionPoList.forEach(this::deleteAction);
        }

        return true;
    }

    public List<OntologyObjectTypeActionPo> saveActionPoList(OntologyObjectTypePo objectTypePo,
            ObjectTypeVo objectTypeVo) {

        List<ObjectTypeActionVo> actions = objectTypeVo.getActions();
        if (actions != null) {
            final List<OntologyObjectTypeActionPo> collect = actions.stream().map(action -> {
                OntologyObjectTypeActionPo actionPo = new OntologyObjectTypeActionPo();
                actionPo.setId(StringUtil.genUuid(32));
                actionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                actionPo.setOperStatus(OperStatusEnum.CREATED.getCode());
                actionPo.setStatus(StatusEnum.ENABLED.getCode());
                actionPo.setActionName(getActionLabel(action.getActionType(), objectTypeVo.getObjectTypeLabel()));
                actionPo.setActionLabel(getActionLabel(action.getActionType(), objectTypeVo.getObjectTypeLabel()));
                actionPo.setActionType(action.getActionType());
                actionPo.setBuildType("object");
                actionPo.setOwnerId(objectTypePo.getOwnerId());
                // actionPo.setUsers(objectTypeVo.getActionUsers());
                actionPo.setObjectTypeId(objectTypePo.getId());
                return actionPo;
            }).collect(Collectors.toList());
            actionRepository.saveAll(collect);
            return collect;
        } else {
            return null;
        }

    }

    /**
     * 基于函数创建动作类型
     * 
     * @param objectTypeActionVo 动作类型
     * @return 动作类型
     */
    private OntologyObjectTypeActionPo saveWithFunction(ObjectTypeActionVo objectTypeActionVo) {
        OntologyObjectTypeActionPo actionPo = new OntologyObjectTypeActionPo();
        BeanUtils.copyProperties(objectTypeActionVo, actionPo);
        actionPo.setId(StringUtil.genUuid(32));
        actionPo.setStatus(StatusEnum.ENABLED.getCode());
        actionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        actionPo.setOperStatus(OperStatusEnum.CREATED.getCode());

        OntologyObjectTypeActionPo saved = actionRepository.save(actionPo);

        if ("function".equals(objectTypeActionVo.getBuildType())) {
            createFunction(actionPo);
        } else if ("api".equals(objectTypeActionVo.getBuildType())) {
            // 基于API创建动作类型
            createApi(actionPo, objectTypeActionVo.getApiId());
        }

        return saved;
    }

    private String getActionLabel(String action, String objectTypeLabel) {

        try {
            String actionFormatName = action.toLowerCase() + "Format";

            Field field = this.getClass().getField(actionFormatName);

            String format = (String) field.get(this);

            return String.format(format, objectTypeLabel);
        } catch (Exception e) {
            return action + objectTypeLabel;
        }

    }

    public void deleteByObjectTypeId(String id) {

        actionRepository.softDeleteByObjectTypeIds(Collections.singletonList(id));
    }

    private List<OntologyObjectTypeDto> findAllObjectType() {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository
                .findAll((Specification<OntologyObjectTypePo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();
                    predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));

                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();
                });

        return objectTypePoList.stream()
                .map(po -> {
                    OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                    BeanUtils.copyProperties(po, objectTypeDto);
                    return objectTypeDto;
                }).collect(Collectors.toList());
    }

    public OntologyObjectTypeActionDto getAction(String key) {
        OntologyObjectTypeActionPo actionPo = actionRepository.findById(key).orElseThrow(null);

        if (actionPo == null) {
            actionPo = actionRepository.findByActionName(key);
        }

        if (actionPo == null) {
            throw new RuntimeException("未找到对应的动作");
        }
        OntologyObjectTypeActionDto actionDto = new OntologyObjectTypeActionDto();
        BeanUtils.copyProperties(actionPo, actionDto);

        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId()).orElse(null);
        if (objectTypePo != null) {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo, objectTypeDto);
            if ("api".equals(actionPo.getBuildType())) {
                OntologyApiPo apiPo = apiRepository.findById(objectTypePo.getApiId())
                        .orElseThrow(() -> new RuntimeException("API不存在"));
                List<OntologyApiParamPo> paramPoList = apiParamRepository
                        .findApiParambyApiId(objectTypePo.getApiId());
                List<ApiParamVo> apiParamVoList = paramPoList.stream()
                        .map(paramPo -> {
                            ApiParamVo apiParamVo = new ApiParamVo();
                            BeanUtils.copyProperties(paramPo, apiParamVo);
                            return apiParamVo;
                        }).collect(Collectors.toList());
                ApiVo apiVo = new ApiVo();
                BeanUtils.copyProperties(apiPo, apiVo);
                apiVo.setParams(apiParamVoList);
                objectTypeDto.setApiInfo(apiVo);
            }

            actionDto.setObjectType(objectTypeDto);
        }

        // 查询对象类型所有属性
        List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository
                .findAvaliableByTypeId(actionPo.getObjectTypeId());
        Map<String, OntologyObjectTypeAttributePo> map = new HashMap<>();
        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
            map.put(attributePo.getId(), attributePo);
        }

        List<OntologyObjectTypeActionParamPo> actionParamPoList = paramRepository.findByActionId(actionPo.getId());
        List<OntologyObjectTypeActionParamDto> paramDtoList = actionParamPoList.stream()
                .map(po -> {
                    OntologyObjectTypeActionParamDto paramDto = new OntologyObjectTypeActionParamDto();
                    BeanUtils.copyProperties(po, paramDto);
                    OntologyObjectTypeAttributePo attributePo = map.get(po.getAttributeId());
                    if (attributePo != null) {
                        paramDto.setAttributeName(attributePo.getAttributeName());
                        paramDto.setFieldName(attributePo.getFieldName());
                        paramDto.setFieldType(attributePo.getFieldType());
                        paramDto.setIsPrimaryKey(attributePo.getIsPrimaryKey());
                    }
                    return paramDto;
                }).collect(Collectors.toList());
        actionDto.setParams(paramDtoList);

        return actionDto;
    }

    @Transactional
    public Object sync(String ontologyId, String userId) {
        if (StringUtils.isBlank(ontologyId)) {
            // 同步所有本体
            List<OntologyPo> ontologyPoList = ontologyRepository.findAll();
            for (OntologyPo ontologyPo : ontologyPoList) {
                syncFunction(ontologyPo, userId);
            }
        } else {
            OntologyPo ontologyPo = ontologyRepository.findById(ontologyId)
                    .orElseThrow(() -> new RuntimeException("本体不存在"));
            syncFunction(ontologyPo, userId);
        }
        return true;
    }

    @SuppressWarnings("unchecked")
    public void syncFunction(OntologyPo ontologyPo, String userId) {
        CommonResponse response = dataosFeign.registerActionFunction(ontologyPo.getOntologyName());
        log.info("调用同步动作类型函数接口返回: {}", JsonUtil.getInstance().write(response));
        if (ResponseCodeEnum.FAILURE.getCode().equals(response.getCode())) {
            throw new RuntimeException(response.getMessage());
        }
        Map<String, Object> data = response.getData();
        if (MapUtils.isEmpty(data)) {
            log.warn("动作类型同步接口返回数据为空");
            return;
        }
        List<Map<String, Object>> resultList = (List<Map<String, Object>>) data.get("registered");
        if (resultList != null && !resultList.isEmpty()) {
            // 查询所有的动作类型
            List<OntologyObjectTypeActionPo> actionPoList = actionRepository.findAllWithFunction(ontologyPo.getId());
            Map<String, OntologyObjectTypeActionPo> actionPoMap = new HashMap<>();
            for (OntologyObjectTypeActionPo actionPo : actionPoList) {
                actionPoMap.put(actionPo.getActionName(), actionPo);
            }

            // 遍历外部同步过来的数据。
            // 如果 actionPoMap 中存在，则更新（并从 actionPoMap 中移除，表示该条目已处理）。
            // 如果 actionPoMap 中不存在，则新增。
            for (Map<String, Object> map : resultList) {
                String name = MapUtils.getString(map, "name");
                String desc = MapUtils.getString(map, "desc");
                Object inputParam = map.get("signature");
                Object signatureDetail = map.get("signature_detail");
                String code = MapUtils.getString(map, "code");
                String fileName = MapUtils.getString(map, "filename");
                List<String> objectTypeNameList = (List<String>) map.get("used_objects");

                OntologyObjectTypeActionPo actionPo = actionPoMap.remove(name);
                if (actionPo == null) {
                    actionPo = new OntologyObjectTypeActionPo();
                    actionPo.setId(StringUtil.genUuid(32));
                    actionPo.setActionName(name);
                    actionPo.setActionLabel(name);
                    actionPo.setOwnerId(userId);
                    actionPo.setBuildType(LogicBuildTypeEnum.FUNCTION.getValue());
                    actionPo.setOntologyId(ontologyPo.getId());
                    actionPo.setStatus(StatusEnum.ENABLED.getCode());
                    actionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                    actionPo.setOperStatus(OperStatusEnum.CREATED.getCode());
                }
                actionPo.setActionDesc(desc);
                actionPo.setFunctionCode(code);
                actionPo.setFileName(fileName);
                actionPo.setInputParam(JsonUtil.getInstance().write(inputParam));
                actionPo.setSignatureDetail(JsonUtil.getInstance().write(signatureDetail));
                if (objectTypeNameList != null && !objectTypeNameList.isEmpty()) {
                    String objectTypeName = objectTypeNameList.get(0);
                    OntologyObjectTypePo objectTypePo = objectTypeRepository.findByName(ontologyPo.getId(), objectTypeName).orElse(null);
                    if (objectTypePo != null) {
                        actionPo.setObjectTypeId(objectTypePo.getId());
                    }
                }
                actionRepository.save(actionPo);
            }

            // 遍历结束后，logicTypePoMap 中剩余的数据即为数据库中多余的数据，执行删除。
            if (MapUtils.isNotEmpty(actionPoMap)) {
                actionRepository.softDeleteByIds(actionPoMap.values()
                        .stream()
                        .map(OntologyObjectTypeActionPo::getId)
                        .collect(Collectors.toList()));
            }
        }
    }

    private void createFunction(OntologyObjectTypeActionPo actionPo) {
        OntologyPo ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在"));
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId())
                .orElseThrow(() -> new RuntimeException("对象类型不存在"));

        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("used_objects", Collections.singletonList(objectTypePo.getObjectTypeName()));
        params.put("function_name", actionPo.getActionName());
        params.put("function_label", actionPo.getActionLabel());
        params.put("fun_params",
                actionPo.getInputParam() == null ? null : JsonUtil.getInstance().read(actionPo.getInputParam()));
        params.put("fun_desc", actionPo.getActionDesc());
        params.put("file_name", actionPo.getFileName());
        log.info("调用创建动作类型函数接口请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.createActionFunction(params);
        log.info("调用创建动作类型函数接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.get("status"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }
    }

    private void deleteAction(List<String> ids) {
        OntologyPo ontologyPo = null;
        List<Map<String, Object>> actionInfoList = new ArrayList<>();
        for (String id : ids) {
            OntologyObjectTypeActionPo actionPo = actionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("动作类型不存在"));
            if (ontologyPo == null) {
                ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                        .orElseThrow(() -> new RuntimeException("本体不存在"));
            }
            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId())
                    .orElseThrow(() -> new RuntimeException("对象类型不存在"));

            Map<String, Object> actionInfo = new HashMap<>();
            actionInfo.put("action_name", actionPo.getActionName());
            actionInfo.put("object_type_name", objectTypePo.getObjectTypeName());
            actionInfoList.add(actionInfo);
        }

        if (ontologyPo == null) {
            throw new RuntimeException("本体不存在");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("action_info", actionInfoList);
        deleteAction(params);
    }

    private void deleteAction(OntologyObjectTypeActionPo actionPo) {
        OntologyPo ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在"));
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId())
                .orElseThrow(() -> new RuntimeException("对象类型不存在"));

        List<Map<String, Object>> actionInfoList = new ArrayList<>();
        Map<String, Object> actionInfo = new HashMap<>();
        actionInfo.put("action_name", actionPo.getActionName());
        actionInfo.put("object_type_name", objectTypePo.getObjectTypeName());
        actionInfoList.add(actionInfo);

        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("action_info", actionInfoList);
        deleteAction(params);
    }

    private void deleteAction(Map<String, Object> params) {
        log.info("调用删除动作类型函数接口请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.deleteActionFunction(params);
        log.info("调用删除动作类型函数接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.get("status"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }
    }

    private void createObject(OntologyObjectTypeActionPo actionPo) {
        List<OntologyObjectTypeActionParamPo> paramPoList = paramRepository.findByActionId(actionPo.getId());
        createObject(actionPo, paramPoList);
    }

    private void createObject(OntologyObjectTypeActionPo actionPo, List<OntologyObjectTypeActionParamPo> paramPoList) {
        OntologyPo ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在"));
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId())
                .orElseThrow(() -> new RuntimeException("对象类型不存在"));
        Map<String, OntologyObjectTypeAttributePo> attributePoMap = new HashMap<>();
        List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository
                .findAvaliableByTypeId(actionPo.getObjectTypeId());
        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
            attributePoMap.put(attributePo.getId(), attributePo);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("ontologyName", ontologyPo.getOntologyName());
        params.put("actionName", actionPo.getActionName());
        params.put("actionLabel", actionPo.getActionLabel());
        params.put("actionDesc", actionPo.getActionDesc());
        params.put("actionType", actionPo.getActionType());
        params.put("objectName", objectTypePo.getObjectTypeName());

        List<Map<String, Object>> paramList = new ArrayList<>();
        for (OntologyObjectTypeActionParamPo param : paramPoList) {
            OntologyObjectTypeAttributePo attributePo = attributePoMap.get(param.getAttributeId());
            if (attributePo != null) {
                Map<String, Object> paramMap = new HashMap<>();
                paramMap.put("attributeName", attributePo.getAttributeName());
                paramMap.put("paramRequired", param.getParamRequired());
                paramList.add(paramMap);
            }
        }
        params.put("params", paramList);

        log.info("调用基于对象创建动作类型接口请求: {}", JsonUtil.getInstance().write(params));
        CommonResponse response = dataosFeign.createActionObject(params);
        log.info("调用基于对象创建动作类型接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }
    }

    private void createApi(OntologyObjectTypeActionPo actionPo, String apiId) {
        OntologyPo ontologyPo = ontologyRepository.findById(actionPo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在"));
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(actionPo.getObjectTypeId())
                .orElseThrow(() -> new RuntimeException("对象类型不存在"));
        objectTypePo.setApiId(apiId);
        objectTypeRepository.save(objectTypePo);

        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("used_objects", Collections.singletonList(objectTypePo.getObjectTypeName()));
        params.put("function_name", actionPo.getActionName());
        params.put("function_label", actionPo.getActionLabel());
        params.put("fun_params",
                actionPo.getInputParam() == null ? null : JsonUtil.getInstance().read(actionPo.getInputParam()));
        params.put("fun_desc", actionPo.getActionDesc());

        OntologyApiPo apiPo = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API不存在"));
        List<OntologyApiParamPo> paramPoList = apiParamRepository.findApiParambyApiId(apiId);
        List<ApiParamVo> apiParamVoList = paramPoList.stream()
                .map(paramPo -> {
                    ApiParamVo apiParamVo = new ApiParamVo();
                    BeanUtils.copyProperties(paramPo, apiParamVo);
                    return apiParamVo;
                }).collect(Collectors.toList());
        ApiVo apiVo = new ApiVo();
        BeanUtils.copyProperties(apiPo, apiVo);
        apiVo.setParams(apiParamVoList);

        params.put("api_info", buildApiParams(apiVo));

        log.info("调用创建动作类型API接口请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.createActionApi(params);
        log.info("调用创建动作类型API接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.get("status"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }
    }

    private LinkedHashMap<String, Object> buildApiParams(ApiVo apiVo) {
        LinkedHashMap<String, Object> apiParamMap = new LinkedHashMap<>();
        apiParamMap.put("api_name", apiVo.getApiName());
        apiParamMap.put("api_desc", apiVo.getApiDesc());
        apiParamMap.put("api_method", apiVo.getApiMethod());
        apiParamMap.put("url", apiVo.getUrl());
        apiParamMap.put("timeout", apiVo.getApiTimeout());

        List<LinkedHashMap<String, Object>> requestParamList = new ArrayList<>();
        for (ApiParamVo apiParamVo : apiVo.getParams()) {
            if ("request".equalsIgnoreCase(apiParamVo.getParamMode())) {
                if (StringUtils.isNotBlank(apiParamVo.getParentId()))
                    continue; // 只同步第一层参数
                LinkedHashMap<String, Object> requestParamMap = new LinkedHashMap<>();
                requestParamMap.put("param_name", apiParamVo.getParamName());
                requestParamMap.put("param_type", apiParamVo.getParamType());
                requestParamMap.put("param_method", apiParamVo.getParamMethod());
                requestParamMap.put("param_desc", apiParamVo.getParamDesc());
                requestParamMap.put("is_required", (Objects.equals(apiParamVo.getIsRequired(), 1)));
                requestParamMap.put("default_value", apiParamVo.getDefaultValue());
                requestParamMap.put("is_builtin", (Objects.equals(apiParamVo.getIsBuiltins(), 1)));
                if (apiParamVo.getFunctionId() != null) {
                    requestParamMap.put("value_source", "util_function");
                    OntologyApiFunctionPo apiFunctionPo = apiFunctionRepository.findById(apiParamVo.getFunctionId())
                            .orElse(null);
                    if (apiFunctionPo == null) {
                        throw new RuntimeException("函数不存在。id:" + apiParamVo.getFunctionId());
                    }
                    requestParamMap.put("util_function_name", apiFunctionPo.getFunctionName());
                    requestParamMap.put("util_function_params",
                            JSONObject.parseObject(apiFunctionPo.getFunctionParams()));
                }
                requestParamList.add(requestParamMap);
            }
        }

        apiParamMap.put("request_params", requestParamList);

        return apiParamMap;
    }

}

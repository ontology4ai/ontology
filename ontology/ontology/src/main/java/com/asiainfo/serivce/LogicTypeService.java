package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.asiainfo.common.*;
import com.asiainfo.dto.LogicTypeDto;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.dto.OntologyObjectTypeDto;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.response.CommonResponse;
import com.asiainfo.modo.app.usersystem.user.ModoUser;
import com.asiainfo.modo.app.usersystem.user.ModoUserRepo;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.operation.ApiParamVo;
import com.asiainfo.vo.operation.ApiVo;
import com.asiainfo.vo.operation.LogicTypeVo;
import com.asiainfo.vo.search.LogicTypeSearchVo;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 逻辑类型业务处理类
 *
 * @author hulin
 * @since 2025-09-25
 */
@Slf4j
@Service
public class LogicTypeService {
    @Autowired
    private DataosFeign dataosFeign;
    @Autowired
    private OntologyLogicTypeRepository logicTypeRepository;
    @Autowired
    private OntologyRepository ontologyRepository;
    @Autowired
    private ModoUserRepo userRepo;
    @Autowired
    private OntologyLogicTypeObjectRepository logicTypeObjectRepository;
    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    private OntologyApiFunctionRepository apiFunctionRepository;

    @Autowired
    private OntologyApiService ontologyApiService;

    /**
     * 调用 REST 接口获取指定本体下的文件列表
     *
     * @param ontologyName 本体名
     * @return 指定本体下的文件列表
     */
    public Object listFile(String ontologyName) {
        if (StringUtils.isBlank(ontologyName)) {
            throw new RuntimeException("本体名称为空");
        }
        log.info("查询逻辑类型文件列表请求: {}", ontologyName);
        Map<String, Object> response = dataosFeign.listFunctionFiles(ontologyName);
        Object dataNode = response.get("data");
        Map<String, Object> data = dataNode instanceof Map ? (Map<String, Object>) dataNode : null;
        if (data != null && data.containsKey("files")) {
            return data.get("files");
        }
        return response.get("files");
    }

    public Object list(LogicTypeSearchVo searchVo) {
        Sort sort = Sort.by(
                Sort.Order.desc("lastUpdate"),
                Sort.Order.asc("logicTypeLabel")
        );
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyLogicTypePo> logicTypePoPage = logicTypeRepository.findAll((Specification<OntologyLogicTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("logicTypeName").as(String.class)), "%" + keyword + "%");
                Predicate labelLike = cb.like(cb.lower(root.get("logicTypeLabel").as(String.class)), "%" + keyword + "%");
                predicates.add(cb.or(nameLike, labelLike));
            }

            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            if (searchVo.getPublished() == null) {
                predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            } else if (searchVo.getPublished()) {
                predicates.add(cb.equal(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
            } else {
                predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
                predicates.add(cb.equal(root.get("status").as(Integer.class), StatusEnum.ENABLED.getCode()));
            }
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        Map<String, OntologyPo> ontologyLabelMap = new HashMap<>();
        List<OntologyPo> ontologyPoList = ontologyRepository.findAll();
        for (OntologyPo ontologyPo : ontologyPoList) {
            ontologyLabelMap.put(ontologyPo.getId(), ontologyPo);
        }

        final List<LogicTypeDto> collect = logicTypePoPage.getContent().stream().map(logicTypePo -> {
            LogicTypeDto logicTypeDto = new LogicTypeDto();
            BeanUtils.copyProperties(logicTypePo, logicTypeDto);
            OntologyPo ontologyPo = ontologyLabelMap.get(logicTypePo.getOntologyId());
            logicTypeDto.setOntologyLabel(ontologyPo.getOntologyLabel());
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            logicTypeDto.setOntology(ontologyDto);
            logicTypeDto.setCodeUrl("/ontology_ontology_dev_dev/?folder=/home/coder/code_gen/");
            // 此处开始获取绑定的对象类型列表
            List<OntologyLogicTypeObjectPo> logicTypeObjectPoList = logicTypeObjectRepository.findByLogicTypeId(logicTypeDto.getId());
            List<String> objectTypeIdList = logicTypeObjectPoList.stream().map(OntologyLogicTypeObjectPo::getObjectTypeId).collect(Collectors.toList());
            List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findByIdIn(objectTypeIdList);
            List<OntologyObjectTypeDto> objectTypeDtoList = objectTypePoList.stream()
                    .map(objectTypePo -> {
                        OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                        BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                        return objectTypeDto;
                    }).collect(Collectors.toList());
            logicTypeDto.setObjectTypeList(objectTypeDtoList);
            if (null != logicTypePo.getApiId()) {
                logicTypeDto.setApiInfo(ontologyApiService.findById(logicTypePo.getApiId()));
            }

            return logicTypeDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, logicTypePoPage.getPageable(), logicTypePoPage.getTotalElements());
    }

    /**
     * 查询中文名或英文名是否存在
     *
     * @param searchVo 逻辑类型名称
     * @return 是否存在
     */
    public Map<String, Object> checkExists(LogicTypeSearchVo searchVo) {
        String ontologyId = searchVo.getOntologyId();
        String logicTypeName = searchVo.getLogicTypeName();
        String logicTypeLabel = searchVo.getLogicTypeLabel();

        Map<String, Object> map = new HashMap<>();
        map.put("ontologyId", ontologyId);
        if (StringUtils.isNotBlank(logicTypeName)) {
            boolean exists = logicTypeRepository.existsByOntologyIdAndLogicTypeNameAndSyncStatusLessThan(ontologyId, logicTypeName, ChangeStatusEnum.DELETED.getCode());
            map.put("logicTypeName", searchVo.getLogicTypeName());
            map.put("exists", exists);
        } else if (StringUtils.isNotBlank(logicTypeLabel)) {
            boolean exists = logicTypeRepository.existsByOntologyIdAndLogicTypeLabelAndSyncStatusLessThan(ontologyId, logicTypeLabel, ChangeStatusEnum.DELETED.getCode());
            map.put("logicTypeLabel", logicTypeLabel);
            map.put("exists", exists);
        } else {
            throw new RuntimeException("中文名和英文名同时为空");
        }

        return map;
    }

    @Transactional
    public Object save(LogicTypeVo logicTypeVo) {
        // todo：校验名称是否存在
        OntologyLogicTypePo logicTypePo = new OntologyLogicTypePo();
        BeanUtils.copyProperties(logicTypeVo, logicTypePo);
        logicTypePo.setId(StringUtil.genUuid(32));
        logicTypePo.setStatus(StatusEnum.ENABLED.getCode());
        logicTypePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        logicTypePo.setOperStatus(OperStatusEnum.CREATED.getCode());
        OntologyLogicTypePo saved = logicTypeRepository.save(logicTypePo);
        LogicTypeDto logicTypeDto = new LogicTypeDto();
        BeanUtils.copyProperties(saved, logicTypeDto);

        // 创建逻辑类型绑定选择的对象类型列表
        if (logicTypeVo.getObjectTypeIds() != null) {
            for (String objectTypeId : logicTypeVo.getObjectTypeIds()) {
                OntologyLogicTypeObjectPo logicTypeObjectPo = new OntologyLogicTypeObjectPo();
                logicTypeObjectPo.setId(StringUtil.genUuid(32));
                logicTypeObjectPo.setLogicTypeId(logicTypePo.getId());
                logicTypeObjectPo.setObjectTypeId(objectTypeId);
                logicTypeObjectPo.setOntologyId(logicTypePo.getOntologyId());
                logicTypeObjectRepository.save(logicTypeObjectPo);
            }
        }

        // 调用创建函数接口
        createFunction(logicTypePo);

        return logicTypeDto;
    }

    @Transactional
    public Object update(LogicTypeVo logicTypeVo) {
        // todo: 校验修改后的名称是否存在
        if (StringUtils.isBlank(logicTypeVo.getId())) {
            throw new RuntimeException("逻辑类型ID为空");
        }
        OntologyLogicTypePo logicTypePo = logicTypeRepository.findById(logicTypeVo.getId()).orElseThrow(() -> new RuntimeException("逻辑类型不存在"));
        logicTypePo.setLogicTypeName(logicTypeVo.getLogicTypeName());
        logicTypePo.setLogicTypeLabel(logicTypeVo.getLogicTypeLabel());
        logicTypePo.setLogicTypeDesc(logicTypeVo.getLogicTypeDesc());
        logicTypePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        logicTypePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
        if (logicTypeVo.getStatus() != null) {
            logicTypePo.setStatus(logicTypeVo.getStatus());
        }
        logicTypeRepository.save(logicTypePo);

        // 更新逻辑类型绑定选择的对象类型列表(新增/删除)
        List<String> newObjectTypeIds = logicTypeVo.getObjectTypeIds();
        List<OntologyLogicTypeObjectPo> logicTypeObjectPoList = logicTypeObjectRepository.findByLogicTypeId(logicTypePo.getId());
        for (OntologyLogicTypeObjectPo logicTypeObjectPo : logicTypeObjectPoList) {
            if (newObjectTypeIds.contains(logicTypeObjectPo.getObjectTypeId())) {
                // 直接跳过已存在的对象类型
                newObjectTypeIds.remove(logicTypeObjectPo.getObjectTypeId());
                continue;
            }

            // 删除最新列表中不存在的对象类型
            logicTypeObjectRepository.deleteById(logicTypeObjectPo.getId());
        }

        for (String objectTypeId : newObjectTypeIds) {
            OntologyLogicTypeObjectPo logicTypeObjectPo = new OntologyLogicTypeObjectPo();
            logicTypeObjectPo.setId(StringUtil.genUuid(32));
            logicTypeObjectPo.setLogicTypeId(logicTypePo.getId());
            logicTypeObjectPo.setObjectTypeId(objectTypeId);
            logicTypeObjectPo.setOntologyId(logicTypePo.getOntologyId());
            // 保存新增的对象类型
            logicTypeObjectRepository.save(logicTypeObjectPo);
        }

        return true;
    }

    @Transactional
    public Object delete(List<String> ids) {
        logicTypeRepository.softDeleteByIds(ids);

        // 调用删除函数接口
        deleteFunction(ids);

        return true;
    }

    @Transactional
    public Object deleteByObjectTypeIds(List<String> ids) {
        // 查询需要调后台删除接口的逻辑类型
        List<OntologyLogicTypePo> logicTypePoList = logicTypeRepository.findAvailableByObjectTypeIds(ids);
        // 根据对象类型删除关联的逻辑类型
        int count = logicTypeRepository.softDeleteByObjectTypeIds(ids);
        if (count > 0) {
            logicTypePoList.forEach(this::deleteFunction);
        }

        return true;
    }

    public Object disableByObjectTypeIds(List<String> ids) {
        // 查询需要调后台删除接口的逻辑类型
        List<OntologyLogicTypePo> logicTypePoList = logicTypeRepository.findAvailableByObjectTypeIds(ids);
        // 根据对象类型禁用关联的逻辑类型
        int count = logicTypeRepository.disableByObjectTypeIds(ids);
        if (count > 0) {
            logicTypePoList.forEach(this::deleteFunction);
        }

        return true;
    }

    @Transactional
    public Object changeStatus(LogicTypeVo logicTypeVo) {
        List<String> ids = logicTypeVo.getIds();
        for (String id : ids) {
            OntologyLogicTypePo logicTypePo = logicTypeRepository.findById(id).orElse(null);
            if (logicTypePo != null) {
                if (StatusEnum.ENABLED.getCode() == logicTypeVo.getStatus()) {
                    // 启用逻辑类型前判断关联的对象类型是否存在或删除
                    Long num = logicTypeRepository.countDeletedOrDisabledObjectType(id);
                    if (num > 0) {
                        throw new RuntimeException("[" + logicTypePo.getLogicTypeLabel() + "]关联了已删除或禁用的对象类型");
                    }
                }
                logicTypePo.setStatus(logicTypeVo.getStatus());
                logicTypeRepository.save(logicTypePo);
            }
        }

        // 调用创建函数接口; 禁用逻辑时只需更新status状态
        // 20260107: 变更状态只更新数据库，不调python接口
//        if (logicTypeVo.getStatus() == 1) {
//            createFunction(ids);
//        }

        return true;
    }

    public Object get(String id) {
        OntologyLogicTypePo logicTypePo = logicTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("逻辑类型不存在"));
        return buildLogicTypeDto(logicTypePo);
    }

    /**
     * 根据英文名查询逻辑类型
     */
    public Object getByName(String ontologyId, String logicTypeName) {
        if (StringUtils.isAnyBlank(ontologyId, logicTypeName)) {
            throw new RuntimeException("本体ID或逻辑类型英文名为空");
        }
        OntologyLogicTypePo logicTypePo = logicTypeRepository.findFirstByOntologyIdAndLogicTypeName(ontologyId, logicTypeName)
                .orElseThrow(() -> new RuntimeException("逻辑类型不存在"));
        return buildLogicTypeDto(logicTypePo);
    }

    private LogicTypeDto buildLogicTypeDto(OntologyLogicTypePo logicTypePo) {
        LogicTypeDto logicTypeDto = new LogicTypeDto();
        BeanUtils.copyProperties(logicTypePo, logicTypeDto);

        ModoUser user = userRepo.findActiveUserById(logicTypePo.getOwnerId());
        if (user != null) {
            logicTypeDto.setOwner(user.getUserName());
        }

        Map<String, OntologyPo> ontologyLabelMap = new HashMap<>();
        List<OntologyPo> ontologyPoList = ontologyRepository.findAll();
        for (OntologyPo ontologyPo : ontologyPoList) {
            ontologyLabelMap.put(ontologyPo.getId(), ontologyPo);
        }

        List<OntologyLogicTypeObjectPo> logicTypeObjectPoList = logicTypeObjectRepository.findByLogicTypeId(logicTypePo.getId());
        List<String> objectTypeIdList = logicTypeObjectPoList.stream()
                .map(OntologyLogicTypeObjectPo::getObjectTypeId)
                .collect(Collectors.toList());
        List<OntologyObjectTypePo> objectTypePoList = objectTypeIdList.isEmpty()
                ? new ArrayList<>()
                : objectTypeRepository.findByIdIn(objectTypeIdList);
        List<OntologyObjectTypeDto> collect = objectTypePoList.stream()
                .map(objectTypePo -> {
                    OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                    BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                    return objectTypeDto;
                }).collect(Collectors.toList());
        logicTypeDto.setObjectTypeList(collect);

        if (null != logicTypePo.getApiId()) {
            logicTypeDto.setApiInfo(ontologyApiService.findById(logicTypePo.getApiId()));
        }

        OntologyPo ontologyPo = ontologyLabelMap.get(logicTypePo.getOntologyId());
        if (ontologyPo != null) {
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            logicTypeDto.setOntology(ontologyDto);

            String storagePath = ontologyPo.getOntologyName() + "/logics/" + logicTypePo.getFileName();
            logicTypeDto.setStoragePath(storagePath);
        }

        logicTypeDto.setCodeUrl("/ontology_ontology_dev_dev/?folder=/home/coder/code_gen/");
        return logicTypeDto;
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
            OntologyPo ontologyPo = ontologyRepository.findById(ontologyId).orElseThrow(() -> new RuntimeException("本体不存在"));
            syncFunction(ontologyPo, userId);
        }
        return true;
    }

    @SuppressWarnings("unchecked")
    public void syncFunction(OntologyPo ontologyPo, String userId) {
        CommonResponse response = dataosFeign.registerFunction(ontologyPo.getOntologyName());
        log.info("调用同步函数接口返回: {}", JsonUtil.getInstance().write(response));
        if (ResponseCodeEnum.FAILURE.getCode().equals(response.getCode())) {
            throw new RuntimeException(response.getMessage());
        }
        Map<String, Object> data = response.getData();
        if (MapUtils.isEmpty(data)) {
            log.warn("同步函数接口返回数据为空");
            return;
        }
        List<Map<String, Object>> resultList = (List<Map<String, Object>>) data.get("registered");
        if (resultList != null && !resultList.isEmpty()) {
            // 查询所有未删除的逻辑类型
            List<OntologyLogicTypePo> logicTypePoList = logicTypeRepository.findAllByOntologyId(ontologyPo.getId());
            Map<String, OntologyLogicTypePo> logicTypePoMap = new HashMap<>();
            for (OntologyLogicTypePo logicTypePo : logicTypePoList) {
                // 同步操作目前只考虑函数类型，其他类型保持不变
                if (LogicBuildTypeEnum.FUNCTION.equals(logicTypePo.getBuildType())) {
                    logicTypePoMap.put(logicTypePo.getLogicTypeName(), logicTypePo);
                }
            }

            // 遍历外部同步过来的数据。
            // 如果 logicTypePoMap 中存在，则更新（并从 logicTypePoMap 中移除，表示该条目已处理）。
            // 如果 logicTypePoMap 中不存在，则新增。
            for (Map<String, Object> map : resultList) {
                String name = MapUtils.getString(map, "name");
                String desc = MapUtils.getString(map, "desc");
                Object inputParam = map.get("signature");
                Object signatureDetail = map.get("signature_detail");
                String code = MapUtils.getString(map, "code");
                String fileName = MapUtils.getString(map, "filename");

                OntologyLogicTypePo logicTypePo = logicTypePoMap.remove(name);
                if (logicTypePo == null) {
                    // 新增的逻辑类型
                    logicTypePo = new OntologyLogicTypePo();
                    logicTypePo.setId(StringUtil.genUuid(32));
                    logicTypePo.setLogicTypeName(name);
                    logicTypePo.setLogicTypeLabel(name);
                    logicTypePo.setOwnerId(userId);
                    logicTypePo.setBuildType(LogicBuildTypeEnum.FUNCTION.getValue());
                    logicTypePo.setOntologyId(ontologyPo.getId());
                    logicTypePo.setStatus(StatusEnum.ENABLED.getCode());
                    logicTypePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                    logicTypePo.setOperStatus(OperStatusEnum.CREATED.getCode());
                }
                logicTypePo.setLogicTypeDesc(desc);
                logicTypePo.setFunctionCode(code);
                logicTypePo.setFileName(fileName);
                logicTypePo.setInputParam(JsonUtil.getInstance().write(inputParam));
                logicTypePo.setSignatureDetail(JsonUtil.getInstance().write(signatureDetail));

                logicTypeRepository.save(logicTypePo);
            }

            // 遍历结束后，logicTypePoMap 中剩余的数据即为数据库中多余的数据，执行删除。
            if (MapUtils.isNotEmpty(logicTypePoMap)) {
                logicTypeRepository.softDeleteByIds(logicTypePoMap.values()
                        .stream()
                        .map(OntologyLogicTypePo::getId)
                        .collect(Collectors.toList()));
            }
        }
    }

    private void createFunction(List<String> ids) {
        for (String id : ids) {
            logicTypeRepository.findById(id).ifPresent(this::createFunction);
        }
    }

    private void createFunction(OntologyLogicTypePo logicTypePo) {
        OntologyPo ontologyPo = ontologyRepository.findById(logicTypePo.getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));
        String buildType = logicTypePo.getBuildType();
        if (LogicBuildTypeEnum.FUNCTION.equals(buildType)) {
            Map<String, Object> params = new HashMap<>();
            params.put("ontology_name", ontologyPo.getOntologyName());
            params.put("function_name", logicTypePo.getLogicTypeName());
            params.put("function_label", logicTypePo.getLogicTypeLabel());
            params.put("fun_params", logicTypePo.getInputParam() == null ? null : JsonUtil.getInstance().read(logicTypePo.getInputParam()));
            params.put("fun_desc", logicTypePo.getLogicTypeDesc());
            params.put("file_name", logicTypePo.getFileName());
            log.info("调用创建函数接口请求: {}", JsonUtil.getInstance().write(params));
            Map<String, Object> response = dataosFeign.createFunction(params);
            log.info("调用创建函数接口返回: {}", JsonUtil.getInstance().write(response));
            if ("failed".equals(response.get("status"))) {
                throw new RuntimeException(MapUtils.getString(response, "message"));
            }
        } else if (LogicBuildTypeEnum.API.equals(buildType)) {
            Map<String, Object> params = new HashMap<>();
            params.put("ontology_name", ontologyPo.getOntologyName());
            params.put("function_name", logicTypePo.getLogicTypeName());
            params.put("function_label", logicTypePo.getLogicTypeLabel());
            params.put("fun_desc", logicTypePo.getLogicTypeDesc());
            params.put("function_type", buildType);
            params.put("api_info", buildApiParams(logicTypePo.getApiId()));

            log.info("调用创建函数接口请求: {}", JsonUtil.getInstance().write(params));
            Map<String, Object> response = dataosFeign.createFunction(params);
            log.info("调用创建函数接口返回: {}", JsonUtil.getInstance().write(response));
            if ("failed".equals(response.get("status"))) {
                throw new RuntimeException(MapUtils.getString(response, "message"));
            }
        }
    }

    private Map<String, Object> buildApiParams(String apiId) {
        ApiVo apiVo = ontologyApiService.findById(apiId);
        Map<String, Object> apiParamMap = new HashMap<>();
        apiParamMap.put("api_name", apiVo.getApiName());
        apiParamMap.put("api_desc", apiVo.getApiDesc());
        apiParamMap.put("api_method", apiVo.getApiMethod());
        apiParamMap.put("url", apiVo.getUrl());
        apiParamMap.put("timeout", apiVo.getApiTimeout());

        List<OntologyApiFunctionPo> apiFunctionPoList = apiFunctionRepository.findAll();
        Map<String, OntologyApiFunctionPo> apiParamFunctionMap = new HashMap<>();
        for (OntologyApiFunctionPo apiFunctionPo : apiFunctionPoList) {
            apiParamFunctionMap.put(apiFunctionPo.getId(), apiFunctionPo);
        }

        List<Map<String, Object>> requestParamList = new ArrayList<>();
        for(ApiParamVo apiParamVo : apiVo.getParams()) {
            if ("request".equalsIgnoreCase(apiParamVo.getParamMode())) {
                if (StringUtils.isNotBlank(apiParamVo.getParentId())) continue; // 只同步第一层参数
                Map<String, Object> requestParamMap = new HashMap<>();
                requestParamMap.put("param_name", apiParamVo.getParamName());
                requestParamMap.put("param_type", apiParamVo.getParamType());
                requestParamMap.put("param_method", apiParamVo.getParamMethod());
                requestParamMap.put("param_desc", apiParamVo.getParamDesc());
                requestParamMap.put("is_required", apiParamVo.getIsRequired());
                requestParamMap.put("default_value", apiParamVo.getDefaultValue());
                requestParamMap.put("is_builtin", apiParamVo.getIsBuiltins());
                if (StringUtils.isBlank(apiParamVo.getFunctionId())) {
                    requestParamMap.put("value_source", "static");
                } else {
                    requestParamMap.put("value_source", "util_function");
                    OntologyApiFunctionPo apiFunctionPo = apiParamFunctionMap.get(apiParamVo.getFunctionId());
                    if (apiFunctionPo != null) {
                        requestParamMap.put("util_function_name", apiFunctionPo.getFunctionName());
                        requestParamMap.put("util_function_params", JSON.parseObject(apiFunctionPo.getFunctionParams()));
                    }
                }
                requestParamList.add(requestParamMap);
            }
        }

        apiParamMap.put("request_params", requestParamList);

        return apiParamMap;
    }

    private void deleteFunction(List<String> ids) {
        for (String id : ids) {
            logicTypeRepository.findById(id).ifPresent(this::deleteFunction);
        }
    }

    private void deleteFunction(OntologyLogicTypePo logicTypePo) {
        OntologyPo ontologyPo = ontologyRepository.findById(logicTypePo.getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));
        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("function_name", logicTypePo.getLogicTypeName());

        String buildType = logicTypePo.getBuildType();
        if (LogicBuildTypeEnum.FUNCTION.equals(buildType)) {
            params.put("file_name", logicTypePo.getFileName());
        } else if (LogicBuildTypeEnum.API.equals(buildType)) {
            params.put("function_type", buildType);
        }

        log.info("调用删除函数接口请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.deleteFunction(params);
        log.info("调用删除函数接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.get("status"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }
    }
}

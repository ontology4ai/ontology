package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.ApiTypeEnum;
import com.asiainfo.common.LogicBuildTypeEnum;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.po.*;
import com.asiainfo.vo.operation.*;

import com.asiainfo.repo.*;
import com.asiainfo.util.HierarchyConverter;
import com.asiainfo.feign.response.CommonResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.suanchou.utils.JsonUtil;
import io.github.suanchou.utils.StringUtil;

import lombok.extern.slf4j.Slf4j;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

/**
 * @Author weihf
 * @Date 2025/11/21
 * @Description
 */
@Service
@Slf4j
public class OntologyApiService {
    @Autowired
    private DataosFeign dataosFeign;
    @Autowired
    private OntologyApiRepository apiRepository;
    @Autowired
    private OntologyApiParamRepository apiParamRepository;
    @Autowired
    private OntologyRepository ontologyRepository;
    @Autowired
    private OntologyLogicTypeRepository logicTypeRepository;

    @Autowired
    private OntologyApiFunctionRepository apiFunctionRepository;

    /**
     * 更新API及其参数列表，单一职责
     */
    @Transactional
    public ApiVo update(String id, ApiVo apiVo) {
        OntologyApiPo ontologyApiPo = apiRepository.findById(id).orElse(null);
        if (ontologyApiPo == null) {
            throw new RuntimeException("API不存在");
        }
        copyApiVoToPo(apiVo, ontologyApiPo);
        apiRepository.save(ontologyApiPo);

        apiParamRepository.deleteByApiId(id);
        List<OntologyApiParamPo> apiParamPoList = convertParamVoList(apiVo.getParams(), id);
        apiParamRepository.saveAll(apiParamPoList);
        ApiVo result = convertApiPoToVoWithParams(ontologyApiPo);

        // 同步api_definition
        syncUpdateApi(result);
        return result;
    }

    public boolean syncApiFunction() throws IOException {
        CommonResponse response = dataosFeign.syncApiFunction();
        if ("200".equals(response.getCode())) {
            Map<String, Object> dataMap = response.getData();
            if (null != dataMap) {
                List<Map<String, Object>> registeredList = (List<Map<String, Object>>) dataMap.get("registered");
                for(Map<String, Object> registeredMap: registeredList) {
                    OntologyApiFunctionPo apiFunctionPo = new OntologyApiFunctionPo();
                    String functionName = registeredMap.get("name").toString();
                    apiFunctionPo.setId(functionName);
                    apiFunctionPo.setFunctionName(functionName);
                    apiFunctionPo.setFunctionLabel(functionName);
                    ObjectMapper objectMapper = new ObjectMapper();
                    apiFunctionPo.setFunctionParams(objectMapper.writeValueAsString(registeredMap.get("signature_detail")));
                    apiFunctionRepository.save(apiFunctionPo);
                }
            }

            return true;
        }

        throw new IOException(response.getMessage());
    }

    private void syncApi(ApiVo apiVo, OntologyLogicTypePo logicTypePo) {
        OntologyPo ontologyPo = ontologyRepository.findById(logicTypePo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在"));
        Map<String, Object> params = new HashMap<>();
        params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("function_name", logicTypePo.getLogicTypeName());
        params.put("function_label", logicTypePo.getLogicTypeLabel());
        params.put("fun_desc", logicTypePo.getLogicTypeDesc());
        params.put("function_type", LogicBuildTypeEnum.API.getValue());
        params.put("api_info", buildApiParams(apiVo));

        log.info("调用创建函数接口请求: {}", JsonUtil.getInstance().write(params));
        Map<String, Object> response = dataosFeign.createFunction(params);
        log.info("调用创建函数接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.get("status"))) {
            throw new RuntimeException(MapUtils.getString(response, "message"));
        }
    }

    // 需要保证报文里字段的顺序和定义时的顺序一致，因此用LinkedHashMap
    // HashMap的顺序是不确定的
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
                if (StringUtils.isNotBlank(apiParamVo.getParentId())) continue; // 只同步第一层参数
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

    /**
     * 新增API及参数
     */
    @Transactional
    public ApiVo save(ApiVo apiVo) {
        OntologyApiPo ontologyApiPo = createOntologyApiPoFromVo(apiVo);
        apiRepository.save(ontologyApiPo);

        List<OntologyApiParamPo> apiParamPoList = convertParamVoList(apiVo.getParams(), ontologyApiPo.getId());
        apiParamRepository.saveAll(apiParamPoList);

        return convertApiPoToVoWithParams(ontologyApiPo);
    }

    /**
     * 根据id删除API及参数信息
     */
    @Transactional
    public Boolean delete(String id) {
        apiRepository.deleteById(id);
        apiParamRepository.deleteByApiId(id);
        return true;
    }

    public ApiVo findById(String apiId) {
        OntologyApiPo ontologyApiPo = apiRepository.findById(apiId).orElse(null);
        ApiVo apiVo = new ApiVo();
        if (ontologyApiPo == null) {
            apiVo.setParams(new ArrayList<>());
            return apiVo;
        }
        BeanUtils.copyProperties(ontologyApiPo, apiVo);
        List<OntologyApiParamPo> paramPoList = apiParamRepository.findApiParambyApiId(apiId);
        List<ApiParamVo> apiParamVoList = paramPoList.stream().map(ontologyApiParamPo -> {
            ApiParamVo apiParamVo = new ApiParamVo();
            BeanUtils.copyProperties(ontologyApiParamPo, apiParamVo);
            return apiParamVo;
        }).collect(Collectors.toList());
        apiVo.setParams(apiParamVoList);
        return apiVo;
    }

    public Boolean apiNameExist(SearchApiVo apiVo) {
        log.debug("apiNameExist() apiName:{}", apiVo.getApiName());
        log.debug("apiNameExist() workspaceId:{}", apiVo.getWorkspaceId());
        List<OntologyApiPo> api = apiRepository.findAvailableApibyApiName(apiVo.getWorkspaceId(),
                apiVo.getApiName().trim());
        log.debug("apiNameExist() api:{}", api);
        return (api != null && api.size() > 0) ? true : false;
    }

    /**
     * 按workspaceId查询所有API，转换为VO返回
     */
    public List<ApiVo> findAllByWorkspaceId(SearchApiVo apiVo) {
        List<OntologyApiPo> apiPoList = apiRepository.findAvailableApibyWorkspaceId(apiVo.getWorkspaceId());
        return apiPoList.stream()
                .filter(apiPo -> StringUtils.isEmpty(apiVo.getApiType())
                        || apiVo.getApiType().equals(apiPo.getApiType()))
                .filter(apiPo -> StringUtils.isEmpty(apiVo.getApiName())
                        || apiPo.getApiName().contains(apiVo.getApiName()))
                .map(this::convertApiPoToVoWithParams)
                .collect(Collectors.toList());
    }

    /*------------------ 工具&模块提取方法 -------------------*/

    // Bean拷贝工具避免重复
    private void copyApiVoToPo(ApiVo src, OntologyApiPo dest) {
        // 创建用户、创建时间不能修改
        String user = dest.getCreateUser();
        LocalDateTime time = dest.getCreateTime();
        BeanUtils.copyProperties(src, dest);
        dest.setCreateUser(user);
        dest.setCreateTime(time);
    }

    // 创建一个新的OntologyApiPo对象
    private OntologyApiPo createOntologyApiPoFromVo(ApiVo apiVo) {
        OntologyApiPo po = new OntologyApiPo();
        BeanUtils.copyProperties(apiVo, po);
        po.setId(StringUtil.genUuid(32));
        return po;
    }

    // paramVoList转换为PoList，减少重复逻辑
    private List<OntologyApiParamPo> convertParamVoList(List<ApiParamVo> paramVoList, String apiId) {
        if (paramVoList == null)
            return Collections.emptyList();
        List<ApiParamVo> hierarchyNodes = HierarchyConverter.convertToHierarchy(paramVoList, apiId, null);
        return HierarchyConverter.hierarchyOntologyApiParamPo(hierarchyNodes, 0);
        // return hierarchyNodes.stream().map(apiParamVo -> {
        // OntologyApiParamPo apiParamPo = new OntologyApiParamPo();
        // BeanUtils.copyProperties(apiParamVo, apiParamPo);
        // if (StringUtils.isEmpty(apiParamVo.getId())) {
        // apiParamPo.setId(StringUtil.genUuid(32));
        // }
        // apiParamPo.setApiId(apiId);
        // return apiParamPo;
        // }).collect(Collectors.toList());
    }

    // Po转换为VO并附带参数列表VO
    private ApiVo convertApiPoToVoWithParams(OntologyApiPo apiPo) {
        ApiVo apiVo = new ApiVo();
        BeanUtils.copyProperties(apiPo, apiVo);
        List<OntologyApiParamPo> paramPoList = apiParamRepository.findApiParambyApiId(apiPo.getId());
        List<ApiParamVo> apiParamVoList = paramPoList.stream().map(paramPo -> {
            ApiParamVo apiParamVo = new ApiParamVo();
            BeanUtils.copyProperties(paramPo, apiParamVo);
            apiParamVo.setIsVirtual(isVirtualParam(apiPo.getId(), paramPo.getId()));
            return apiParamVo;
        }).collect(Collectors.toList());
        apiVo.setParams(HierarchyConverter.convertToHierarchy(apiParamVoList));
        return apiVo;
    }

    public List<OntologyApiParamPo> findVirtualApiParamList(String apiId, String id) {
        return apiParamRepository.findVirtualApiParamList(apiId, id);
    }

    private boolean isVirtualParam(String apiId, String id) {
        List<OntologyApiParamPo> virtualApiParamList = findVirtualApiParamList(apiId, id);
        return virtualApiParamList != null && virtualApiParamList.size() > 0;
    }

    public List<ApiFunctionVo> findOntologyApiFunctionList(SearchApiFunctionVo functionVo) {
        return apiFunctionRepository.findAll().stream()
                .filter(apiFunctionPo -> StringUtils.isEmpty(functionVo.getId())
                        || functionVo.getId().equals(apiFunctionPo.getId()))
                .filter(apiFunctionPo -> StringUtils.isEmpty(functionVo.getFunctionName())
                        || apiFunctionPo.getFunctionName().contains(functionVo.getFunctionName()))
                .map(apiFunctionPo -> {
                    ApiFunctionVo apiFunctionVo = new ApiFunctionVo();
                    BeanUtils.copyProperties(apiFunctionPo, apiFunctionVo);
                    return apiFunctionVo;
                }).collect(Collectors.toList());
    }

    private void syncUpdateApi(ApiVo apiVo) {

        Map<String, Object> params = new HashMap<>();
        // params.put("ontology_name", ontologyPo.getOntologyName());
        params.put("api_name", apiVo.getApiName());
        params.put("api_info", buildApiParams(apiVo));

        log.info("调用API更新接口请求: {}", JsonUtil.getInstance().write(params));
        // 根据apiType决定调function还是action接口
        CommonResponse response = null;
        if (ApiTypeEnum.LOGIC.getType().equals(apiVo.getApiType())) {
            response = dataosFeign.updateFunctionsApiDefinition(params);
        } else if (ApiTypeEnum.LOGIC.getType().equals(apiVo.getApiType())) {
            response = dataosFeign.updateActionsApiDefinition(params);
        } else
            return;

        log.info("调用API更新接口返回: {}", JsonUtil.getInstance().write(response));
        if ("failed".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }
    }
}

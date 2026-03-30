package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.GlobalApiEnum;
import com.asiainfo.common.RequestDemo;
import com.asiainfo.common.ServiceTypeEnum;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.dto.OntologyPublishApiDto;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.search.OntologyPublishApiSearchVo;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
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

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OntologyPublishApiService {

    @Autowired
    private OntologyPublishApiRepository ontologyPublishApiRepository;

    @Autowired
    private OntologyRepository ontologyRepository;

    @Autowired
    private OntologyLogicTypeHisRepository logicTypeRepository;

    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;

    @Autowired
    private OntologyObjectTypeActionHisRepository actionHisRepository;



    private static final String SERVICE_METHOD_GLOBAL = "global";

    private static final String SERVICE_METHOD_LOGIC = "logic";

    private static final String SERVICE_METHOD_ACTION = "action";

    private static final String POST_METHOD = "POST";

    private static final String OUTPUT_PARAMS = "{\"status\": \"success/failed\", \"message\": \"\",\"data\":{},\"code\":\"200/500\"}";



    public OntologyPublishApiDto findById(String id) {
        Optional<OntologyPublishApiPo> poOpt = ontologyPublishApiRepository.findById(id);
        if (poOpt.isPresent()) {
            OntologyPublishApiDto dto = new OntologyPublishApiDto();
            BeanUtils.copyProperties(poOpt.get(), dto);
            return dto;
        }
        return null;
    }

    public void deleteById(String id) {
        ontologyPublishApiRepository.deleteById(id);
    }

    public Object list(HttpServletRequest request, OntologyPublishApiSearchVo searchVo) {

        String protocol = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();

        // 构造 token 请求 URL
        String url = "";

        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest pageRequest = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);


        Page<OntologyPublishApiPo> publishApiPos = ontologyPublishApiRepository.findAll(new Specification<OntologyPublishApiPo>() {
            @Override
            public Predicate toPredicate(Root<OntologyPublishApiPo> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
                List<Predicate> predicates = new ArrayList<Predicate>();
                if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                    Predicate nameLike = cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId());
                    predicates.add(nameLike);
                }
                if (StringUtils.isNotBlank(searchVo.getName())) {
                    Predicate nameLike = cb.like(cb.lower(root.get("name").as(String.class)), "%" + searchVo.getName() + "%");
                    predicates.add(nameLike);
                }
                if (StringUtils.isNotBlank(searchVo.getLabel())) {
                    Predicate nameLike = cb.like(cb.lower(root.get("label").as(String.class)), "%" + searchVo.getLabel() + "%");
                    predicates.add(nameLike);
                }
                if (StringUtils.isNotBlank(searchVo.getServiceType())) {
                    Predicate nameLike = cb.equal(root.get("serviceType").as(String.class), searchVo.getServiceType());
                    predicates.add(nameLike);
                }

                Predicate[] p = new Predicate[predicates.size()];
                query.where(cb.and(predicates.toArray(p)));
                return query.getRestriction();
            }
        }, pageRequest);

        final List<OntologyPo> all = ontologyRepository.findAll();;
        Map<String, OntologyPo> ontologyPoMap = new HashMap<>();
        for (OntologyPo ontologyPo : all) {
            ontologyPoMap.put(ontologyPo.getId(), ontologyPo);
        }

        final List<OntologyPublishApiDto> collect = publishApiPos.getContent().stream().map(publishApiPo -> {
            OntologyPublishApiDto publishApiDto = new OntologyPublishApiDto();

            BeanUtils.copyProperties(publishApiPo, publishApiDto);
            OntologyPo ontologyPo = ontologyPoMap.get(publishApiPo.getOntologyId());
            if(ontologyPo != null) {
                OntologyDto ontologyDto = new OntologyDto();
                BeanUtils.copyProperties(ontologyPo, ontologyDto);
                publishApiDto.setOntologyDto(ontologyDto);
                publishApiDto.setApiPath(url + "/sandbox_pro" + publishApiDto.getApiPath());
                publishApiDto.setMcpServerPath(url + "/sandbox_pro" + publishApiDto.getMcpServerPath());
                generateRequestDemo(url, publishApiDto);

            }
            return publishApiDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, publishApiPos.getPageable(), publishApiPos.getTotalElements());
    }

    private void generateRequestDemo(String gateway, OntologyPublishApiDto publishApiDto) {

        String serviceType = publishApiDto.getServiceType();

        if(SERVICE_METHOD_GLOBAL.equals(serviceType)) {

            GlobalApiEnum globalApiEnum = GlobalApiEnum.getEnum(publishApiDto.getName());
            switch (globalApiEnum) {
                case FIND:
                    publishApiDto.setRquestDemo(RequestDemo.FIND_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro"));
                    break;
                case LIST_OBJECTS:
                    publishApiDto.setRquestDemo(RequestDemo.LIST_OBJECTS_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro").replace("<name>", publishApiDto.getOntologyDto().getOntologyName()));
                    break;
                case LIST_ACTIONS:
                    publishApiDto.setRquestDemo(RequestDemo.LIST_ACTIONS_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro").replace("<name>", publishApiDto.getOntologyDto().getOntologyName()));
                    break;
                case LIST_FUNCTIONS:
                    publishApiDto.setRquestDemo(RequestDemo.LIST_FUNCTIONS_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro").replace("<name>", publishApiDto.getOntologyDto().getOntologyName()));
                    break;

            }
        } else if(SERVICE_METHOD_ACTION.equals(serviceType)) {
            String inputParamsStr = StringUtils.isNotBlank(publishApiDto.getInputParams()) ? publishApiDto.getInputParams() : "{}";
            JSONObject inputParams = JSONObject.parseObject(inputParamsStr);
            JSONObject params = inputParams.getJSONObject("params");
            publishApiDto.setRquestDemo(RequestDemo.ACTION_RUN_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro")
                    .replace("<name>", publishApiDto.getOntologyDto().getOntologyName())
                    .replace("<action>", publishApiDto.getName())
                    .replace("<objectName>", inputParams.getString("object_name"))
                    .replace("<params>", params == null ? "{}" : params.toString())
            );

        } else  {
            String inputParamsStr = StringUtils.isNotBlank(publishApiDto.getInputParams()) ? publishApiDto.getInputParams() : "{}";
            JSONObject inputParams = JSONObject.parseObject(inputParamsStr);
            JSONObject params = inputParams.getJSONObject("params");
            publishApiDto.setRquestDemo(RequestDemo.LOGIC_RUN_DEMO.replace("<host>", gateway).replace("<context>", "sandbox_pro")
                    .replace("<name>", publishApiDto.getOntologyDto().getOntologyName())
                    .replace("<function>", publishApiDto.getName())
                    .replace("<params>", params == null ? "{}" : params.toString())
            );
        }
    }

    @Transactional
    public void generateOntologyApi(String ontologyId) {

        OntologyPo ontologyPo = ontologyRepository.findById(ontologyId).orElseThrow(() -> new RuntimeException("未找到本体"));
        if(ontologyPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("未找到本体");
        }

        ontologyPublishApiRepository.deleteByOntologyId(ontologyId);

        List<OntologyLogicTypeHisPo> logicTypePos = logicTypeRepository.findPub(ontologyId);


        for (OntologyLogicTypeHisPo logicTypePo : logicTypePos) {
            OntologyPublishApiPo apiPo = new OntologyPublishApiPo();
            apiPo.setId(StringUtil.genUuid(32));
            apiPo.setOntologyId(ontologyId);
            apiPo.setServiceId(logicTypePo.getId());
            apiPo.setApiPath("/object/apis/function/run");
            apiPo.setServiceType(ServiceTypeEnum.LOGIC.getValue());
            apiPo.setComment(logicTypePo.getLogicTypeDesc());
            apiPo.setLabel(logicTypePo.getLogicTypeLabel());
            apiPo.setName(logicTypePo.getLogicTypeName());
            apiPo.setMcpServerPath("/ontology/mcp");
            apiPo.setMcpToolName("ontology_object_function_run");
            JSONObject param = new JSONObject();
            param.put("ontology_name", ontologyPo.getOntologyName());
            param.put("function_name", logicTypePo.getLogicTypeName());

            try {
                String inputParamStr = logicTypePo.getInputParam();
                if (StringUtils.isBlank(inputParamStr)) {
                    param.put("params", new JSONObject());
                } else {
                    JSONObject inputParams = JSONObject.parseObject(inputParamStr);
                    param.put("params", inputParams);
                }
            } catch (Exception e) {
                log.error("逻辑类型[{}]参数格式异常", logicTypePo.getLogicTypeId());
                param.put("params", new JSONObject());
            }
            apiPo.setInputParams(param.toJSONString());
            apiPo.setOutputParams(OUTPUT_PARAMS);
            apiPo.setMethod(POST_METHOD);
            ontologyPublishApiRepository.save(apiPo);
        }

        List<OntologyObjectTypeActionHisPo> actionPos = actionHisRepository.findPub(ontologyId);

        List<String> objectTypeIds = actionPos.stream().map(OntologyObjectTypeActionHisPo::getObjectTypeId).collect(Collectors.toList());

        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository.findByIdIn(objectTypeIds);
        Map<String, OntologyObjectTypePo> objectTypePoMap = new HashMap<>();
        for (OntologyObjectTypePo objectTypePo : objectTypePos) {
            objectTypePoMap.put(objectTypePo.getId(), objectTypePo);
        }

        for (OntologyObjectTypeActionHisPo actionPo : actionPos) {
            OntologyPublishApiPo apiPo = new OntologyPublishApiPo();
            apiPo.setId(StringUtil.genUuid(32));
            apiPo.setOntologyId(ontologyId);
            apiPo.setServiceId(actionPo.getId());
            apiPo.setApiPath("/object/apis/action/run");
            apiPo.setServiceType(ServiceTypeEnum.ACTION.getValue());
            apiPo.setComment(actionPo.getActionDesc());
            apiPo.setLabel(StringUtils.isNotBlank(actionPo.getActionLabel()) ? actionPo.getActionLabel(): actionPo.getActionDesc() );
            apiPo.setName(actionPo.getActionName());
            apiPo.setMcpServerPath("/ontology/mcp");
            JSONObject param = new JSONObject();
            param.put("ontology_name", ontologyPo.getOntologyName());
            param.put("action_name", actionPo.getActionName());
            if(objectTypePoMap.containsKey(actionPo.getObjectTypeId())) {
                param.put("object_name", objectTypePoMap.get(actionPo.getObjectTypeId()).getObjectTypeName());
            }

            try {
                String inputParamStr = actionPo.getInputParam();
                if (StringUtils.isBlank(inputParamStr)) {
                    param.put("params", new JSONObject());
                } else {
                    JSONObject inputParams = JSONObject.parseObject(inputParamStr);
                    param.put("params", inputParams);
                }
            } catch (Exception e) {
                log.error("动作类型[{}]参数格式异常", actionPo.getActionId());
                param.put("params", new JSONObject());
            }

            apiPo.setInputParams(param.toJSONString());
            apiPo.setMcpToolName("ontology_object_action_run");
            apiPo.setOutputParams(OUTPUT_PARAMS);
            apiPo.setMethod(POST_METHOD);
            ontologyPublishApiRepository.save(apiPo);
        }


        for (GlobalApiEnum value : GlobalApiEnum.values()) {

            OntologyPublishApiPo apiPo = new OntologyPublishApiPo();
            apiPo.setId(StringUtil.genUuid(32));
            apiPo.setOntologyId(ontologyId);
            apiPo.setServiceId(ServiceTypeEnum.GLOBAL.getValue());
            apiPo.setApiPath("/object/apis/" + value.getValue());
            apiPo.setServiceType(ServiceTypeEnum.GLOBAL.getValue());
            apiPo.setComment(value.getComment());
            apiPo.setLabel(value.getLabel());
            apiPo.setName(value.getValue());
            apiPo.setMcpServerPath("/ontology/mcp");
            apiPo.setMcpToolName(value.getTool());
            apiPo.setOutputParams(OUTPUT_PARAMS);
            apiPo.setMethod(value.getMethod());
            ontologyPublishApiRepository.save(apiPo);
        }
    }

    public Object getMcpServer(HttpServletRequest request) {
//        String protocol = request.getScheme();
//        String host = request.getServerName();
//        int port = request.getServerPort();

        String url = request.getRequestURL().toString();
        // 构造 token 请求 URL
//        String url = String.format("%s://%s:%d", protocol, host, port);

        String resp = "[\n" +
                "        {\n" +
                "            label: '地址',\n" +
                "            value: '/sandbox_pro/function{function_name}/run',\n" +
                "        },\n" +
                "        {\n" +
                "            label: '传输类型',\n" +
                "            value: 'Streamable HTTP',\n" +
                "        },\n" +
                "        {\n" +
                "            label: '描述',\n" +
                "            value: '调用本体动作和全局函数的工具集合',\n" +
                "        }\n" +
                "    ]";

        return JSONArray.parse(resp);
    }
}
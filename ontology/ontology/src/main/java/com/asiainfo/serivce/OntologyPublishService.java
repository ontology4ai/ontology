package com.asiainfo.serivce;

import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import io.github.suanchou.utils.StringUtil;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 本体发布服务类
 *
 * @author hulin
 * @since 2025-09-29
 */
@Service
public class OntologyPublishService {
    @Autowired
    private OntologyRepository ontologyRepository;
    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    private OntologyObjectTypeAttributeRepository objectTypeAttributeRepository;
    @Autowired
    private OntologyLinkTypeRepository linkTypeRepository;
    @Autowired
    private OntologyObjectTypeActionRepository actionRepository;
    @Autowired
    private OntologyLogicTypeRepository logicTypeRepository;
    @Autowired
    private OntologyInterfaceRepository interfaceRepository;
    @Autowired
    private OntologyInterfaceAttributeRepository interfaceAttributeRepository;
    @Autowired
    private OntologyInterfaceConstraintRepository interfaceConstraintRepository;
    @Autowired
    private OntologyHisRepository ontologyHisRepository;
    @Autowired
    private OntologyObjectTypeHisRepository objectTypeHisRepository;
    @Autowired
    private OntologyObjectTypeAttributeHisRepository objectTypeAttributeHisRepository;
    @Autowired
    private OntologyLinkTypeHisRepository linkTypeHisRepository;
    @Autowired
    private OntologyObjectTypeActionHisRepository actionHisRepository;
    @Autowired
    private OntologyLogicTypeHisRepository logicTypeHisRepository;
    @Autowired
    private OntologyInterfaceHisRepository interfaceHisRepository;
    @Autowired
    private OntologyInterfaceAttributeHisRepository interfaceAttributeHisRepository;
    @Autowired
    private OntologyInterfaceConstraintHisRepository interfaceConstraintHisRepository;


    public void publish(OntologyPo ontologyPo, String taskId) {
        LocalDateTime now = LocalDateTime.now();
        // 记录最新版本
        String latestVersion = ontologyPo.getLatestVersion();
        if (StringUtils.isBlank(latestVersion)) {
            latestVersion = "V1.0";
        } else {
            latestVersion = incrementVersion(latestVersion);
        }
        ontologyPo.setLatestVersion(latestVersion);
        ontologyPo.setPublishTime(now);
        ontologyPo.setStatus(StatusEnum.ENABLED.getCode()); // 发布禁用的本体时将当前本体设置为启用
        ontologyPo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
        ontologyRepository.save(ontologyPo);

        // 本体
        OntologyHisPo ontologyHisPo = new OntologyHisPo();
        BeanUtils.copyProperties(ontologyPo, ontologyHisPo);
        ontologyHisPo.setId(StringUtil.genUuid(32));
        ontologyHisPo.setOntologyId(ontologyPo.getId());
        ontologyHisRepository.save(ontologyHisPo);

        // 对象类型
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAvaliableByOntologyId(ontologyPo.getId());
        validateObjectTypeAttributes(objectTypePoList);
        List<String> objectTypeIdList = new ArrayList<>();
        objectTypePoList.forEach(objectTypePo -> {
            objectTypePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            objectTypeRepository.save(objectTypePo);

            OntologyObjectTypeHisPo objectTypeHisPo = new OntologyObjectTypeHisPo();
            BeanUtils.copyProperties(objectTypePo, objectTypeHisPo);
            objectTypeHisPo.setId(StringUtil.genUuid(32));
            objectTypeHisPo.setObjectTypeId(objectTypePo.getId());
            objectTypeHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            objectTypeHisRepository.save(objectTypeHisPo);

            objectTypeIdList.add(objectTypePo.getId());
        });

        // 对象类型属性
        List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = objectTypeAttributeRepository.findAvaliableAndEnableByTypeIds(objectTypeIdList);
        objectTypeAttributePoList.forEach(objectTypeAttributePo -> {
            objectTypeAttributePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            objectTypeAttributeRepository.save(objectTypeAttributePo);

            OntologyObjectTypeAttributeHisPo objectTypeAttributeHisPo = new OntologyObjectTypeAttributeHisPo();
            BeanUtils.copyProperties(objectTypeAttributePo, objectTypeAttributeHisPo);
            objectTypeAttributeHisPo.setId(StringUtil.genUuid(32));
            objectTypeAttributeHisPo.setAttributeId(objectTypeAttributePo.getId());
            objectTypeAttributeHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            objectTypeAttributeHisRepository.save(objectTypeAttributeHisPo);
        });

        // 连接类型
        List<OntologyLinkTypePo> linkTypePoList = linkTypeRepository.findAvailableByOntologyId(ontologyPo.getId());
        linkTypePoList.forEach(linkTypePo -> {
            linkTypePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            linkTypeRepository.save(linkTypePo);

            OntologyLinkTypeHisPo linkTypeHisPo = new OntologyLinkTypeHisPo();
            BeanUtils.copyProperties(linkTypePo, linkTypeHisPo);
            linkTypeHisPo.setId(StringUtil.genUuid(32));
            linkTypeHisPo.setLinkTypeId(linkTypePo.getId());
            linkTypeHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            linkTypeHisRepository.save(linkTypeHisPo);
        });

        // 动作类型
        List<OntologyObjectTypeActionPo> actionPoList = actionRepository.findAvailableByOntologyId(ontologyPo.getId());
        actionPoList.forEach(actionPo -> {
            actionPo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            actionRepository.save(actionPo);

            OntologyObjectTypeActionHisPo objectTypeActionHisPo = new OntologyObjectTypeActionHisPo();
            BeanUtils.copyProperties(actionPo, objectTypeActionHisPo);
            objectTypeActionHisPo.setId(StringUtil.genUuid(32));
            objectTypeActionHisPo.setActionId(actionPo.getId());
            objectTypeActionHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            actionHisRepository.save(objectTypeActionHisPo);
        });

        // 逻辑类型
        List<OntologyLogicTypePo> logicTypePoList = logicTypeRepository.findAvailablebyOntologyId(ontologyPo.getId());
        logicTypePoList.forEach(logicTypePo -> {
            logicTypePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            logicTypeRepository.save(logicTypePo);

            OntologyLogicTypeHisPo logicTypeHisPo = new OntologyLogicTypeHisPo();
            BeanUtils.copyProperties(logicTypePo, logicTypeHisPo);
            logicTypeHisPo.setId(StringUtil.genUuid(32));
            logicTypeHisPo.setLogicTypeId(logicTypePo.getId());
            logicTypeHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            logicTypeHisRepository.save(logicTypeHisPo);
        });

        // 接口&接口属性类型
        List<OntologyInterfacePo> interfacePoList = interfaceRepository.findAllByOntologyId(ontologyPo.getId());
        interfacePoList.forEach(interfacePo -> {
            interfacePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
            interfaceRepository.save(interfacePo);

            OntologyInterfaceHisPo interfaceHisPo = new OntologyInterfaceHisPo();
            BeanUtils.copyProperties(interfacePo, interfaceHisPo);
            interfaceHisPo.setId(StringUtil.genUuid(32));
            interfaceHisPo.setOriginId(interfacePo.getId());
            interfaceHisPo.setLatestVersion(ontologyPo.getLatestVersion());
            interfaceHisRepository.save(interfaceHisPo);

            List<OntologyInterfaceAttributePo> interfaceAttributePoList = interfaceAttributeRepository.findAllByInterfaceId(interfacePo.getId());
            interfaceAttributePoList.forEach(interfaceAttributePo -> {
                interfaceAttributePo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
                interfaceAttributeRepository.save(interfaceAttributePo);

                OntologyInterfaceAttributeHisPo interfaceAttributeHisPo = new OntologyInterfaceAttributeHisPo();
                BeanUtils.copyProperties(interfaceAttributePo, interfaceAttributeHisPo);
                interfaceAttributeHisPo.setId(StringUtil.genUuid(32));
                interfaceAttributeHisPo.setOriginId(interfaceAttributePo.getId());
                interfaceAttributeHisPo.setLatestVersion(ontologyPo.getLatestVersion());
                interfaceAttributeHisRepository.save(interfaceAttributeHisPo);
            });

            List<OntologyInterfaceConstraintPo> interfaceConstraintPoList = interfaceConstraintRepository.findAllByInterfaceId(interfacePo.getId());
            interfaceConstraintPoList.forEach(interfaceConstraintPo -> {
                interfaceConstraintPo.setOperStatus(OperStatusEnum.PUBLISHED.getCode());
                interfaceConstraintRepository.save(interfaceConstraintPo);

                OntologyInterfaceConstraintHisPo interfaceConstraintHisPo = new OntologyInterfaceConstraintHisPo();
                BeanUtils.copyProperties(interfaceConstraintPo, interfaceConstraintHisPo);
                interfaceConstraintHisPo.setId(StringUtil.genUuid(32));
                interfaceConstraintHisPo.setOriginId(interfaceConstraintPo.getId());
                interfaceConstraintHisPo.setLatestVersion(ontologyPo.getLatestVersion());
                interfaceConstraintHisRepository.save(interfaceConstraintHisPo);
            });
        });
    }

    private void validateObjectTypeAttributes(List<OntologyObjectTypePo> objectTypePoList) {
        if (objectTypePoList == null || objectTypePoList.isEmpty()) {
            return;
        }
        List<String> objectTypeIds = objectTypePoList.stream()
                .map(OntologyObjectTypePo::getId)
                .collect(Collectors.toList());
        List<OntologyObjectTypeAttributePo> attributes = objectTypeAttributeRepository.findAvaliableByTypeIdList(objectTypeIds);
        Map<String, List<OntologyObjectTypeAttributePo>> attributeGroup = attributes.stream()
                .collect(Collectors.groupingBy(OntologyObjectTypeAttributePo::getObjectTypeId));
        List<String> invalidTypes = objectTypePoList.stream()
                .filter(po -> attributeGroup.getOrDefault(po.getId(), Collections.emptyList()).isEmpty())
                .map(po -> StringUtils.isBlank(po.getObjectTypeLabel()) ? po.getObjectTypeName() : po.getObjectTypeLabel())
                .collect(Collectors.toList());
        if (!invalidTypes.isEmpty()) {
            throw new RuntimeException(String.format("以下对象类型未配置任何属性，无法发布：%s", String.join("、", invalidTypes)));
        }
    }

    /**
     * 将版本号增加 0.1
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
}

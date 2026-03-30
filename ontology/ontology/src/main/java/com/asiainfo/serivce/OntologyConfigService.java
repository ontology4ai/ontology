package com.asiainfo.serivce;

import com.asiainfo.common.AapConstant;
import com.asiainfo.common.AgentTypeEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.DifyConstant;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.event.OntologyRegisterInfoChangeEvent;
import com.asiainfo.event.OntologyRegisterTypeChangeEvent;
import com.asiainfo.po.OntologyConfigGroupPo;
import com.asiainfo.po.OntologyConfigPo;
import com.asiainfo.repo.OntologyConfigGroupRepository;
import com.asiainfo.repo.OntologyConfigRepository;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigVo;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyConfigService {
    private static final String AGENT_TYPE = "agent_type";

    @Autowired
    OntologyConfigRepository configRepository;
    @Autowired
    ApplicationEventPublisher eventPublisher;
    @Autowired
    private OntologyConfigGroupRepository configGroupRepository;

    public Map<String, String> findAll(String configType) {

        List<OntologyConfigPo> interfacePolist = configRepository
                .findAll((Specification<OntologyConfigPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (StringUtils.isNotBlank(configType)) {

                        predicates.add(cb.equal(root.get("configType").as(String.class), configType));
                    }
                    predicates.add(cb.isNull(root.get("configSource")));
                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();
                });
        Map<String, String> collect = interfacePolist.stream()
                .collect(Collectors.toMap(OntologyConfigPo::getConfigKey, OntologyConfigPo::getConfigValue));

        // 获取context_path
        String contextPath = "";
        Optional<OntologyConfigGroupPo> configGroupPoOptional = configGroupRepository
                .findByStatus(StatusEnum.ENABLED.getCode());
        if (configGroupPoOptional.isPresent()) {
            OntologyConfigGroupPo configGroupPo = configGroupPoOptional.get();
            List<OntologyConfigPo> configPoList = configRepository.findByGroup(configGroupPo.getCode());
            if (CollectionUtils.isNotEmpty(configPoList)) {
                for (OntologyConfigPo configPo : configPoList) {
                    if (AapConstant.AAP_CONTEXT_PATH.equals(configPo.getConfigKey())
                            || DifyConstant.DIFY_CONTEXT_PATH.equals(configPo.getConfigKey())) {
                        contextPath = configPo.getConfigValue();
                        break;
                    }
                }
            }
            collect.put("agent_type", configGroupPo.getGroupType());
        }
        collect.put("context_path", contextPath);

        return collect;
    }

    @Transactional
    public boolean save(List<OntologyConfigVo> configVo) {
        List<OntologyConfigPo> configPoList = configVo.stream()
                // .filter(vo -> !"context_path".equals(vo.getConfigKey()))
                .map(entry -> {
                    if ("context_path".equals(entry.getConfigKey()))
                        throw new RuntimeException("不能创建配置context_path，此配置由查询接口自动生成");
                    OntologyConfigPo configPo = new OntologyConfigPo();
                    BeanUtils.copyProperties(entry, configPo);
                    configPo.setId(StringUtil.genUuid(32));
                    configPo.setOperStatus(OperStatusEnum.CREATED.getCode());
                    configPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                    configPo.setStatus(StatusEnum.ENABLED.getCode());
                    return configPo;
                }).collect(Collectors.toList());

        configRepository.saveAllAndFlush(configPoList);
        return true;
    }

    @Transactional
    public boolean save(String key, String value) {
        OntologyConfigPo configPo = configRepository.findKey(key);
        if (null == configPo) {
            configPo = new OntologyConfigPo();
            configPo.setId(StringUtil.genUuid(32));
            configPo.setOperStatus(OperStatusEnum.CREATED.getCode());
            configPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            configPo.setConfigKey(key);
        } else {
            configPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            configPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        }

        configPo.setConfigValue(value);
        configRepository.saveAndFlush(configPo);
        return true;
    }

    public OntologyConfigPo findKey(String key) {
        return configRepository.findKey(key);
    }

    public List<OntologyConfigVo> getByConfigType(String configType, String configSource) {
        List<OntologyConfigPo> configPoList = getOntologyConfigPosByConfigType(configType, configSource);
        return configPoList.stream().map(po -> {
            OntologyConfigVo vo = new OntologyConfigVo();
            BeanUtils.copyProperties(po, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @NotNull
    private List<OntologyConfigPo> getOntologyConfigPosByConfigType(String configType, String configSource) {
        List<OntologyConfigPo> configPoList = configRepository
                .findAll((Specification<OntologyConfigPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();
                    predicates.add(cb.equal(root.get("configType").as(String.class), configType));
                    predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
                    if (StringUtils.isNotBlank(configSource))
                        predicates.add(cb.equal(root.get("configSource").as(String.class), configSource));
                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();
                });
        return configPoList;
    }

    @Transactional
    public boolean saveAll(String configType, String configSource, List<OntologyConfigVo> configs) {
        List<OntologyConfigPo> oldConfigPoList = getOntologyConfigPosByConfigType(configType, "group");
        Map<String, String> oldConfigMap = new HashMap<>();
        oldConfigPoList.forEach(config -> {
            oldConfigMap.put(config.getConfigKey(), config.getConfigValue());
        });
        if (CollectionUtils.isNotEmpty(oldConfigPoList)) {
            List<String> remoteIds = oldConfigPoList.stream()
                    .map(OntologyConfigPo::getId)
                    .collect(Collectors.toList());
            if (CollectionUtils.isNotEmpty(remoteIds)) {
                configRepository.deleteAllById(remoteIds);
            }
        }
        Map<String, String> newConfigMap = new HashMap<>();
        if (CollectionUtils.isNotEmpty(configs)) {
            configs.forEach(config -> {
                newConfigMap.put(config.getConfigKey(), config.getConfigValue());
            });

            List<OntologyConfigPo> configPoList = configs.stream().map(config -> {
                if ("context_path".equals(config.getConfigKey()) && StringUtils.isEmpty(configSource)) {
                    throw new RuntimeException("配置context_path不允许修改，此配置由查询接口自动生成");
                }
                OntologyConfigPo configPo = new OntologyConfigPo();
                configPo.setId(StringUtils.isEmpty(config.getId()) ? StringUtil.genUuid(32) : config.getId());
                configPo.setConfigKey(config.getConfigKey());
                configPo.setConfigValue(config.getConfigValue());
                configPo.setDescription(config.getDescription());
                configPo.setConfigType(configType);
                if (StringUtils.isNotEmpty(configSource))
                    configPo.setConfigSource(configSource);
                configPo.setOperStatus(OperStatusEnum.CREATED.getCode());
                configPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                configPo.setStatus(StatusEnum.ENABLED.getCode());
                return configPo;
            }).collect(Collectors.toList());

            configRepository.saveAllAndFlush(configPoList);
        }

        // 创建时不启用，需要手工启用
        // EnvironmentProcessor environmentProcessor = new EnvironmentProcessor();
        // environmentProcessor.modifyProperties((ConfigurableEnvironment)
        // SpringContextUtil.getEnvironment(), configType,
        // newConfigMap);

        // configChangeListener(configType, newConfigMap, oldConfigMap);
        return true;
    }

    private void configChangeListener(String configType, Map<String, String> newConfigMap,
            Map<String, String> oldConfigMap) {
        log.info("configType = {}", configType);
        if (newConfigMap.containsKey(AGENT_TYPE)) {
            String oldAgentType = MapUtils.getString(oldConfigMap, AGENT_TYPE);
            String newAgentType = MapUtils.getString(newConfigMap, AGENT_TYPE);
            if (!StringUtils.equalsIgnoreCase(oldAgentType, newAgentType)) {
                log.info("注册方式由{}变更为{}", oldAgentType, newAgentType);
                eventPublisher.publishEvent(new OntologyRegisterTypeChangeEvent(newAgentType));
            }
        } else if (newConfigMap.containsKey(AapConstant.AAP_HOST)
                || newConfigMap.containsKey(AapConstant.AAP_PORT)
                || newConfigMap.containsKey(AapConstant.AAP_REG)) {
            OntologyConfigPo ontologyConfigPo = findKey(AGENT_TYPE);
            if (ontologyConfigPo != null
                    && StringUtils.equalsIgnoreCase(ontologyConfigPo.getConfigValue(), AgentTypeEnum.AAP.getValue())) {
                if (!(StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, AapConstant.AAP_HOST),
                        MapUtils.getString(newConfigMap, AapConstant.AAP_HOST))
                        && StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, AapConstant.AAP_PORT),
                                MapUtils.getString(newConfigMap, AapConstant.AAP_PORT))
                        && StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, AapConstant.AAP_REG),
                                MapUtils.getString(newConfigMap, AapConstant.AAP_REG)))) {
                    log.info("AAP注册信息变更{}", newConfigMap);
                    eventPublisher.publishEvent(OntologyRegisterInfoChangeEvent.builder()
                            .agentType(AgentTypeEnum.AAP.getValue())
                            .host(MapUtils.getString(newConfigMap, AapConstant.AAP_HOST))
                            .port(MapUtils.getString(newConfigMap, AapConstant.AAP_PORT))
                            .reg(MapUtils.getString(newConfigMap, AapConstant.AAP_REG))
                            .build());
                }
            }
        } else if (newConfigMap.containsKey(DifyConstant.DIFY_HOST)
                || newConfigMap.containsKey(DifyConstant.DIFY_PORT)
                || newConfigMap.containsKey(DifyConstant.DIFY_REG)) {
            OntologyConfigPo ontologyConfigPo = findKey(AGENT_TYPE);
            if (ontologyConfigPo != null
                    && StringUtils.equalsIgnoreCase(ontologyConfigPo.getConfigValue(), AgentTypeEnum.DIFY.getValue())) {
                if (!(StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, DifyConstant.DIFY_HOST),
                        MapUtils.getString(newConfigMap, DifyConstant.DIFY_HOST))
                        && StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, DifyConstant.DIFY_PORT),
                                MapUtils.getString(newConfigMap, DifyConstant.DIFY_PORT))
                        && StringUtils.equalsIgnoreCase(MapUtils.getString(oldConfigMap, DifyConstant.DIFY_REG),
                                MapUtils.getString(newConfigMap, DifyConstant.DIFY_REG)))) {
                    log.info("DIFY注册信息变更{}", newConfigMap);
                    eventPublisher.publishEvent(OntologyRegisterInfoChangeEvent.builder()
                            .agentType(AgentTypeEnum.DIFY.getValue())
                            .host(MapUtils.getString(newConfigMap, DifyConstant.DIFY_HOST))
                            .port(MapUtils.getString(newConfigMap, DifyConstant.DIFY_PORT))
                            .reg(MapUtils.getString(newConfigMap, DifyConstant.DIFY_REG))
                            .build());
                }
            }
        }
    }

    @Transactional
    public void deleteByConfigType(String configType, String configSource) {
        // 直接物理删除
        // configRepository.softDeleteByConfigType(configType);
        if (StringUtils.isNotBlank(configSource)) {
            log.debug("删除配置，configType:{}, configSource:{}", configType, configSource);
            int num = configRepository.deleteByConfigType(configType, configSource);
            log.debug("删除了{}条配置", num);
        } else {
            int num = configRepository.deleteByConfigType(configType);
            log.debug("删除了{}条配置", num);
        }
    }

    @Transactional
    public void updateStatusByConfigType(String configType, Integer status, String configSource) {
        List<OntologyConfigPo> configPoList = getOntologyConfigPosByConfigType(configType, configSource);
        if (CollectionUtils.isNotEmpty(configPoList)) {
            for (OntologyConfigPo po : configPoList) {
                po.setStatus(status);
            }
            configRepository.saveAllAndFlush(configPoList);
        }
    }

    @Transactional
    public boolean update(String id, OntologyConfigVo configVo) {
        if ("context_path".equals(configVo.getConfigKey())) {
            throw new RuntimeException("配置context_path不允许修改，此配置由查询接口自动生成");
        }
        OntologyConfigPo configPo = configRepository.findById(id).orElse(null);
        if (configPo != null) {
            BeanUtils.copyProperties(configVo, configPo);
            configPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            configPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            configRepository.saveAndFlush(configPo);
        } else {
            throw new RuntimeException("配置不存在");
        }
        return true;
    }

    @Transactional
    public boolean delete(String id) {
        OntologyConfigPo configPo = configRepository.findById(id).orElse(null);
        if (configPo != null) {
            configRepository.delete(configPo);
        } else {
            throw new RuntimeException("配置不存在");
        }
        return true;
    }

    @Transactional
    public boolean delete(List<String> ids) {
        configRepository.deleteAllById(ids);
        return true;
    }

    public boolean checkExists(String configType, String configKey) {
        // List<OntologyConfigPo> ontologyConfigPos =
        // configRepository.findKey(configKey);
        // for (OntologyConfigPo ontologyConfigPo : ontologyConfigPos) {
        // if (StringUtils.equals(ontologyConfigPo.getConfigType(), configType)) {
        // return true;
        // }
        // }
        return false;
    }
}

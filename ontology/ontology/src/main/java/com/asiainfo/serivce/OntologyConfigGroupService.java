package com.asiainfo.serivce;

import com.asiainfo.common.AapConstant;
import com.asiainfo.common.AgentTypeEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.DifyConstant;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.config.RegisterFactory;
import com.asiainfo.dto.OntologyConfigGroupDto;
import com.asiainfo.po.OntologyConfigGroupPo;
import com.asiainfo.repo.OntologyConfigGroupRepository;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;
import com.asiainfo.vo.operation.OntologyConfigVo;
import com.asiainfo.vo.search.OntologyConfigGroupSearchVo;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyConfigGroupService {

    @Autowired
    private OntologyConfigGroupRepository ontologyConfigGroupRepository;

    @Autowired
    private OntologyConfigService ontologyConfigService;

    @Autowired
    private AgentPlatformUtils agentPlatformUtils;

    public Page<OntologyConfigGroupDto> search(OntologyConfigGroupSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.ASC, "code");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);
        Page<OntologyConfigGroupPo> page = ontologyConfigGroupRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getCode())) {
                predicates.add(cb.like(root.get("code").as(String.class), "%" + searchVo.getCode() + "%"));
            }
            if (StringUtils.isNotBlank(searchVo.getName())) {
                predicates.add(cb.like(root.get("name").as(String.class), "%" + searchVo.getName() + "%"));
            }
            if (searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(String.class), searchVo.getStatus()));
            }
            predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        List<OntologyConfigGroupDto> records = page.getContent().stream().map(OntologyConfigGroupDto::toDto)
                .collect(Collectors.toList());
        return new PageImpl<>(records, page.getPageable(), page.getTotalElements());

    }

    @Transactional
    public OntologyConfigGroupPo save(OntologyConfigGroupVo ontologyConfigGroupVo) {
        if (ontologyConfigGroupRepository.countByCode(ontologyConfigGroupVo.getCode()) > 0) {
            throw new RuntimeException("分组编码已存在");
        }
        OntologyConfigGroupPo ontologyConfigGroupPo = new OntologyConfigGroupPo();
        BeanUtils.copyProperties(ontologyConfigGroupVo, ontologyConfigGroupPo);
        ontologyConfigGroupPo.setId(StringUtil.genUuid(32));
        // 默认是不启用的
        ontologyConfigGroupPo.setStatus(StatusEnum.DISABLED.getCode());
        ontologyConfigGroupPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        ontologyConfigGroupPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        OntologyConfigGroupPo save = ontologyConfigGroupRepository.save(ontologyConfigGroupPo);

        ontologyConfigService.saveAll(ontologyConfigGroupVo.getCode(), "group", ontologyConfigGroupVo.getConfigs());

        return save;
    }

    public OntologyConfigGroupVo view(String id) {
        Optional<OntologyConfigGroupPo> sharedConfigPo = ontologyConfigGroupRepository.findById(id);
        return getVo(sharedConfigPo);
    }

    private Optional<OntologyConfigGroupPo> getOntologyConfigGroupByCode(String code) {
        return ontologyConfigGroupRepository.findOne((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("code").as(String.class), code));
            predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        });
    }

    private Optional<OntologyConfigGroupPo> getEnabledOntologyConfigGroupByType(String type) {
        return ontologyConfigGroupRepository.findOne((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("groupType").as(String.class), type));
            predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            predicates.add(cb.equal(root.get("status").as(String.class), StatusEnum.ENABLED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        });
    }

    public OntologyConfigGroupVo get(String code) {
        Optional<OntologyConfigGroupPo> sharedConfigPo = getOntologyConfigGroupByCode(code);
        return getVo(sharedConfigPo);
    }

    private OntologyConfigGroupVo getVo(Optional<OntologyConfigGroupPo> sharedConfigPo) {
        if (!sharedConfigPo.isPresent()) {
            return null;
        }

        OntologyConfigGroupPo ontologyConfigGroupPo = sharedConfigPo.get();
        if (ontologyConfigGroupPo.getSyncStatus() == OperStatusEnum.DELETED.getCode()) {
            return null;
        }

        OntologyConfigGroupVo vo = new OntologyConfigGroupVo();
        BeanUtils.copyProperties(ontologyConfigGroupPo, vo);
        vo.setConfigs(ontologyConfigService.getByConfigType(vo.getCode(), "group"));
        return vo;
    }

    @Transactional
    public OntologyConfigGroupPo update(String id, OntologyConfigGroupVo ontologyConfigGroupVo) {
        // 分组编码不能修改，因此不需要判重
        // if
        // (ontologyConfigGroupRepository.countByCode(ontologyConfigGroupVo.getCode(),
        // ontologyConfigGroupVo.getId()) > 0) {
        // throw new RuntimeException("分组编码已存在");
        // }
        OntologyConfigGroupPo ontologyConfigGroupPo = ontologyConfigGroupRepository.findById(id).orElse(null);
        if (ontologyConfigGroupPo == null
                || ontologyConfigGroupPo.getSyncStatus() == ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("配置分组不存在");
        }
        if (ontologyConfigGroupPo.getStatus() == StatusEnum.ENABLED.getCode()) {
            throw new RuntimeException("分组已被启用。请禁用后再修改！");
        }
        if (!ontologyConfigGroupPo.getCode().equals(ontologyConfigGroupVo.getCode())) {
            throw new RuntimeException("分组编码不能修改！");
        }
        boolean needUpdate = false;

        if (!StringUtils.equals(ontologyConfigGroupVo.getCode(), ontologyConfigGroupPo.getCode())) {
            ontologyConfigGroupPo.setCode(ontologyConfigGroupVo.getCode());
            needUpdate = true;
        }

        if (!StringUtils.equals(ontologyConfigGroupVo.getName(), ontologyConfigGroupPo.getName())) {
            ontologyConfigGroupPo.setName(ontologyConfigGroupVo.getName());
            needUpdate = true;
        }

        if (!StringUtils.equals(ontologyConfigGroupVo.getGroupType(), ontologyConfigGroupPo.getGroupType())) {
            ontologyConfigGroupPo.setGroupType(ontologyConfigGroupVo.getGroupType());
            needUpdate = true;
        }
        log.debug("needUpdate:{}", needUpdate);
        log.debug("ontologyConfigGroupPo:{}", ontologyConfigGroupPo);
        OntologyConfigGroupPo save = ontologyConfigGroupPo;
        if (needUpdate) {
            ontologyConfigGroupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            ontologyConfigGroupPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            save = ontologyConfigGroupRepository.save(ontologyConfigGroupPo);
        } else {
            log.warn("未修改任何内容");
        }

        ontologyConfigService.saveAll(ontologyConfigGroupVo.getCode(), "group", ontologyConfigGroupVo.getConfigs());

        return save;
    }

    @Transactional
    public Boolean delete(List<String> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            return false;
        }
        List<OntologyConfigGroupPo> ontologyConfigGroupPos = ontologyConfigGroupRepository.findAllById(ids);
        log.debug("delete() {}", ontologyConfigGroupPos);
        if (!CollectionUtils.isEmpty(ontologyConfigGroupPos)) {
            for (OntologyConfigGroupPo ontologyConfigGroupPo : ontologyConfigGroupPos) {
                if (ontologyConfigGroupPo.getStatus() == StatusEnum.ENABLED.getCode()) {
                    throw new RuntimeException(ontologyConfigGroupPo.getCode() + "已被启用。请禁用后再删除！");
                }
                ontologyConfigService.deleteByConfigType(ontologyConfigGroupPo.getCode(), "group");
            }
        }
        // 直接物理删除
        // ontologyConfigGroupRepository.softDeleteByIds(ids);
        ontologyConfigGroupPos.stream().forEach(ontologyConfigGroupPo -> {
            ontologyConfigGroupRepository.delete(ontologyConfigGroupPo);
        });
        return true;
    }

    @Transactional
    public boolean disable(List<String> ids) {
        return updateStatusByIds(ids, StatusEnum.DISABLED.getCode());
    }

    @Transactional
    public boolean enable(List<String> ids) {
        return updateStatusByIds(ids, StatusEnum.ENABLED.getCode());
    }

    private boolean updateStatusByIds(List<String> ids, Integer status) {
        List<OntologyConfigGroupPo> ontologyConfigGroupPos = ontologyConfigGroupRepository.findAllById(ids);
        if (CollectionUtils.isNotEmpty(ontologyConfigGroupPos)) {
            for (OntologyConfigGroupPo ontologyConfigGroupPo : ontologyConfigGroupPos) {
                ontologyConfigGroupPo.setStatus(status);
                ontologyConfigGroupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
                ontologyConfigGroupPo.setOperStatus(OperStatusEnum.UPDATED.getCode());

                ontologyConfigService.updateStatusByConfigType(ontologyConfigGroupPo.getCode(), status, "group");
            }
            ontologyConfigGroupRepository.saveAllAndFlush(ontologyConfigGroupPos);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean enable(String id) {
        return updateStatusByIds(id);
    }

    @Transactional
    public boolean disable(String id) {
        OntologyConfigGroupPo currrentOntologyConfigGroupPo = ontologyConfigGroupRepository.findById(id).orElse(null);
        // status状态未改变，也执行启用操作
        if (currrentOntologyConfigGroupPo != null) {
            log.debug("当前配置:{}", currrentOntologyConfigGroupPo);
            // 禁用其他配置
            disabledConfigGroup(currrentOntologyConfigGroupPo);

            return true;
        } else
            log.warn("没有找到需要启用的配置！");
        return false;
    }

    private boolean updateStatusByIds(String id) {
        OntologyConfigGroupPo currrentOntologyConfigGroupPo = ontologyConfigGroupRepository.findById(id).orElse(null);
        // status状态未改变，也执行启用操作
        if (currrentOntologyConfigGroupPo != null) {
            log.debug("当前配置:{}", currrentOntologyConfigGroupPo);
            List<OntologyConfigGroupPo> ontologyConfigGroupPos = ontologyConfigGroupRepository.findAll();
            for (OntologyConfigGroupPo ontologyConfigGroupPo : ontologyConfigGroupPos) {
                // 多个aap、dify互斥，当1个配置启用时，其他配置自动禁用。
                if (ontologyConfigGroupPo.getId().equals(id)) {
                    // 启用当前配置
                    enabledConfigGroup(ontologyConfigGroupPo);
                } else {
                    // 禁用其他配置
                    disabledConfigGroup(ontologyConfigGroupPo);
                }

            }
            return true;
        } else
            log.warn("没有找到需要启用的配置！");
        return false;
    }

    private void enabledConfigGroup(OntologyConfigGroupPo ontologyConfigGroupPo) {
        ontologyConfigGroupPo.setStatus(StatusEnum.ENABLED.getCode());
        ontologyConfigGroupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        ontologyConfigGroupPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
        ontologyConfigGroupRepository.save(ontologyConfigGroupPo);

        OntologyConfigGroupVo vo = getVo(Optional.of(ontologyConfigGroupPo));
        if (ontologyConfigGroupPo.getGroupType().equals(AgentTypeEnum.AAP.getValue())) {
            // 激活AAP
            try {
                agentPlatformUtils.registerAapRoute(vo);
                agentPlatformUtils.runAap(vo);
            } catch (Exception e) {
                log.error("{}自动注册异常: {}", "AAP", e.getMessage());
            }

        } else if (ontologyConfigGroupPo.getGroupType().equals(AgentTypeEnum.DIFY.getValue())) {
            // 激活DIFY
            agentPlatformUtils.registerAapRoute(vo);
        }

    }

    private void disabledConfigGroup(OntologyConfigGroupPo ontologyConfigGroupPo) {
        ontologyConfigGroupPo.setStatus(StatusEnum.DISABLED.getCode());
        if (OperStatusEnum.DELETED.getCode() != ontologyConfigGroupPo.getOperStatus()
                && ChangeStatusEnum.DELETED.getCode() != ontologyConfigGroupPo.getSyncStatus()) {
            ontologyConfigGroupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            ontologyConfigGroupPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            ontologyConfigGroupRepository.save(ontologyConfigGroupPo);
        }

    }

    public OntologyConfigGroupVo getEnabledAgentPlatform() {
        Optional<OntologyConfigGroupPo> aapPo = getEnabledOntologyConfigGroupByType(AgentTypeEnum.AAP.getValue());
        OntologyConfigGroupVo configGroupVo = getVo(aapPo);
        if (configGroupVo != null && configGroupVo.getStatus() == StatusEnum.ENABLED.getCode()) {
            return configGroupVo;
        }
        Optional<OntologyConfigGroupPo> difyPo = getEnabledOntologyConfigGroupByType(AgentTypeEnum.DIFY.getValue());
        configGroupVo = getVo(difyPo);
        if (configGroupVo != null && configGroupVo.getStatus() == StatusEnum.ENABLED.getCode()) {
            return configGroupVo;
        }
        return configGroupVo;
    }

    public boolean checkExists(String code) {
        Optional<OntologyConfigGroupPo> ontologyConfigGroupPo = getOntologyConfigGroupByCode(code);
        return ontologyConfigGroupPo.isPresent();
    }

    public Map<String, String> getEnabledAgentPlatformMap() {
        OntologyConfigGroupVo enabledConfigGroupVo = getEnabledAgentPlatform();
        Map<String, String> collect = enabledConfigGroupVo.getConfigs().stream()
                .collect(Collectors.toMap(OntologyConfigVo::getConfigKey, OntologyConfigVo::getConfigValue));

        // 获取context_path
        String contextPath = "";
        for (OntologyConfigVo configVo : enabledConfigGroupVo.getConfigs()) {
            if (AapConstant.AAP_CONTEXT_PATH.equals(configVo.getConfigKey())
                    || DifyConstant.DIFY_CONTEXT_PATH.equals(configVo.getConfigKey())) {
                contextPath = configVo.getConfigValue();
                break;
            }
        }

        collect.put("context_path", contextPath);
        return collect;
    }
}

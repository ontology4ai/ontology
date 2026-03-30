package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.dto.OntologyPromptDto;
import com.asiainfo.po.OntologyPromptPo;
import com.asiainfo.repo.OntologyPromptRepository;
import com.asiainfo.vo.operation.PromptVo;
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

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OntologyPromptService {
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final static int CUSTOMIZED_TYPE = 0;

    @Autowired
    OntologyPromptRepository promptRepository;

    @Autowired
    OntologyService ontologyService;

    @Transactional
    public boolean save(PromptVo promptVo) throws Exception {

        if (promptRepository.countByPromptName(promptVo.getOntologyId(), promptVo.getPromptType(), promptVo.getPromptName()) > 0) {
            throw new Exception(String.format("提示词%s已存在", promptVo.getPromptName()));
        }

        OntologyPromptPo promptPo = new OntologyPromptPo();
        BeanUtils.copyProperties(promptVo, promptPo);
        promptPo.setId(StringUtil.genUuid(32));
        promptPo.setCreateTime(LocalDateTime.now());
        promptPo.setLastUpdate(promptPo.getCreateTime());
        promptPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        promptPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        promptPo.setDefaultType(CUSTOMIZED_TYPE);
        promptRepository.save(promptPo);

        return true;
    }

    @Transactional
    public boolean batchSave(PromptVo promptVo) {
        List<OntologyPromptPo> promptPoList = promptVo.getBatchList().stream().map(templateVo -> {
            OntologyPromptPo promptPo = new OntologyPromptPo();
            BeanUtils.copyProperties(templateVo, promptPo);
            promptPo.setId(StringUtil.genUuid(32));
            promptPo.setOntologyId(promptVo.getOntologyId());
            promptPo.setDefaultType(CUSTOMIZED_TYPE);
            promptPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            promptPo.setOperStatus(OperStatusEnum.CREATED.getCode());
            return promptPo;
        }).collect(Collectors.toList());

        promptRepository.saveAllAndFlush(promptPoList);
        return true;
    }

    @Transactional
    public Object update(PromptVo promptVo) throws Exception {
        OntologyPromptPo promptPo = promptRepository.findById(promptVo.getId()).orElse(null);
        if (null == promptPo) {
            return false;
        }

        promptPo.setLastUpdate(LocalDateTime.now());

        int promptType = promptPo.getPromptType();
        if (null != promptVo.getPromptType()) {
            promptType = promptVo.getPromptType();
        }

        if (StringUtils.isNotBlank(promptVo.getPromptName())
                && !promptPo.getPromptName().equals(promptVo.getPromptName())) {
            if (promptRepository.countByPromptName(promptPo.getOntologyId(), promptType, promptVo.getPromptName()) > 0) {
                throw new Exception(String.format("提示词%s已存在", promptVo.getPromptName()));
            }

            promptPo.setPromptName(promptVo.getPromptName());
        }
        if (StringUtils.isNotBlank(promptVo.getPromptDesc())) {
            promptPo.setPromptDesc(promptVo.getPromptDesc());
        }
        if (StringUtils.isNotBlank(promptVo.getPromptContent())) {
            promptPo.setPromptContent(promptVo.getPromptContent());
        }
        if (null != promptVo.getPromptType()) {
            promptPo.setPromptType(promptVo.getPromptType());
        }

        promptPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        promptPo.setOperStatus(OperStatusEnum.UPDATED.getCode());

        promptRepository.save(promptPo);
        return true;
    }

    @Transactional
    public boolean deleteAllById(List<String> idList) {
        promptRepository.deleteByIds(idList);
        return true;
    }

    public OntologyPromptDto showById(String id) {
        OntologyPromptDto promptDto = new OntologyPromptDto();
        promptDto.setId(id);
        promptDto.setPromptName(promptRepository.findNameById(id));
        return promptDto;
    }

    public OntologyPromptDto findById(String id) {
        OntologyPromptPo promptPo = promptRepository.findById(id).orElse(null);
        OntologyPromptDto promptDto = new OntologyPromptDto();
        if (null == promptPo) {
            return promptDto;
        }

        BeanUtils.copyProperties(promptPo, promptDto, "createTime", "lastUpdate");
        if (null != promptPo.getCreateTime()) {
            promptDto.setCreateTime(promptPo.getCreateTime().format(formatter));
        }
        if (null != promptPo.getLastUpdate()) {
            promptDto.setLastUpdate(promptPo.getLastUpdate().format(formatter));
        }

        // 默认提示词内容从接口获取
        if (CUSTOMIZED_TYPE != promptPo.getDefaultType().intValue()) {
            try {
                if (PromptTypeEnum.NORMAL.equals(promptPo.getPromptType().intValue())) {
                    promptDto.setPromptContent(ontologyService.getCommonPrompt(promptPo.getOntologyId()));
                }

                if (PromptTypeEnum.OAG.equals(promptPo.getPromptType().intValue())) {
                    promptDto.setPromptContent(ontologyService.getOagPrompt(promptPo.getOntologyId()));
                }
            } catch (Exception e) {
                log.error(e.getMessage());
                promptDto.setPromptContent(e.getMessage());
            }
        }

        return promptDto;
    }

    public Page<OntologyPromptDto> explorePage(PromptVo promptVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "defaultType", "createTime");
        PageRequest request = PageRequest.of(Math.max(promptVo.getPage() - 1, 0), promptVo.getLimit() > 0 ? promptVo.getLimit() : 10, sort);

        Page<OntologyPromptPo> promptPage = promptRepository.findAll((Specification<OntologyPromptPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("ontologyId").as(String.class), promptVo.getOntologyId()));
            predicates.add(cb.or(
                    cb.equal(root.get("workspaceId").as(String.class), promptVo.getWorkspaceId()),
                    cb.isNull(root.get("workspaceId"))
            ));
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            if (StringUtils.isNotBlank(promptVo.getKeyword())) {
                predicates.add(cb.like(root.get("promptName").as(String.class), "%" + promptVo.getKeyword() + "%"));
            }
            if (Objects.nonNull(promptVo.getPromptType())) {
                predicates.add(cb.equal(root.get("promptType").as(Integer.class), promptVo.getPromptType()));
            }
            if (Objects.nonNull(promptVo.getOwnerIdList()) && !promptVo.getOwnerIdList().isEmpty()) {
                predicates.add(root.get("ownerId").in(promptVo.getOwnerIdList()));
            }

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        String rdfPrompt = "";
        try {
            rdfPrompt = ontologyService.getRDFPrompt(promptVo.getOntologyId());
        } catch (Exception e) {
            log.error("RDF内容获取失败", e);
        }

        String tmpPrompt = rdfPrompt;
        final List<OntologyPromptDto> collect = promptPage.getContent().stream().map(promptPo -> {
            OntologyPromptDto promptDto = new OntologyPromptDto();
            BeanUtils.copyProperties(promptPo, promptDto, "createTime", "lastUpdate", "promptContent");
            if (null != promptPo.getCreateTime()) {
                promptDto.setCreateTime(promptPo.getCreateTime().format(formatter));
            }
            if (null != promptPo.getLastUpdate()) {
                promptDto.setLastUpdate(promptPo.getLastUpdate().format(formatter));
            }

            if (CUSTOMIZED_TYPE != promptPo.getDefaultType()) {
                if (PromptTypeEnum.NORMAL.equals(promptPo.getPromptType().intValue())) {
                    String normalPrompt = ontologyService.getCommonPrompt(promptPo.getOntologyId());
                    String prompt = (normalPrompt == null ? "" : normalPrompt) + tmpPrompt;
                    promptDto.setCharNum(prompt.length());
                } else {
                    String oagPrompt = ontologyService.getOagPrompt(promptPo.getOntologyId());
                    promptDto.setCharNum(oagPrompt.length() + 58); // 20260206: OAG类型提示词后统一加本体ID等信息
                }
            } else {
                if (PromptTypeEnum.NORMAL.equals(promptPo.getPromptType().intValue())) {
                    String promptContent = (promptPo.getPromptContent() == null ? "" : promptPo.getPromptContent()) + tmpPrompt;
                    promptDto.setCharNum(promptContent.length());
                } else {
                    promptDto.setCharNum(StringUtils.length(promptPo.getPromptContent()) + 58); // 20260206: OAG类型提示词后统一加本体ID等信息
                }
            }

            return promptDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, promptPage.getPageable(), promptPage.getTotalElements());
    }

    public List<OntologyPromptDto> findByPromptType(PromptVo promptVo) {
        List<OntologyPromptPo> poList = promptRepository.findByPromptType(promptVo.getOntologyId(),
                promptVo.getWorkspaceId(),
                promptVo.getPromptType());
        return poList.stream().map(promptPo -> {
            OntologyPromptDto promptDto = new OntologyPromptDto();
            BeanUtils.copyProperties(promptPo, promptDto, "createTime", "lastUpdate", "promptContent");
            if (null != promptPo.getCreateTime()) {
                promptDto.setCreateTime(promptPo.getCreateTime().format(formatter));
            }
            if (null != promptPo.getLastUpdate()) {
                promptDto.setLastUpdate(promptPo.getLastUpdate().format(formatter));
            }
            return promptDto;
        }).collect(Collectors.toList());
    }

}

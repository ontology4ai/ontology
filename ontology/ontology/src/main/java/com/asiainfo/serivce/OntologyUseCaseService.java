package com.asiainfo.serivce;

import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.dto.OntologyDifyTaskDto;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.dto.OntologyUseCaseDto;
import com.asiainfo.po.OntologyPromptPo;
import com.asiainfo.po.OntologyUseCasePo;
import com.asiainfo.repo.OntologyPromptRepository;
import com.asiainfo.repo.OntologyUseCaseRepository;
import com.asiainfo.vo.operation.CaseTemplateVo;
import com.asiainfo.vo.operation.UseCaseVo;
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
import java.util.stream.Collectors;

@Slf4j
@Service
public class OntologyUseCaseService {
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final static int CUSTOMIZED_TYPE = 0;

    @Autowired
    OntologyUseCaseRepository useCaseRepository;

    @Autowired
    OntologyDifyTaskService difyTaskService;

    @Autowired
    OntologyPromptService promptService;

    @Autowired
    OntologyPromptRepository promptRepository;

    @Autowired
    OntologyService ontologyService;

    @Transactional
    public boolean save(UseCaseVo useCaseVo) throws Exception {
        OntologyUseCasePo useCasePo = new OntologyUseCasePo();
        BeanUtils.copyProperties(useCaseVo, useCasePo);
        useCasePo.setId(StringUtil.genUuid(32));
        useCasePo.setCreateTime(LocalDateTime.now());
        OntologyDto OntologyDto = ontologyService.findOne(useCaseVo.getOntologyId());
        if (null != OntologyDto) {
            useCasePo.setOntologyName(OntologyDto.getOntologyName());
        }

        initNormalPrompt(useCasePo, useCaseVo.getOntologyId(), useCaseVo.getNormalPromptName());
        initOagPrompt(useCasePo, useCaseVo.getOntologyId(), useCaseVo.getOagPromptName());

        useCaseRepository.save(useCasePo);
        return true;
    }

    private void initNormalPrompt(OntologyUseCasePo useCasePo, String ontologyId, String promptName) throws Exception {
        OntologyPromptPo normalPromptPo = promptRepository.findByPromptName(ontologyId, PromptTypeEnum.NORMAL.getValue(), promptName);
        useCasePo.setNormalPromptId(normalPromptPo.getId());
        if (CUSTOMIZED_TYPE == normalPromptPo.getDefaultType()) {
            useCasePo.setNormalPrompt(normalPromptPo.getPromptContent());
        } else {
            useCasePo.setNormalPrompt(ontologyService.getPrompt(ontologyId));
        }
    }

    private void initOagPrompt(OntologyUseCasePo useCasePo, String ontologyId, String promptName) {
        OntologyPromptPo oagPromptPo = promptRepository.findByPromptName(ontologyId, PromptTypeEnum.OAG.getValue(), promptName);
        useCasePo.setOagPromptId(oagPromptPo.getId());
        if (CUSTOMIZED_TYPE == oagPromptPo.getDefaultType()) {
            useCasePo.setOagPrompt(oagPromptPo.getPromptContent());
        } else {
            useCasePo.setOagPrompt(ontologyService.getOagPrompt(ontologyId));
        }
    }

    @Transactional
    public boolean saveBatch(String ontologyId, List<CaseTemplateVo> caseList, String ownerId, String workspaceId) throws Exception {
        OntologyDto OntologyDto = ontologyService.findOne(ontologyId);
        List<OntologyUseCasePo> casePoList = new ArrayList<>();
        for (CaseTemplateVo caseVo : caseList) {
            OntologyUseCasePo useCasePo = new OntologyUseCasePo();
            useCasePo.setId(StringUtil.genUuid(32));
            useCasePo.setOwnerId(ownerId);
            useCasePo.setWorkspaceId(workspaceId);
            useCasePo.setCreateTime(LocalDateTime.now());
            useCasePo.setOntologyId(ontologyId);
            useCasePo.setQuestion(caseVo.getQuestion());
            useCasePo.setExpectedResult(caseVo.getExpectedResult());
            if (null != OntologyDto) {
                useCasePo.setOntologyName(OntologyDto.getOntologyName());
            }

            initNormalPrompt(useCasePo, ontologyId, caseVo.getNormalPromptName());
            initOagPrompt(useCasePo, ontologyId, caseVo.getOagPromptName());

            casePoList.add(useCasePo);
        }

        useCaseRepository.saveAll(casePoList);
        return true;
    }

    @Transactional
    public Object update(UseCaseVo useCaseVo) throws Exception {
        OntologyUseCasePo useCasePo = useCaseRepository.findById(useCaseVo.getId()).orElse(null);
        if (null != useCasePo) {
            if (StringUtils.isNotEmpty(useCaseVo.getQuestion())) {
                useCasePo.setQuestion(useCaseVo.getQuestion());
            }
            if (StringUtils.isNotEmpty(useCaseVo.getExpectedResult())) {
                useCasePo.setExpectedResult(useCaseVo.getExpectedResult());
            }
            if (StringUtils.isNotEmpty(useCaseVo.getNormalPromptName())) {
                initNormalPrompt(useCasePo, useCasePo.getOntologyId(), useCaseVo.getNormalPromptName());
            }
            if (StringUtils.isNotEmpty(useCaseVo.getOagPromptName())) {
                initOagPrompt(useCasePo, useCasePo.getOntologyId(), useCaseVo.getOagPromptName());
            }

            useCaseRepository.save(useCasePo);
        }
        return true;
    }

    @Transactional
    public boolean deleteAllById(List<String> caseIdList) {
        useCaseRepository.deleteAllById(caseIdList);
        return true;
    }

    public Page<OntologyUseCaseDto> explorePage(UseCaseVo useCaseVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        PageRequest request = PageRequest.of(Math.max(useCaseVo.getPage() - 1, 0), useCaseVo.getLimit() > 0 ? useCaseVo.getLimit() : 10, sort);

        Page<OntologyUseCasePo> useCasePage = useCaseRepository.findAll((Specification<OntologyUseCasePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("ontologyId").as(String.class), useCaseVo.getOntologyId()));
            predicates.add(cb.equal(root.get("workspaceId").as(String.class), useCaseVo.getWorkspaceId()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        final List<OntologyUseCaseDto> collect = useCasePage.getContent().stream().map(useCasePo -> {
            OntologyUseCaseDto useCaseDto = new OntologyUseCaseDto();
            BeanUtils.copyProperties(useCasePo, useCaseDto, "createTime");
            if (null != useCasePo.getCreateTime()) {
                useCaseDto.setCreateTime(useCasePo.getCreateTime().format(formatter));
            }

            useCaseDto.setNormalPrompt(promptService.showById(useCasePo.getNormalPromptId()));
            useCaseDto.setOagPrompt(promptService.showById(useCasePo.getOagPromptId()));

            // OntologyDifyTaskPo difyTaskPo = difyTaskService.findTopByCaseId(useCasePo.getId());
            // 设置用例上次执行的任务信息 - 查找对应提示词模式的任务
            OntologyDifyTaskDto difyTaskDto = difyTaskService.findLastTask(useCasePo.getId(), useCaseVo.getPromptType());
            useCaseDto.setTask(difyTaskDto);

            return useCaseDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, useCasePage.getPageable(), useCasePage.getTotalElements());
    }

    public List<OntologyUseCaseDto> listAll(UseCaseVo useCaseVo) {
        List<OntologyUseCasePo> useCasePoList = useCaseRepository.findByOwner(useCaseVo.getOntologyId(), useCaseVo.getWorkspaceId());
        List<OntologyUseCaseDto> useCaseDtoList = new ArrayList<>();
        for (OntologyUseCasePo useCasePo : useCasePoList) {
            OntologyUseCaseDto useCaseDto = new OntologyUseCaseDto();
            BeanUtils.copyProperties(useCasePo, useCaseDto, "createTime");
            if (null != useCasePo.getCreateTime()) {
                useCaseDto.setCreateTime(useCasePo.getCreateTime().format(formatter));
            }

            useCaseDto.setNormalPrompt(promptService.showById(useCasePo.getNormalPromptId()));
            useCaseDto.setOagPrompt(promptService.showById(useCasePo.getOagPromptId()));

            // 设置用例上次执行的任务信息 - 查找对应提示词模式的任务
            OntologyDifyTaskDto difyTaskDto = difyTaskService.findLastTask(useCasePo.getId(), useCaseVo.getPromptType());
            useCaseDto.setTask(difyTaskDto);

            if (null != useCaseVo.getStatus()) {
                if (null == difyTaskDto.getStatus() || useCaseVo.getStatus() != difyTaskDto.getStatus()) {
                    continue;
                }
            }

            if (null != useCaseVo.getSummary()) {
                if (null == difyTaskDto.getSummary() || !useCaseVo.getSummary().equals(difyTaskDto.getSummary())) {
                    continue;
                }
            }

            if (null != useCaseVo.getKeyword()) {
                String keyword = useCaseVo.getKeyword().toLowerCase();
                if (!useCaseDto.getId().toLowerCase().contains(keyword)
                        && !useCaseDto.getQuestion().toLowerCase().contains(keyword)
                        && !useCaseDto.getExpectedResult().toLowerCase().contains(keyword)) {
                    continue;
                }
            }

            useCaseDtoList.add(useCaseDto);
        }

        return useCaseDtoList;
    }
}

package com.asiainfo.serivce;

import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.dto.OntologyPromptConfigDto;
import com.asiainfo.po.OntologyPromptConfigPo;
import com.asiainfo.repo.OntologyPromptRepository;
import com.asiainfo.repo.OntologyPromptConfigRepository;
import com.asiainfo.vo.operation.PromptConfigVo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class OntologyPromptConfigService {

    @Autowired
    OntologyPromptConfigRepository promptConfigRepository;

    @Autowired
    OntologyPromptRepository promptRepository;

    @Autowired
    OntologyPromptService promptService;


    @Transactional
    public OntologyPromptConfigDto save(PromptConfigVo promptConfigVo) throws Exception {
        OntologyPromptConfigPo promptConfigPo = new OntologyPromptConfigPo();
        BeanUtils.copyProperties(promptConfigVo, promptConfigPo);
        promptConfigPo.setId(String.format("%s%s", promptConfigVo.getOwnerId(), promptConfigVo.getOntologyId()));
        promptConfigRepository.save(promptConfigPo);
        return findByUser(promptConfigVo);
    }

    @Transactional
    public OntologyPromptConfigDto findByUser(PromptConfigVo promptConfigVo) {
        OntologyPromptConfigPo promptConfigPo = promptConfigRepository.findById(String.format("%s%s", promptConfigVo.getOwnerId(), promptConfigVo.getOntologyId())).orElse(null);

        if (null == promptConfigPo) {
            promptConfigPo = new OntologyPromptConfigPo();
            BeanUtils.copyProperties(promptConfigVo, promptConfigPo);
            promptConfigPo.setId(String.format("%s%s", promptConfigVo.getOwnerId(), promptConfigVo.getOntologyId()));
            promptConfigPo.setPromptType(PromptTypeEnum.NORMAL.getValue());
            promptConfigPo.setNormalPromptId(promptRepository.findDefaultPromptByType(promptConfigVo.getOntologyId(), promptConfigVo.getWorkspaceId(), PromptTypeEnum.NORMAL.getValue()));
            promptConfigPo.setOagPromptId(promptRepository.findDefaultPromptByType(promptConfigVo.getOntologyId(), promptConfigVo.getWorkspaceId(), PromptTypeEnum.OAG.getValue()));
            promptConfigRepository.save(promptConfigPo);
        }

        OntologyPromptConfigDto promptConfigDto = new OntologyPromptConfigDto();
        BeanUtils.copyProperties(promptConfigPo, promptConfigDto);
        promptConfigDto.setNormalPrompt(promptService.findById(promptConfigPo.getNormalPromptId()));
        promptConfigDto.setOagPrompt(promptService.findById(promptConfigPo.getOagPromptId()));
        return promptConfigDto;
    }

}

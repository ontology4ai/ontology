package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.po.OntologyPromptPo;
import com.asiainfo.repo.OntologyPromptRepository;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class OntologyDefaultPromptService {

    private final static int DEFAULT_TYPE = 1;

    private final static String DEFAULT_PROMPT_DESC = "由系统自动生成的默认提示词，适用于本体中不限定具体场景的通用性问答";

    @Autowired
    OntologyPromptRepository promptRepository;

    public void initDefaultPrompt(OntologyPo ontologyPo) {
        OntologyPromptPo promptPo = new OntologyPromptPo();
        promptPo.setId(StringUtil.genUuid(32));
        promptPo.setCreateTime(LocalDateTime.now());
        promptPo.setLastUpdate(promptPo.getCreateTime());
        promptPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        promptPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        promptPo.setDefaultType(DEFAULT_TYPE);
        promptPo.setPromptType(PromptTypeEnum.NORMAL.getValue());
        promptPo.setPromptDesc(DEFAULT_PROMPT_DESC);
        promptPo.setPromptName(ontologyPo.getOntologyLabel());
        promptPo.setOntologyId(ontologyPo.getId());
//        promptPo.setOwnerId(ontologyPo.getOwnerId());

        OntologyPromptPo oAgPromptPo = new OntologyPromptPo();
        oAgPromptPo.setId(StringUtil.genUuid(32));
        oAgPromptPo.setCreateTime(LocalDateTime.now());
        oAgPromptPo.setLastUpdate(oAgPromptPo.getCreateTime());
        oAgPromptPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        oAgPromptPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        oAgPromptPo.setDefaultType(DEFAULT_TYPE);
        oAgPromptPo.setPromptType(PromptTypeEnum.OAG.getValue());
        oAgPromptPo.setPromptDesc(DEFAULT_PROMPT_DESC);
        oAgPromptPo.setOntologyId(ontologyPo.getId());
        oAgPromptPo.setPromptName(ontologyPo.getOntologyLabel());
//        oAgPromptPo.setOwnerId(ontologyPo.getOwnerId());
        // 默认的提示词用户和工作空间如何设置

        List<OntologyPromptPo> list = new ArrayList<>();
        list.add(promptPo);
        list.add(oAgPromptPo);
        promptRepository.saveAllAndFlush(list);
    }

}

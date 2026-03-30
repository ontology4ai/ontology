package com.asiainfo.vo.operation;

import com.asiainfo.vo.search.BaseSearchVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class PromptConfigVo extends BaseSearchVo{

    private String ontologyId;

    private Integer promptType;

    private String normalPromptId;

    private String oagPromptId;
}

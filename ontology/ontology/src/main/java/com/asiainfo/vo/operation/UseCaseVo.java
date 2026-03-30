package com.asiainfo.vo.operation;

import com.asiainfo.vo.search.BaseSearchVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
public class UseCaseVo extends BaseSearchVo{

    private String id;

    private String question;

    private String expectedResult;

    private String ontologyId;

    private List<String> caseIdList;

    private String normalPromptName;

    private String oagPromptName;

    private Integer promptType;

    private String keyword;

    private Integer status;

    private String summary;
}

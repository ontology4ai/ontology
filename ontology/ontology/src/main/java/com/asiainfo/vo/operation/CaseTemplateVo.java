package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@EqualsAndHashCode(callSuper = false)
public class CaseTemplateVo {

    @NotBlank(message = "问题不能为空")
    private String question;

    @NotBlank(message = "预期结果不能为空")
    private String expectedResult;

    @NotBlank(message = "普通提示词名称不能为空")
    private String normalPromptName;

    @NotBlank(message = "OAG提示词名称不能为空")
    private String oagPromptName;
}

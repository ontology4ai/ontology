package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@EqualsAndHashCode(callSuper = false)
public class PromptTemplateVo {

    @NotBlank(message = "提示词内容不能为空")
    @Size(max = 100, message = "提示词名称长度不能超过100")
    private String promptName;

    @NotBlank(message = "提示词类型不能为空")
    private Integer promptType;

    @Size(max = 1000, message = "提示词描述长度不能超过1000")
    private String promptDesc;

    @NotBlank(message = "提示词内容不能为空")
    private String promptContent;
}

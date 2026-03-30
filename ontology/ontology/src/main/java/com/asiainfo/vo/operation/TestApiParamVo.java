package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@EqualsAndHashCode(callSuper = false)
public class TestApiParamVo {
    @NotBlank(message = "参数类型不能为空")
    @Size(max = 100, message = "参数类型长度不能超过100")
    private String paramType;

    @NotBlank(message = "参数名称不能为空")
    @Size(max = 100, message = "参数名称长度不能超过100")
    private String paramName;

    private String paramMethod;

    @NotBlank(message = "参数类别不能为空")
    @Size(max = 100, message = "参数类别长度不能超过100")
    private String paramMode;

    @NotBlank(message = "API参数是否必要不能为空")
    private Integer isRequired;

    private String defaultValue;

    private String paramValue;
}

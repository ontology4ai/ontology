package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * @Author weihf
 * @Date 2025/11/21
 * @Description
 */
@Data
public class ApiParamVo {
    @Size(max = 32, message = "API参数ID长度不能超过32")
    private String id;

    @Size(max = 32, message = "API ID长度不能超过32")
    private String apiId;

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

    private String paramDesc;

    @NotBlank(message = "API参数是否必要不能为空")
    private Integer isRequired;

    @NotBlank(message = "是否内置不能为空")
    private Integer isBuiltins;

    private String defaultValue;

    private Boolean isVirtual;
    private String parentId;
    private List<ApiParamVo> children;
    private String functionId;

    public ApiParamVo() {
        this.children = new ArrayList<>();
    }

    public ApiParamVo(String id, String apiId, String paramType, String paramName, String paramMethod,
            String paramMode, Integer isRequired, Integer isBuiltins, String paramDesc,
            String defaultValue, Boolean isVirtual, String parentId, String functionId) {
        this();
        this.id = id;
        this.apiId = apiId;
        this.paramType = paramType;
        this.paramName = paramName;
        this.paramMethod = paramMethod;
        this.paramMode = paramMode;
        this.isRequired = isRequired;
        this.isBuiltins = isBuiltins;
        this.paramDesc = paramDesc;
        this.defaultValue = defaultValue;
        this.isVirtual = isVirtual;
        this.parentId = parentId;
        this.functionId = functionId;
    }

}

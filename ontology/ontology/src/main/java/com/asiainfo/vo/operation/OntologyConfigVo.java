package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class OntologyConfigVo {
    private String id;

    /**
     * 配置字段键值
     */
    @NotBlank(message = "配置字段键值不能为空")
    @Size(max = 100, message = "配置字段键值不能超过100")
    private String configKey;

    /**
     * 配置字段值
     */
    @NotBlank(message = "配置字段值不能为空")
    private String configValue;

    private String configType;

    /**
     * 配置字段描述
     */
    private String description;

}

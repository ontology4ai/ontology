package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 本体接口属性对象
 */
@Data
@EqualsAndHashCode()
public class OntologyInterfaceAttributeVo {
    private String id;

    private String interfaceId;

    @Size(max = 100, message = "类型长度不能超过100")
    private String type;

    @NotBlank(message = "英文名不能为空")
    @Size(max = 100, message = "英文名长度不能超过100")
    private String name;

    @Size(max = 100, message = "中文名长度不能超过100")
    private String label;

    @Size(max = 500, message = "描述信息长度不能超过500")
    private String description;

    private Integer isRequired;

    private Integer operStatus;

}

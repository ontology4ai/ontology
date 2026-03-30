package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 本体接口对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyInterfaceVo extends BaseOperationVo {
    private String id;

    private String ontologyId;

    private String icon;

    @NotBlank(message = "英文名不能为空")
    @Size(max = 100, message = "英文名长度不能超过100")
    private String name;

    @Size(max = 100, message = "中文名长度不能超过100")
    private String label;

    @Size(max = 500, message = "描述信息长度不能超过500")
    private String description;

    private Integer status;

    private List<OntologyInterfaceAttributeVo> attributeList;
}

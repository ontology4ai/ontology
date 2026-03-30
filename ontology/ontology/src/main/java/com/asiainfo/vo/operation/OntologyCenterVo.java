package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 本体共享中心对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyCenterVo extends BaseOperationVo {
    private String id;

    private String parentId;

    @NotBlank(message = "centerName不能为空")
    @Size(max = 100, message = "英文名长度不能超过100")
    private String centerName;

    @Size(max = 100, message = "中文名长度不能超过100")
    private String centerLabel;

    @Size(max = 500, message = "描述信息长度不能超过500")
    private String centerDesc;

    private Integer status;

    private Integer isLeaf;
}

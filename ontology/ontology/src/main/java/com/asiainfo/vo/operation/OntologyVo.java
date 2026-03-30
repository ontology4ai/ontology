package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyVo extends BaseOperationVo {
    private String id;

    @NotBlank(message = "ontologyName不能为空")
    @Size(max = 100, message = "ontologyName长度不能超过100")
    private String ontologyName;

    @NotBlank(message = "ontologyLabel不能为空")
    @Size(max = 100, message = "ontologyLabel长度不能超过100")
    private String ontologyLabel;

    @Size(max = 500, message = "ontologyDesc长度不能超过500")
    private String ontologyDesc;

    private Integer status;

    /**
     * 推荐标记（1为推荐，0为不推荐）
     */
    private Integer isRecommend;
}

package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 关系标签
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyTagVo extends BaseOperationVo {

    private String id;

    @NotBlank(message = "标签中文不能为空")
    @Size(max = 100, message = "标签中文长度不能超过100")
    private String tagName;

    @NotBlank(message = "标签英文不能为空")
    @Size(max = 100, message = "标签英文长度不能超过100")
    private String tagLabel;

    @Size(max = 1000, message = "描述长度不能超过1000")
    private String tagDesc;
}

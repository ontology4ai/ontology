package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 本体对象
 */
@Data
public class OntologyObjectTypeGroupVo extends BaseOperationVo{

    @NotBlank(message = "objectGroupLabel")
    @Size(max = 100, message = "objectGroupLabel长度不能超过100")
    private String objectGroupLabel;

    private String ontologyId;
}
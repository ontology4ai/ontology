package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 本体对象
 */
@Data

public class SharedAttributeVo extends BaseOperationVo{


    @NotBlank(message = "ontologyId不能为空")
    private String ontologyId;

    @NotBlank(message = "attributeName不能为空")
    private String attributeName;

    @NotBlank(message = "attributeLabel不能为空")
    private String attributeLabel;

    private String attributeDesc;

    @NotEmpty(message = "attributeTypes不能为空，且至少有一个对象")
    private List<String> attributeTypes;

    private Integer status;
}

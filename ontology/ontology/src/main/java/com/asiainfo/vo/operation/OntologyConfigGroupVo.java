package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyConfigGroupVo extends BaseOperationVo {
    private String id;

    /**
     * 分组编码
     */
    @NotBlank(message = "分组编码不能为空")
    @Size(max = 100, message = "分组编码不能超过100")
    private String code;

    /**
     * 分组名称
     */
    @NotBlank(message = "分组名称不能为空")
    @Size(max = 200, message = "分组名称长度不能超过200")
    private String name;

    /**
     * 状态
     */
    private Integer status;

    @NotBlank(message = "分组类型不能为空")
    @Size(max = 10, message = "分组类型不能超过10")
    private String groupType;

    /**
     * 配置项
     */
    private List<OntologyConfigVo> configs;
}

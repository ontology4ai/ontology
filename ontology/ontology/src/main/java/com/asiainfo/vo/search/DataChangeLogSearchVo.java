package com.asiainfo.vo.search;

import javax.validation.constraints.NotBlank;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DataChangeLogSearchVo extends BaseSearchVo {
    @NotBlank(message = "跟踪ID不能为空")
    private String trackId;

    @NotBlank(message = "目标对象英文名称不能为空")
    private String objectTypeName;

    private String keyword;

    private String ontologyId;
}

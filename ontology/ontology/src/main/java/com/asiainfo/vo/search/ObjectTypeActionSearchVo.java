package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 动作类型
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ObjectTypeActionSearchVo extends BaseSearchVo {

    private String keyword;

    private Integer status;

    private String objectTypeId;

    private String ontologyId;

    private Boolean published;
}
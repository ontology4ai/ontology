package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ObjectTypeSearchVo extends BaseSearchVo {

    private String keyword;

    private Integer status;

    private String ontologyId;

    private String groupId;

    private Boolean published;

    private String interfaceId;
}
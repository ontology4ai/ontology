package com.asiainfo.vo.search;

import lombok.Data;

/**
 * 本体对象
 */
@Data
public class SharedAttributeSearchVo extends BaseSearchVo {

    private String keyword;

    private Integer status;

    private String ontologyId;
}
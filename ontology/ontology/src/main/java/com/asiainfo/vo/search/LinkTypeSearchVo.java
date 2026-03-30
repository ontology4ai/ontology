package com.asiainfo.vo.search;

import lombok.Data;

/**
 * 本体对象
 */
@Data
public class LinkTypeSearchVo extends BaseSearchVo {

    private String keyword;

    private Integer status;

    private String ontologyId;

    private Boolean published;
}
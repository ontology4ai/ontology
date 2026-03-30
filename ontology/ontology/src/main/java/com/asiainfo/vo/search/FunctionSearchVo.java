package com.asiainfo.vo.search;

import lombok.Data;

/**
 * 本体对象
 */
@Data
public class FunctionSearchVo extends BaseSearchVo {
    private String ontologyId;

    private String ontologyName;

    private Integer status;
}
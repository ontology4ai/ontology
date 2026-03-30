package com.asiainfo.vo.search;

import lombok.Data;

@Data
public class OntologyConfigGroupSearchVo extends BaseSearchVo {
    private String code;

    private String name;

    private Integer status;
}

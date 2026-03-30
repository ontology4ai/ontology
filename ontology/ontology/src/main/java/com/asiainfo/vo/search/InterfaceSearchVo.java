package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;

/**
 * 接口对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class InterfaceSearchVo extends BaseSearchVo {

    private String ontologyId;

    private String interfaceId;

    private Integer status;

    private String keyword;

}

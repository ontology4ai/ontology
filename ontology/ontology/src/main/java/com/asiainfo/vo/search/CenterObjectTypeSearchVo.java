package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CenterObjectTypeSearchVo extends BaseSearchVo {

    @NotBlank(message = "共享中心id不能为空")
    private String centerId;

}
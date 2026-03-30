package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;

/**
 * 共享中心对象类型
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CenterObjectTypeUpdateVo extends BaseSearchVo {

    @NotBlank(message = "对象类型id不能为空")
    private String objectTypeId;

    @NotBlank(message = "对象类型状态不能为空")
    private Integer status;

}
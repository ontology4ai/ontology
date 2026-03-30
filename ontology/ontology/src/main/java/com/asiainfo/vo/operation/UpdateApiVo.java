package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@EqualsAndHashCode(callSuper = false)
public class UpdateApiVo extends ApiVo {

    @NotBlank(message = "API ID不能为空")
    @Size(max = 100, message = "API ID长度不能超过100")
    private String id;
}

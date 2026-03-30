package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class ApiFunctionVo {
    @Size(max = 32, message = "函数ID长度不能超过32")
    private String id;

    @NotBlank(message = "函数名称不能为空")
    @Size(max = 100, message = "函数名称长度不能超过100")
    private String functionName;
    private String functionLabel;
    private String functionParams;
}

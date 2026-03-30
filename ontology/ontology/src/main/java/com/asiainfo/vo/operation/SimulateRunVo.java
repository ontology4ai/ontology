package com.asiainfo.vo.operation;

import lombok.Data;

import javax.validation.constraints.NotBlank;

import java.util.Map;

@Data
public class SimulateRunVo {

    @NotBlank(message = "本体名称不能为空")
    private String ontologyName;

    @NotBlank(message = "动作名称不能为空")
    private String actionName;

    @NotBlank(message = "对象名称不能为空")
    private String objectName;

    private String eventName;

    private Map<String, Object> params;
}

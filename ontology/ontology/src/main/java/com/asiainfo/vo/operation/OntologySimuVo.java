package com.asiainfo.vo.operation;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import lombok.Data;

@Data
public class OntologySimuVo extends BaseOperationVo {

    private String id;

    @NotBlank(message = "仿真场景英文名称不能为空")
    @Size(max = 100, message = "仿真场景英文名称长度不能超过100")
    private String sceneName;

    @NotBlank(message = "仿真场景中文名称不能为空")
    @Size(max = 100, message = "仿真场景中文名称长度不能超过100")
    private String sceneLabel;

    private String description;

    @NotBlank(message = "本体管理器id不能为空")
    @Size(max = 32, message = "本体管理器id长度不能超过32")
    private String ontologyId;
}

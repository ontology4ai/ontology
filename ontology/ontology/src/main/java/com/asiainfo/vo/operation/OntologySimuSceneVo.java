package com.asiainfo.vo.operation;

import lombok.Data;

@Data
public class OntologySimuSceneVo extends OntologySimuVo {

    // 本体英文名称
    private String ontologyName;
    // 本体中文名称
    private String ontologyLabel;
    // 画布ID
    private String canvasId;
    // 画布名称
    private String canvasName;
    // 状态，1为启用，0为禁用
    private Integer status;

}

package com.asiainfo.vo.operation;

import javax.validation.constraints.NotBlank;

import com.alibaba.fastjson.JSONObject;

import lombok.Data;

import java.util.List;

@Data
public class OntologyCanvasVo extends BaseOperationVo {

    private String id;

    private String canvasName;
    private String sceneId;
    @NotBlank(message = "画布布局json不能为空")
    private JSONObject canvasLayout;

    private String description;

    private List<OntologyCanvasNodeVo> nodes;
}

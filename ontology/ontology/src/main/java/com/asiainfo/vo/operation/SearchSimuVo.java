package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchSimuVo extends BaseOperationVo {
    private String keyword;
    private String sceneLabel;
    private String sceneName;
    private String ontologyName;
    private String ontologyLabel;
    private Integer status;
    private Integer page;
    private Integer limit;
}

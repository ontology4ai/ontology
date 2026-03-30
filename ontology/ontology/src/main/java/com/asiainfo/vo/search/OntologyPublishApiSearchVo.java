package com.asiainfo.vo.search;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import com.asiainfo.vo.operation.BaseOperationVo;
import lombok.Data;

@ApiModel("OntologyPublishApiSearchVo")
@Data
public class OntologyPublishApiSearchVo extends BaseSearchVo {

    @ApiModelProperty("服务类型：action/logic/global")
    private String serviceType;

    @ApiModelProperty("服务英文名")
    private String name;

    @ApiModelProperty("服务中文名")
    private String label;

    @ApiModelProperty("所属本体id")
    private String ontologyId;

    @ApiModelProperty("服务api地址")
    private String apiPath;


    @ApiModelProperty("服务描述")
    private String comment;

}
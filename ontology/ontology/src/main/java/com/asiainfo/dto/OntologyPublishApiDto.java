package com.asiainfo.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.persistence.Column;

@ApiModel("OntologyPublishApiDto")
@Data
public class OntologyPublishApiDto extends BaseDto {

    @ApiModelProperty("主键")
    private String id;

    @ApiModelProperty("服务类型：action/logic/global")
    private String serviceType;

    @ApiModelProperty("服务的对应id")
    private String serviceId;

    @ApiModelProperty("服务英文名")
    private String name;

    @ApiModelProperty("服务中文名")
    private String label;

    @ApiModelProperty("所属本体id")
    private String ontologyId;

    @ApiModelProperty("所属本体id")
    private OntologyDto ontologyDto;

    @ApiModelProperty("服务api地址")
    private String apiPath;

    @ApiModelProperty("入参")
    private String inputParams;

    @ApiModelProperty("服务描述")
    private String comment;

    @ApiModelProperty("mcp地址")
    private String mcpServerPath;

    @ApiModelProperty("mcp工具名")
    private String mcpToolName;

    @ApiModelProperty("方法")
    private String method;

    @ApiModelProperty("入参")
    private String outputParams;

    @ApiModelProperty("请求示例")
    private String rquestDemo;
}
package com.asiainfo.po;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.io.Serializable;

@ApiModel("OntologyPublishApiPo")
@Entity
@Table(name = "ontology_publish_api")
@Data
@EntityListeners(AuditingEntityListener.class)
public class OntologyPublishApiPo extends BasePo {

    @Id
    @Column(name = "id", length = 255, nullable = false)
    @ApiModelProperty("主键")
    private String id;

    @Column(name = "service_type", length = 255)
    @ApiModelProperty("服务类型：action/logic/global")
    private String serviceType;

    @Column(name = "service_id", length = 255)
    @ApiModelProperty("服务的对应id")
    private String serviceId;

    @Column(name = "name", length = 255)
    @ApiModelProperty("服务英文名")
    private String name;

    @Column(name = "label", length = 255)
    @ApiModelProperty("服务中文名")
    private String label;

    @Column(name = "ontology_id", length = 255)
    @ApiModelProperty("所属本体id")
    private String ontologyId;

    @Column(name = "api_path", length = 255)
    @ApiModelProperty("服务api地址")
    private String apiPath;

    @Column(name = "input_params", columnDefinition = "text")
    @ApiModelProperty("入参")
    private String inputParams;

    @Column(name = "comment", columnDefinition = "text")
    @ApiModelProperty("服务描述")
    private String comment;

    @Column(name = "mcp_server_path", length = 255)
    @ApiModelProperty("mcp地址")
    private String mcpServerPath;

    @Column(name = "mcp_tool_name", length = 255)
    @ApiModelProperty("mcp工具名")
    private String mcpToolName;

    @Column(name = "method", length = 255)
    @ApiModelProperty("方法")
    private String method;

    @Column(name = "output_params", columnDefinition = "text")
    @ApiModelProperty("入参")
    private String outputParams;

}
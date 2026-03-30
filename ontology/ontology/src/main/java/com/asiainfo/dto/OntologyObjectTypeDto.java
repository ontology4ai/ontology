package com.asiainfo.dto;

import com.asiainfo.vo.operation.ApiVo;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import javax.persistence.Column;
import java.util.List;

/**
 * 动作类型
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeDto extends BaseDto {

    private String id;
    private String ontologyId;
    private String objectTypeName;
    private String objectTypeLabel;
    private String objectTypeDesc;
    private String dsId;
    private String dsName;
    private String dsSchema;
    private String tableName;
    private String icon;
    private String buildType;
    private String repoName;
    private String fileName;
    private String functionCode;
    private String inputParam;
    private String outputParam;
    private String ownerId;
    private String owner;
    private String codeUrl;

    private Integer dsType;
    private String customSql;

    private String interfaceId;
    private String interfaceIcon;
    private String interfaceLabel;

    private List<OntologyObjectTypeGroupDto> groups;

    private List<OntologyObjectTypeAttributeDto> attributes;

    private List<OntologyObjectTypeActionDto> actions;

    private List<OntologyLinkTypeDto> linkTypes;

    private ApiVo apiInfo;

}
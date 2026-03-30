package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeExploreDto extends BaseDto {

    private String id;

    private String ontologyId;

    private String objectTypeName;

    private String objectTypeLabel;

    private String objectTypeDesc;

    private String ownerId;

    private String dsId;

    private String dsSchema;

    private String tableName;

    private Integer dsType;

    private String customSql;

    private String icon;

    private Long instanceNum;

    private OntologyDto ontology;

    private List<OntologyObjectTypeGroupDto> groups;

    private List<OntologyObjectTypeAttributeDto> attributes;

    private List<OntologyObjectTypeActionDto> actions;

    private List<OntologyObjectTypeExploreDto> linkObjectTypes;
}
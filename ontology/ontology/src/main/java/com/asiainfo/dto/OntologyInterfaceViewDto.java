package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体接口
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyInterfaceViewDto extends BaseDto {

    private String id;

    private String ontologyId;

    private String icon;

    private String name;

    private String label;

    private String description;

    private String ownerId;

    private String workspaceId;

    private List<OntologyInterfaceAttributeDto> attributeList;

    private List<OntologyObjectTypeDto> extendedList;

    private List<OntologyInterfaceConstraintDto> constraintList;

}
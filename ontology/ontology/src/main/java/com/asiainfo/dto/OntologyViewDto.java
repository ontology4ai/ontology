package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyViewDto extends BaseDto {

    private String id;

    private String ontologyName;

    private String ontologyLabel;

    private List<OntologyObjectTypeDto> objectTypes;

    private List<OntologySharedAttributeDto> sharedAttributes;

    private List<OntologyLinkTypeDto> linkTypes;

    private List<OntologyObjectTypeActionDto> actionDtos;

    private List<LogicTypeDto> logicTypes;

    private List<OntologyInterfaceDto> interfaces;

    private Integer promptTotal;

    private String ontologyDesc;

    private String workspaceId;

    private String owner;

    private Integer isRecommend;


}

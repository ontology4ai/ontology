package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 连接对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyLinkTypeDto extends BaseDto{

    private String id;

    private String ontologyId;

    private String sourceName;

    private String sourceLabel;

    private String targetName;

    private String targetLabel;

    private String sourceObjectTypeId;

    private String sourceAttributeId;

    private String targetObjectTypeId;

    private String targetAttributeId;

    private OntologyObjectTypeDto sourceObjectType;

    private OntologyObjectTypeDto targetObjectType;

    private OntologyObjectTypeAttributeDto sourceAttribute;

    private OntologyObjectTypeAttributeDto targetAttribute;

    private Integer linkType;

    private Integer linkMethod;

    private String middleDsId;

    private String middleDsName;

    private String middleDsLabel;

    private String middleDsSchema;

    private String middleTableName;

    private String middleSourceField;

    private String middleTargetField;

    private String ownerId;

    private List<String> sourceTag;

    private List<String> targetTag;

    private boolean isMatchConstraint;

    private String constraintRelation;
}

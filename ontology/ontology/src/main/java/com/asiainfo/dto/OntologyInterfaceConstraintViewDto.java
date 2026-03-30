package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;


/**
 * 本体接口约束详情
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyInterfaceConstraintViewDto extends BaseDto {

    private String id;

    private String interfaceId;

    private Integer constraintType;

    private String constraintRelation;

    private String objectTypeId;

    private String objectTypeName;

    private List<OntologyLinkTypeDto> extendedLinkList;

}
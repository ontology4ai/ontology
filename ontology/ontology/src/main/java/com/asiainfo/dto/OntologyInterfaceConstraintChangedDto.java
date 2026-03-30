package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体接口变更
 */
@Data
@EqualsAndHashCode()
public class OntologyInterfaceConstraintChangedDto {

    private String id;

    private String interfaceId;

    private Integer constraintType;

    private String constraintRelation;

    private String objectTypeId;

    private Integer status;



}
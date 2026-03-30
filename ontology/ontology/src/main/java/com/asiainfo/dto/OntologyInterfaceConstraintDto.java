package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;


/**
 * 本体接口约束
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyInterfaceConstraintDto extends BaseDto {

    private String id;

    private String interfaceId;

    private String interfaceIcon;

    private String interfaceName;

    private String interfaceLabel;

    private Integer constraintType;

    private String constraintRelation;

    private String objectTypeId;

    private String objectTypeName;

    private String objectTypeLabel;

    private String objectTypeIcon;

    private Integer status;

    private Integer operStatus;

}
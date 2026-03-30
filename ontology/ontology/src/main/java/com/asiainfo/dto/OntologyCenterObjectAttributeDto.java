package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体共享中心对象类型属性
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyCenterObjectAttributeDto extends BaseDto {

    private String id;

    private String objectTypeId;

    private String fieldName;

    private String fieldType;

    private String attributeName;

    private String attributeDesc;

    private String attributeInst;

    private String sharedAttributeId;

    private int isPrimaryKey;

    private int isTitle;

}
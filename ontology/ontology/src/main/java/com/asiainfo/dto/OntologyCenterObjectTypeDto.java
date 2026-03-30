package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体共享中心对象类型
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyCenterObjectTypeDto extends BaseDto {

    private String id;

    private String centerId;

    private String ontologyId;

    private String objectTypeName;

    private String objectTypeLabel;

    private String objectTypeDesc;

    private String ownerId;

    private String dsId;

    private String dsSchema;

    private String tableName;

    private String icon;

    private List<OntologyCenterObjectAttributeDto> attributeList;

}
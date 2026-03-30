package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体接口属性变更
 */
@Data
@EqualsAndHashCode()
public class OntologyInterfaceAttributeChangedDto {

    private String id;

    private String interfaceId;

    private Integer operStatus;

    private OntologyInterfaceAttributeDto attributeDto;

    private OntologyInterfaceAttributeDto originAttributeDto;

}
package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体接口变更
 */
@Data
@EqualsAndHashCode()
public class OntologyInterfaceChangedDto {

    private String id;

    private String ontologyId;

    private String icon;

    private String name;

    private String label;

    private List<OntologyInterfaceAttributeChangedDto> attributeChangedList;

    private List<OntologyObjectTypeDto> affectExtendedList;

}
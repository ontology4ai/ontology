package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 本体接口属性
 */
@Data
@EqualsAndHashCode()
public class OntologyInterfaceAttributeDto {

    private String id;

    private String interfaceId;

    private String type;

    private String name;

    private String label;

    private String description;

    private Integer isRequired;

}
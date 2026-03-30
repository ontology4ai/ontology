package com.asiainfo.dto;

import lombok.Data;

/**
 * @Author luchao
 * @Date 2025/8/25
 * @Description
 */
@Data
public class OntologyObjectTypeActionParamDto {
    private String id;
    private String attributeId;
    private String attributeName;
    private String fieldName;
    private String fieldType;
    private Integer isPrimaryKey;
    private Integer paramType;
    private String paramName;
    private String paramValue;
    private Integer paramRequired;
}

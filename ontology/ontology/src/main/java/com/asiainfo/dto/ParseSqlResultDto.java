package com.asiainfo.dto;

import lombok.Data;

import java.util.List;

@Data
public class ParseSqlResultDto {

    private Boolean status;

    private String message;

    private String tableName;

    private String customSql;

    private List<OntologyObjectCustomAttributeDto> attributeList;
}

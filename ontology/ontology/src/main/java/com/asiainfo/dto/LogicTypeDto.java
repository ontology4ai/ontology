package com.asiainfo.dto;

import com.asiainfo.vo.operation.ApiVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 逻辑类型
 *
 * @author hulin
 * @since 2025-09-25
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class LogicTypeDto extends BaseDto {
    private String logicTypeName;
    private String logicTypeLabel;
    private String logicTypeDesc;
    private String ontologyId;
    private String ontologyLabel;
    private OntologyDto ontology;
    private String buildType;
    private String repoName;
    private String fileName;
    private String functionCode;
    private String inputParam;
    private String outputParam;
    private String ownerId;
    private String owner;
    private String codeUrl;
    private String storagePath;
    private List<OntologyObjectTypeDto> objectTypeList;
    private ApiVo apiInfo;
}

package com.asiainfo.dto;

import com.asiainfo.po.BasePo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体对象图谱展示
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeGraphDto extends BasePo {


    private String id;

    private String ontologyId;

    private String objectTypeName;

    private String objectTypeLabel;

    private String objectTypeDesc;

    private String ownerId;

    private Integer status;

    private String dsSchema;

    private String primaryKey;

    private List<OntologyObjectTypeAttributeDto> typeAttributes;
}
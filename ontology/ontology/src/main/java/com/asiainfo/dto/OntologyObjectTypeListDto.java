package com.asiainfo.dto;

import com.asiainfo.vo.operation.ApiVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 对象类型
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeListDto extends BaseDto {
    private String id;

    private String ontologyId;

    private String objectTypeName;

    private String objectTypeLabel;

    private String objectTypeDesc;

    private String ownerId;

    private String dsId;

    private String icon;

    private String interfaceId;

    private String interfaceIcon;

    private String interfaceLabel;

    private List<OntologyObjectTypeGroupDto> groups;

    private ApiVo apiInfo;
}
package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyLinkTypeVo extends BaseOperationVo {

    @NotBlank(message = "ontologyId不能为空")
    private String ontologyId;

    private String sourceName;

    private String sourceLabel;

    private String targetName;

    private String targetLabel;

    private List<String> sourceTag;

    private List<String> targetTag;

    @NotBlank(message = "sourceObjectTypeId不能为空")
    private String sourceObjectTypeId;

    @NotBlank(message = "targetObjectTypeId不能为空")
    private String targetObjectTypeId;

    @NotBlank(message = "sourceAttributeId不能为空")
    private String sourceAttributeId;

    @NotBlank(message = "targetAttributeId不能为空")
    private String targetAttributeId;

    @NotBlank(message = "linkType不能为空")
    private Integer linkType;

    private Integer linkMethod;

    private String middleDsId;

    private String middleDsSchema;

    private String middleTableName;

    private String middleSourceField;

    private String middleTargetField;

    private Integer status;

    private List<String> tagIds;

    private List<String> ids;
}

package com.asiainfo.vo.operation;

import com.asiainfo.po.OntologyObjectTypeGroupPo;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/22
 * @Description
 */

@Data
@EqualsAndHashCode(callSuper = true)
public class ObjectTypeVo extends BaseOperationVo{

    @NotBlank(message = "ontologyId不能为空")
    private String ontologyId;

    @NotBlank(message = "objectTypeName不能为空")
    private String objectTypeName;

    @NotBlank(message = "objectTypeLabel不能为空")
    private String objectTypeLabel;

    private String objectTypeDesc;

    private String ownerId;

    private String dsId;

    private String dsName;

    private String dsSchema;

    private String tableName;

    private Integer status;

    private List<String> groupIds;

    private List<ObjectTypeActionVo> actions;

    private List<String> actionUsers;

    private String icon;

    private List<AttributeVo> attributes;

    private List<String> ids;

    private String interfaceId;

    private String linkTypeId;

    private String apiId;

    private Integer dsType;

    private String customSql;
}

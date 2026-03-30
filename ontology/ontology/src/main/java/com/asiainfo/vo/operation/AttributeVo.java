package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import javax.persistence.Column;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/22
 * @Description
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AttributeVo extends BaseOperationVo{

    private String id;

    private String fieldName;

    private String fieldType;

    private String attributeName;

    private String attributeLabel;

    private String sharedAttributeId;

    private Integer isPrimaryKey;

    private Integer isTitle;

    private Integer status;

    private String attributeDesc;

    private String attributeInst;

    private Integer interfaceType;

    private String interfaceAttrId;

    private List<String> ids;
}

package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 共享中心对象属性
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_center_object_attribute")
@EntityListeners(AuditingEntityListener.class)
public class OntologyCenterObjectAttributePo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("对象类型属性唯一id")
    private String id;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型id")
    private String objectTypeId;

    @Column(name = "field_name", length = 100)
    @Comment("本体对象类型字段名")
    private String fieldName;

    @Column(name = "field_type", length = 100)
    @Comment("本体对象类型字段类型")
    private String fieldType;

    @Column(name = "attribute_name", length = 100)
    @Comment("本体对象类型属性名")
    private String attributeName;

    @Column(name = "attribute_desc", length = 100)
    @Comment("本体对象类型描述")
    private String attributeDesc;

    @Column(name = "attribute_inst", length = 100)
    @Comment("本体对象类型英文名")
    private String attributeInst;


    @Column(name = "shared_attribute_id", length = 100)
    @Comment("本体对象类型属性名")
    private String sharedAttributeId;

    /**
     * 状态，1为是，0为否
     */
    @Column(name = "is_primary_key")
    @Comment("状态，1为是，0为否")
    private int isPrimaryKey;

    /**
     * 状态，1为是，0为否
     */
    @Column(name = "is_title")
    @Comment("状态，1为是，0为否")
    private int isTitle;


    @Column(name = "status")
    @Comment("1启用/0禁用")
    private Integer status;
}
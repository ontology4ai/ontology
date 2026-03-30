package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.util.List;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_link_type")
@EntityListeners(AuditingEntityListener.class)
public class OntologyLinkTypePo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("连接类型唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "source_name", length = 100)
    @Comment("源连接类型英文名")
    private String sourceName;

    @Column(name = "source_label", length = 100)
    @Comment("源连接类型中文名")
    private String sourceLabel;

    @Column(name = "target_name", length = 100)
    @Comment("目标连接类型英文名")
    private String targetName;

    @Column(name = "target_label", length = 100)
    @Comment("目标连接类型中文名")
    private String targetLabel;

    @Column(name = "source_object_type_id", length = 100)
    @Comment("源对象类型id")
    private String sourceObjectTypeId;

    @Column(name = "target_object_type_id", length = 100)
    @Comment("目标对象类型id")
    private String targetObjectTypeId;

    @Column(name = "source_attribute_id", length = 100)
    @Comment("源属性id")
    private String sourceAttributeId;

    @Column(name = "target_attribute_id", length = 100)
    @Comment("目标属性id")
    private String targetAttributeId;

    @Column(name = "link_type", length = 100)
    @Comment("连接类型分类")
    private Integer linkType;

    @Column(name = "link_method", length = 100)
    @Comment("连接类型分类")
    private Integer linkMethod;

    @Column(name = "middle_ds_id", length = 100)
    @Comment("中间数据源id")
    private String middleDsId;

    @Column(name = "middle_ds_schema", length = 100)
    @Comment("中间数据源schema")
    private String middleDsSchema;

    @Column(name = "middle_table_name", length = 100)
    @Comment("中间数据源表名")
    private String middleTableName;

    @Column(name = "middle_source_field", length = 100)
    @Comment("源关联字段")
    private String middleSourceField;

    @Column(name = "middle_target_field", length = 100)
    @Comment("目标关联字段")
    private String middleTargetField;

    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

//    @ManyToMany(cascade =  {CascadeType.PERSIST})
//    @JoinTable(
//            name = "ontology_link_type_tag",
//            joinColumns = @JoinColumn(name = "link_type_id"),
//            inverseJoinColumns = @JoinColumn(name = "tag_id"),
//            foreignKey = @ForeignKey(name = "none", value=ConstraintMode.NO_CONSTRAINT),
//            inverseForeignKey = @ForeignKey(name = "none", value = ConstraintMode.NO_CONSTRAINT)
//    )
//    private List<OntologyTagPo> tags;
}

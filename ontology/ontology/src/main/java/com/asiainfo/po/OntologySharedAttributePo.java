package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_shared_attribute")
@EntityListeners(AuditingEntityListener.class)
public class OntologySharedAttributePo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("共享属性唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "attribute_name", length = 100)
    @Comment("共享属性名称")
    private String attributeName;

    @Column(name = "attribute_label", length = 100)
    @Comment("共享属性中文名")
    private String attributeLabel;

    @Column(name = "attribute_desc", length = 100)
    @Comment("共享属性中文名")
    private String attributeDesc;


    @Column(name = "attribute_types", length = 255)
    @Comment("共享属性类型")
    private String attributeTypes;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

}
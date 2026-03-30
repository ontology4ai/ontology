package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 接口约束对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_interface_constraint")
@EntityListeners(AuditingEntityListener.class)
public class OntologyInterfaceConstraintPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("接口唯一id")
    private String id;

    @Column(name = "interface_id", length = 32)
    @Comment("本体接口id")
    private String interfaceId;

    /**
     * 接口约束类型
     */
    @Column(name = "constraint_type")
    @Comment("接口约束类型")
    private Integer constraintType;

    /**
     * 接口约束关系
     */
    @Column(name = "constraint_relation", length = 100)
    @Comment("接口约束关系")
    private String constraintRelation;

    /**
     * 约束的本体类型对象id
     */
    @Column(name = "object_type_id", length = 100)
    @Comment("本体类型对象id")
    private String objectTypeId;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

}
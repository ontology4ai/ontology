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
@Table(name = "ontology_object_type_group")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypeGroupPo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("对象类型分组唯一id")
    private String id;


    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "object_group_label", length = 100)
    @Comment("本体对象类型名")
    private String objectGroupLabel;

    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;


//    @ManyToMany(mappedBy = "groups", cascade = {CascadeType.PERSIST})
//    private List<OntologyObjectTypePo> objectTypes;
}
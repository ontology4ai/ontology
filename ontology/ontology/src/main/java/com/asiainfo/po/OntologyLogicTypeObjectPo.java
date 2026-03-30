package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 逻辑类型关联对象类型
 *
 * @author hulin
 * @since 2025-09-25
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_logic_type_object")
@EntityListeners(AuditingEntityListener.class)
public class OntologyLogicTypeObjectPo {
    @Id
    @Column(name = "id", length = 100)
    @Comment("主键ID")
    private String id;

    @Column(name = "logic_type_id", length = 100)
    @Comment("逻辑类型ID")
    private String logicTypeId;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型ID")
    private String objectTypeId;

    @Column(name = "ontology_id", length = 100)
    @Comment("所属本体ID")
    private String ontologyId;
}

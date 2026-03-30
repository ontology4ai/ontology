package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 * 动作类型授权用户
 *
 * @author hulin
 * @since 2025-09-12
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_object_type_action_user")
public class OntologyObjectTypeActionUserPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "action_id",  length = 100)
    @Comment("动作类型ID")
    private String actionId;

    @Column(name = "user_id", length = 100)
    @Comment("用户ID")
    private String userId;
}

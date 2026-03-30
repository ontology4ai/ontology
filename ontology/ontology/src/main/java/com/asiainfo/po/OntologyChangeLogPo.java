package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体对象变更日志
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_change_log")
@EntityListeners(AuditingEntityListener.class)
public class OntologyChangeLogPo extends BasePo {

    @Id
    @Column(name = "id", length = 32)
    @Comment("连接类型唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    @Column(name = "change_type", length = 200)
    @Comment("变更类型")
    private String changeType;

    @Column(name = "change_target_type", length = 100)
    @Comment("变更对象类型")
    private String changeTargetType;

    @Column(name = "change_target_id", length = 100)
    @Comment("变更对象标识")
    private String changeTargetId;

    @Column(name = "change_target_desc", length = 200)
    @Comment("变更对象描述")
    private String changeTargetDesc;

}

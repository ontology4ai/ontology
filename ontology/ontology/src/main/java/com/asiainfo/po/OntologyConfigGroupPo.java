package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_config_group")
@EntityListeners(AuditingEntityListener.class)
public class OntologyConfigGroupPo extends BasePo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键")
    private String id;

    /**
     * 分组编码
     */
    @Column(name = "code", length = 100)
    @Comment("分组编码")
    private String code;

    /**
     * 分组名称
     */
    @Column(name = "name", length = 200)
    @Comment("分组名称")
    private String name;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    /**
     * 分组类型：aap/dify
     */
    @Column(name = "group_type", length = 10)
    @Comment("分组类型")
    private String groupType;
}

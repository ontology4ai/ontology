package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 *
 *
 * @author hulin
 * @since 2025-09-18
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_code_repo")
@EntityListeners(AuditingEntityListener.class)
public class OntologyCodeRepoPo extends BasePo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("仓库ID")
    private String id;

    @Column(name = "repo_name", length = 256)
    @Comment("仓库名称")
    private String repoName;

    @Column(name = "repo_type", length = 32)
    @Comment("仓库类型/语言：python - Python；rest - Rest API")
    private String repoType;

    @Column(name = "ontology_id", length = 64)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "repo_address", length = 256)
    @Comment("仓库地址")
    private String repoAddress;

    @Column(name = "owner_id", length = 64)
    @Comment("拥有者")
    private String ownerId;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;
}

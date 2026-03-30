package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体版本
 *
 * @author hulin
 * @since 2025-09-19
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_version")
@EntityListeners(AuditingEntityListener.class)
public class OntologyVersionPo extends BasePo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("版本ID")
    private String id;

    @Column(name = "version_name", length = 100)
    @Comment("版本名称/版本号")
    private String versionName;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "owner_id", length = 100)
    @Comment("发布人")
    private String ownerId;

    @Column(name = "latest")
    @Comment("最新版本：0 - 最新版本，1 - 历史版本")
    private Integer latest;
}

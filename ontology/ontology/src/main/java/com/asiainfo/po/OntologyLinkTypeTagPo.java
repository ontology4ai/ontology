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
 * 连接类型标签
 *
 * @author hulin
 * @since 2025-09-09
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_link_type_tag")
public class OntologyLinkTypeTagPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("连接类型标签唯一id")
    private String id;

    @Column(name = "link_type_id", length = 32)
    @Comment("连接类型id")
    private String linkTypeId;

    @Column(name = "tag_id", length = 32)
    @Comment("标签id")
    private String tagId;

    @Column(name = "link_direct", length = 10)
    @Comment("连接方向: source - 来源, target - 目标")
    private String linkDirect;
}

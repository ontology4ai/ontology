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
@Table(name = "ontology_tag")
@EntityListeners(AuditingEntityListener.class)
public class OntologyTagPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("标签唯一id")
    private String id;

    @Column(name = "tag_name", length = 100)
    @Comment("标签名")
    private String tagName;


    @Column(name = "tag_label", length = 100)
    @Comment("标签中文名")
    private String tagLabel;

    @Column(name = "tag_desc", length = 1000)
    @Comment("描述")
    private String tagDesc;
}

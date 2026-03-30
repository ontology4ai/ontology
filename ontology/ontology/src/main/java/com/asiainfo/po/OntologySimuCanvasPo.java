package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_simu_canvas")
@EntityListeners(AuditingEntityListener.class)
public class OntologySimuCanvasPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("画布id")
    private String id;

    @Column(name = "canvas_name", length = 100)
    @Comment("画布名称")
    private String canvasName;

    @Column(name = "description", length = 1000)
    @Comment("画布描述")
    private String description;

    @Lob
    @Column(name = "canvas_layout", columnDefinition = "LONGTEXT")
    @Comment("画布布局")
    private String canvasLayout;

    @Column(name = "owner_id", length = 64)
    @Comment("创建/修改用户")
    private String ownerId;

}
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
@Table(name = "ontology_canvas_node")
@EntityListeners(AuditingEntityListener.class)
public class OntologyCanvasNodePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("节点id")
    private String id;

    @Column(name = "canvas_id", length = 32)
    @Comment("画布id")
    private String canvasId;

    @Column(name = "node_type", length = 10)
    @Comment("节点类型:object-对象，logic-逻辑，action-动作")
    private String nodeType;

    @Column(name = "element_id", length = 32)
    @Comment("节点所使用元素id：对象id/逻辑id/动作id")
    private String elementId;

    @Column(name = "data_status")
    @Comment("初始化数据状态，1-已初始化数据，0-未初始化")
    private Integer dataStatus;

}
package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * Dify graph 对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_dify_graph")
@EntityListeners(AuditingEntityListener.class)
public class DifyGraphPo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 100)
    @Comment("dify任务id")
    private String id;

    @Column(name = "conversation_id", length = 100)
    @Comment("dify会话id")
    private String conversationId;

    @Column(name = "graph", columnDefinition = "LONGTEXT")
    @Comment("图谱信息")
    private String graph;
}
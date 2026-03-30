package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 本体对象历史表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_manage_agent")
@EntityListeners(AuditingEntityListener.class)
public class OntologyAgentPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "agent_id", length = 100)
    @Comment("智能体ID")
    private String agentId;


}
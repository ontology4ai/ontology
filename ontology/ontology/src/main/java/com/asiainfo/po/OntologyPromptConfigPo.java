package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 提示词配置对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_prompt_config")
@EntityListeners(AuditingEntityListener.class)
public class OntologyPromptConfigPo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 200)
    @Comment("主键ID")
    private String id;

    /**
     * 创建用户
     */
    @Column(name = "owner_id", length = 100)
    @Comment("创建用户")
    private String ownerId;

    /**
     * 工作空间
     */
    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间")
    private String workspaceId;

    /**
     * 本体id
     */
    @Column(name = "ontology_id", length = 100)
    @Comment("本体id")
    private String ontologyId;

    /**
     * 提示词类型: 1-OAG提示词, 0-普通提示词
     */
    @Column(name = "prompt_type")
    @Comment("提示词类型: 1-OAG提示词, 0-普通提示词")
    private Integer promptType;

    /**
     * 普通提示词ID
     */
    @Column(name = "normal_prompt_id", length = 32)
    @Comment("普通提示词ID")
    private String normalPromptId;

    /**
     * OAG提示词ID
     */
    @Column(name = "oag_prompt_id", length = 32)
    @Comment("OAG提示词ID")
    private String oagPromptId;
}
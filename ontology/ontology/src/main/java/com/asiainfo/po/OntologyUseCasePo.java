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
 * use case 对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_use_case")
@EntityListeners(AuditingEntityListener.class)
public class OntologyUseCasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键id")
    private String id;

    /**
     * 用例问题
     */
    @Column(name = "question", columnDefinition = "TEXT")
    @Comment("用例问题")
    private String question;

    /**
     * 预期结果
     */
    @Column(name = "expected_result", columnDefinition = "TEXT")
    @Comment("预期结果")
    private String expectedResult;

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

    /**
     * 普通提示词
     */
    @Column(name = "normal_prompt", columnDefinition = "LONGTEXT")
    @Comment("普通提示词")
    private String normalPrompt;

    /**
     * OAG提示词
     */
    @Column(name = "oag_prompt", columnDefinition = "LONGTEXT")
    @Comment("OAG提示词")
    private String oagPrompt;

    /**
     * 本体id
     */
    @Column(name = "ontology_id", length = 100)
    @Comment("本体id")
    private String ontologyId;

    /**
     * 本体名称
     */
    @Column(name = "ontology_name", length = 100)
    @Comment("本体名称")
    private String ontologyName;

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
     * 创建时间
     */
    @Column(name = "create_time")
    @CreatedDate
    @Comment("创建时间")
    private LocalDateTime createTime;
}
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
 * dify task 对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_dify_task")
@EntityListeners(AuditingEntityListener.class)
public class OntologyDifyTaskPo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键id")
    private String id;

    /**
     * 状态，1为test，0为chat
     */
    @Column(name = "type")
    @Comment("状态，1为test，0为chat")
    private Integer type;

    /**
     * 提示词类型: 1-OAG提示词, 0-普通提示词
     */
    @Column(name = "prompt_type")
    @Comment("提示词类型: 1-OAG提示词, 0-普通提示词")
    private Integer promptType;

    /**
     * 批次号
     */
    @Column(name = "batch_num", length = 32)
    @Comment("批次号")
    private String batchNum;

    /**
     * 子任务编号
     */
    @Column(name = "batch_idx")
    @Comment("子任务编号")
    private Integer batchIndex;


    /**
     * 用例id
     */
    @Column(name = "case_id", length = 32)
    @Comment("批次号")
    private String caseId;

    /**
     * 会话id
     */
    @Column(name = "conversation_id", length = 100)
    @Comment("会话id")
    private String conversationId;

    /**
     * 任务id
     */
    @Column(name = "task_id", length = 100)
    @Comment("任务id")
    private String taskId;

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
     * 执行用户
     */
    @Column(name = "exec_user", length = 100)
    @Comment("执行用户")
    private String execUser;


    /**
     * 执行状态
     */
    @Column(name = "status")
    @Comment("执行状态")
    private Integer status;

    /**
     * 结果概要
     */
    @Column(name = "summary", length = 100)
    @Comment("结果概要")
    private String summary;

    /**
     * 创建时间
     */
    @Column(name = "create_time")
    @CreatedDate
    @Comment("创建时间")
    private LocalDateTime createTime;

    /**
     * 执行时间
     */
    @Column(name = "last_exec_time")
    @CreatedDate
    @Comment("执行时间")
    private LocalDateTime lastExecTime;

    /**
     * 执行结果
     */
    @Column(name = "last_exec_result", columnDefinition = "TEXT")
    @Comment("执行结果")
    private String lastExecResult;

    /**
     * 对比分析信息
     */
    @Column(name = "last_exec_detail", columnDefinition = "TEXT")
    @Comment("对比分析信息")
    private String lastExecDetail;
}
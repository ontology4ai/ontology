package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EqualsAndHashCode(callSuper=false)
@Table(name = "ontology_action_process")
@EntityListeners(AuditingEntityListener.class)
public class OntologyActionProcessPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 64)
    @Comment("主键ID")
    private String id;

    @Column(name = "task_id", length = 64)
    private String taskId;

    @Column(name = "task_name", length = 100)
    @Comment("动作NAME")
    private String taskName;

    @Column(name = "task_type", length = 20)
    @Comment("程序类型")
    private String taskType;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "file_name", length = 200)
    @Comment("文件名")
    private String fileName;

    @Column(name = "api_param", length = 4000)
    @Comment("执行参数")
    private String apiParam;

    @Column(name = "api_path", length = 1000)
    @Comment("执行地址")
    private String apiPath;

    @Lob
    @Column(name = "message")
    @Comment("执行消息")
    private String message;

    @Column(name = "state")
    @Comment("执行状态")
    private Integer state;

    @Column(name = "create_user", length = 100)
    private String createUser;

    @Column(name = "start_time")
    @Comment("开始时间")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    @Comment("结束时间")
    private LocalDateTime endTime;
}

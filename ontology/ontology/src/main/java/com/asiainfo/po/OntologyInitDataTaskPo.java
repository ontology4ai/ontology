package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 本体仿真初始化数据任务表
 *
 * @author hulin
 * @since 2025-12-25
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_init_data_task")
@EntityListeners(AuditingEntityListener.class)
public class OntologyInitDataTaskPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "task_id", length = 32)
    @Comment("初始化数据任务ID")
    private String taskId;

    @Column(name = "scene_id", length = 100)
    @Comment("仿真场景ID")
    private String sceneId;

    @Column(name = "scene_name", length = 100)
    @Comment("仿真场景名称")
    private String sceneName;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型ID")
    private String objectTypeId;

    @Column(name = "object_type_name", length = 100)
    @Comment("对象类型名称")
    private String objectTypeName;

    @Column(name = "job_code", length = 100)
    @Comment("同步数据任务编码")
    private String jobCode;

    @Column(name = "status")
    @Comment("数据初始化任务状态: 0 - 新建，1 - 运行中，2 - 成功，3 - 失败，4 - 未绑定数据源")
    private Integer status;

    @Column(name = "ds_name", length = 100)
    @Comment("数据源名")
    private String dsName;

    @Column(name = "ds_schema", length = 100)
    @Comment("数据源schema")
    private String dsSchema;

    @Column(name = "table_name", length = 100)
    @Comment("表名")
    private String tableName;

    @Column(name = "create_user", length = 100)
    @Comment("创建人")
    private String createUser;

    @Column(name = "create_time")
    @Comment("创建时间")
    @CreatedDate
    private LocalDateTime createTime;

    @Lob
    @Column(name = "message")
    @Comment("执行信息")
    private String message;
}

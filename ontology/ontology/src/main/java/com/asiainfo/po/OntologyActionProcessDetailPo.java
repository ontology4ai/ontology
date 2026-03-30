package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import javax.persistence.*;

/**
 * 本体导入/导出任务表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_action_process_detail")
public class OntologyActionProcessDetailPo {
    @Id
    @Column(name = "id", length = 100)
    @Comment("主键ID")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "task_id", length = 100)
    @Comment("任务ID")
    private String taskId;

    @Column(name = "parent_id", length = 100)
    @Comment("关联资源ID")
    private String parentId;

    @Column(name = "resource_type", length = 100)
    @Comment("资源类型: object - 对象；attr - 属性；link - 关系；logic - 逻辑；action - 动作；interface - 接口")
    private String resourceType;

    @Column(name = "content")
    @Comment("资源内容")
    private String content;

    @Column(name = "state")
    @Comment("状态: 0 - 已存在; 1 - 新增; 2 - 覆盖")
    private Integer state;
}

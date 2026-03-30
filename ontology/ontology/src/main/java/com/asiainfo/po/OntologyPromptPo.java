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
 * 提示词prompt对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_prompt")
@EntityListeners(AuditingEntityListener.class)
public class OntologyPromptPo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键id")
    private String id;

    /**
     * 提示词名称
     */
    @Column(name = "prompt_name", length = 100)
    @Comment("提示词名称")
    private String promptName;

    /**
     * 提示词说明
     */
    @Column(name = "prompt_desc", length = 1000)
    @Comment("提示词说明")
    private String promptDesc;

    /**
     * 提示词内容
     */
    @Column(name = "prompt_content", columnDefinition = "LONGTEXT")
    @Comment("提示词内容")
    private String promptContent;

    /**
     * 提示词类型: 1-OAG提示词, 0-普通提示词
     */
    @Column(name = "prompt_type")
    @Comment("提示词类型: 1-OAG提示词, 0-普通提示词")
    private Integer promptType;

    /**
     * 默认提示词: 1-默认, 0-自定义
     */
    @Column(name = "default_type")
    @Comment("默认提示词: 1-默认, 0-自定义")
    private Integer defaultType;

    /**
     * 本体id
     */
    @Column(name = "ontology_id", length = 100)
    @Comment("本体id")
    private String ontologyId;

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

    /**
     * 更新时间
     */
    @Column(name = "last_update")
    @CreatedDate
    @Comment("更新时间")
    private LocalDateTime lastUpdate;

    @Column(name = "sync_status")
    @Comment("待同步状态，1为新建，2为修改，3为删除，0为已同步")
    private Integer syncStatus;

    @Column(name = "oper_status")
    @Comment("操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除")
    private Integer operStatus;
}
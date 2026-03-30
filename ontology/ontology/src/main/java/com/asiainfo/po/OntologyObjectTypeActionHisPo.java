package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
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
@Table(name = "ontology_object_type_action_his")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypeActionHisPo {

    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "action_id", length = 100)
    @Comment("对象类型动作ID")
    private String actionId;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型id")
    private String objectTypeId;

    @Column(name = "action_name", length = 100)
    @Comment("本体对象类型动作名称")
    private String actionName;

    @Column(name = "action_label", length = 100)
    @Comment("动作类型中文名")
    private String actionLabel;


    @Column(name = "action_desc", length = 1000)
    @Comment("动作描述")
    private String actionDesc;

    @Column(name = "icon", length = 100)
    @Comment("图标")
    private String icon;

    @Column(name = "action_type", length = 10)
    @Comment("动作类型：create - 创建对象，update - 修改对象，delete - 删除对象")
    private String actionType;

    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    @Column(name = "latest_version", length = 100)
    @Comment("最新版本号")
    private String latestVersion;


    @Column(name = "build_type", length = 100)
    @Comment("构建方式/逻辑类型：function - Function，api - API，link - Link")
    private String buildType;

    @Column(name = "intput_param", length = 1000)
    @Comment("入参")
    private String inputParam;

    @Column(name = "output_param", length = 1000)
    @Comment("出參")
    private String outputParam;

    @Column(name = "function_code", columnDefinition = "longtext")
    @Comment("函数代码")
    private String functionCode;

    @Column(name = "signature_detail", columnDefinition = "longtext")
    @Comment("入参详情")
    private String signatureDetail;

    @Column(name = "repo_name", length = 100)
    @Comment("仓库名")
    private String repoName;

    @Column(name = "file_name", length = 100)
    @Comment("文件名")
    private String fileName;

    @Column(name = "owner_id", length = 100)
    @Comment("发布人")
    private String ownerId;

    @Column(name = "create_time")
    @Comment("创建时间")
    private LocalDateTime createTime;

    @Column(name = "last_update")
    @Comment("修改时间")
    private LocalDateTime lastUpdate;

    @Column(name = "sync_status")
    @Comment("待同步状态，1为新建，2为修改，3为删除，0为已同步")
    private Integer syncStatus;

    @Column(name = "oper_status")
    @Comment("操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除")
    private Integer operStatus;
}
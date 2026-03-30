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
@Table(name = "ontology_manage_his")
@EntityListeners(AuditingEntityListener.class)
public class OntologyHisPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "ontology_name", length = 100)
    @Comment("本体管理器英文名")
    private String ontologyName;

    @Column(name = "ontology_label", length = 100)
    @Comment("本体管理器中文名")
    private String ontologyLabel;

    @Column(name = "ontology_desc", columnDefinition = "text")
    @Comment("本体管理器描述")
    private String ontologyDesc;

    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间/团队名")
    private String workspaceId;

    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    @Column(name = "sync_label")
    @Comment("同步标记")
    private Integer syncLabel;

    @Column(name = "is_favorite")
    @Comment("状态，1为收藏，0为不收藏")
    private Integer isFavorite;

    @Column(name = "is_recommend")
    @Comment("推荐状态，1为推荐，0为不推荐")
    private Integer isRecommend;

    @Column(name = "latest_version", length = 100)
    @Comment("最新版本号")
    private String latestVersion;

    @Column(name = "publish_user", length = 100)
    @Comment("发布人")
    private String publishUser;

    @Column(name = "publish_time")
    @Comment("发布时间")
    private LocalDateTime publishTime;

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

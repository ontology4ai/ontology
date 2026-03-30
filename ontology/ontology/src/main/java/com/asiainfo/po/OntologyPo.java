package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_manage")
@EntityListeners(AuditingEntityListener.class)
public class OntologyPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("本体管理器唯一id")
    private String id;

    /**
     * 本体英文名
     */
    @Column(name = "ontology_name", length = 100)
    @Comment("本体管理器英文名")
    private String ontologyName;

    /**
     * 本体中文名
     */
    @Column(name = "ontology_label", length = 100)
    @Comment("本体管理器中文名")
    private String ontologyLabel;

    /**
     * 描述
     */
    @Column(name = "ontology_desc", columnDefinition = "text")
    @Comment("本体管理器描述")
    private String ontologyDesc;

    /**
     * 隶属于的工作空间id
     */
    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间/团队名")
    private String workspaceId;

    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;



    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    /**
     * 同步标记
     */
    @Column(name = "sync_label")
    @Comment("同步标记")
    private Integer syncLabel;

    /**
     * 状态，1为收藏，0为不收藏
     */
    @Column(name = "is_favorite")
    @Comment("状态，1为收藏，0为不收藏")
    private Integer isFavorite;

    /**
     * 推荐标识，1为推荐，0为不推荐
     */
    @Column(name = "is_recommend")
    @Comment("推荐标识，1为推荐，0为不推荐")
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
}

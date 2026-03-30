package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 共享中心对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_share_center")
@EntityListeners(AuditingEntityListener.class)
public class OntologyCenterPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("共享中心对象唯一id")
    private String id;

    /**
     * 父节点id
     */
    @Column(name = "parent_id", length = 32)
    @Comment("共享中心对象父节点id")
    private String parentId;

    /**
     * 共享中心英文名
     */
    @Column(name = "center_name", length = 100)
    @Comment("共享中心英文名")
    private String centerName;

    /**
     * 共享中心中文名
     */
    @Column(name = "center_label", length = 100)
    @Comment("共享中心中文名")
    private String centerLabel;

    /**
     * 描述
     */
    @Column(name = "center_desc", columnDefinition = "text")
    @Comment("共享中心描述")
    private String centerDesc;

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
     * 是否是叶子节点
     */
    @Column(name = "is_leaf")
    @Comment("叶子节点标记 1:叶子节点 0:非叶子结点")
    private Integer isLeaf;

}
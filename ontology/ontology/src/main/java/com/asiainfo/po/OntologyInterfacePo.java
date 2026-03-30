package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 接口对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_interface")
@EntityListeners(AuditingEntityListener.class)
public class OntologyInterfacePo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("接口唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    /**
     * 接口图标
     */
    @Column(name = "icon", length = 100)
    @Comment("接口图标")
    private String icon;

    /**
     * 接口英文名
     */
    @Column(name = "name", length = 100)
    @Comment("接口英文名")
    private String name;

    /**
     * 接口中文名
     */
    @Column(name = "label", length = 100)
    @Comment("接口中文名")
    private String label;

    /**
     * 描述
     */
    @Column(name = "description", columnDefinition = "text")
    @Comment("接口描述")
    private String description;

    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    /**
     * 隶属于的工作空间id
     */
    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间/团队名")
    private String workspaceId;


    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

}
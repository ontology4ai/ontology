package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_simu_scene")
@EntityListeners(AuditingEntityListener.class)
public class OntologySimuScenePo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("仿真场景id")
    private String id;

    @Column(name = "scene_name", length = 100)
    @Comment("仿真场景英文名称")
    private String sceneName;

    @Column(name = "scene_label", length = 100)
    @Comment("仿真场景中文名称")
    private String sceneLabel;

    @Column(name = "description", length = 1000)
    @Comment("仿真场景描述")
    private String description;

    @Column(name = "ontology_id", length = 32)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "canvas_id", length = 32)
    @Comment("画布id")
    private String canvasId;

    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    /**
     * 隶属于的工作空间id
     */
    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间/团队名")
    private String workspaceId;

    @Column(name = "owner_id", length = 64)
    @Comment("创建/修改用户")
    private String ownerId;

}
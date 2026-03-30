package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import javax.persistence.ConstraintMode;
import javax.persistence.ForeignKey;
import java.util.List;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_object_type_action")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypeActionPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("动作类型主键ID")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型ID")
    private String objectTypeId;

    @Column(name = "action_name", length = 100)
    @Comment("动作类型英文名")
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

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

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
}
package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 逻辑类型实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_logic_type")
@EntityListeners(AuditingEntityListener.class)
public class OntologyLogicTypePo extends BasePo {
    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("逻辑类型主键ID")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体ID")
    private String ontologyId;

    @Column(name = "logic_type_name", length = 100)
    @Comment("逻辑类型英文名")
    private String logicTypeName;

    @Column(name = "logic_type_label", length = 100)
    @Comment("逻辑类型中文名")
    private String logicTypeLabel;

    @Column(name = "logic_type_desc", columnDefinition = "longtext")
    @Comment("逻辑类型描述")
    private String logicTypeDesc;

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

    @Column(name = "status")
    @Comment("状态：1 - 启用，0 - 禁用")
    private Integer status;

    @Column(name = "owner_id", length = 64)
    @Comment("发布人")
    private String ownerId;

    @Column(name = "api_id", length = 100)
    @Comment("API id")
    private String apiId;
}
package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_object_type")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypePo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("对象类型唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "object_type_name", length = 100)
    @Comment("本体对象类型英文名")
    private String objectTypeName;

    @Column(name = "object_type_label", length = 100)
    @Comment("本体对象类型中文名")
    private String objectTypeLabel;

    @Column(name = "object_type_desc", columnDefinition = "text")
    @Comment("本体对象类型描述")
    private String objectTypeDesc;

    @Column(name = "ds_type")
    @Comment("状态，1为自定义，0为默认")
    private Integer dsType;

    @Column(name = "custom_sql", columnDefinition = "text")
    @Comment("本体对象类型自定义sql")
    private String customSql;

    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    @Column(name = "ds_id", length = 100)
    @Comment("数据源id")
    private String dsId;

    @Column(name = "ds_name", length = 100)
    @Comment("数据源名")
    private String dsName;

    @Column(name = "ds_schema", length = 100)
    @Comment("数据源schema")
    private String dsSchema;

    @Column(name = "table_name", length = 100)
    @Comment("数据源表名")
    private String tableName;

    @Column(name = "icon", length = 100)
    @Comment("图标")
    private String icon;

    @Column(name = "interface_id", length = 100)
    @Comment("接口Id")
    private String interfaceId;

    @Column(name = "interface_icon", length = 100)
    @Comment("接口图标")
    private String interfaceIcon;

    @Column(name = "link_type_id", length = 100)
    @Comment("链接类型ID，不为空当前对象为虚拟对象")
    private String linkTypeId;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    @Column(name = "api_id", length = 100)
    @Comment("API id")
    private String apiId;

}

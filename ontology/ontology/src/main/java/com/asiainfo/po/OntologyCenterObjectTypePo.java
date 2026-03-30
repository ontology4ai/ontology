package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.util.List;

/**
 * 共享中心对象类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_center_object_type")
@EntityListeners(AuditingEntityListener.class)
public class OntologyCenterObjectTypePo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("对象类型唯一id")
    private String id;

    @Column(name = "center_id", length = 32)
    @Comment("共享中心id")
    private String centerId;

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
    /**
     * 拥有者的用户id
     */
    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    @Column(name = "ds_id", length = 100)
    @Comment("数据源id")
    private String dsId;

    @Column(name = "ds_schema", length = 100)
    @Comment("数据源schema")
    private String dsSchema;

    @Column(name = "table_name", length = 100)
    @Comment("数据源表名")
    private String tableName;

    @Column(name = "icon", length = 100)
    @Comment("图标")
    private String icon;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

}

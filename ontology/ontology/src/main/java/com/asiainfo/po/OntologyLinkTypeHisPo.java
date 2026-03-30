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
@Table(name = "ontology_link_type_his")
@EntityListeners(AuditingEntityListener.class)
public class OntologyLinkTypeHisPo {

    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "link_type_id", length = 100)
    @Comment("连接类型ID")
    private String linkTypeId;

    @Column(name = "ontology_id", length = 100)
    @Comment("本体管理器id")
    private String ontologyId;

    @Column(name = "source_name", length = 100)
    @Comment("源连接类型英文名")
    private String sourceName;

    @Column(name = "source_label", length = 100)
    @Comment("源连接类型中文名")
    private String sourceLabel;

    @Column(name = "target_name", length = 100)
    @Comment("目标连接类型英文名")
    private String targetName;

    @Column(name = "target_label", length = 100)
    @Comment("目标连接类型中文名")
    private String targetLabel;

    @Column(name = "source_object_type_id", length = 100)
    @Comment("源对象类型id")
    private String sourceObjectTypeId;

    @Column(name = "target_object_type_id", length = 100)
    @Comment("目标对象类型id")
    private String targetObjectTypeId;

    @Column(name = "source_attribute_id", length = 100)
    @Comment("源属性id")
    private String sourceAttributeId;

    @Column(name = "target_attribute_id", length = 100)
    @Comment("目标属性id")
    private String targetAttributeId;

    @Column(name = "link_type", length = 100)
    @Comment("连接类型分类")
    private Integer linkType;

    @Column(name = "link_method", length = 100)
    @Comment("连接类型分类")
    private Integer linkMethod;

    @Column(name = "middle_ds_id", length = 100)
    @Comment("中间数据源id")
    private String middleDsId;

    @Column(name = "middle_ds_schema", length = 100)
    @Comment("中间数据源schema")
    private String middleDsSchema;

    @Column(name = "middle_table_name", length = 100)
    @Comment("中间数据源表名")
    private String middleTableName;

    @Column(name = "middle_source_field", length = 100)
    @Comment("源关联字段")
    private String middleSourceField;

    @Column(name = "middle_target_field", length = 100)
    @Comment("目标关联字段")
    private String middleTargetField;

    @Column(name = "owner_id", length = 100)
    @Comment("拥有者标识")
    private String ownerId;

    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    @Column(name = "latest_version", length = 100)
    @Comment("最新版本号")
    private String latestVersion;

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

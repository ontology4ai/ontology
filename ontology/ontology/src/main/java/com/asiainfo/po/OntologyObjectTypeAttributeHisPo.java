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
@Table(name = "ontology_object_type_attribute_his")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypeAttributeHisPo {

    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "attribute_id", length = 100)
    @Comment("对象类型属性ID")
    private String attributeId;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型id")
    private String objectTypeId;

    @Column(name = "field_name", length = 100)
    @Comment("本体对象类型字段名")
    private String fieldName;

    @Column(name = "field_type", length = 100)
    @Comment("本体对象类型字段类型")
    private String fieldType;

    @Column(name = "attribute_name", length = 100)
    @Comment("本体对象类型属性名")
    private String attributeName;

    @Column(name = "attribute_label", length = 100)
    @Comment("本体对象类型属性英文编码/标签")
    private String attributeLabel;

    @Lob
    @Column(name = "attribute_desc")
    @Comment("本体对象类型描述")
    private String attributeDesc;

    @Column(name = "attribute_inst", length = 100)
    @Comment("本体对象类型英文名")
    private String attributeInst;

    @Column(name = "shared_attribute_id", length = 100)
    @Comment("本体对象类型属性名")
    private String sharedAttributeId;

    @Column(name = "is_primary_key")
    @Comment("状态，1为是，0为否")
    private int isPrimaryKey;

    @Column(name = "is_title")
    @Comment("状态，1为是，0为否")
    private int isTitle;

    @Column(name = "status")
    @Comment("1启用/0禁用")
    private Integer status;

    @Column(name = "interface_type")
    @Comment("字段接口类型，1为使用接口不同步，2使用接口同步，3不使用接口")
    private Integer interfaceType;

    @Column(name = "interface_attr_id")
    @Comment("映射接口属性ID")
    private String interfaceAttrId;

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
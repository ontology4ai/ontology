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
@Table(name = "ontology_object_type_his")
@EntityListeners(AuditingEntityListener.class)
public class OntologyObjectTypeHisPo {

    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "object_type_id", length = 100)
    @Comment("对象类型ID")
    private String objectTypeId;

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

    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

    @Column(name = "api_id", length = 100)
    @Comment("API id")
    private String apiId;

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

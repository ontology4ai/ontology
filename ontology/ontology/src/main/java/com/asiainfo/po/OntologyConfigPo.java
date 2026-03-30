package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体配置对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_config")
@EntityListeners(AuditingEntityListener.class)
public class OntologyConfigPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("接口唯一id")
    private String id;

    /**
     * 配置字段键值
     */
    @Column(name = "config_key", length = 100)
    @Comment("配置字段键值")
    private String configKey;

    /**
     * 配置字段值
     */
    @Column(name = "config_value", columnDefinition = "longtext")
    @Comment("配置字段值")
    private String configValue;

    /**
     * 配置字段描述
     */
    @Column(name = "description", columnDefinition = "text")
    @Comment("配置字段描述")
    private String description;

    /**
     * 配置字段描述
     */
    @Column(name = "config_type", length = 100)
    @Comment("参数类型")
    private String configType;

    @Column(name = "config_source", length = 100)
    @Comment("参数来源")
    private String configSource;

    /**
     * 状态，1为启用，0为禁用
     */
    @Column(name = "status")
    @Comment("状态，1为启用，0为禁用")
    private Integer status;

}
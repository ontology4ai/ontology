package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 *
 * @author hulin
 * @since 2025-09-12
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_object_type_action_param")
public class OntologyObjectTypeActionParamPo {
    @Id
    @Column(name = "id", length = 32)
    @Comment("主键ID")
    private String id;

    @Column(name = "action_id", length = 100)
    @Comment("动作ID")
    private String actionId;

    @Column(name = "attribute_id", length = 100)
    @Comment("属性ID")
    private String attributeId;

    @Column(name = "param_type", length = 32)
    @Comment("参数类型：1 - 用户输入，2 - 多项选择，3 - 静态值，4 - 默认当前用户，5 - 默认执行时间，6 - 系统生成")
    private Integer paramType;

    @Column(name = "param_name", length = 128)
    @Comment("参数名称")
    private String paramName;

    @Column(name = "param_value", length = 1000)
    @Comment("参数值")
    private String paramValue;

    @Column(name = "param_required", length = 32)
    @Comment("是否必填：0 - 不必填，1 - 必填")
    private Integer paramRequired;
}

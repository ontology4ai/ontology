package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * api入参/出参对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_api_param")
@EntityListeners(AuditingEntityListener.class)
public class OntologyApiParamPo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("API参数唯一ID")
    private String id;

    @Column(name = "parent_id", length = 32)
    @Comment("父API参数ID")
    private String parentId;

    @Column(name = "api_id", length = 100)
    @Comment("API ID")
    private String apiId;

    @Column(name = "param_type", length = 32)
    @Comment("参数类型：string/integer/number/boolean/array/object")
    private String paramType;

    @Column(name = "param_name", length = 128)
    @Comment("参数名称")
    private String paramName;

    @Column(name = "param_method", length = 100)
    @Comment("传入方式：path/query/body/header/cookie")
    private String paramMethod;

    @Column(name = "param_mode", length = 100)
    @Comment("类别：request/response")
    private String paramMode;

    @Column(name = "param_desc", length = 1000)
    @Comment("参数描述")
    private String paramDesc;

    /**
     * API参数是否必要
     */
    @Column(name = "is_required")
    @Comment("是否必填: 0 - 否，1 - 是")
    private Integer isRequired;

    @Column(name = "is_builtins")
    @Comment("是否内置: 0 - 否，1 - 是")
    private Integer isBuiltins;

    @Column(name = "default_value", length = 1000)
    @Comment("默认值")
    private String defaultValue;

    @Column(name = "function_id", length = 32)
    @Comment("API函数ID")
    private String functionId;
}
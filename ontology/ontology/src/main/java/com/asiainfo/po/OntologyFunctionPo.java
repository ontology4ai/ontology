package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_object_type_function")
@EntityListeners(AuditingEntityListener.class)
public class OntologyFunctionPo extends BasePo{

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("function唯一id")
    private String id;

    @Column(name = "ontology_id", length = 100)
    @Comment("对象类型id")
    private String ontologyId;

    @Column(name = "name", length = 100)
    @Comment("函数名")
    private String name;

    @Column(name = "function_desc", length = 100)
    @Comment("函数注释")
    private String functionDesc;

    @Column(name = "intput_param", length = 100)
    @Comment("函数入参数")
    private String inputParam;

    @Column(name = "code", length = 100)
    @Comment("函数代码")
    private String code;

    @Column(name = "commit_msg", length = 100)
    @Comment("函数提交信息")
    private String commitMsg;

    @Column(name = "storage", length = 100)
    @Comment("仓库")
    private String storage;

    @Column(name = "directory", length = 100)
    @Comment("目录")
    private String directory;

    @Column(name = "api", length = 100)
    @Comment("api")
    private String api;

    @Column(name = "url", columnDefinition = "text")
    @Comment("url")
    private String url;

    @Column(name = "version", columnDefinition = "text")
    @Comment("version")
    private String version;


    @Column(name = "status")
    @Comment("1启用/0禁用")
    private Integer status;

    @Column(name = "owner_id", length = 64)
    @Comment("发布人")
    private String ownerId;
}
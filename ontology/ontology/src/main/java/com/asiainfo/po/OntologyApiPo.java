package com.asiainfo.po;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

/**
 * api对象
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ontology_api")
@EntityListeners(AuditingEntityListener.class)
public class OntologyApiPo extends BasePo {

    /**
     * 唯一id
     */
    @Id
    @Column(name = "id", length = 32)
    @Comment("API唯一id")
    private String id;

    @Column(name = "api_name", length = 100)
    @Comment("API名称")
    private String apiName;

    @Column(name = "api_desc", length = 1000)
    @Comment("API描述")
    private String apiDesc;

    @Column(name = "api_method", length = 100)
    @Comment("请求方式: GET/POST/PUT等")
    private String apiMethod;

    @Column(name = "api_type", length = 100)
    @Comment("接口类型: object/logic/action")
    private String apiType;

    @Column(name = "url", length = 1000)
    @Comment("API请求地址")
    private String url;

    @Column(name = "api_timeout_ms")
    @Comment("API接口超时时间：单位毫秒")
    private Integer apiTimeout;
    /**
     * 隶属于的工作空间id
     */
    @Column(name = "workspace_id", length = 100)
    @Comment("工作空间/团队名")
    private String workspaceId;

    @Column(name = "create_user", length = 64)
    @Comment("创建用户")
    private String createUser;

    @Column(name = "update_user", length = 64)
    @Comment("修改用户")
    private String updateUser;
}
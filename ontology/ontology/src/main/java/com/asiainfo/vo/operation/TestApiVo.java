package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.Column;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import org.hibernate.annotations.Comment;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
public class TestApiVo {
    @NotBlank(message = "API url不能为空")
    @Size(max = 100, message = "API url长度不能超过1000")
    private String url;

    @Column(name = "api_method", length = 100)
    @Comment("请求方式: GET/POST/PUT等")
    private String apiMethod;

    private Integer apiTimeout;
    private Object apiBody;
    private List<TestApiParamVo> params;
}

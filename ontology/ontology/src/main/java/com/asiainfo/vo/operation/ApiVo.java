package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import java.util.List;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * @Author weihf
 * @Date 2025/11/21
 * @Description
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ApiVo extends BaseOperationVo {

    private String id;

    @NotBlank(message = "API名称不能为空")
    @Size(max = 100, message = "API名称长度不能超过100")
    private String apiName;

    @Size(max = 1000, message = "API描述长度不能超过100")
    private String apiDesc;

    @NotBlank(message = "API请求方式不能为空")
    @Size(max = 100, message = "API请求方式长度不能超过100")
    private String apiMethod;

    @NotBlank(message = "API类型不能为空")
    @Size(max = 100, message = "API类型长度不能超过100")
    private String apiType;

    @NotBlank(message = "API url不能为空")
    @Size(max = 100, message = "API url长度不能超过1000")
    private String url;

    private Integer apiTimeout;

    private String createUser;

    private String updateUser;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdate;

    private List<ApiParamVo> params;
}

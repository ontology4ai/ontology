package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 动作类型
 *
 * @author hulin
 * @since 2025-09-12
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ObjectTypeActionVo extends BaseOperationVo {
    private String id;

    private String ontologyId;

    private String objectTypeId;

    private String actionType;

    private String actionName;

    private String actionLabel;

    private String actionDesc;

    private Integer status;

    private String icon;

    private String buildType;
    private String fileName;
    private String apiId;

    private List<String> actionUsers;

    private List<ObjectTypeActionParamVo> params;

    private List<String> ids;
}

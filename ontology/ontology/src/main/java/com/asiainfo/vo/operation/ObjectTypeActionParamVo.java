package com.asiainfo.vo.operation;

import lombok.Data;

/**
 * 动作类型参数
 *
 * @author hulin
 * @since 2025-09-12
 */
@Data
public class ObjectTypeActionParamVo {
    private String id;
    private String actionId;
    private String attributeId;
    private Integer paramType;
    private String paramValue;
    private String paramName;
    private Integer paramRequired;
}

package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 逻辑类型
 *
 * @author hulin
 * @since 2025-09-25
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class LogicTypeVo extends BaseOperationVo {
    private String id;
    private String ontologyId;
    private String logicTypeName;
    private String logicTypeLabel;
    private String logicTypeDesc;
    private String buildType;
    private String fileName;
    private Integer status;
    private List<String> ids;
    private List<String> objectTypeIds;
    private String apiId;
}

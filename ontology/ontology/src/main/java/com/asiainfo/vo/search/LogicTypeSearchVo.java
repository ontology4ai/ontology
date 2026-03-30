package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 逻辑类型
 *
 * @author hulin
 * @since 2025-09-25
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class LogicTypeSearchVo extends BaseSearchVo {
    private String keyword;
    private String ontologyId;
    private String logicTypeName;
    private String logicTypeLabel;
    private Boolean published;
}

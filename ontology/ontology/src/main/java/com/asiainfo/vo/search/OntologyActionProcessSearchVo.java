package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 *
 *
 * @author hulin
 * @since 2026-01-21
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyActionProcessSearchVo extends BaseSearchVo {
    private String ontologyId;
    private String taskType;
    private String state;
    private String query;
    private String taskId;
    private String resourceType;
    private String objectTypeId;
}

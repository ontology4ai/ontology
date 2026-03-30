package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体版本
 *
 * @author hulin
 * @since 2025-09-22
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyVersionSearchVo extends BaseSearchVo {
    private String ontologyId;
}

package com.asiainfo.dto;

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
public class OntologyVersionDto extends BaseDto {
    private String versionName;
    private String ownerId;
    private String owner;
    private String ontologyId;
}

package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 *
 *
 * @author hulin
 * @since 2025-09-18
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CodeRepoDto extends BaseDto {
    private String repoName;

    private String repoType;

    private String repoAddress;

    private String ontologyId;

    private String ontologyName;

    private String ontologyLabel;

    private String owner;

    private String codeUrl;
}

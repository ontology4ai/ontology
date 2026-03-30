package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本体对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyDto extends BaseDto{

    private String id;

    private String ontologyName;

    private String ontologyLabel;

    private String ontologyDesc;

    private String workspaceId;

    private String owner;

    private String versionName;

    private Integer isFavorite;

    private Integer isRecommend;
}

package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode()
public class OntologyPromptDto {
    private String id;

    private String promptName;

    private String promptDesc;

    private String promptContent;

    private Integer promptType;

    private Integer defaultType;

    private String ontologyId;

    private String ownerId;

    private String workspaceId;

    private String createTime;

    private String lastUpdate;

    private Integer syncStatus;

    private Integer operStatus;

    private Integer charNum;
}

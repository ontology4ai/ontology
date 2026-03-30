package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode()
public class OntologyPromptConfigDto {
    private String id;
    private String ownerId;
    private String workspaceId;
    private Integer promptType;
    private String ontologyId;
    private OntologyPromptDto normalPrompt;
    private OntologyPromptDto oagPrompt;
}

package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode()
public class OntologyUseCaseDto {
    private String id;
    private String question;
    private String expectedResult;
    private String ownerId;
    private String workspaceId;
    private String createTime;
    private OntologyDifyTaskDto task;

    private OntologyPromptDto normalPrompt;
    private OntologyPromptDto oagPrompt;
}

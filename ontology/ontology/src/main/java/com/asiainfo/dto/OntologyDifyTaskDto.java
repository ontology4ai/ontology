package com.asiainfo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OntologyDifyTaskDto {
    private String id;
    private Integer type;
    private String batchNum;
    private Integer batchIndex;
    private String caseId;
    private String conversationId;
    private String taskId;
    private String question;
    private String expectedResult;
    private String execUser;
    private Integer status;
    private String summary;
    private String createTime;
    private String lastExecTime;
    private String lastExecResult;
    private String lastExecDetail;

    private OntologyDifyTaskDto lastTask;

    private String promptName;
    private Integer promptType;
}
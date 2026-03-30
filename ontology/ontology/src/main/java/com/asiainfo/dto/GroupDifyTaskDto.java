package com.asiainfo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupDifyTaskDto {

    private String id;
    private String batchNum;
    private String caseId;
    private Integer type;
    private Integer promptType;
    private String question;
    private String conversationId;
    private String taskId;
    private LocalDateTime createTime;
    private Integer caseTotal;

    public GroupDifyTaskDto(String batchNum, LocalDateTime createTime) {
        this.batchNum = batchNum;
        this.createTime = createTime;
    }
}
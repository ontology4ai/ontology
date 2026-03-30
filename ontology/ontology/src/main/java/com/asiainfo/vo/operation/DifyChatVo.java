package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class DifyChatVo extends BaseOperationVo{
    private String query; // required
    private String ontologyName; // required
    private String sysPrompt;
    private String responseMode; // streaming/blocking
    private String conversationId;
    private String parentMessageId;
    private Integer promptType;
    private String promptId;
}

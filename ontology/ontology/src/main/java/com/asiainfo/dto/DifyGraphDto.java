package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode()
public class DifyGraphDto {
    private String taskId;
    private String conversationId;
    private Object graph;
}

package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = false)
public class DifyGraphVo extends BaseOperationVo{

    private String taskId;

    private String conversationId;

    private Map<String, Object> data;
}

package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class DifyVo extends BaseOperationVo{
    private String ontologyName;
    private String lastId;
    private Integer limit;
    private String pinned;
    private String conversationId;
    private String firstId;
    private String taskId;
    private Integer promptType;
    private Integer expireDay;
    private Integer concurrentLimit;
}

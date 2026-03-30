package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode()
public class DifyBatchTaskStatusDto {
    private Integer total;
    private Integer finished;
    private Boolean isFinished;
    private String batchNum;
}

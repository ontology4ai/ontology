package com.asiainfo.vo.operation;

import com.asiainfo.vo.search.BaseSearchVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
public class DifyBatchTaskVo extends BaseSearchVo {

    private String ontologyName;

    private List<String> caseIdList;

    private String execUser;

    private String batchNum;

    private String id;

    private String conversationId;

    private String taskId;

    private Integer status;

    private String summary;

    private String lastExecTime;

    private String lastExecResult;

    private String lastExecDetail;

    // restart
    private List<String> batchIdList;

    // delete history task
    private List<String> batchNumList;

    // explore batch task
    private List<String> summaryList;

    private Integer promptType;

    private String keyword;

    private String sortColumn;

    private String sortOrder;

}

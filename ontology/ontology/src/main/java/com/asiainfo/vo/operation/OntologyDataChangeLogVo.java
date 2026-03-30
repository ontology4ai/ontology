package com.asiainfo.vo.operation;

import java.time.LocalDateTime;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

import com.alibaba.fastjson.JSONArray;

@Data
public class OntologyDataChangeLogVo {
    private Long id;

    private String trackId;

    private String operationType;
    private String operationTypeLabel;

    private String objectTypeName;
    private String objectTypeLabel;

    private Integer affectedRows;

    private Integer recordCountBefore;

    private Integer recordCountAfter;

    private String changeDetails;
    private JSONArray details;

    private LocalDateTime createdAt;

    private String title;
    private JSONObject attribute;
}

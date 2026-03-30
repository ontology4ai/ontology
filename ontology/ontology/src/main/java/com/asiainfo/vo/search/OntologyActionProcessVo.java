package com.asiainfo.vo.search;

import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OntologyActionProcessVo {
    private String taskId;

    private String taskName;

    private String taskType;

    private String apiParam;

    private String apiPath;

    private String message;

    private Integer state;

    private String createUser;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    private String fileName;

    private JSONObject resourceInfo;
}

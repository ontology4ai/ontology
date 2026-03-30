package com.asiainfo.feign.request;

import lombok.Data;

@Data
public class DataAccessParam {
    private String runSql;
    private String dsName;
    private String dsProfile;
    private String dsSchema;
    private String dsType;
    private String dsUserId; // 团队成员数据源
    private String windowId;
    private String reqKey;
    private int limit;
    private Boolean isExplain;
    private String teamName;
    private String teamLabel;
    private String userId;
    private String userName;
    private String ipAddress;
    private String queueName;
    private String execEngine;
}

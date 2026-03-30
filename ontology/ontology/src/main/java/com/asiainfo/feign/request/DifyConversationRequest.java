package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class DifyConversationRequest implements Serializable {
    private String user;
    private String last_id;
    private Integer limit;
    private String pinned;
    private String conversation_id;
    private Integer agent_mode;
}
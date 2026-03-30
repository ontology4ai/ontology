package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class DifyMessageRequest implements Serializable {
    private String user;
    private String conversation_id;
    private Integer limit;
    private String first_id;
    private Integer agent_mode;
}
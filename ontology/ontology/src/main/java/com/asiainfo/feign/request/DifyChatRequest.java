package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class DifyChatRequest implements Serializable {
    private String sys_prompt;
    private String query;
    private String response_mode = "streaming";
    private String conversation_id;
    private String user;
    private String parent_message_id;
    private String workspace_id;
    private String ontology_name;
    private Integer agent_mode;

    private String prompt_id;
}
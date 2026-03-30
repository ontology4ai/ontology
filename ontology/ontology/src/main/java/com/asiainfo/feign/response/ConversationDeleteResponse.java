package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

@Data
public class ConversationDeleteResponse {
    private String status;
    private String message;
    private Object data;
    private String code;
}

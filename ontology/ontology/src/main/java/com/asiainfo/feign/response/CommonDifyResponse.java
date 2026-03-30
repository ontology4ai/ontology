package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

@Data
public class CommonDifyResponse {
    private String status;
    private String message;
    private Map<String, Object> data;
    private String code;
}

package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 * 本体迁出响应体
 */
@Data
public class OntologyMigrateOutResponse {
    private String status;
    private String message;
    private String code;
    private Map<String, Object> data;
}
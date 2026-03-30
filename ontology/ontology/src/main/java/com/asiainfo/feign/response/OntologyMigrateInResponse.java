package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 * 本体迁入响应体
 */
@Data
public class OntologyMigrateInResponse {
    private String status;
    private String message;
    private String code;
    private Map<String, Object> data;
}
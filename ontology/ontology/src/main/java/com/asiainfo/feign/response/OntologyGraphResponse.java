package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 * 本体图谱响应体
 */
@Data
public class OntologyGraphResponse {
    private String status;
    private String message;
    private String code;
    private Map<String, Object> data;
}
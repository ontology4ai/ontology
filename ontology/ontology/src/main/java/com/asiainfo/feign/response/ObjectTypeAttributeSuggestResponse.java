package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 * 创建本体对象响应体
 */
@Data
public class ObjectTypeAttributeSuggestResponse {
    private Map<String, Object> data;
    private String status;
    private String message;
}
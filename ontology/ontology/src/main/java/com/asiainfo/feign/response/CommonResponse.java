package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 *
 *
 * @author hulin
 * @since 2025-09-30
 */
@Data
public class CommonResponse {
    private String status;
    private String message;
    private Map<String, Object> data;
    private String code;
}

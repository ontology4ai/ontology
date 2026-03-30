package com.asiainfo.feign.response;

import lombok.Data;

import java.util.Map;

/**
 * 本体文件导入响应体
 */
@Data
public class OntologyFileImportResponse {
    private String status;
    private String message;
    private Map<String, Object> data;
}
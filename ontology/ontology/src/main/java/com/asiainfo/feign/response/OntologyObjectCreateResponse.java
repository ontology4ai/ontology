package com.asiainfo.feign.response;

import java.io.Serializable;
import java.util.Map;

/**
 * 创建本体对象响应体
 */
public class OntologyObjectCreateResponse implements Serializable {
    private Map<String, Object> data;
    private String status;

    public OntologyObjectCreateResponse() {}

    public OntologyObjectCreateResponse(Map<String, Object> data, String status) {
        this.data = data;
        this.status = status;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
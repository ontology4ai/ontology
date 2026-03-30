package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
public enum StatusEnum {
    ENABLED(1), DISABLED(0);

    int code;

    StatusEnum(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
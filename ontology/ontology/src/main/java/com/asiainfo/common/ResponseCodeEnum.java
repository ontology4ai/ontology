package com.asiainfo.common;

/**
 *
 *
 * @author hulin
 * @since 2025-12-10
 */
public enum ResponseCodeEnum {
    SUCCESS("200", "success"),
    FAILURE("500", "failure");

    private final String code;
    private final String message;

    ResponseCodeEnum(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}

package com.asiainfo.common;

/**
 * API请求方式枚举
 */
public enum ApiMethodEnum {
    GET, POST, PUT;

    public static boolean isValid(String method) {
        for (ApiMethodEnum value : ApiMethodEnum.values()) {
            if (value.name().equalsIgnoreCase(method)) {
                return true;
            }
        }
        return false;
    }
}

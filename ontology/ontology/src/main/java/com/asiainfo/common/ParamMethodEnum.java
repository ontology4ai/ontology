package com.asiainfo.common;

/**
 * 参数方法枚举
 */
public enum ParamMethodEnum {
    PATH("path"), QUERY("query"), BODY("body"),
    HEADER("header"), COOKIE("cookie");

    private final String method;

    ParamMethodEnum(String method) {
        this.method = method;
    }

    public String getMethod() {
        return method;
    }

    public static boolean isValid(String method) {
        for (ParamMethodEnum value : ParamMethodEnum.values()) {
            if (value.getMethod().equalsIgnoreCase(method)) {
                return true;
            }
        }
        return false;
    }
}

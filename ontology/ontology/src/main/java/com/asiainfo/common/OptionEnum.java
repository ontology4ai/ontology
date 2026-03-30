package com.asiainfo.common;

public enum OptionEnum {
    REQUIRED(1), OPTIONAL(0);

    int code;

    OptionEnum(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
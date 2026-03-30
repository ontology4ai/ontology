package com.asiainfo.common;

/**
 * 操作状态枚举
 */
public enum OperStatusEnum {
    CREATED(0), UPDATED(1), PUBLISHED(2), DELETED(3);

    final int code;

    OperStatusEnum(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
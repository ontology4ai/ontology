package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
public enum ChangeStatusEnum {
    SYNCED(0), CREATED(1), UPDATED(2), DELETED(3);

    int code;

    ChangeStatusEnum(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
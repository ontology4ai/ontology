package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */
public enum SyncStatusEnum {
    SYNCING(0), SYNC_SUCCESS(1), SYNC_FAILED(2);

    int code;

    SyncStatusEnum(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
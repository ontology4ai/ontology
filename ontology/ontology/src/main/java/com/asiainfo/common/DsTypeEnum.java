package com.asiainfo.common;

public enum DsTypeEnum {

    NORMAL(0, "普通"),
    CUSTOM(1, "自定义");

    int value;

    String status;

    DsTypeEnum(int value, String status) {
        this.value = value;
        this.status = status;
    }

    public int getValue() {
        return value;
    }

    public String getStatus() {
        return status;
    }

    public boolean equals(int value) {
        return this.value == value;
    }
}

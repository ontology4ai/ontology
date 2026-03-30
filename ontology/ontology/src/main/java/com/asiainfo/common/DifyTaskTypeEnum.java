package com.asiainfo.common;

public enum DifyTaskTypeEnum {

    CHAT(0, "实时会话"),
    BATCH(1, "批量测试");

    int value;

    String type;

    DifyTaskTypeEnum(int value, String type) {
        this.value = value;
        this.type = type;
    }

    public int getValue() {
        return value;
    }

    public String getType() {
        return type;
    }

    public boolean equals(int value) {
        return this.value == value;
    }
}

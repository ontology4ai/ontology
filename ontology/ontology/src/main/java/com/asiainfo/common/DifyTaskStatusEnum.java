package com.asiainfo.common;

public enum DifyTaskStatusEnum {

    QUEUE(0, "排队中"),
    RUNNING(1, "执行中"),
    FINISHED(2, "正常结束"),
    ERROE(3, "异常退出"),
    ABORTED(4, "任务中止");

    int value;

    String status;

    DifyTaskStatusEnum(int value, String status) {
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

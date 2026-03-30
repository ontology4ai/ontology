package com.asiainfo.common;

/**
 * 本体仿真数据初始化任务状态
 *
 * @author hulin
 * @since 2026-01-04
 */
public enum InitDataTaskStatusEnum {
    INIT(0, "新建"),
    RUNNING(1, "运行中"),
    SUCCESS(2, "成功"),
    FAILED(3, "失败"),
    NODATASOURCE(4, "未绑定数据源");

    private final Integer value;
    private final String label;
    InitDataTaskStatusEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}

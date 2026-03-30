package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/21
 * @Description
 */
public enum ServiceTypeEnum {

    LOGIC("logic", "逻辑"),
    ACTION("action", "动作"),
    GLOBAL("global", "全局");

    String value;

    String label;

    ServiceTypeEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static ServiceTypeEnum getEnum(String value) {

        for (ServiceTypeEnum actionEnum : ServiceTypeEnum.values()) {
            if (actionEnum.name().equals(value)) {
                return actionEnum;
            }
        }
        return null;
    }
}

package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/21
 * @Description
 */
public enum AttributeInterfaceTypeEnum {

    EXTEND_NO_DYNAMIC(1, "继承但不更新"),
    EXTEND_DYNAMIC(2, "继承更新"),
    NO_USE(3, "不使用");

    Integer value;

    String label;

    AttributeInterfaceTypeEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static AttributeInterfaceTypeEnum getEnum(String value) {

        for (AttributeInterfaceTypeEnum actionEnum : AttributeInterfaceTypeEnum.values()) {
            if (actionEnum.name().equals(value)) {
                return actionEnum;
            }
        }
        return null;
    }
}

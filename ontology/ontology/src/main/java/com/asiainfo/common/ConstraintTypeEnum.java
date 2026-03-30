package com.asiainfo.common;

public enum ConstraintTypeEnum {

    INTERFACE(0, "接口"),
    OBJECT(1, "对象");

    Integer value;

    String label;

    ConstraintTypeEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static ConstraintTypeEnum getEnum(String value) {

        for (ConstraintTypeEnum constraintType : ConstraintTypeEnum.values()) {
            if (constraintType.name().equals(value)) {
                return constraintType;
            }
        }
        return null;
    }
}

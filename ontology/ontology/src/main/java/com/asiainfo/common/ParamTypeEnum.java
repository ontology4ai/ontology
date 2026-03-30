package com.asiainfo.common;

/**
 * 参数类型枚举
 */
public enum ParamTypeEnum {
    STRING("string"), INTEGER("integer"), NUMBER("number"), OBJECT("object"), ARRAY("array"), BOOLEAN("boolean");

    private final String type;

    ParamTypeEnum(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public static boolean isValid(String type) {
        for (ParamTypeEnum value : ParamTypeEnum.values()) {
            if (value.getType().equalsIgnoreCase(type)) {
                return true;
            }
        }
        return false;
    }
}

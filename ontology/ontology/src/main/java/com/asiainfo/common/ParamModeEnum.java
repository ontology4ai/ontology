package com.asiainfo.common;

/**
 * 参数模式枚举
 */
public enum ParamModeEnum {
    REQUEST("request"), RESPONSE("response");

    private final String mode;

    ParamModeEnum(String mode) {
        this.mode = mode;
    }

    public String getMode() {
        return mode;
    }

    public static boolean isValid(String mode) {
        for (ParamModeEnum value : ParamModeEnum.values()) {
            if (value.getMode().equalsIgnoreCase(mode)) {
                return true;
            }
        }
        return false;
    }
}

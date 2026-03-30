package com.asiainfo.common;

public enum ApiTypeEnum {
    OBJECT("object"), LOGIC("logic"), ACTION("action");

    private final String type;

    ApiTypeEnum(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public static boolean isValid(String type) {
        for (ApiTypeEnum value : ApiTypeEnum.values()) {
            if (value.getType().equalsIgnoreCase(type)) {
                return true;
            }
        }
        return false;
    }
}

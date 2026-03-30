package com.asiainfo.common;

public enum LogicBuildTypeEnum {
    FUNCTION("function"),
    API("api"),
    LINK("link");

    String value;

    LogicBuildTypeEnum(String value) {
        this.value = value;
    }

    public static LogicBuildTypeEnum parse(String value) {
        for (LogicBuildTypeEnum profileEnum : LogicBuildTypeEnum.values()) {
            if(profileEnum.name().equalsIgnoreCase(value)) {
                return profileEnum;
            }
        }

        return null;
    }

    public String getValue() {
        return value;
    }

    public boolean equals(String type) {
        return this.value.equalsIgnoreCase(type);
    }
}

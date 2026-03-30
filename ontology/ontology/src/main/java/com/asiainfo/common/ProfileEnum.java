package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */
public enum ProfileEnum {
    DEV("开发库"), PRO("生产库"), DQ("质量库"), SIM("仿真库");

    String value;

    ProfileEnum(String value) {
        this.value = value;
    }

    public static ProfileEnum parse(String value) {
        for (ProfileEnum profileEnum : ProfileEnum.values()) {
            if(profileEnum.name().equalsIgnoreCase(value)) {
                return profileEnum;
            }
        }
        return DEV;
    }

    public String getValue() {
        return value;
    }
}

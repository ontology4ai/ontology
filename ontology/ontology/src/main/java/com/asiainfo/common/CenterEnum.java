package com.asiainfo.common;

public enum CenterEnum {

    ROOT("root", "共享中心根节点");

    String value;
    String label;

    CenterEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static CenterEnum getEnum(String value) {

        for (CenterEnum centerEnum : CenterEnum.values()) {
            if (centerEnum.name().equals(value)) {
                return centerEnum;
            }
        }
        return null;
    }
}

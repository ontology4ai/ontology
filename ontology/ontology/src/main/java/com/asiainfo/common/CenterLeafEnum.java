package com.asiainfo.common;

public enum CenterLeafEnum {

    ROOT(0, "非叶子节点"),
    LEAF(1, "叶子节点");

    Integer value;
    String label;

    CenterLeafEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static CenterLeafEnum getEnum(Integer value) {

        for (CenterLeafEnum centerEnum : CenterLeafEnum.values()) {
            if (centerEnum.getValue() == value) {
                return centerEnum;
            }
        }
        return null;
    }
}

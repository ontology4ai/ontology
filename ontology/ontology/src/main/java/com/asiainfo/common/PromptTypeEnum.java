package com.asiainfo.common;

public enum PromptTypeEnum {

    NORMAL(0, "普通提示词"),
    OAG(1, "OAG提示词");

    Integer value;
    String label;

    PromptTypeEnum(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public boolean equals(int type) {
        return this.value.equals(type);
    }
}

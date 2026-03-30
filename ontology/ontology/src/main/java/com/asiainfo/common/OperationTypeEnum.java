package com.asiainfo.common;

public enum OperationTypeEnum {
    CREATE("CREATE", "新增"),
    UPDATE("UPDATE", "修改"),
    DELETE("DELETE", "删除"),
    OTHER("OTHER", "其他");

    final String value;

    final String label;

    OperationTypeEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static OperationTypeEnum getEnum(String value) {

        for (OperationTypeEnum operationTypeEnum : OperationTypeEnum.values()) {
            if (operationTypeEnum.name().equals(value)) {
                return operationTypeEnum;
            }
        }
        return OTHER;
    }
}

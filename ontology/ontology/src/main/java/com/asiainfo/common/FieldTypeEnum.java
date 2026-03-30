package com.asiainfo.common;

/**
 * 字段类型枚举
 * 用于对象属性类型的枚举值
 */
public enum FieldTypeEnum {
    
    INT("int"),
    DECIMAL("decimal"),
    STRING("string"),
    BOOLEAN("boolean"),
    DATE("date"),
    DATETIME("datetime");

    private final String type;

    FieldTypeEnum(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}

package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/21
 * @Description
 */
public enum ActionEnum {

    CREATE("创建[%s]对象实例", "新增对象实例，维护各属性信息"),
    UPDATE("编辑[%s]对象实例", "编辑已有实例的属性信息"),
    DELETE("删除[%s]对象实例", "删除已有实例");

    String value;

    String label;

    ActionEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static ActionEnum getEnum(String value) {

        for (ActionEnum actionEnum : ActionEnum.values()) {
            if (actionEnum.name().equals(value)) {
                return actionEnum;
            }
        }
        return null;
    }
}

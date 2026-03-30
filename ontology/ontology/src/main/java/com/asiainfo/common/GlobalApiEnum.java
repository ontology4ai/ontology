package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/8/21
 * @Description
 */
public enum GlobalApiEnum {
    LIST_OBJECTS("list_objects", "获取可用对象", "获取当前可用的全部对象", "ontology_object_list", "GET"),
    LIST_FUNCTIONS("list_functions", "获取可用逻辑", "获取当前可用的全部逻辑", "ontology_functions_list", "GET"),
    LIST_ACTIONS("list_actions", "获取可用动作", "获取当前可用的全部动作", "ontology_actions_list", "GET"),
    FIND("find", "查询", "条件查询对象实例", "find", "POST");

    String value;

    String label;

    String comment;

    String tool;

    String method;


    GlobalApiEnum(String value, String label, String comment, String tool, String method) {
        this.value = value;
        this.label = label;
        this.comment = comment;
        this.tool = tool;
        this.method = method;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public String getComment() {
        return comment;
    }

    public String getTool() {
        return tool;
    }

    public String getMethod() {
        return method;
    }

    public static GlobalApiEnum getEnum(String value) {

        for (GlobalApiEnum actionEnum : GlobalApiEnum.values()) {
            if (actionEnum.getValue().equals(value)) {
                return actionEnum;
            }
        }
        return null;
    }
}

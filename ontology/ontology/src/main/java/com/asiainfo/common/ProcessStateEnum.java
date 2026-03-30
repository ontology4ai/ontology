package com.asiainfo.common;


import lombok.Getter;

@Getter
public enum ProcessStateEnum {

    START(0,"pending"),
    RUNNING(3,"running"),
    COMPLETED(1,"completed"),
    FAILED(-1,"failed"),
    CANCELLED(-2,"cancelled");


    final Integer value;

    final String label;

    ProcessStateEnum(int value,String label) {
        this.value = value;
        this.label = label;
    }

    public static String getLabel(int value) {
        for (ProcessStateEnum state : ProcessStateEnum.values()) {
            if(state.value==value) {
                return state.label;
            }
        }
        return "";
    }

    public static int getValue(String label) {
        for (ProcessStateEnum state : ProcessStateEnum.values()) {
            if(state.label.equalsIgnoreCase(label)) {
                return state.value;
            }
        }
        return 0;
    }
}

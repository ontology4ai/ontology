package com.asiainfo.common;

public enum ConstraintRelationEnum {

    ONE2ONE("1To1", "一对一"),
    ONE2MANY("1ToN", "一对多"),
    MANY2MANY("NToN", "多对多"),
    MANY2ONE("NTo1", "多对一");

    String value;

    String label;

    ConstraintRelationEnum(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static ConstraintRelationEnum getEnum(String value) {

        for (ConstraintRelationEnum constraintRelation : ConstraintRelationEnum.values()) {
            if (constraintRelation.name().equals(value)) {
                return constraintRelation;
            }
        }
        return null;
    }

    public static String reverse(String value) {
        switch (value) {
            case "1To1":
                return "1To1";
            case "1ToN":
                return "NTo1";
            case "NToN":
                return "NToN";
            case "NTo1":
                return "1ToN";
            default:
                return "";
        }

    }
}

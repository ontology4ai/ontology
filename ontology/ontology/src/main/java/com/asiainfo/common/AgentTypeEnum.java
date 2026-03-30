package com.asiainfo.common;

public enum AgentTypeEnum {
    DIFY("dify"), AAP("aap");

    String value;

    AgentTypeEnum(String value) {
        this.value = value;
    }

    public static AgentTypeEnum parse(String value) {
        for (AgentTypeEnum agentTypeEnum : AgentTypeEnum.values()) {
            if(agentTypeEnum.name().equalsIgnoreCase(value)) {
                return agentTypeEnum;
            }
        }
        return AAP;
    }

    public String getValue() {
        return value;
    }
}

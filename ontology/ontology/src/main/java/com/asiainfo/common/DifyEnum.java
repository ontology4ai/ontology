package com.asiainfo.common;

public enum DifyEnum {
    EVENT("event"), EVENT_THOUGHT("agent_thought"), EVENT_MESSAGE("agent_message"), EVENT_END("message_end"), EVENT_ERROR("error");

    private final String type;

    DifyEnum(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public boolean equals(String event) {
        return this.type.equalsIgnoreCase(event);
    }

    public String toString() {
        return this.type;
    }
}

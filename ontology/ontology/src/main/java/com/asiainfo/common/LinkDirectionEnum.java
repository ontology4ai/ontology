package com.asiainfo.common;

/**
 *
 *
 * @author hulin
 * @since 2025-09-09
 */
public enum LinkDirectionEnum {
    SOURCE("source"), TARGET("target");

    private final String direction;

    LinkDirectionEnum(String direction) {
        this.direction = direction;
    }

    public String getDirection() {
        return direction;
    }
}

package com.asiainfo.feign.request;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;
import org.apache.commons.collections4.MapUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * @Author luchao
 * @Date 2025/9/2
 * @Description
 */

public class FieldInfo extends HashMap<String, Object> {

    public String getName() {
        return MapUtils.getString(this, "name");
    }

    public void setName(String name) {
        this.put("name", name);
    }

    public String getType() {
        return  MapUtils.getString(this, "type");
    }

    public void setType(String type) {
        this.put("type", type);
    }

    public Boolean getPrimary_key() {
        return MapUtils.getBoolean(this, "primary_key");
    }

    public void setPrimary_key(Boolean primarykey) {
        this.put("primary_key", primarykey);
    }

    public String getProperty() {
        return MapUtils.getString(this, "property");
    }

    public void setProperty(String property) {
        this.put("property", property);
    }


    public static void main(String[] args) {
        final FieldInfo fieldInfo = new FieldInfo();
        fieldInfo.setPrimary_key(true);
        fieldInfo.setName("name");
        fieldInfo.setType("string");
        fieldInfo.put("a", 1);
//        System.out.println(JSONObject.toJSONString(fieldInfo));
    }
}

package com.asiainfo.util;


import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.StringWriter;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JSON处理帮助类
 * @author Mei Kefu
 * @date 2010-3-5
 */
@Component
public class JsonHelper {

    //2010-5-27修改每次调用都new一个，虽然有部分开销但是防止了多线程同步修改问题
    //private JSONWriter writer = new JSONWriter(false);

    //private JSONReader reader = new JSONReader();

    private static Logger LOG = LoggerFactory.getLogger(JsonHelper.class);

    private static JsonHelper HELPER = new JsonHelper();

    private ObjectMapper mapper = new ObjectMapper();

    private JsonHelper(){
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
        mapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    /**
     * 取出Json处理对象
     *
     * @return Json处理对象
     */
    public static JsonHelper getInstance(){
        return HELPER;
    }
    /** Json对象转换为字符串.
     *@param object 传入对象
     *@return 转换后字符串
     */
    public String write(Object object) {
        StringWriter sw = new StringWriter();
        try {
            mapper.writeValue(sw, object);
        } catch (IOException e) {
            LOG.error("", e);
        }
        return sw.toString();
    }
    /** 字符串转换为Json对象.
     *@param string 传入字符串
     *@return 转换后Json对象
     */
    public Object read(String string){
        Object obj = null;
        try {
            obj = readObj(string);
        } catch (JsonParseException e) {
            LOG.error("解析出错"+string,e);
        } catch (JsonMappingException e) {
            LOG.error("", e);
        } catch (IOException e) {
            LOG.error("", e);
        }
        return obj;
    }

    /**
     * 字符串转换为json对象，抛出转换过程中的异常
     * @param string
     * @return
     * @throws JsonParseException
     * @throws JsonMappingException
     * @throws IOException
     * @since 2.4.1
     */
    public Object readObj(String string) throws JsonParseException, JsonMappingException, IOException{
        string = string.trim();
        Object obj = null;
        Class cls = string.startsWith("[")?List.class:Map.class;
        obj = mapper.readValue(string,cls);
        return obj;
    }

    /** 字符串转换为泛型对象.
     *@param string 传入字符串
     *@return 转换后泛型对象
     */
    public <T> T read(String string,Class<T> clz){
        string = string.trim();
        T obj = null;
        try {
            obj = mapper.readValue(string,clz);
        } catch (JsonParseException e) {
            LOG.error("", e);
        } catch (JsonMappingException e) {
            LOG.error("", e);
        } catch (IOException e) {
            LOG.error("", e);
        }
        return (T)obj;
    }

    public <T> T read(String json, TypeReference<T> jsonTypeReference) {
        try {
            return (T) mapper.readValue(json, jsonTypeReference);
        } catch (JsonParseException e) {
            LOG.error("decode(String, JsonTypeReference<T>)", e);
        } catch (JsonMappingException e) {
            LOG.error("decode(String, JsonTypeReference<T>)", e);
        } catch (IOException e) {
            LOG.error("decode(String, JsonTypeReference<T>)", e);
        }
        return null;
    }

    // 支持转list对象
    public <T> List<T>  convertTypeList(String jsonStr, Class<T> clazz)  {
        List<Map<String,String>> dataList = (List<Map<String, String>>) this.read(jsonStr);
        List<T> result = new ArrayList<>();
        for(Map<String, String> map : dataList) {
            try {
                T object = clazz.newInstance();
                for (Map.Entry<String, String> entry : map.entrySet()) {
                    Field field = clazz.getDeclaredField(entry.getKey());
                    field.setAccessible(true);
                    field.set(object, entry.getValue());
                }
                result.add(object);
            } catch (Exception e) {
                LOG.error("",e);
            }
        }
        return result;
    }

    //支持map转对象
    public <T> T convertToObject(LinkedHashMap<String, String> linkedHashMap, Class<T> clazz)  {
        T object = null;
        try {
            object = clazz.newInstance();

            for (Map.Entry<String, String> entry : linkedHashMap.entrySet()) {
                Field field = clazz.getDeclaredField(entry.getKey());
                field.setAccessible(true);
                field.set(object, entry.getValue());
            }
        } catch (InstantiationException e) {
            LOG.error("",e);
        } catch (IllegalAccessException e) {
            LOG.error("",e);
        } catch (NoSuchFieldException e) {
            LOG.error("",e);
        }
        return object;
    }
}

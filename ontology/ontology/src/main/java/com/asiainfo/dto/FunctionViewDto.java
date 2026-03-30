package com.asiainfo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@Data
@NoArgsConstructor
public class FunctionViewDto extends BaseDto {
    private String name;
    private String ontology;
    private String version;
    private List<String> objectTypes;
    private String api;
    private String code;
    private String commitMsg;
    private String directory;
    private String functionDesc;
    private String inputParam;
    private String storage;
    private String url;
    private String ownerId;
}

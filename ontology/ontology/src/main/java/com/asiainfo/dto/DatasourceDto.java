package com.asiainfo.dto;

import lombok.Data;

import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */

@Data
public class DatasourceDto {

    private String id;

    private String name;

    private List<String> schemas;
}

package com.asiainfo.vo.search;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomApiResponseVo {
    private String columnName;

    private String columnLabel;

    private String columnType;

    private String columnDesc;
}
package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchApiFunctionVo {

    private String id;

    private String functionName;
}

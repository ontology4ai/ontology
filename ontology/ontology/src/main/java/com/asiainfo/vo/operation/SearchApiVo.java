package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchApiVo extends BaseOperationVo {

    private String apiName;

    private String apiType;
}

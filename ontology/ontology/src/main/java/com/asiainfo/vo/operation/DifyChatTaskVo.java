package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class DifyChatTaskVo extends BaseOperationVo {

    private String question;

    private String execUser;

    private Integer promptType;

}

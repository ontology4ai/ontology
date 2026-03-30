package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 代码仓库
 *
 * @author hulin
 * @since 2025-09-18
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CodeRepoVo extends BaseOperationVo {
    private String repoName;
    private String repoType;
    private String ontologyId;
    private Integer status;
}

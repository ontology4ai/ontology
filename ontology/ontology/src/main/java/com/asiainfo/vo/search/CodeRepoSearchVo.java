package com.asiainfo.vo.search;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 代码仓库查询参数
 *
 * @author hulin
 * @since 2025-09-18
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CodeRepoSearchVo extends BaseSearchVo {
    private String keyword;

    private Integer status;
}

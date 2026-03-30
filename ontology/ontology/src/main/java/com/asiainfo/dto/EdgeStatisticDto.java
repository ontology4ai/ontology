package com.asiainfo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图谱关系统计信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EdgeStatisticDto {

    /**
     * 关系标签
     */
    private String label;

    /**
     * 关系类型
     */
    private String edgeType;

    /**
     * 关系出现次数
     */
    private long count;
}

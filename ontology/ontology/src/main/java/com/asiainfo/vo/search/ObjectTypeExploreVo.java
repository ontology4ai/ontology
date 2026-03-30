package com.asiainfo.vo.search;

import lombok.Data;

/**
 *
 *
 * @author hulin
 * @since 2025-09-17
 */
@Data
public class ObjectTypeExploreVo {
    private String objectTypeId;
    private String attributeId;
    private Integer limit;
    private boolean title;
    private String keyword;
    private String query;

    // 自定义sql
    private String dsId;
    private String dsSchema;
    private String customSql;
    private String workspaceId;
    private boolean check;
}

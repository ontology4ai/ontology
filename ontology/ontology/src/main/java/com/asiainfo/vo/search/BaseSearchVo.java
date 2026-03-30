package com.asiainfo.vo.search;

import lombok.Data;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */

@Data
public class BaseSearchVo {

    private int page = 1;

    private int limit = 10;

    private String ownerId;

    private String workspaceId;
}

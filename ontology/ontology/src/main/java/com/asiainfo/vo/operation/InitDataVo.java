package com.asiainfo.vo.operation;

import lombok.Data;

import java.util.List;

/**
 *
 *
 * @author hulin
 * @since 2025-12-23
 */
@Data
public class InitDataVo {
    // 数据初始化任务ID
    private String taskId;
    // 仿真场景ID
    private String sceneId;
    // 对象类型
    private List<String> objectIds;
    // 工作空间/团队ID
    private String workspaceId;
    // 工作空间/团队名称
    private String workspaceName;
    // 创建人
    private String ownerId;
}

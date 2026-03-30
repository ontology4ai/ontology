package com.asiainfo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 本体图谱概览对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyGraphViewDto extends BaseDto {

    private String id;

    private String ontologyName;

    private String ontologyLabel;

    private long objectTypes; //对象

    private long datasourceObjectTypes; //关联数据源

    private long notDatasourceObjectTypes; //未关联数据源

    private long interfaceObjectTypes; //继承接口

    private long notInterfaceObjectTypes; //未继承接口

    private long logicTypes; //逻辑

    private long refObjectLogicTypes; //引用对象

    private long notRefObjectLogicTypes; //未引用对象

    private long functionLogicTypes;//基于函数构建

    private long objectActions; //动作

    private long functionObjectActions; // 基于函数构建

    private long createObjectActions; //新增

    private long updateObjectActions; //修改

    private long deleteObjectActions; //删除

    private long interfaces; //接口

    private long extendObjectInterfaces; //继承接口

    private long notExtendObjectInterfaces; //未继承接口

    private List<GroupLinkTypeDto> linkTypes;

    private List<EdgeStatisticDto> edgeStatistics;

    private String ontologyDesc;

    private String workspaceId;

    private String ownerId;

    private String version;

}

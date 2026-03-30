package com.asiainfo.vo.operation;

import java.util.List;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 本类表示本体画布节点的值对象(Value Object)，用于封装节点相关的数据属性。
 * 使用@Data注解自动生成getter、setter等方法。
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class OntologyCanvasNodeVo {
    private String id;

    @NotBlank(message = "节点类型不能为空")
    @Size(max = 10, message = "节点类型长度不能超过10")
    private String nodeType;

    @NotBlank(message = "elementId不能为空")
    @Size(max = 32, message = "elementId长度不能超过32")
    private String elementId;

    @NotBlank(message = "初始化数据状态不能为空")
    private Integer dataStatus;

    private String icon;
    private String name;
    private String label;
    private List<Object> objectRelations;
    private List<Object> logicRelations;
    private List<Object> actionRelations;
}

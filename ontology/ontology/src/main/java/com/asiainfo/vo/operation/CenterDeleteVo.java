package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 本体共享中心对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CenterDeleteVo extends BaseOperationVo {

    @NotBlank(message = "共享中心id不能为空")
    private String centerId;

    @NotBlank(message = "共享中心父节点id不能为空")
    private String parentId;
}

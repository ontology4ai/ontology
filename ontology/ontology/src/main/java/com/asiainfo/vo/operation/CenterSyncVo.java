package com.asiainfo.vo.operation;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 本体共享中心对象
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CenterSyncVo extends BaseOperationVo {

    @NotBlank(message = "共享中心id不能为空")
    private String centerId;

    @NotBlank(message = "本体对象类型id列表不能为空")
    private List<String> typeIdList;
}

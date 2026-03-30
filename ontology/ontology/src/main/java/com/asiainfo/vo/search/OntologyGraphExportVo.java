package com.asiainfo.vo.search;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 本体图谱导出请求参数
 */
@Data
public class OntologyGraphExportVo {

    @NotBlank(message = "本体id不能为空")
    private String ontologyId;

    @NotBlank(message = "本体类型id列表不能为空")
    private List<String> objectTypeIdList;

}
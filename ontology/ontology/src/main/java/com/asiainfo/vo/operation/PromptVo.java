package com.asiainfo.vo.operation;

import com.asiainfo.vo.search.BaseSearchVo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.Size;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
public class PromptVo extends BaseSearchVo{
    private String id;

    @Size(max = 100, message = "提示词名称长度不能超过100")
    private String promptName;

    private Integer promptType;

    private Integer defaultType;

    @Size(max = 1000, message = "提示词描述长度不能超过1000")
    private String promptDesc;

    private String promptContent;

    private String ontologyId;

    private List<String> idList;

    private String keyword;

    private List<String> ownerIdList;

    private List<PromptTemplateVo> batchList;
}

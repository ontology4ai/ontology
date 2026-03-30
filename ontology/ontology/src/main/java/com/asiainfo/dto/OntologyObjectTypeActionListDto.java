package com.asiainfo.dto;

import com.asiainfo.po.OntologyObjectTypeActionPo;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.beans.BeanUtils;

/**
 * @Author luchao
 * @Date 2025/8/25
 * @Description
 */

@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeActionListDto extends BaseDto {
    private String ontologyId;
    private String actionName;
    private String actionLabel;
    private String actionDesc;
    private String buildType;
    private String codeUrl;
    private OntologyObjectTypeDto objectType;

    public static OntologyObjectTypeActionListDto transform(OntologyObjectTypeActionPo actionPo) {
        if (actionPo == null) return null;

        OntologyObjectTypeActionListDto actionDto = new OntologyObjectTypeActionListDto();
        BeanUtils.copyProperties(actionPo, actionDto);

        return actionDto;
    }
}

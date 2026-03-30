package com.asiainfo.dto;

import com.asiainfo.common.ActionEnum;
import com.asiainfo.po.OntologyObjectTypeActionPo;
import com.asiainfo.po.OntologyObjectTypeGroupPo;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.beans.BeanUtils;

import javax.persistence.*;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/25
 * @Description
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OntologyObjectTypeActionDto extends BaseDto {

    private String actionName;

    private String actionLabel;

    private String actionDesc;

    private String actionType;

    private OntologyDto ontology;
    private String buildType;
    private String repoName;
    private String fileName;
    private String functionCode;
    private String inputParam;
    private String outputParam;
    private String ownerId;
    private String owner;
    private String codeUrl;
    private String storagePath;

    private List<String> users;

    private OntologyObjectTypeDto objectType;

    private List<OntologyObjectTypeActionParamDto> params;

    public static OntologyObjectTypeActionDto transform(OntologyObjectTypeActionPo actionPo) {
        if (actionPo == null) return null;

        OntologyObjectTypeActionDto actionDto = new OntologyObjectTypeActionDto();
        BeanUtils.copyProperties(actionPo, actionDto);

        if (ActionEnum.getEnum(actionDto.getActionName()) != null) {

            actionDto.setActionLabel(ActionEnum.getEnum(actionDto.getActionName()).getValue());
            actionDto.setActionDesc(ActionEnum.getEnum(actionDto.getActionName()).getLabel());
        }

        return actionDto;
    }
}

package com.asiainfo.dto;

import com.asiainfo.po.OntologyObjectTypeAttributePo;
import lombok.Data;
import org.springframework.beans.BeanUtils;

/**
 * @Author luchao
 * @Date 2025/8/25
 * @Description
 */

@Data
public class OntologyObjectTypeAttributeDto extends BaseDto{


    private String fieldName;

    private String fieldType;

    private String attributeName;

    private String attributeLabel;

    private String attributeInst;

    private String attributeDesc;

    private Integer interfaceType;

    private String interfaceAttrId;

    private int isPrimaryKey;

    private int isTitle;

    public static OntologyObjectTypeAttributeDto transform(OntologyObjectTypeAttributePo attributePo) {
        if (attributePo == null) return null;

        OntologyObjectTypeAttributeDto attributeDto = new OntologyObjectTypeAttributeDto();

        BeanUtils.copyProperties(attributePo, attributeDto);

        return attributeDto;
    }
}

package com.asiainfo.dto;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.po.BasePo;
import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.po.OntologySharedAttributePo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.annotations.Comment;
import org.springframework.beans.BeanUtils;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.util.List;

@Data
@Slf4j
public class OntologySharedAttributeDto extends BaseDto{

    private String id;

    private String attributeName;

    private String attributeLabel;

    private String attributeDesc;

    private List<String> attributeTypes;

    private Long objectTypes;

    public static OntologySharedAttributeDto transform(OntologySharedAttributePo attributePo) {
        if (attributePo == null) return null;

        OntologySharedAttributeDto attributeDto = new OntologySharedAttributeDto();

        BeanUtils.copyProperties(attributePo, attributeDto);

        if(StringUtils.isNotBlank(attributePo.getAttributeTypes())) {
            List<String> types = null;
            try {
                types = JSONArray.parseArray(attributePo.getAttributeTypes(), String.class);
            } catch (Exception e) {
                log.warn("", e);
            }
            attributeDto.setAttributeTypes(types);
        }


        return attributeDto;
    }

}
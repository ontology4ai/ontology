package com.asiainfo.dto;

import com.asiainfo.po.OntologyConfigGroupPo;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;

@Data
@Slf4j
public class OntologyConfigGroupDto extends BaseDto {
    /**
     * 分组编码
     */
    private String code;

    /**
     * 分组名称
     */
    private String name;

    public static OntologyConfigGroupDto toDto(OntologyConfigGroupPo po) {
        OntologyConfigGroupDto dto = new OntologyConfigGroupDto();
        BeanUtils.copyProperties(po, dto);
        return dto;
    }
}
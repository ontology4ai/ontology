package com.asiainfo.dto;

import com.asiainfo.po.OntologyObjectTypeGroupPo;
import com.asiainfo.po.OntologyObjectTypePo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 本体对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OntologyObjectTypeGroupDto extends BaseDto{


    private String id;

    private String ontologyId;

    private String objectGroupLabel;

    private String ownerId;

    private Long objectTypeCount;

    public static OntologyObjectTypeGroupDto transform(OntologyObjectTypeGroupPo groupPo, boolean deep) {
        if (groupPo == null) return null;

        OntologyObjectTypeGroupDto groupDto = new OntologyObjectTypeGroupDto();

        BeanUtils.copyProperties(groupPo, groupDto);
//        if (deep) {
//            org.hibernate.Hibernate.initialize(groupPo.getObjectTypes());
//            groupDto.setObjectTypeCount((long) groupPo.getObjectTypes().size());
//        }
        return groupDto;
    }

}
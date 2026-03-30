package com.asiainfo.serivce;

import com.asiainfo.common.AttributeInterfaceTypeEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.po.OntologyInterfaceAttributePo;
import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.repo.OntologyInterfaceAttributeRepository;
import com.asiainfo.repo.OntologyObjectTypeAttributeRepository;
import com.asiainfo.vo.operation.AttributeVo;
import com.asiainfo.vo.operation.ObjectTypeVo;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/22
 * @Description
 */

@Service
@Slf4j
public class ObjectTypeAttributeService {

    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;
    @Autowired
    OntologyInterfaceAttributeRepository interfaceAttributeRepository;

    public List<OntologyObjectTypeAttributePo> saveAttributesPoList(OntologyObjectTypePo objectTypePo, ObjectTypeVo objectTypeVo) {

        List<AttributeVo> attributes = objectTypeVo.getAttributes();
        final List<OntologyObjectTypeAttributePo> collect = attributes.stream().map(attributeVo -> {
            OntologyObjectTypeAttributePo attributePo = new OntologyObjectTypeAttributePo();
            BeanUtils.copyProperties(attributeVo, attributePo);
            attributePo.setId(StringUtil.genUuid(32));
            attributePo.setObjectTypeId(objectTypePo.getId());
            attributePo.setFieldType(attributeVo.getFieldType());
            attributePo.setSharedAttributeId(attributeVo.getSharedAttributeId());
//            if(StringUtils.isNotBlank(attributeVo.getFieldName())) {
//                attributePo.setStatus(StatusEnum.ENABLED.getCode());
//            } else {
//                attributePo.setStatus(StatusEnum.DISABLED.getCode());
//            }
            if(attributePo.getStatus() == null) {
                attributePo.setStatus(StatusEnum.ENABLED.getCode());
            }
            attributePo.setAttributeInst(attributeVo.getAttributeInst());
            attributePo.setAttributeDesc(attributeVo.getAttributeDesc());
            attributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            attributePo.setOperStatus(OperStatusEnum.CREATED.getCode());
            attributePo.setInterfaceType(attributeVo.getInterfaceType());
            if (null != attributeVo.getInterfaceType() && AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue() == attributeVo.getInterfaceType()) {
                Optional<OntologyInterfaceAttributePo> optInterfaceAttributePo = interfaceAttributeRepository.findById(attributeVo.getInterfaceAttrId());
                if (optInterfaceAttributePo.isPresent()) {
                    attributePo.setAttributeName(optInterfaceAttributePo.get().getLabel());
                }
            }

            attributePo.setInterfaceAttrId(attributeVo.getInterfaceAttrId());
            return attributePo;
        }).collect(Collectors.toList());

        attributeRepository.saveAll(collect);
        return collect;
    }

    public List<OntologyObjectTypeAttributePo> saveAttributesPoListWithoutDs(OntologyObjectTypePo objectTypePo, ObjectTypeVo objectTypeVo) {

        List<AttributeVo> attributes = objectTypeVo.getAttributes();
        final List<OntologyObjectTypeAttributePo> collect = attributes.stream().map(attributeVo -> {
            OntologyObjectTypeAttributePo attributePo = new OntologyObjectTypeAttributePo();
            BeanUtils.copyProperties(attributeVo, attributePo, "interfaceType", "interfaceAttrId");
            attributePo.setId(StringUtil.genUuid(32));
            attributePo.setObjectTypeId(objectTypePo.getId());
            attributePo.setFieldType(attributeVo.getFieldType());
            attributePo.setSharedAttributeId(attributeVo.getSharedAttributeId());
            attributePo.setAttributeInst(attributeVo.getAttributeInst());
            attributePo.setAttributeDesc(attributeVo.getAttributeDesc());
            if (StringUtils.isBlank(attributePo.getFieldName())) {
                attributePo.setFieldName(attributePo.getAttributeName());
            }
            attributePo.setStatus(StatusEnum.ENABLED.getCode());
            attributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            attributePo.setOperStatus(OperStatusEnum.CREATED.getCode());
            Integer interfaceType = attributeVo.getInterfaceType();
            if (interfaceType == null) {
                interfaceType = AttributeInterfaceTypeEnum.NO_USE.getValue();
            }
            attributePo.setInterfaceType(interfaceType);
            attributePo.setInterfaceAttrId(attributeVo.getInterfaceAttrId());
            return attributePo;
        }).collect(Collectors.toList());

        attributeRepository.saveAll(collect);
        return collect;
    }

    public void deleteByObjectTypeId(String id) {

        attributeRepository.softDeleteByObjectIds(Collections.singletonList(id));
    }

    public String getPrimaryKeyByObjectTypeId(String objectTypeId) {
        return attributeRepository.findFirstByObjectTypeId(objectTypeId);
    }
}

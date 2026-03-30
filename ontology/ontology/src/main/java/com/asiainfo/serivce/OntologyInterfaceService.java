package com.asiainfo.serivce;

import com.asiainfo.common.*;
import com.asiainfo.dto.*;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.operation.OntologyInterfaceAttributeVo;
import com.asiainfo.vo.operation.OntologyInterfaceVo;
import com.asiainfo.vo.search.InterfaceSearchVo;
import io.github.suanchou.utils.SpringJdbcUtil;
import io.github.suanchou.utils.StringUtil;
import org.apache.commons.lang3.StringUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyInterfaceService {
    @Autowired
    OntologyInterfaceRepository interfaceRepository;

    @Autowired
    OntologyInterfaceAttributeRepository interfaceAttributeRepository;

    @Autowired
    OntologyInterfaceConstraintRepository interfaceConstraintRepository;

    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;

    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;
    
    @Autowired
    ObjectTypeService objectTypeService;


    @Transactional
    public OntologyInterfacePo save(OntologyInterfaceVo interfaceVo) {
        OntologyInterfacePo interfacePo = new OntologyInterfacePo();
        BeanUtils.copyProperties(interfaceVo, interfacePo);
        interfacePo.setId(StringUtil.genUuid(32));
        interfacePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        interfacePo.setOperStatus(OperStatusEnum.CREATED.getCode());
        interfaceRepository.save(interfacePo);

        List<OntologyInterfaceAttributePo> interfaceAttributePoList = interfaceVo.getAttributeList().stream().map(interfaceAttributeVo -> {
            OntologyInterfaceAttributePo interfaceAttributePo = new OntologyInterfaceAttributePo();
            BeanUtils.copyProperties(interfaceAttributeVo, interfaceAttributePo);
            interfaceAttributePo.setId(StringUtil.genUuid(32));
            interfaceAttributePo.setInterfaceId(interfacePo.getId());
            interfaceAttributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            interfaceAttributePo.setOperStatus(OperStatusEnum.CREATED.getCode());

            if (null == interfaceAttributePo.getIsRequired()) {
                interfaceAttributePo.setIsRequired(OptionEnum.REQUIRED.getCode());
            }

            return interfaceAttributePo;
        }).collect(Collectors.toList());
        interfaceAttributeRepository.saveAllAndFlush(interfaceAttributePoList);
        return interfacePo;
    }

    @Transactional
    public Object update(OntologyInterfaceVo interfaceVo) {
        OntologyInterfacePo interfacePo = new OntologyInterfacePo();
        BeanUtils.copyProperties(interfaceVo, interfacePo);
        interfacePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        interfacePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
        interfaceRepository.save(interfacePo);

        List<OntologyInterfaceAttributePo> interfaceAttributePoList = interfaceVo.getAttributeList().stream().map(interfaceAttributeVo -> {
            OntologyInterfaceAttributePo interfaceAttributePo = new OntologyInterfaceAttributePo();
            BeanUtils.copyProperties(interfaceAttributeVo, interfaceAttributePo);
            if (interfaceAttributeVo.getOperStatus() != null && OperStatusEnum.DELETED.getCode() == interfaceAttributeVo.getOperStatus()) {
                interfaceAttributePo.setSyncStatus(ChangeStatusEnum.DELETED.getCode());
                interfaceAttributePo.setOperStatus(OperStatusEnum.DELETED.getCode());
            } else {
                interfaceAttributePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
                interfaceAttributePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            }
            interfaceAttributePo.setInterfaceId(interfacePo.getId());

            if (null == interfaceAttributeVo.getId() || interfaceAttributeVo.getId().isEmpty()) {
                // id为空是新增的接口属性
                interfaceAttributePo.setId(StringUtil.genUuid(32));
                interfaceAttributePo.setOperStatus(OperStatusEnum.CREATED.getCode());
                interfaceAttributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            } else {
                // 1、当接口属性中文名修改时，使用这个接口的对象，要检测是否用到了这个接口属性，如果type=2则需要用修改后的接口属性刷新对象属性表中的中文名
                // 2、当接口属性有修改时，使用这个接口的对象，要检测是否用到了这个接口属性，如果type=2则需要同步当前对象到代码
                List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findExtendedByInterfaceId(interfacePo.getId(), interfacePo.getOntologyId());
                for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                    List<OntologyObjectTypeAttributePo> typeAttributePoList = attributeRepository.findAvaliableAndEnableByTypeId(objectTypePo.getId());

                    for(OntologyObjectTypeAttributePo objectTypeAttributePo : typeAttributePoList) {
                        updateObjectTypeAttribute(objectTypeAttributePo, interfaceAttributeVo);
                    }

                    objectTypeService.updateOntologyObject(objectTypePo, typeAttributePoList);
                }
            }

            if (null == interfaceAttributePo.getIsRequired()) {
                interfaceAttributePo.setIsRequired(OptionEnum.REQUIRED.getCode());
            }

            OntologyInterfaceAttributeChangedDto interfaceAttributeChangedDto = isInterfaceAttributeChanged(interfaceAttributePo);
            if (null != interfaceAttributeChangedDto) {
                updateAffectedObjectTypeList(interfaceAttributeChangedDto);
            }

            return interfaceAttributePo;
        }).collect(Collectors.toList());

        return interfaceAttributeRepository.saveAllAndFlush(interfaceAttributePoList);
    }

    public OntologyInterfaceChangedDto analysisAffected(OntologyInterfaceVo interfaceVo) {
        OntologyInterfaceChangedDto interAttributeChangedDto = new OntologyInterfaceChangedDto();
        BeanUtils.copyProperties(interfaceVo, interAttributeChangedDto);

        List<OntologyInterfaceAttributeChangedDto> attributeChangedDtoList = new ArrayList<>();
        Map<String, OntologyObjectTypeDto> affectExtendedMap = new HashMap<>();

        for (OntologyInterfaceAttributeVo interfaceAttributeVo : interfaceVo.getAttributeList()) {
            OntologyInterfaceAttributePo interfaceAttributePo = new OntologyInterfaceAttributePo();
            BeanUtils.copyProperties(interfaceAttributeVo, interfaceAttributePo);
            interfaceAttributePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            interfaceAttributePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            interfaceAttributePo.setInterfaceId(interfaceVo.getId());

            if (null == interfaceAttributeVo.getId() || interfaceAttributeVo.getId().isEmpty()) {
                // id为空是新增的接口属性
                interfaceAttributePo.setOperStatus(OperStatusEnum.CREATED.getCode());
                interfaceAttributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            }

            OntologyInterfaceAttributeChangedDto interfaceAttributeChangedDto = isInterfaceAttributeChanged(interfaceAttributePo);
            if (null != interfaceAttributeChangedDto) {
                attributeChangedDtoList.add(interfaceAttributeChangedDto);
                List<OntologyObjectTypeDto> affectExtendedList = getAffectedObjectTypeList(interfaceAttributeChangedDto);
                for (OntologyObjectTypeDto affectObjectTypeDto : affectExtendedList) {
                    // id去重
                    affectExtendedMap.put(affectObjectTypeDto.getId(), affectObjectTypeDto);
                }
            }
        }

        interAttributeChangedDto.setAttributeChangedList(attributeChangedDtoList);
        interAttributeChangedDto.setAffectExtendedList(new ArrayList<>(affectExtendedMap.values()));
        return interAttributeChangedDto;
    }

    private void updateAffectedObjectTypeList(OntologyInterfaceAttributeChangedDto interfaceAttributeChangedDto) {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findExtendedByInterfaceId(interfaceAttributeChangedDto.getInterfaceId());
        List<OntologyObjectTypeDto> objectTypeDtoList = new ArrayList<>();
        if (OperStatusEnum.CREATED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            // 继承对象默认新增一个属性,名称相同且默认同步接口属性
            List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = new ArrayList<>();
            for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                OntologyObjectTypeAttributePo objectTypeAttributePo = new OntologyObjectTypeAttributePo();
                objectTypeAttributePo.setId(StringUtil.genUuid(32));
                objectTypeAttributePo.setObjectTypeId(objectTypePo.getId());
                objectTypeAttributePo.setInterfaceType(AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue());
                objectTypeAttributePo.setInterfaceAttrId(interfaceAttributeChangedDto.getId());
                objectTypeAttributePo.setAttributeInst(interfaceAttributeChangedDto.getAttributeDto().getName());
                objectTypeAttributePo.setAttributeName(interfaceAttributeChangedDto.getAttributeDto().getLabel());
                objectTypeAttributePo.setAttributeDesc(interfaceAttributeChangedDto.getAttributeDto().getDescription());
                // TODO 其他字段如何映射 对象类型属性 fieldName fieldType attributeName attribute_inst 如何和接口属性对应的
                objectTypeAttributePo.setFieldType(interfaceAttributeChangedDto.getAttributeDto().getType());
                objectTypeAttributePo.setFieldName(interfaceAttributeChangedDto.getAttributeDto().getLabel());
                objectTypeAttributePoList.add(objectTypeAttributePo);
            }

            attributeRepository.saveAllAndFlush(objectTypeAttributePoList);
        } else if (OperStatusEnum.DELETED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = attributeRepository.findByTypeIdAndInterAttrId(objectTypePo.getId(), interfaceAttributeChangedDto.getId());
                if (null != objectTypeAttributePoList && !objectTypeAttributePoList.isEmpty()) {
                    OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                    BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                    objectTypeDtoList.add(objectTypeDto);

                    for (OntologyObjectTypeAttributePo objectTypeAttributePo : objectTypeAttributePoList) {
                        // TODO - 删除取消映射关系,对象的属性转为自定义扩展属性 下面处理逻辑是否正确
                        objectTypeAttributePo.setInterfaceAttrId(null);
                        objectTypeAttributePo.setInterfaceType(AttributeInterfaceTypeEnum.NO_USE.getValue());
                    }
                    attributeRepository.saveAllAndFlush(objectTypeAttributePoList);
                }
            }
        } else if (OperStatusEnum.UPDATED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = attributeRepository.findByTypeIdAndInterAttrId(objectTypePo.getId(), interfaceAttributeChangedDto.getId());
                if (null != objectTypeAttributePoList && !objectTypeAttributePoList.isEmpty()) {
                    List<OntologyObjectTypeAttributePo> todoAttributePoList = new ArrayList<>();
                    for (OntologyObjectTypeAttributePo objectTypeAttributePo : objectTypeAttributePoList) {
                        if (AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue() == objectTypeAttributePo.getInterfaceType()) {
                            // TODO - 继承对象同步修改 下面处理逻辑是否正确,字段匹配是否正确
                            objectTypeAttributePo.setAttributeName(interfaceAttributeChangedDto.getAttributeDto().getLabel());
                            objectTypeAttributePo.setAttributeInst(interfaceAttributeChangedDto.getAttributeDto().getName());
                            objectTypeAttributePo.setAttributeDesc(interfaceAttributeChangedDto.getAttributeDto().getDescription());
                            objectTypeAttributePo.setFieldType(interfaceAttributeChangedDto.getAttributeDto().getType());
                            objectTypeAttributePo.setFieldName(interfaceAttributeChangedDto.getAttributeDto().getLabel());
                            todoAttributePoList.add(objectTypeAttributePo);
                        }
                    }

                    if (!todoAttributePoList.isEmpty()) {
                        OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                        BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                        objectTypeDtoList.add(objectTypeDto);
                        attributeRepository.saveAllAndFlush(todoAttributePoList);
                    }
                }
            }
        }
    }

    private List<OntologyObjectTypeDto> getAffectedObjectTypeList(OntologyInterfaceAttributeChangedDto interfaceAttributeChangedDto) {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findExtendedByInterfaceId(interfaceAttributeChangedDto.getInterfaceId());
        List<OntologyObjectTypeDto> objectTypeDtoList = new ArrayList<>();
        if (OperStatusEnum.CREATED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            // 继承对象默认新增一个属性 所有继承对象都受影响
            return objectTypePoList.stream().map(objectTypePo -> {
                OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                return objectTypeDto;
            }).collect(Collectors.toList());
        } else if (OperStatusEnum.DELETED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = attributeRepository.findByTypeIdAndInterAttrId(objectTypePo.getId(), interfaceAttributeChangedDto.getId());
                if (null != objectTypeAttributePoList && !objectTypeAttributePoList.isEmpty()) {
                    OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                    BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                    objectTypeDtoList.add(objectTypeDto);
                }
            }

            return objectTypeDtoList;
        } else if (OperStatusEnum.UPDATED.getCode() == interfaceAttributeChangedDto.getOperStatus()) {
            for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
                List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = attributeRepository.findByTypeIdAndInterAttrId(objectTypePo.getId(), interfaceAttributeChangedDto.getId());
                if (null != objectTypeAttributePoList && !objectTypeAttributePoList.isEmpty()) {
                    List<OntologyObjectTypeAttributePo> todoAttributePoList = new ArrayList<>();
                    for (OntologyObjectTypeAttributePo objectTypeAttributePo : objectTypeAttributePoList) {
                        if (AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue() == objectTypeAttributePo.getInterfaceType()) {
                            todoAttributePoList.add(objectTypeAttributePo);
                            break;
                        }
                    }

                    if (!todoAttributePoList.isEmpty()) {
                        OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                        BeanUtils.copyProperties(objectTypePo, objectTypeDto);
                        objectTypeDtoList.add(objectTypeDto);
                    }
                }
            }
            return objectTypeDtoList;
        }

        return Collections.emptyList();
    }

    private OntologyInterfaceAttributeChangedDto isInterfaceAttributeChanged(OntologyInterfaceAttributePo attributePo) {
        OntologyInterfaceAttributeChangedDto attributeChangedDto = new OntologyInterfaceAttributeChangedDto();
        // 新增接口属性
        if (OperStatusEnum.CREATED.getCode() == attributePo.getOperStatus()) {
            BeanUtils.copyProperties(attributePo, attributeChangedDto);
            attributeChangedDto.setOperStatus(OperStatusEnum.CREATED.getCode());
            OntologyInterfaceAttributeDto attributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(attributePo, attributeDto);
            attributeChangedDto.setAttributeDto(attributeDto);
            return attributeChangedDto;
        }

        attributeChangedDto.setId(attributePo.getId());
        attributeChangedDto.setInterfaceId(attributePo.getInterfaceId());

        // 删除接口属性
        if (null != attributePo.getOperStatus()
                && OperStatusEnum.DELETED.getCode() == attributePo.getOperStatus()) {
            OntologyInterfaceAttributeDto attributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(attributePo, attributeDto);
            attributeChangedDto.setOriginAttributeDto(attributeDto);
            attributeChangedDto.setOperStatus(OperStatusEnum.DELETED.getCode());
            return attributeChangedDto;
        }

        // 更新接口属性
        Optional<OntologyInterfaceAttributePo>  optInterfaceAttributePo = interfaceAttributeRepository.findById(attributePo.getId());
        if (optInterfaceAttributePo.isPresent() && ! attributePo.equalsWith(optInterfaceAttributePo.get())) {
            OntologyInterfaceAttributePo interfaceAttributePo = optInterfaceAttributePo.get();
            OntologyInterfaceAttributeDto originAttributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(interfaceAttributePo, originAttributeDto);
            attributeChangedDto.setOriginAttributeDto(originAttributeDto);
            attributeChangedDto.setOperStatus(OperStatusEnum.UPDATED.getCode());

            OntologyInterfaceAttributeDto attributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(attributePo, attributeDto);
            attributeChangedDto.setAttributeDto(attributeDto);

            return attributeChangedDto;
        }

        return null;
    }

    private void updateObjectTypeAttribute(OntologyObjectTypeAttributePo objectTypeAttributePo, OntologyInterfaceAttributeVo interfaceAttributeVo) {
        // 当接口属性中文名修改时，使用这个接口的对象，要检测是否用到了这个接口属性，如果type=2则需要用修改后的接口属性刷新对象属性表中的中文名
        if (null != objectTypeAttributePo.getInterfaceType()
                && AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue() == objectTypeAttributePo.getInterfaceType()) {
            if (StringUtils.isNotBlank(objectTypeAttributePo.getAttributeName())
                    && StringUtils.isNotBlank(interfaceAttributeVo.getLabel())
                    && ! objectTypeAttributePo.getAttributeName().equals(interfaceAttributeVo.getLabel())) {
                objectTypeAttributePo.setAttributeName(interfaceAttributeVo.getLabel());
                attributeRepository.save(objectTypeAttributePo);
            } else if (StringUtils.isBlank(objectTypeAttributePo.getAttributeName())
                    && StringUtils.isNotBlank(interfaceAttributeVo.getLabel())) {
                objectTypeAttributePo.setAttributeName(interfaceAttributeVo.getLabel());
                attributeRepository.save(objectTypeAttributePo);
            }
        }
    }

    @Transactional
    public List<OntologyInterfaceDto> updateStatus(List<InterfaceSearchVo> searchVoList) {
        List<OntologyInterfaceDto> interfacePoList = new ArrayList<>();
        for (InterfaceSearchVo searchVo : searchVoList) {
            OntologyInterfacePo interfacePo = SpringJdbcUtil.getEntityManager().find(OntologyInterfacePo.class, searchVo.getInterfaceId());
            if (null != interfacePo) {
                interfacePo.setStatus(searchVo.getStatus());
                OntologyInterfaceDto interfaceDto = new OntologyInterfaceDto();
                BeanUtils.copyProperties(SpringJdbcUtil.getEntityManager().merge(interfacePo), interfaceDto);
                interfacePoList.add(interfaceDto);

                // 继承接口的对象同步启用/禁用
                List<OntologyObjectTypePo> extendedPoList = objectTypeRepository.findExtendedByInterfaceId(searchVo.getInterfaceId());
                for (OntologyObjectTypePo extendedPo : extendedPoList) {
                    extendedPo.setStatus(searchVo.getStatus());
                }
                objectTypeRepository.saveAllAndFlush(extendedPoList);
            }
        }

        return interfacePoList;
    }

    @Transactional
    public List<OntologyInterfaceDto> delete(List<InterfaceSearchVo> searchVoList) {
        List<OntologyInterfaceDto> interfaceDtoList = new ArrayList<>();
        for (InterfaceSearchVo searchVo : searchVoList) {
            OntologyInterfacePo interfacePo = SpringJdbcUtil.getEntityManager().find(OntologyInterfacePo.class, searchVo.getInterfaceId());
            if (null != interfacePo) {
                interfacePo.setOperStatus(OperStatusEnum.DELETED.getCode());
                OntologyInterfaceDto interfaceDto = new OntologyInterfaceDto();
                BeanUtils.copyProperties(SpringJdbcUtil.getEntityManager().merge(interfacePo), interfaceDto);
                interfaceDtoList.add(interfaceDto);

                // 删除接口时继承接口的对象取消继承关系
                objectTypeRepository.removeOntologyObjectTypeInterface(interfacePo.getId());
                attributeRepository.removeInterfaceByInterfaceId(interfacePo.getId());
            }
        }

        return interfaceDtoList;
    }

    public Page<OntologyInterfaceDto> explorePage(InterfaceSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyInterfacePo> interfacePage = interfaceRepository.findAll((Specification<OntologyInterfacePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            predicates.add(cb.notEqual(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = "%" + searchVo.getKeyword().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name").as(String.class)), keyword);
                Predicate labelLike = cb.like(cb.lower(root.get("label").as(String.class)), keyword);
                predicates.add(cb.or(nameLike, labelLike));
            }
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        final List<OntologyInterfaceDto> collect = interfacePage.getContent().stream().map(interfacePo -> {
            OntologyInterfaceDto interfaceDto = new OntologyInterfaceDto();
            BeanUtils.copyProperties(interfacePo, interfaceDto);
            return interfaceDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, interfacePage.getPageable(), interfacePage.getTotalElements());
    }

    public Page<OntologyObjectTypeDto> exploreExtendedPage(InterfaceSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyObjectTypePo> objectTypePage = objectTypeRepository.findAll((Specification<OntologyObjectTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("interfaceId").as(String.class), searchVo.getInterfaceId()));
            predicates.add(cb.notEqual(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        final List<OntologyObjectTypeDto> collect = objectTypePage.getContent().stream().map(objectTypePo -> {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo, objectTypeDto);
            return objectTypeDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, objectTypePage.getPageable(), objectTypePage.getTotalElements());
    }

    public OntologyInterfaceViewDto findById(String interfaceId) {
        OntologyInterfacePo ontologyInterfacePo = interfaceRepository.findById(interfaceId).orElseThrow(() -> new RuntimeException("接口不存在"));
        OntologyInterfaceViewDto interfaceViewDto = new OntologyInterfaceViewDto();
        BeanUtils.copyProperties(ontologyInterfacePo, interfaceViewDto);
        interfaceViewDto.setAttributeList(findAllAttributes(interfaceId));
        interfaceViewDto.setExtendedList(findAllExtended(interfaceId));
        interfaceViewDto.setConstraintList(findAllConstraints(interfaceId));
        return interfaceViewDto;
    }

    public List<OntologyInterfaceViewDto> findAll(String ontologyId) {
        List<OntologyInterfacePo> interfacePolist = interfaceRepository.findAllByOntologyId(ontologyId);
        List<OntologyInterfaceViewDto> interfaceDtolist = interfacePolist.stream().map(interfacePo -> {
            OntologyInterfaceViewDto interfaceDto = new OntologyInterfaceViewDto();
            BeanUtils.copyProperties(interfacePo, interfaceDto);
            interfaceDto.setAttributeList(findAllAttributes(interfacePo.getId()));
            interfaceDto.setExtendedList(findAllExtended(interfacePo.getId()));
            interfaceDto.setConstraintList(findAllConstraints(interfacePo.getId()));
            return interfaceDto;
        }).collect(Collectors.toList());

        return interfaceDtolist;
    }

    public List<OntologyInterfaceAttributeDto> findAllAttributes(String interfaceId) {
        List<OntologyInterfaceAttributePo> attributePoList = interfaceAttributeRepository.findAllByInterfaceId(interfaceId);
        return attributePoList.stream().map(interfaceAttributePo -> {
            OntologyInterfaceAttributeDto interfaceAttributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(interfaceAttributePo, interfaceAttributeDto);
            return interfaceAttributeDto;
        }).collect(Collectors.toList());
    }

    public List<OntologyInterfaceAttributeDto> findAllAttributes(String interfaceId, String attributeLabel) {
        if (StringUtils.isBlank(attributeLabel)) {
            return findAllAttributes(interfaceId);
        }

        List<OntologyInterfaceAttributePo> attributePoList = interfaceAttributeRepository.findAll(
                Specification.where(InterfaceAttributeSpecifications.equalInterfaceId(interfaceId))
                        .and(InterfaceAttributeSpecifications.notDeleted()
                        .and(InterfaceAttributeSpecifications.labelContains(attributeLabel))));
        return attributePoList.stream().map(interfaceAttributePo -> {
            OntologyInterfaceAttributeDto interfaceAttributeDto = new OntologyInterfaceAttributeDto();
            BeanUtils.copyProperties(interfaceAttributePo, interfaceAttributeDto);
            return interfaceAttributeDto;
        }).collect(Collectors.toList());
    }

    public List<OntologyObjectTypeDto> findAllExtended(String interfaceId) {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findExtendedByInterfaceId(interfaceId);
        return objectTypePoList.stream().map(objectTypePo -> {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo, objectTypeDto);
            return objectTypeDto;
        }).collect(Collectors.toList());
    }

    public List<OntologyInterfaceConstraintDto> findAllConstraints(String interfaceId) {
        List<OntologyInterfaceConstraintPo> constraintPoList = interfaceConstraintRepository.findAllByInterfaceId(interfaceId);
        return constraintPoList.stream().map(constraintPo -> {
            OntologyInterfaceConstraintDto constraintDto = new OntologyInterfaceConstraintDto();
            BeanUtils.copyProperties(constraintPo, constraintDto);

            OntologyInterfacePo ontologyInterfacePo = interfaceRepository.findById(interfaceId).orElseThrow(() -> new RuntimeException("接口不存在"));
            constraintDto.setInterfaceIcon(ontologyInterfacePo.getIcon());
            constraintDto.setInterfaceName(ontologyInterfacePo.getName());
            constraintDto.setInterfaceLabel(ontologyInterfacePo.getLabel());

            OntologyObjectTypePo ontologyObjectTypePo = objectTypeRepository.findById(constraintDto.getObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
            constraintDto.setObjectTypeIcon(ontologyObjectTypePo.getIcon());
            constraintDto.setObjectTypeName(ontologyObjectTypePo.getObjectTypeName());
            constraintDto.setObjectTypeLabel(ontologyObjectTypePo.getObjectTypeLabel());

            return constraintDto;
        }).collect(Collectors.toList());
    }

    public InterfaceDuplicateResult checkExists(String ontologyId, String interfaceName, String interfaceLabel) {
        boolean nameExists = false;
        boolean labelExists = false;

        if (StringUtils.isNotBlank(interfaceName)) {
            nameExists = interfaceRepository.countAllByName(ontologyId, interfaceName) > 0;
        }
        if (StringUtils.isNotBlank(interfaceLabel)) {
            labelExists = interfaceRepository.countAllByLabel(ontologyId, interfaceLabel) > 0;
        }

        return new InterfaceDuplicateResult(nameExists, labelExists);
    }

    @Transactional
    public Object removeObj(String interfaceId, List<String> objectIds) {
        objectTypeRepository.removeOntologyObjectTypeInterfaceById(interfaceId, objectIds);
        attributeRepository.removeInterfaceByObjectIds(objectIds);

        return null;
    }

    public static class InterfaceDuplicateResult {
        private final boolean nameExists;
        private final boolean labelExists;

        public InterfaceDuplicateResult(boolean nameExists, boolean labelExists) {
            this.nameExists = nameExists;
            this.labelExists = labelExists;
        }

        public boolean isNameExists() {
            return nameExists;
        }

        public boolean isLabelExists() {
            return labelExists;
        }
    }
}

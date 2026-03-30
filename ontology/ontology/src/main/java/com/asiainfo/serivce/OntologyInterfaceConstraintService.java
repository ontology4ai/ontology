package com.asiainfo.serivce;

import com.asiainfo.common.*;
import com.asiainfo.dto.*;
import com.asiainfo.po.OntologyInterfaceConstraintPo;
import com.asiainfo.po.OntologyInterfacePo;
import com.asiainfo.po.OntologyLinkTypePo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.repo.OntologyLinkTypeRepository;
import com.asiainfo.repo.OntologyInterfaceConstraintRepository;
import com.asiainfo.repo.OntologyInterfaceRepository;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.vo.operation.OntologyInterfaceConstraintVo;
import io.github.suanchou.utils.StringUtil;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyInterfaceConstraintService {

    @Autowired
    OntologyInterfaceConstraintRepository interfaceConstraintRepository;

    @Autowired
    OntologyInterfaceRepository interfaceRepository;

    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;

    @Autowired
    OntologyLinkTypeRepository linkTypeRepository;

    @Transactional
    public OntologyInterfaceConstraintPo save(OntologyInterfaceConstraintVo interfaceConstraintVo) {
        OntologyInterfaceConstraintPo interfaceConstraintPo = new OntologyInterfaceConstraintPo();
        BeanUtils.copyProperties(interfaceConstraintVo, interfaceConstraintPo);
        interfaceConstraintPo.setId(StringUtil.genUuid(32));
        interfaceConstraintPo.setStatus(StatusEnum.ENABLED.getCode());
        interfaceConstraintPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        interfaceConstraintPo.setOperStatus(OperStatusEnum.CREATED.getCode());
        return interfaceConstraintRepository.save(interfaceConstraintPo);
    }

    @Transactional
    public void delete(OntologyInterfaceConstraintVo interfaceConstraintVo) {
        // TODO 删除关系约束时与之映射的对象关系取消继承
        OntologyInterfaceConstraintPo interfaceConstraintPo = interfaceConstraintRepository.findById(interfaceConstraintVo.getId()).orElseThrow(() -> new RuntimeException("接口约束不存在"));;
        interfaceConstraintRepository.deleteByConstraintId(interfaceConstraintVo.getId());

        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findExtendedByInterfaceId(interfaceConstraintVo.getInterfaceId());
        List<OntologyLinkTypePo> LinkTypePoList = getExtendedLinkTypeList(interfaceConstraintPo.getInterfaceId(), interfaceConstraintPo.getObjectTypeId());

        List<OntologyObjectTypePo> cancelObjectTypePoList = new ArrayList<>();
        for (OntologyObjectTypePo ontologyObjectTypePo : objectTypePoList) {
            for (OntologyLinkTypePo ontologyLinkTypePo : LinkTypePoList) {
                if (ontologyLinkTypePo.getSourceObjectTypeId().equals(ontologyObjectTypePo.getId())
                        || ontologyLinkTypePo.getTargetObjectTypeId().equals(ontologyObjectTypePo.getId())) {
                    ontologyObjectTypePo.setInterfaceId(null);
                    ontologyObjectTypePo.setInterfaceIcon(null);
                    cancelObjectTypePoList.add(ontologyObjectTypePo);
                }
            }
        }

        objectTypeRepository.saveAllAndFlush(cancelObjectTypePoList);
    }

    @Transactional
    public Object update(OntologyInterfaceConstraintVo interfaceConstraintVo) {
        OntologyInterfaceConstraintPo interfaceConstraintPo = interfaceConstraintRepository.findById(interfaceConstraintVo.getId()).orElseThrow(() -> new RuntimeException("接口约束不存在"));;
        interfaceConstraintPo.setConstraintType(interfaceConstraintVo.getConstraintType());
        interfaceConstraintPo.setConstraintRelation(interfaceConstraintVo.getConstraintRelation());
        interfaceConstraintPo.setObjectTypeId(interfaceConstraintVo.getObjectTypeId());
        interfaceConstraintPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        interfaceConstraintPo.setOperStatus(OperStatusEnum.UPDATED.getCode());
        return interfaceConstraintRepository.save(interfaceConstraintPo);
    }

    public List<OntologyLinkTypeDto> analysisAffected(OntologyInterfaceConstraintVo interfaceConstraintVo) {
        // TODO 分析更新影响 关系不满足约束的
        List<OntologyLinkTypePo> linkTypePoList = getExtendedLinkTypeList(interfaceConstraintVo.getInterfaceId(), interfaceConstraintVo.getObjectTypeId());

        List<OntologyLinkTypeDto> linkTypeDtoList = new ArrayList<>();
        for (OntologyLinkTypePo ontologyLinkTypePo : linkTypePoList) {
            if (!isMatched(interfaceConstraintVo, ontologyLinkTypePo)) {
                OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
                BeanUtils.copyProperties(ontologyLinkTypePo, linkTypeDto);
                OntologyObjectTypePo sourceObjectTypePo = objectTypeRepository.findById(linkTypeDto.getSourceObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));;
                OntologyObjectTypeDto sourceObjectTypeDto = new OntologyObjectTypeDto();
                BeanUtils.copyProperties(sourceObjectTypePo, sourceObjectTypeDto);
                linkTypeDto.setSourceObjectType(sourceObjectTypeDto);

                OntologyObjectTypePo targetObjectTypePo = objectTypeRepository.findById(linkTypeDto.getTargetObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
                OntologyObjectTypeDto targetObjectTypeDto = new OntologyObjectTypeDto();
                BeanUtils.copyProperties(targetObjectTypePo, targetObjectTypeDto);
                linkTypeDto.setTargetObjectType(targetObjectTypeDto);

                linkTypeDto.setMatchConstraint(false);
                if (targetObjectTypeDto.getId().equals(interfaceConstraintVo.getObjectTypeId())) {
                    linkTypeDto.setConstraintRelation(interfaceConstraintVo.getConstraintRelation());
                } else {
                    linkTypeDto.setConstraintRelation(ConstraintRelationEnum.reverse(interfaceConstraintVo.getConstraintRelation()));
                }

                linkTypeDtoList.add(linkTypeDto);
            }
        }

        return linkTypeDtoList;
    }

    public boolean isMatched(OntologyInterfaceConstraintPo interfaceConstraintPo, OntologyLinkTypePo ontologyLinkTypePo) {
        OntologyInterfaceConstraintVo interfaceConstraintVo = new OntologyInterfaceConstraintVo();
        BeanUtils.copyProperties(interfaceConstraintPo, interfaceConstraintVo);

        return isMatched(interfaceConstraintVo, ontologyLinkTypePo);
    }

    private boolean isMatched(OntologyInterfaceConstraintVo interfaceConstraintVo, OntologyLinkTypePo ontologyLinkTypePo) {
        /*
        接口约束， 对象B, 类型是ONE
        target = B   关系 link_type=1 且link_method=1 一对一
                或
        source = B  关系 link_type=1 且link_method=1 一对一
                link_type=1 且link_method=2 一对多
        接口约束，对象B 类型是多
        target = B   关系 link_type=1 且link_method=2 一对多
                link_type=2 多对多
                source = B 关系  ink_type=2 多对多
        */

        if (ConstraintTypeEnum.OBJECT.getValue() == interfaceConstraintVo.getConstraintType()
                && ConstraintRelationEnum.ONE2ONE.getValue().equals(interfaceConstraintVo.getConstraintRelation())) {
            if (ontologyLinkTypePo.getTargetObjectTypeId().equals(interfaceConstraintVo.getObjectTypeId())
                    && ontologyLinkTypePo.getLinkType() == 1 && ontologyLinkTypePo.getLinkMethod()==1) {
                return true;
            }
            else if (ontologyLinkTypePo.getSourceObjectTypeId().equals(interfaceConstraintVo.getObjectTypeId())
                    && ontologyLinkTypePo.getLinkType() == 1
                    && (ontologyLinkTypePo.getLinkMethod()== 1 || ontologyLinkTypePo.getLinkMethod() == 2)) {
                return true;
            } else {
                return false;
            }
        } else if (ConstraintTypeEnum.OBJECT.getValue() == interfaceConstraintVo.getConstraintType()
                && ConstraintRelationEnum.ONE2MANY.getValue().equals(interfaceConstraintVo.getConstraintRelation())) {
            if (ontologyLinkTypePo.getTargetObjectTypeId().equals(interfaceConstraintVo.getObjectTypeId())
                    && ((ontologyLinkTypePo.getLinkType() == 1 && ontologyLinkTypePo.getLinkMethod() == 2) || ontologyLinkTypePo.getLinkType() == 2)) {
                return true;
            }
            else if (ontologyLinkTypePo.getSourceObjectTypeId().equals(interfaceConstraintVo.getObjectTypeId())
                    && ontologyLinkTypePo.getLinkType() == 2) {
                return true;
            } else {
                return false;
            }
        }

        return true;
    }

    private List<OntologyLinkTypePo> getExtendedLinkTypeList(String interfaceId, String constraintTypeId) {
        OntologyInterfacePo interfacePo = interfaceRepository.findById(interfaceId).orElseThrow(() -> new RuntimeException("接口不存在"));;;
        List<OntologyObjectTypePo> extendedList = objectTypeRepository.findExtendedByInterfaceId(interfaceId);

        List<OntologyLinkTypePo> linkTypePoList = new ArrayList<>();
        for (OntologyObjectTypePo extendedPo : extendedList) {
            linkTypePoList.addAll(linkTypeRepository.findLinkListByIds(interfacePo.getOntologyId(), extendedPo.getId(), constraintTypeId));
            linkTypePoList.addAll(linkTypeRepository.findLinkListByIds(interfacePo.getOntologyId(), constraintTypeId, extendedPo.getId()));
        }

        return linkTypePoList;
    }

    public Page<OntologyInterfaceConstraintDto> explorePage(OntologyInterfaceConstraintVo interfaceConstraintVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(interfaceConstraintVo.getPage() - 1, 0), interfaceConstraintVo.getLimit() > 0 ? interfaceConstraintVo.getLimit() : 10, sort);

        Page<OntologyInterfaceConstraintPo> interfaceConstraintPage = interfaceConstraintRepository.findAll((Specification<OntologyInterfaceConstraintPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("interfaceId").as(String.class), interfaceConstraintVo.getInterfaceId()));
            predicates.add(cb.notEqual(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        final List<OntologyInterfaceConstraintDto> collect = interfaceConstraintPage.getContent().stream().map(interfaceConstraintPo -> {
            OntologyInterfaceConstraintDto interfaceConstraintDto = new OntologyInterfaceConstraintDto();
            BeanUtils.copyProperties(interfaceConstraintPo, interfaceConstraintDto);

            OntologyInterfacePo interfacePo = interfaceRepository.findById(interfaceConstraintPo.getInterfaceId()).orElseThrow(() -> new RuntimeException("接口不存在"));
            interfaceConstraintDto.setInterfaceIcon(interfacePo.getIcon());
            interfaceConstraintDto.setInterfaceName(interfacePo.getName());
            interfaceConstraintDto.setInterfaceLabel(interfacePo.getLabel());

            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(interfaceConstraintPo.getObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
            interfaceConstraintDto.setObjectTypeIcon(objectTypePo.getIcon());
            interfaceConstraintDto.setObjectTypeName(objectTypePo.getObjectTypeName());
            interfaceConstraintDto.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());

            return interfaceConstraintDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, interfaceConstraintPage.getPageable(), interfaceConstraintPage.getTotalElements());
    }

    public OntologyInterfaceConstraintViewDto findByConstraintId(String constraintId) {
        OntologyInterfaceConstraintPo constraintPo = interfaceConstraintRepository.findById(constraintId).orElseThrow(() -> new RuntimeException("接口约束不存在"));
        OntologyInterfaceConstraintViewDto constraintViewDto = new OntologyInterfaceConstraintViewDto();
        BeanUtils.copyProperties(constraintPo, constraintViewDto);

        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(constraintPo.getObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
        constraintViewDto.setObjectTypeName(objectTypePo.getObjectTypeName());

        List<OntologyLinkTypePo> linkTypePoList = getExtendedLinkTypeList(constraintPo.getInterfaceId(), constraintPo.getObjectTypeId());

        List<OntologyLinkTypeDto> linkTypeDtoList = linkTypePoList.stream().map(ontologyLinkTypePo -> {
            OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
            BeanUtils.copyProperties(ontologyLinkTypePo, linkTypeDto);
            OntologyObjectTypePo sourceObjectTypePo = objectTypeRepository.findById(linkTypeDto.getSourceObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
            OntologyObjectTypeDto sourceObjectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(sourceObjectTypePo, sourceObjectTypeDto);
            linkTypeDto.setSourceObjectType(sourceObjectTypeDto);

            OntologyObjectTypePo targetObjectTypePo = objectTypeRepository.findById(linkTypeDto.getTargetObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
            OntologyObjectTypeDto targetObjectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(targetObjectTypePo, targetObjectTypeDto);
            linkTypeDto.setTargetObjectType(targetObjectTypeDto);

            // 标识关系是否满足约束
            linkTypeDto.setMatchConstraint(isMatched(constraintPo, ontologyLinkTypePo));
            if (targetObjectTypeDto.getId().equals(constraintPo.getObjectTypeId())) {
                linkTypeDto.setConstraintRelation(constraintPo.getConstraintRelation());
            } else {
                linkTypeDto.setConstraintRelation(ConstraintRelationEnum.reverse(constraintPo.getConstraintRelation()));
            }

            return linkTypeDto;
        }).collect(Collectors.toList());

        constraintViewDto.setExtendedLinkList(linkTypeDtoList);

        return constraintViewDto;
    }

}

package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONArray;
import com.asiainfo.common.AttributeInterfaceTypeEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.dto.*;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.FieldInfo;
import com.asiainfo.feign.request.OntologyRefreshRequest;
import com.asiainfo.feign.response.ObjectTypeAttributeSuggestResponse;
import com.asiainfo.modo.app.datasource.rela.ModoTeamDs;
import com.asiainfo.modo.app.datasource.rela.ModoTeamDsRepo;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.operation.AttributeVo;
import com.asiainfo.vo.operation.ObjectTypeVo;
import com.asiainfo.vo.search.ObjectTypeSearchVo;
import io.github.suanchou.utils.JsonUtil;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/22
 * @Description
 */

@Service
@Slf4j
public class ObjectTypeService {

    @Autowired
    OntologyRepository ontologyRepository;
    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    OntologyObjectTypeGroupService objectTypeGroupService;
    @Autowired
    ObjectTypeAttributeService objectTypeAttributeService;
    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;
    @Autowired
    OntologyObjectTypeActionRepository actionRepository;
    @Autowired
    OntologyLinkTypeRepository linkTypeRepository;
    @Autowired
    LogicTypeService logicTypeService;
    @Autowired
    ObjectTypeActionService actionService;
    @Autowired
    OntologyApiService apiService;
    @Autowired
    DataosFeign dataosFeign;

    @Autowired
    OntologyInterfaceRepository interfaceRepository;
    @Autowired
    OntologyInterfaceAttributeRepository interfaceAttributeRepository;

    @Autowired
    ModoTeamDsRepo modoTeamDsRepo;


    @Transactional
    public Object list(ObjectTypeSearchVo searchVo) {

        Sort sort = Sort.by(
                Sort.Order.desc("lastUpdate"),
                Sort.Order.asc("objectTypeName"),
                Sort.Order.desc("id")
        );
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyObjectTypePo> ontologyPage = objectTypeRepository.findAll((Specification<OntologyObjectTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate labelLike = cb.like(cb.lower(root.get("objectTypeLabel").as(String.class)), "%" + keyword + "%");
                Predicate nameLike = cb.like(cb.lower(root.get("objectTypeName").as(String.class)), "%" + keyword + "%");
                predicates.add(cb.or(labelLike, nameLike));
            }

            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                Subquery<OntologyPo> subquery = query.subquery(OntologyPo.class);
                Root<OntologyPo> ontologyRoot = subquery.from(OntologyPo.class);
                subquery.select(ontologyRoot)
                        .where(
                                cb.equal(ontologyRoot.get("id"), root.get("ontologyId")),
                                cb.equal(ontologyRoot.get("workspaceId"), searchVo.getWorkspaceId())
                        );
                predicates.add(cb.exists(subquery));
            }
            if (searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            if (searchVo.getPublished() == null) {
                predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()));
            } else if (searchVo.getPublished()) {
                predicates.add(cb.equal(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
            } else {
                predicates.add(cb.lt(root.get("operStatus").as(Integer.class), OperStatusEnum.PUBLISHED.getCode()));
                predicates.add(cb.equal(root.get("status").as(Integer.class), StatusEnum.ENABLED.getCode()));
            }
            predicates.add(cb.isNull(root.get("linkTypeId")));

            if (StringUtils.isNotBlank(searchVo.getInterfaceId())) {
                predicates.add(cb.equal(root.get("interfaceId").as(String.class), searchVo.getInterfaceId()));
            }
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        List<String> interfaceIds = ontologyPage.getContent()
                .stream()
                .map(OntologyObjectTypePo::getInterfaceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<String, OntologyInterfacePo> maps = new HashMap<>();

        if (!interfaceIds.isEmpty()) {
            List<OntologyInterfacePo> allById = interfaceRepository.findAllById(interfaceIds);

            for (OntologyInterfacePo interfacePo : allById) {
                maps.put(interfacePo.getId(), interfacePo);
            }

        }

        final List<OntologyObjectTypeListDto> collect = ontologyPage.getContent().stream().map(objectTypePo -> {
            OntologyObjectTypeListDto typeDto = new OntologyObjectTypeListDto();
            BeanUtils.copyProperties(objectTypePo, typeDto);
            if (StringUtils.isNotBlank(objectTypePo.getInterfaceId())) {
                OntologyInterfacePo interfacePo = maps.get(objectTypePo.getInterfaceId());
                if (interfacePo != null) {
                    typeDto.setInterfaceId(objectTypePo.getInterfaceId());
                    typeDto.setInterfaceIcon(interfacePo.getIcon());
                    typeDto.setInterfaceLabel(interfacePo.getLabel());
                }
            }

            if (StringUtils.isNotBlank(objectTypePo.getApiId())) {
                typeDto.setApiInfo(apiService.findById(objectTypePo.getApiId()));
            }

            return typeDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, ontologyPage.getPageable(), ontologyPage.getTotalElements());
    }

    @Transactional
    public Object save(ObjectTypeVo objectTypeVo) {
        OntologyObjectTypePo typePo = new OntologyObjectTypePo();
        BeanUtils.copyProperties(objectTypeVo, typePo);
        if (StringUtils.isBlank(typePo.getDsName())) {
            Optional<ModoTeamDs> modoTeamDsOptional = modoTeamDsRepo.findById(typePo.getDsId());
            modoTeamDsOptional.ifPresent(teamDs -> typePo.setDsName(teamDs.getDsName()));
        }
        if (StringUtils.isBlank(typePo.getIcon())) {
            typePo.setIcon("IconDataResDirColor");
        }
        typePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        typePo.setOperStatus(OperStatusEnum.CREATED.getCode());
        typePo.setId(StringUtil.genUuid(32));

        if (StringUtils.isNotBlank(objectTypeVo.getInterfaceId())) {
            Optional<OntologyInterfacePo> optInterfacePo = interfaceRepository.findById(objectTypeVo.getInterfaceId());
            if (optInterfacePo.isPresent()) {
                typePo.setInterfaceIcon(optInterfacePo.get().getIcon());
            }
        }
        if (Objects.isNull(typePo.getDsType())) {
            typePo.setDsType(0);
        }

        objectTypeRepository.save(typePo);
        List<OntologyObjectTypeAttributePo> attirbutePoList;
//        if (StringUtils.isBlank(typePo.getDsId())) {
//            attirbutePoList = objectTypeAttributeService.saveAttributesPoListWithoutDs(typePo, objectTypeVo);
//        } else {
        attirbutePoList = objectTypeAttributeService.saveAttributesPoList(typePo, objectTypeVo);
//        }
        // 同步对象类型
        // 启用状态才同步
        if (typePo.getStatus() == StatusEnum.ENABLED.getCode()) {
            updateOntologyObject(typePo, attirbutePoList);
        }

        return true;
    }


    @Transactional
    public boolean update(String id, ObjectTypeVo objectTypeVo) {

        OntologyObjectTypePo typePo = objectTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的对象类型不存在"));

        BeanUtils.copyProperties(objectTypeVo, typePo, "ontologyId", "status");
        if (objectTypeVo.getStatus() != null) {
            typePo.setStatus(objectTypeVo.getStatus());
        }
        // 如果没有绑定数据源，则设置为禁用
        if (StringUtils.isBlank(typePo.getDsId())) {
            typePo.setStatus(StatusEnum.DISABLED.getCode());
        }
        if (StringUtils.isBlank(typePo.getIcon())) {
            typePo.setIcon("IconDataResDirColor");
        }
        typePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        typePo.setOperStatus(OperStatusEnum.UPDATED.getCode());

        if (StringUtils.isNotBlank(objectTypeVo.getInterfaceId())) {
            Optional<OntologyInterfacePo> optInterfacePo = interfaceRepository.findById(objectTypeVo.getInterfaceId());
            if (optInterfacePo.isPresent()) {
                typePo.setInterfaceIcon(optInterfacePo.get().getIcon());
            }
        }
        if (Objects.isNull(typePo.getDsType())) {
            typePo.setDsType(0);
        }

        objectTypeRepository.save(typePo);
        updateAttr(id, objectTypeVo);

        List<OntologyObjectTypeAttributePo> attirbutePoList = objectTypeVo.getAttributes()
                .stream()
                .map(dto -> {
                    OntologyObjectTypeAttributePo po = new OntologyObjectTypeAttributePo();
                    BeanUtils.copyProperties(dto, po);
                    return po;
                }).collect(Collectors.toList());
        // 同步对象类型
        // 启用状态调用更新接口，禁用状态调用删除接口
        if (typePo.getStatus() == StatusEnum.ENABLED.getCode()) {
            updateOntologyObject(typePo, attirbutePoList);
        } else {
            deleteOntologyObject(Collections.singletonList(typePo), attirbutePoList);
        }

        return true;
    }

    @Transactional
    public boolean changeStatus(ObjectTypeVo objectTypeVo) {
        if (objectTypeVo.getIds() == null || objectTypeVo.getIds().isEmpty()) {
            throw new RuntimeException("对象类型ID不能为空");
        }
//        List<String> error = new ArrayList<>();
//        for (String id : objectTypeVo.getIds()) {
//            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(id).orElse(null);
//            if (objectTypePo != null) {
//                if (StringUtils.isEmpty(objectTypeVo.getDsId()) && objectTypeVo.getStatus() == 1) {
//                    error.add(objectTypePo.getObjectTypeLabel());
//                }
//            }
//        }
//        if (!error.isEmpty()) {
//            throw new RuntimeException(String.format("%s配置错误，无法变更状态", String.join(",", error)));
//        }

        for (String id : objectTypeVo.getIds()) {
            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(id).orElse(null);
            if (objectTypePo == null) {
                log.warn("[{}]对象类型为空，忽略操作", id);
                continue;
            }
            // 接口禁用时继承对象不可启用
            if (null != objectTypePo.getInterfaceId()) {
                OntologyInterfacePo ontologyInterfacePo = interfaceRepository.findById(objectTypePo.getInterfaceId()).orElse(null);
                if (null != ontologyInterfacePo
                        && StatusEnum.DISABLED.getCode() == ontologyInterfacePo.getStatus()
                        && StatusEnum.ENABLED.getCode() == objectTypeVo.getStatus()) {
                    log.warn("[{}]继承的接口为禁用状态，无法启用", objectTypePo.getObjectTypeName());
                    continue;
                }
            }

            objectTypePo.setStatus(objectTypeVo.getStatus());
            objectTypePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            objectTypePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
            objectTypeRepository.save(objectTypePo);
        }

        // 同步对象类型
        if (objectTypeVo.getStatus() == 1) { // 启用
            updateOntologyObject(objectTypeVo.getIds());
        } else if (objectTypeVo.getStatus() == 0) { // 禁用
            deleteOntologyObject(objectTypeVo.getIds());
        } else {
            throw new RuntimeException("状态值错误");
        }

        return true;
    }

    @Transactional
    public boolean delete(List<String> ids, boolean cascadeDelete) {
        // 删除前先查询出属性数据
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findByIdIn(ids);
        List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableAndEnableByTypeIds(ids);
        // 删除对象类型
        objectTypeRepository.softDeleteByIds(ids);
        // 删除属性
        attributeRepository.softDeleteByObjectIds(ids);
        // 删除关系类型
        linkTypeRepository.softDeleteByObjectIds(ids);
        if (cascadeDelete) {
            // 删除动作类型
            actionService.deleteByObjectTypeIds(ids);
            // 删除逻辑类型
            logicTypeService.deleteByObjectTypeIds(ids);
        } else {
            // 禁用动作类型
            actionService.disableByObjectTypeIds(ids);
            // 禁用逻辑类型
            logicTypeService.disableByObjectTypeIds(ids);
        }
        deleteOntologyObject(objectTypePoList, attributePoList);

        return true;
    }

    @Transactional
    public OntologyObjectTypeDto get(String id) {
        OntologyObjectTypePo typePo = objectTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的对象类型不存在"));
        OntologyObjectTypeDto typeDto = new OntologyObjectTypeDto();
        BeanUtils.copyProperties(typePo, typeDto);

        if (StringUtils.isNotBlank(typePo.getApiId())) {
            typeDto.setApiInfo(apiService.findById(typePo.getApiId()));
        }

        if (StringUtils.isNotBlank(typePo.getInterfaceId())) {
            OntologyInterfacePo interfacePo = interfaceRepository.findById(typePo.getInterfaceId()).orElse(null);

            if (interfacePo != null) {
                typeDto.setInterfaceId(interfacePo.getId());
                typeDto.setInterfaceIcon(interfacePo.getIcon());
                typeDto.setInterfaceLabel(interfacePo.getLabel());
            }
        }

        // 对象类型属性
        List<OntologyObjectTypeAttributePo> attributes = attributeRepository.findByObjectTypeIdAndSyncStatusLessThan(typePo.getId(), ChangeStatusEnum.DELETED.getCode());
        List<OntologyObjectTypeAttributeDto> attributeDtos = attributes.stream().map(OntologyObjectTypeAttributeDto::transform).collect(Collectors.toList());
        typeDto.setAttributes(attributeDtos);

        // 对象类型动作
        List<OntologyObjectTypeActionPo> actionPos = actionRepository.findByObjectTypeIdAndSyncStatusLessThan(typePo.getId(), ChangeStatusEnum.DELETED.getCode());
        List<OntologyObjectTypeActionDto> actionDtos = actionPos.stream().map(po -> {
            OntologyObjectTypeActionDto transform = OntologyObjectTypeActionDto.transform(po);
            return transform;
        }).collect(Collectors.toList());
        typeDto.setActions(actionDtos);

        // 对象类型分组
//        List<OntologyObjectTypeGroupDto> groupDtos = typePo.getGroups().stream().map(groupPo -> OntologyObjectTypeGroupDto.transform(groupPo, false)).collect(Collectors.toList());
//        typeDto.setGroups(groupDtos);

        // 对象类型关系
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAll();
        Map<String, OntologyObjectTypeDto> objectTypeDtoMap = new HashMap<>();
        for (OntologyObjectTypePo po : objectTypePoList) {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(po, objectTypeDto);
            objectTypeDtoMap.put(po.getId(), objectTypeDto);
        }
        List<OntologyLinkTypePo> linkTypePoList = linkTypeRepository.findAvailableByObjectTypeId(typePo.getOntologyId(), typePo.getId());
        List<OntologyLinkTypeDto> linkTypeDtoList = linkTypePoList.stream()
                .map(linkTypePo -> {
                    OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
                    BeanUtils.copyProperties(linkTypePo, linkTypeDto);
                    linkTypeDto.setSourceObjectType(objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId()));
                    linkTypeDto.setTargetObjectType(objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId()));
                    return linkTypeDto;
                }).collect(Collectors.toList());
        typeDto.setLinkTypes(linkTypeDtoList);

        return typeDto;
    }

    @Transactional
    public Object findAll(ObjectTypeSearchVo searchVo) {

        List<OntologyObjectTypePo> ontologyPage = objectTypeRepository.findAll((Specification<OntologyObjectTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate labelLike = cb.like(cb.lower(root.get("objectTypeLabel").as(String.class)), "%" + keyword + "%");
                Predicate nameLike = cb.like(cb.lower(root.get("objectTypeName").as(String.class)), "%" + keyword + "%");
                predicates.add(cb.or(labelLike, nameLike));
            }

            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            // 如果有“status”条件，就根据条件查询，没有则查询“启用”状态的数据
            if (searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            } else {
                predicates.add(cb.equal(root.get("status").as(Integer.class), StatusEnum.ENABLED.getCode()));
            }
            if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            predicates.add(cb.isNull(root.get("linkTypeId")));
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            if (StringUtils.isNotBlank(searchVo.getInterfaceId())) {
                predicates.add(cb.equal(root.get("interfaceId").as(String.class), searchVo.getInterfaceId()));
            }

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        });

        List<String> interfaceIds = ontologyPage.stream()
                .map(OntologyObjectTypePo::getInterfaceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<String, OntologyInterfacePo> maps = new HashMap<>();

        if (!interfaceIds.isEmpty()) {
            List<OntologyInterfacePo> allById = interfaceRepository.findAllById(interfaceIds);

            for (OntologyInterfacePo interfacePo : allById) {
                maps.put(interfacePo.getId(), interfacePo);
            }

        }

        final List<OntologyObjectTypeListDto> collect = ontologyPage.stream().map(objectTypePo -> {
            OntologyObjectTypeListDto typeDto = new OntologyObjectTypeListDto();
//            List<OntologyObjectTypeGroupPo> groups = objectTypePo.getGroups();

            BeanUtils.copyProperties(objectTypePo, typeDto);
            if (StringUtils.isNotBlank(objectTypePo.getInterfaceId())) {
                OntologyInterfacePo interfacePo = maps.get(objectTypePo.getInterfaceId());
                if (interfacePo != null) {
                    typeDto.setInterfaceId(objectTypePo.getInterfaceId());
                    typeDto.setInterfaceIcon(interfacePo.getIcon());
                    typeDto.setInterfaceLabel(interfacePo.getLabel());
                }
            }
//            typeDto.setGroups(groups.stream().map(groupPo -> OntologyObjectTypeGroupDto.transform(groupPo, false)).collect(Collectors.toList()));
            return typeDto;
        }).collect(Collectors.toList());

        return collect;
    }

    public List<OntologyObjectTypeDto> findAll() {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAll((Specification<OntologyObjectTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
            predicates.add(cb.isNull(root.get("linkTypeId")));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        });

        return objectTypePoList.stream()
                .map(po -> {
                    OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
                    BeanUtils.copyProperties(po, objectTypeDto);
                    return objectTypeDto;
                }).collect(Collectors.toList());
    }

    @Transactional
    public boolean updateAttr(String id, ObjectTypeVo objectTypeVo) {

        OntologyObjectTypePo typePo = objectTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的对象类型不存在"));

        List<OntologyObjectTypeAttributePo> attributePos = attributeRepository.findAvaliableByTypeId(id);

        Map<String, OntologyObjectTypeAttributePo> attributePoMap = new HashMap<>();
        for (OntologyObjectTypeAttributePo attributePo : attributePos) {
            attributePoMap.put(attributePo.getId(), attributePo);
        }
        List<AttributeVo> attributes = objectTypeVo.getAttributes();

        for (AttributeVo attribute : attributes) {
            if (StringUtils.isNotBlank(attribute.getId())) {
                OntologyObjectTypeAttributePo attributePo = attributePoMap.get(attribute.getId());
                if (attributePo != null) {
                    attributePo.setSharedAttributeId(attribute.getSharedAttributeId());
                    attributePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
                    attributePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
                    attributePo.setFieldType(attribute.getFieldType());
                    attributePo.setAttributeName(attribute.getAttributeName());
                    attributePo.setAttributeLabel(attribute.getAttributeLabel());
                    attributePo.setFieldName(attribute.getFieldName());
                    attributePo.setIsPrimaryKey(attribute.getIsPrimaryKey());
                    attributePo.setAttributeInst(attribute.getAttributeInst());
                    attributePo.setAttributeDesc(attribute.getAttributeDesc());
                    attributePo.setIsTitle(attribute.getIsTitle());

                    if (attribute.getStatus() != null) {
                        attributePo.setStatus(attribute.getStatus());
                    }
                    if (StringUtils.isBlank(attribute.getFieldType())) {
                        attributePo.setStatus(StatusEnum.DISABLED.getCode());
                    }
                    attributePo.setInterfaceAttrId(attribute.getInterfaceAttrId());
                    attributePo.setInterfaceType(attribute.getInterfaceType());
                    attributeRepository.save(attributePo);
                    attributePoMap.remove(attribute.getId());
                    continue;
                }
            }
            OntologyObjectTypeAttributePo attributePo = new OntologyObjectTypeAttributePo();
            attributePo.setId(StringUtil.genUuid(32));
            attributePo.setObjectTypeId(typePo.getOntologyId());
            attributePo.setSharedAttributeId(attribute.getSharedAttributeId());
            attributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
            attributePo.setOperStatus(OperStatusEnum.CREATED.getCode());
            attributePo.setFieldType(attribute.getFieldType());
            attributePo.setAttributeName(attribute.getAttributeName());
            attributePo.setAttributeLabel(attribute.getAttributeLabel());
            attributePo.setFieldName(attribute.getFieldName());
            attributePo.setIsPrimaryKey(attribute.getIsPrimaryKey());
            attributePo.setIsTitle(attribute.getIsTitle());
            attributePo.setAttributeInst(attribute.getAttributeInst());
            attributePo.setAttributeDesc(attribute.getAttributeDesc());
            attributePo.setObjectTypeId(id);
            if (attribute.getStatus() != null) {
                attributePo.setStatus(attribute.getStatus());
            } else {
                attributePo.setStatus(StatusEnum.ENABLED.getCode());
            }
            if (StringUtils.isBlank(attribute.getFieldType())) {
                attributePo.setStatus(StatusEnum.DISABLED.getCode());
            }
            attributeRepository.save(attributePo);

        }
        if (!attributePoMap.isEmpty()) {
            attributeRepository.softDeleteByIds(new ArrayList<>(attributePoMap.keySet()));
        }

        return true;
    }

    @Transactional
    public boolean updateAttrStatus(AttributeVo attributeVo) {
        if (attributeVo.getIds() == null || attributeVo.getIds().isEmpty()) {
            throw new RuntimeException("对象类型属性ID不能为空");
        }

        String objectTypeId = null;
        for (String id : attributeVo.getIds()) {
            OntologyObjectTypeAttributePo attributePo = attributeRepository.findById(id).orElse(null);
            if (attributePo != null) {
                objectTypeId = attributePo.getObjectTypeId();
                attributePo.setStatus(attributeVo.getStatus());
                attributePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
                attributeRepository.save(attributePo);
            }
        }

        // 同步对象类型
        if (objectTypeId != null) {
            OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(objectTypeId).orElseThrow(() -> new RuntimeException("对象类型不存在"));
            List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableAndEnableByTypeId(objectTypeId);
            updateOntologyObject(objectTypePo, attributePoList);
        }

        return true;
    }

    @Transactional
    public boolean deleteAttribute(AttributeVo attributeVo) {
        if (attributeVo.getIds() == null || attributeVo.getIds().isEmpty()) {
            throw new RuntimeException("对象类型属性ID不能为空");
        }
        attributeRepository.softDeleteByIds(attributeVo.getIds());

        // 同步对象类型
        OntologyObjectTypeAttributePo attributePo = attributeRepository.findById(attributeVo.getIds().get(0)).orElseThrow(() -> new RuntimeException("对象类型属性不存在"));
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(attributePo.getObjectTypeId()).orElseThrow(() -> new RuntimeException("对象类型不存在"));
        List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableAndEnableByTypeId(attributePo.getObjectTypeId());
        updateOntologyObject(objectTypePo, attributePoList);

        return true;
    }

    public Object suggestAttribute(List<String> fieldNames) {
        ObjectTypeAttributeSuggestResponse response = dataosFeign.suggestAttribute(fieldNames);
        if ("failed".equals(response.getStatus())) {
            throw new RuntimeException(response.getMessage());
        }
        Map<String, Object> data = response.getData();
        return data.get("mapping");
    }

    @Transactional
    public boolean updateAttrInfo(String id, AttributeVo attributeVo) {

        OntologyObjectTypeAttributePo attributePo = attributeRepository.findById(id).orElseThrow(() -> new RuntimeException());

        attributePo.setAttributeName(attributeVo.getAttributeName());
        attributePo.setAttributeLabel(attributeVo.getAttributeLabel());
        attributePo.setFieldName(attributeVo.getFieldName());
        attributePo.setIsTitle(attributeVo.getIsTitle());
        attributePo.setAttributeInst(attributeVo.getAttributeInst());
        attributePo.setAttributeDesc(attributeVo.getAttributeDesc());
        attributePo.setIsPrimaryKey(attributeVo.getIsPrimaryKey());
        attributePo.setStatus(attributeVo.getStatus());
        attributeRepository.save(attributePo);
        return true;
    }

    public Map<String, Object> checkExists(String ontologyId, String objectTypeName, String objectTypeLabel) {
        if (StringUtils.isNotBlank(objectTypeName)) {
            boolean exists = objectTypeRepository.existsByObjectTypeNameAndOntologyIdAndSyncStatusLessThan(objectTypeName, ontologyId, ChangeStatusEnum.DELETED.getCode());
            Map<String, Object> result = new HashMap<>();
            result.put("exists", exists);
            result.put("ontologyId", ontologyId);
            result.put("objectTypeName", objectTypeName);
            return result;
        } else if (StringUtils.isNotBlank(objectTypeLabel)) {
            boolean exists = objectTypeRepository.existsByObjectTypeLabelAndOntologyIdAndSyncStatusLessThan(objectTypeLabel, ontologyId, ChangeStatusEnum.DELETED.getCode());
            Map<String, Object> result = new HashMap<>();
            result.put("exists", exists);
            result.put("ontologyId", ontologyId);
            result.put("objectTypeLabel", objectTypeLabel);
            return result;
        } else {
            throw new RuntimeException("英文名和中文名不能同时为空");
        }
    }

    public OntologyObjectTypeGraphDto expandByObjectTypeId(String objectTypeId) {
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findFirstById(objectTypeId).orElseThrow(() -> new RuntimeException("本体对象类型不存在"));
        OntologyObjectTypeGraphDto objectTypeGraphDto = new OntologyObjectTypeGraphDto();
        BeanUtils.copyProperties(objectTypePo, objectTypeGraphDto);

        objectTypeGraphDto.setPrimaryKey(objectTypeAttributeService.getPrimaryKeyByObjectTypeId(objectTypeId));

        List<OntologyObjectTypeAttributePo> objectTypeAttributePoList = attributeRepository.findByObjectTypeIdAndSyncStatusIsNot(objectTypeId, 3);
        final List<OntologyObjectTypeAttributeDto> collect = objectTypeAttributePoList.stream().map(objectTypeAttributePo -> {
            OntologyObjectTypeAttributeDto dto = new OntologyObjectTypeAttributeDto();
            BeanUtils.copyProperties(objectTypeAttributePo, dto);
            return dto;
        }).collect(Collectors.toList());
        objectTypeGraphDto.setTypeAttributes(collect);

        return objectTypeGraphDto;
    }

    private void deleteOntologyObject(List<String> ids) {
        List<OntologyRefreshRequest> reqs = new ArrayList<>();
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findByIdIn(ids);

        if (objectTypePoList.isEmpty()) {
            throw new RuntimeException("对象类型不存在");
        }
        OntologyPo ontologyPo = ontologyRepository.findById(objectTypePoList.get(0).getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));

        for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
            List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableAndEnableByTypeId(objectTypePo.getId());
            OntologyRefreshRequest request = buildSyncParam(ontologyPo, objectTypePo, attributePoList, false);
            if (request != null) {
                reqs.add(request);
            }
        }
        log.info("调用删除对象类型接口请求: {}", JSONArray.toJSON(reqs));
        Map<String, Object> param = new HashMap<>();
        param.put("ontology_json", reqs);
        Map<String, Object> response = dataosFeign.deleteOntologyObject(param);
        log.info("调用删除对象类型接口返回: {}", response);
    }

    private void deleteOntologyObject(List<OntologyObjectTypePo> objectTypePoList, List<OntologyObjectTypeAttributePo> attributePoList) {
        if (objectTypePoList.isEmpty()) {
            throw new RuntimeException("对象类型不存在");
        }
        OntologyPo ontologyPo = ontologyRepository.findById(objectTypePoList.get(0).getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));

        Map<String, List<OntologyObjectTypeAttributePo>> map = new HashMap<>();
        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
            List<OntologyObjectTypeAttributePo> list = map.computeIfAbsent(attributePo.getObjectTypeId(), k -> new ArrayList<>());
            list.add(attributePo);
        }
        List<OntologyRefreshRequest> reqs = new ArrayList<>();
        for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
            List<OntologyObjectTypeAttributePo> list = map.get(objectTypePo.getId());
            OntologyRefreshRequest request = buildSyncParam(ontologyPo, objectTypePo, list, false);
            if (request != null) {
                reqs.add(request);
            }
        }
        log.info("调用删除对象类型接口请求: {}", JSONArray.toJSON(reqs));
        Map<String, Object> param = new HashMap<>();
        param.put("ontology_json", reqs);
        Map<String, Object> response = dataosFeign.deleteOntologyObject(param);
        log.info("调用删除对象类型接口返回: {}", response);
    }

    private void updateOntologyObject(List<String> ids) {
        List<OntologyRefreshRequest> reqs = new ArrayList<>();
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findByIdIn(ids);

        if (objectTypePoList.isEmpty()) {
            throw new RuntimeException("对象类型不存在");
        }
        OntologyPo ontologyPo = ontologyRepository.findById(objectTypePoList.get(0).getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));

        for (OntologyObjectTypePo objectTypePo : objectTypePoList) {
            List<OntologyObjectTypeAttributePo> attributePoList = attributeRepository.findAvaliableAndEnableByTypeId(objectTypePo.getId());
            OntologyRefreshRequest request = buildSyncParam(ontologyPo, objectTypePo, attributePoList, true);
            if (request != null) {
                reqs.add(request);
            }
        }
        log.info("调用更新对象类型接口请求: {}", JSONArray.toJSON(reqs));
        Map<String, Object> param = new HashMap<>();
        param.put("ontology_json", reqs);
        Map<String, Object> response = dataosFeign.updateOntologyObject(param);
        log.info("调用更新对象类型接口返回: {}", response);
    }

    public void updateOntologyObject(OntologyObjectTypePo objectTypePo, List<OntologyObjectTypeAttributePo> attributePoList) {
        OntologyPo ontologyPo = ontologyRepository.findById(objectTypePo.getOntologyId()).orElseThrow(() -> new RuntimeException("本体不存在"));

        List<OntologyRefreshRequest> reqs = new ArrayList<>();
        OntologyRefreshRequest request = buildSyncParam(ontologyPo, objectTypePo, attributePoList, true);
        if (request != null) {
            reqs.add(request);
        }
        log.info("调用更新对象类型接口请求: {}", JSONArray.toJSON(reqs));
        Map<String, Object> param = new HashMap<>();
        param.put("ontology_json", reqs);
        Map<String, Object> response = dataosFeign.updateOntologyObject(param);
        log.info("调用更新对象类型接口返回: {}", response);
    }

    @Transactional
    public void deleteByLinkTypeId(List<String> linkTypeIds) {
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findByLinkTypeId(linkTypeIds);
        if (!objectTypePoList.isEmpty()) {
            delete(objectTypePoList.stream().map(OntologyObjectTypePo::getId).collect(Collectors.toList()), true);
        }
    }

    private OntologyRefreshRequest buildSyncParam(OntologyPo ontologyPo, OntologyObjectTypePo objectTypePo, List<OntologyObjectTypeAttributePo> attributePoList, boolean isUpdateObject) {
        if (ontologyPo == null || ontologyPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("同步的本体不存在");
        }

        OntologyRefreshRequest request = new OntologyRefreshRequest();
        request.setOntology_name(ontologyPo.getOntologyName());
        request.setDoc(objectTypePo.getObjectTypeLabel());
        request.setTable_name(objectTypePo.getTableName());
        request.setName(objectTypePo.getObjectTypeName());
        request.setPre_sql(objectTypePo.getCustomSql());

        if (isUpdateObject) {
            if (attributePoList == null || attributePoList.isEmpty()) {
                throw new RuntimeException("没有启用的属性");
            }
            // 过滤调未启用的属性
            attributePoList = attributePoList.stream()
                    .filter(po -> StatusEnum.ENABLED.getCode() == po.getStatus())
                    .collect(Collectors.toList());
            if (attributePoList.isEmpty()) {
                throw new RuntimeException("没有启用的属性");
            }
        }

        if (attributePoList != null) {
            List<FieldInfo> fieldInfos = attributePoList.stream()
                    .filter(attributePo -> StringUtils.isNotBlank(attributePo.getFieldName()))
                    .map(attributePo -> {
                        FieldInfo fieldInfo = new FieldInfo();
                        fieldInfo.setName(attributePo.getFieldName());
                        fieldInfo.setType(attributePo.getFieldType());
                        fieldInfo.setPrimary_key(attributePo.getIsPrimaryKey() == 1);
                        fieldInfo.setProperty(attributePo.getAttributeName());
                        if (isUpdateObject
                                && null != attributePo.getInterfaceType()
                                && Objects.equals(AttributeInterfaceTypeEnum.EXTEND_DYNAMIC.getValue(), attributePo.getInterfaceType())) {
                            Optional<OntologyInterfaceAttributePo> optInterfaceAttributePo = interfaceAttributeRepository.findById(attributePo.getInterfaceAttrId());
                            optInterfaceAttributePo.ifPresent(ontologyInterfaceAttributePo -> fieldInfo.setProperty(ontologyInterfaceAttributePo.getLabel()));
                        }
                        return fieldInfo;
                    }).collect(Collectors.toList());
            request.setFields(fieldInfos);
        }

        int status = 0;
        if (objectTypePo.getSyncStatus() < ChangeStatusEnum.DELETED.getCode() && objectTypePo.getStatus() == StatusEnum.ENABLED.getCode()) {
            status = 1;
        }
        request.setStatus(status);

        return request;
    }
}

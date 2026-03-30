package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.LinkDirectionEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.*;
import com.asiainfo.po.OntologyLinkTypePo;
import com.asiainfo.po.OntologyLinkTypeTagPo;
import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.po.OntologyTagPo;
import com.asiainfo.repo.OntologyLinkTypeRepository;
import com.asiainfo.repo.OntologyLinkTypeTagRepository;
import com.asiainfo.repo.OntologyObjectTypeAttributeRepository;
import com.asiainfo.repo.OntologyTagRepository;
import com.asiainfo.vo.operation.AttributeVo;
import com.asiainfo.vo.operation.ObjectTypeVo;
import com.asiainfo.vo.operation.OntologyLinkTypeVo;
import com.asiainfo.vo.operation.OntologyTagVo;
import com.asiainfo.vo.search.LinkTypeSearchVo;
import com.asiainfo.vo.search.OntologyTagSearchVo;
import io.github.suanchou.utils.BeanConvertUtil;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/29
 * @Description
 */

@Slf4j
@Service
public class LinkTypeService {

    @Autowired
    OntologyLinkTypeRepository linkTypeRepository;

    @Autowired
    ObjectTypeService objectTypeService;

    @Autowired
    OntologyObjectTypeAttributeRepository attributeRepository;

    @Autowired
    OntologyTagRepository tagRepository;

    @Autowired
    OntologyLinkTypeTagRepository linkTypeTagRepository;

    @Autowired
    DatasourceService datasourceService;

    @Transactional
    public boolean save(OntologyLinkTypeVo linkTypeVo) {

        OntologyLinkTypePo linkTypePo = new OntologyLinkTypePo();
        BeanUtils.copyProperties(linkTypeVo, linkTypePo);
        linkTypePo.setStatus(StatusEnum.ENABLED.getCode());
        linkTypePo.setId(StringUtil.genUuid(32));
        linkTypePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        linkTypePo.setOperStatus(OperStatusEnum.CREATED.getCode());

        linkTypeRepository.save(linkTypePo);

        // 先单个保存
        for (String tagId : linkTypeVo.getSourceTag()) {
            OntologyLinkTypeTagPo tagPo = new OntologyLinkTypeTagPo();
            tagPo.setId(StringUtil.genUuid(32));
            tagPo.setLinkTypeId(linkTypePo.getId());
            tagPo.setTagId(tagId);
            tagPo.setLinkDirect(LinkDirectionEnum.SOURCE.getDirection());
            linkTypeTagRepository.save(tagPo);
        }
        for (String tagId : linkTypeVo.getTargetTag()) {
            OntologyLinkTypeTagPo tagPo = new OntologyLinkTypeTagPo();
            tagPo.setId(StringUtil.genUuid(32));
            tagPo.setLinkTypeId(linkTypePo.getId());
            tagPo.setTagId(tagId);
            tagPo.setLinkDirect(LinkDirectionEnum.TARGET.getDirection());
            linkTypeTagRepository.save(tagPo);
        }

        // 如果是多对对关系，增加一个虚拟对象
        if (linkTypeVo.getLinkType() == 2) {
            // 创建一个虚拟对象类型
            createVitureObject(linkTypeVo, linkTypePo);
        }

        return true;
    }

    @Transactional
    public boolean update(String id, OntologyLinkTypeVo linkTypeVo) {

        OntologyLinkTypePo linkTypePo = linkTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的连接类型不存在"));

        BeanUtils.copyProperties(linkTypeVo, linkTypePo, "status", "ontologyId");

        if (linkTypeVo.getStatus() != null) {
            linkTypePo.setStatus(linkTypeVo.getStatus());
        }

        linkTypePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        linkTypePo.setOperStatus(OperStatusEnum.UPDATED.getCode());
        linkTypeRepository.save(linkTypePo);

        // 先删除，再单个保存
        linkTypeTagRepository.deleteByLinkTypeId(linkTypePo.getId());
        for (String tagId : linkTypeVo.getSourceTag()) {
            OntologyLinkTypeTagPo tagPo = new OntologyLinkTypeTagPo();
            tagPo.setId(StringUtil.genUuid(32));
            tagPo.setLinkTypeId(linkTypePo.getId());
            tagPo.setTagId(tagId);
            tagPo.setLinkDirect(LinkDirectionEnum.SOURCE.getDirection());
            linkTypeTagRepository.save(tagPo);
        }
        for (String tagId : linkTypeVo.getTargetTag()) {
            OntologyLinkTypeTagPo tagPo = new OntologyLinkTypeTagPo();
            tagPo.setId(StringUtil.genUuid(32));
            tagPo.setLinkTypeId(linkTypePo.getId());
            tagPo.setTagId(tagId);
            tagPo.setLinkDirect(LinkDirectionEnum.TARGET.getDirection());
            linkTypeTagRepository.save(tagPo);
        }

        if (linkTypeVo.getLinkType() == 2) {
            // 先删除虚拟对象，在新增
            objectTypeService.deleteByLinkTypeId(Collections.singletonList(id));
            createVitureObject(linkTypeVo, linkTypePo);
        }

        return true;
    }

    @Transactional
    public boolean changeStatus(OntologyLinkTypeVo linkTypeVo) {
        if (linkTypeVo.getIds() == null || linkTypeVo.getIds().isEmpty()) {
            throw new RuntimeException("连接类型ID不能为空");
        }
        for (String id : linkTypeVo.getIds()) {
            OntologyLinkTypePo linkTypePo = linkTypeRepository.findById(id).orElse(null);
            if (linkTypePo != null) {
                linkTypePo.setStatus(linkTypeVo.getStatus());
                linkTypeRepository.save(linkTypePo);
            }
        }
        return true;
    }

    @Transactional
    public boolean delete(List<String> ids) {
        linkTypeRepository.softDeleteByIds(ids);
        objectTypeService.deleteByLinkTypeId(ids);
        return true;
    }

    @Transactional
    public Object list(LinkTypeSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyLinkTypePo> linkTypePoPage = linkTypeRepository.findAll((Specification<OntologyLinkTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                String pattern = "%" + keyword + "%";

                Predicate linkTypeLabelOrName = cb.or(
                        cb.like(cb.lower(root.get("sourceLabel").as(String.class)), pattern),
                        cb.like(cb.lower(root.get("sourceName").as(String.class)), pattern),
                        cb.like(cb.lower(root.get("targetLabel").as(String.class)), pattern),
                        cb.like(cb.lower(root.get("targetName").as(String.class)), pattern)
                );

                Subquery<String> sourceObjectTypeSub = query.subquery(String.class);
                Root<OntologyObjectTypePo> sourceObjectTypeRoot = sourceObjectTypeSub.from(OntologyObjectTypePo.class);
                sourceObjectTypeSub.select(sourceObjectTypeRoot.get("id"))
                        .where(
                                cb.lt(sourceObjectTypeRoot.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()),
                                cb.like(cb.lower(sourceObjectTypeRoot.get("objectTypeLabel").as(String.class)), pattern)
                        );

                Subquery<String> targetObjectTypeSub = query.subquery(String.class);
                Root<OntologyObjectTypePo> targetObjectTypeRoot = targetObjectTypeSub.from(OntologyObjectTypePo.class);
                targetObjectTypeSub.select(targetObjectTypeRoot.get("id"))
                        .where(
                                cb.lt(targetObjectTypeRoot.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()),
                                cb.like(cb.lower(targetObjectTypeRoot.get("objectTypeLabel").as(String.class)), pattern)
                        );

                Predicate sourceObjectTypeHit = root.get("sourceObjectTypeId").in(sourceObjectTypeSub);
                Predicate targetObjectTypeHit = root.get("targetObjectTypeId").in(targetObjectTypeSub);

                predicates.add(cb.or(linkTypeLabelOrName, sourceObjectTypeHit, targetObjectTypeHit));
            }

            if (StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
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

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        // 查询所有对象类型和对象属性
        List<OntologyObjectTypeDto> objectTypeList = objectTypeService.findAll();
        Map<String, OntologyObjectTypeDto> objectTypeMap = new HashMap<>();
        for (OntologyObjectTypeDto objectTypeDto : objectTypeList) {
            objectTypeMap.put(objectTypeDto.getId(), objectTypeDto);
        }

        List<OntologyLinkTypePo> pageContent = linkTypePoPage.getContent();
        List<String> linkTypeIds = pageContent.stream().map(OntologyLinkTypePo::getId).collect(Collectors.toList());

        Map<String, List<String>> sourceTagMap = new HashMap<>();
        Map<String, List<String>> targetTagMap = new HashMap<>();
        if (!linkTypeIds.isEmpty()) {
            List<OntologyLinkTypeTagPo> linkTypeTags = linkTypeTagRepository.findByLinkTypeIdIn(linkTypeIds);
            for (OntologyLinkTypeTagPo linkTypeTagPo : linkTypeTags) {
                Map<String, List<String>> currentMap = LinkDirectionEnum.SOURCE.getDirection().equals(linkTypeTagPo.getLinkDirect())
                        ? sourceTagMap
                        : targetTagMap;
                currentMap.computeIfAbsent(linkTypeTagPo.getLinkTypeId(), key -> new ArrayList<>()).add(linkTypeTagPo.getTagId());
            }
        }

        List<OntologyLinkTypeDto> collect = pageContent.stream().map(linkTypePo -> {

            OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
            BeanUtils.copyProperties(linkTypePo, linkTypeDto);
            linkTypeDto.setSourceObjectType(objectTypeMap.get(linkTypePo.getSourceObjectTypeId()));
            linkTypeDto.setTargetObjectType(objectTypeMap.get(linkTypePo.getTargetObjectTypeId()));
            linkTypeDto.setSourceTag(sourceTagMap.getOrDefault(linkTypePo.getId(), Collections.emptyList()));
            linkTypeDto.setTargetTag(targetTagMap.getOrDefault(linkTypePo.getId(), Collections.emptyList()));

            return linkTypeDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, linkTypePoPage.getPageable(), linkTypePoPage.getTotalElements());
    }

    @Transactional
    public Object get(String id) {

        OntologyLinkTypePo linkTypePo = linkTypeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的连接类型不存在"));

        OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
        BeanUtils.copyProperties(linkTypePo, linkTypeDto);

        linkTypeDto.setSourceObjectType(objectTypeService.get(linkTypePo.getSourceObjectTypeId()));
        linkTypeDto.setTargetObjectType(objectTypeService.get(linkTypePo.getTargetObjectTypeId()));

        if (StringUtils.isNotBlank(linkTypePo.getSourceAttributeId())) {
            OntologyObjectTypeAttributePo attributePo = attributeRepository.findById(linkTypePo.getSourceAttributeId()).orElse(null);
            OntologyObjectTypeAttributeDto attributeDto = OntologyObjectTypeAttributeDto.transform(attributePo);
            linkTypeDto.setSourceAttribute(attributeDto);
        }

        if (StringUtils.isNotBlank(linkTypePo.getTargetAttributeId())) {
            OntologyObjectTypeAttributePo targetAttributePo = attributeRepository.findById(linkTypePo.getTargetAttributeId()).orElse(null);
            OntologyObjectTypeAttributeDto targetAttributeDto = OntologyObjectTypeAttributeDto.transform(targetAttributePo);
            linkTypeDto.setTargetAttribute(targetAttributeDto);
        }

        List<String> sourceTag = linkTypeTagRepository.findByLinkTypeIdAndLinkDirect(linkTypeDto.getId(), LinkDirectionEnum.SOURCE.getDirection())
                .stream()
                .map(OntologyLinkTypeTagPo::getTagId)
                .collect(Collectors.toList());
        linkTypeDto.setSourceTag(sourceTag);

        List<String> targetTag = linkTypeTagRepository.findByLinkTypeIdAndLinkDirect(linkTypeDto.getId(), LinkDirectionEnum.TARGET.getDirection())
                .stream()
                .map(OntologyLinkTypeTagPo::getTagId)
                .collect(Collectors.toList());
        linkTypeDto.setTargetTag(targetTag);

        if (linkTypeDto.getMiddleDsId() != null) {
            TeamDsDto teamDs = datasourceService.getTeamDs(linkTypeDto.getMiddleDsId());
            if (teamDs != null) {
                linkTypeDto.setMiddleDsName(teamDs.getModoTeamDs().getDsName());
                linkTypeDto.setMiddleDsLabel(teamDs.getLabel());
            }
        }

        return linkTypeDto;
    }

    public boolean saveTag(OntologyTagVo tagVo) {
        OntologyTagPo tagPo = new OntologyTagPo();
        BeanUtils.copyProperties(tagVo, tagPo);
        if (tagPo.getId() == null) {
            tagPo.setId(StringUtil.genUuid(32));
        }
        tagPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());

        tagRepository.save(tagPo);
        return true;
    }

    public List<OntologyTagDto> listTag(OntologyTagSearchVo searchVo) {
        List<OntologyTagPo> queryList = tagRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate like = cb.like(cb.lower(root.get("tagLabel").as(String.class)), keyword);
                predicates.add(like);
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        });

        List<OntologyTagDto> result = queryList.stream().map(po -> {
            OntologyTagDto tagDto = new OntologyTagDto();
            BeanUtils.copyProperties(po, tagDto);
            return tagDto;
        }).collect(Collectors.toList());

        return result;
    }

    private void createVitureObject(OntologyLinkTypeVo linkTypeVo, OntologyLinkTypePo linkTypePo) {
        String sourceObjectTypeId = linkTypeVo.getSourceObjectTypeId();
        String targetObjectTypeId = linkTypeVo.getTargetObjectTypeId();
        OntologyObjectTypeDto sourceObjectTypeDto = objectTypeService.get(sourceObjectTypeId);
        OntologyObjectTypeDto targetObjectTypeDto = objectTypeService.get(targetObjectTypeId);

        ObjectTypeVo objectTypeVo = new ObjectTypeVo();
        objectTypeVo.setOntologyId(linkTypeVo.getOntologyId());
        String objectTypeName = sourceObjectTypeDto.getObjectTypeName() + "_" + targetObjectTypeDto.getObjectTypeName() + "_" + StringUtil.genUuid(2);
        objectTypeVo.setObjectTypeName(objectTypeName);
        objectTypeVo.setObjectTypeLabel(objectTypeName);
        objectTypeVo.setObjectTypeDesc(objectTypeName);
        objectTypeVo.setDsId(linkTypeVo.getMiddleDsId());
        objectTypeVo.setDsSchema(linkTypeVo.getMiddleDsSchema());
        objectTypeVo.setTableName(linkTypeVo.getMiddleTableName());
        objectTypeVo.setLinkTypeId(linkTypePo.getId());
        objectTypeVo.setOwnerId(linkTypeVo.getOwnerId());
        objectTypeVo.setWorkspaceId(linkTypeVo.getWorkspaceId());

        List<AttributeVo> attributes = new ArrayList<>();

        OntologyObjectTypeAttributePo sourceAttributePo = attributeRepository.findById(linkTypeVo.getSourceAttributeId()).orElseThrow(() -> new RuntimeException("左侧属性不存在"));
        AttributeVo sourceAttributeVo = new AttributeVo();
        sourceAttributeVo.setFieldName(linkTypeVo.getMiddleSourceField());
        sourceAttributeVo.setAttributeName(linkTypeVo.getMiddleSourceField());
        sourceAttributeVo.setAttributeLabel(linkTypeVo.getMiddleSourceField());
        sourceAttributeVo.setIsTitle(0);
        sourceAttributeVo.setIsPrimaryKey(0);
        sourceAttributeVo.setFieldType(sourceAttributePo.getFieldType());
        attributes.add(sourceAttributeVo);

        OntologyObjectTypeAttributePo targetAttributePo = attributeRepository.findById(linkTypeVo.getTargetAttributeId()).orElseThrow(() -> new RuntimeException("右侧属性不存在"));
        AttributeVo targetAttributeVo = new AttributeVo();
        targetAttributeVo.setFieldName(linkTypeVo.getMiddleTargetField());
        targetAttributeVo.setAttributeName(linkTypeVo.getMiddleTargetField());
        targetAttributeVo.setAttributeLabel(linkTypeVo.getMiddleTargetField());
        targetAttributeVo.setIsTitle(0);
        targetAttributeVo.setIsPrimaryKey(0);
        targetAttributeVo.setFieldType(targetAttributePo.getFieldType());
        attributes.add(targetAttributeVo);
        objectTypeVo.setAttributes(attributes);
        objectTypeService.save(objectTypeVo);
    }

    public void tagDelete(String id) {
        Optional<OntologyTagPo> tagPoOptional = tagRepository.findById(id);
        tagPoOptional.ifPresent(ontologyTagPo -> tagRepository.delete(ontologyTagPo));
    }

    public OntologyTagDto findTagById(String id) {
        Optional<OntologyTagPo> tagPoOptional = tagRepository.findById(id);
        return tagPoOptional.map(ontologyTagPo -> BeanConvertUtil.copyBean(ontologyTagPo, OntologyTagDto.class)).orElse(null);
    }


    public Page<OntologyTagDto> search(String keyWord, int offset, int limit) {
        int page = offset / limit;
        Pageable pageable = PageRequest.of(page, limit);
        Specification<OntologyTagPo> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(keyWord)) {
                predicates.add(cb.or(cb.like(root.get("tagName"), "%" + keyWord + "%"), cb.like(root.get("tagLabel"), "%" + keyWord + "%"), cb.like(root.get("tagDesc"), "%" + keyWord + "%")));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<OntologyTagPo> tokenPage = tagRepository.findAll(spec, pageable);
        return tokenPage.map(ontologyTagPo -> BeanConvertUtil.copyBean(ontologyTagPo, OntologyTagDto.class));
    }
}

package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.OntologySharedAttributeDto;
import com.asiainfo.po.*;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.repo.OntologySharedAttributeRepository;
import com.asiainfo.vo.operation.SharedAttributeVo;
import com.asiainfo.vo.search.SharedAttributeCountVo;
import com.asiainfo.vo.search.SharedAttributeSearchVo;
import io.github.suanchou.utils.StringUtil;
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

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/26
 * @Description
 */

@Service
public class SharedAttributeService {


    @Autowired
    OntologySharedAttributeRepository sharedAttributeRepository;

    @Autowired
    OntologyObjectTypeRepository ontologyObjectTypeRepository;

    @Transactional
    public Object search(SharedAttributeSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologySharedAttributePo> attributePage = sharedAttributeRepository.findAll((Specification<OntologySharedAttributePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("attributeName").as(String.class)), "%" + keyword + "%");
                predicates.add(nameLike);
            }

            if(StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if(StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if(searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            if(StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);


        List<String> ids = attributePage.getContent().stream().map(OntologySharedAttributePo::getId).collect(Collectors.toList());

        List<SharedAttributeCountVo> countVos = ontologyObjectTypeRepository.countBySharedAttributeId(ids);

        Map<String, Long> countMap = new HashMap<>();
        for (SharedAttributeCountVo countVo : countVos) {
            countMap.put(countVo.getSharedAttributeId(), countVo.getCount());
        }

        List<OntologySharedAttributeDto> collect = attributePage.getContent().stream().map(ontologySharedAttributePo -> {

            OntologySharedAttributeDto transform = OntologySharedAttributeDto.transform(ontologySharedAttributePo);
            if(countMap.containsKey(ontologySharedAttributePo.getId())) {
                transform.setObjectTypes(countMap.get(ontologySharedAttributePo.getId()));
            }
            return transform;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, attributePage.getPageable(), attributePage.getTotalElements());
    }

    public boolean save(SharedAttributeVo attributeVo) {


        OntologySharedAttributePo attributePo = new OntologySharedAttributePo();
        BeanUtils.copyProperties(attributeVo, attributePo);
        attributePo.setStatus(StatusEnum.ENABLED.getCode());
        attributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        attributePo.setId(StringUtil.genUuid(32));
        attributePo.setAttributeTypes(JSONArray.toJSONString(attributeVo.getAttributeTypes()));
        attributePo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        sharedAttributeRepository.save(attributePo);
        return true;
    }

    public boolean update(String id, SharedAttributeVo sharedAttributeVo) {

        OntologySharedAttributePo attributePo = sharedAttributeRepository.findById(id).orElseThrow(() -> new RuntimeException("对应的共享属性不存在"));

        if(StringUtils.isNotBlank(sharedAttributeVo.getAttributeName())) {
            attributePo.setAttributeName(sharedAttributeVo.getAttributeName());
        }
        if(StringUtils.isNotBlank(sharedAttributeVo.getAttributeLabel())) {
            attributePo.setAttributeLabel(sharedAttributeVo.getAttributeLabel());
        }
        if(sharedAttributeVo.getAttributeTypes() != null) {
            attributePo.setAttributeTypes(JSONArray.toJSONString(sharedAttributeVo.getAttributeTypes()));
        }
        if(sharedAttributeVo.getStatus() != null) {
            attributePo.setStatus(sharedAttributeVo.getStatus());
        }
        attributePo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());

        sharedAttributeRepository.save(attributePo);

        return true;
    }

    @Transactional
    public boolean delete(List<String> ids) {

        sharedAttributeRepository.softDeleteByIds(ids);
        return true;
    }

    @Transactional
    public Object findAll(SharedAttributeSearchVo searchVo) {

        List<OntologySharedAttributePo> attributePos = sharedAttributeRepository.findAll((Specification<OntologySharedAttributePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("attributeName").as(String.class)), "%" + keyword + "%");
                predicates.add(nameLike);
            }

            if(StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if(StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if(searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            if(StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            predicates.add(cb.notEqual(root.get("status").as(Integer.class), StatusEnum.ENABLED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        });

        List<String> ids = attributePos.stream().map(OntologySharedAttributePo::getId).collect(Collectors.toList());

        List<SharedAttributeCountVo> countVos = ontologyObjectTypeRepository.countBySharedAttributeId(ids);

        Map<String, Long> countMap = new HashMap<>();
        for (SharedAttributeCountVo countVo : countVos) {
            countMap.put(countVo.getSharedAttributeId(), countVo.getCount());
        }
        List<OntologySharedAttributeDto> collect = attributePos.stream().map(ontologySharedAttributePo -> {

            OntologySharedAttributeDto transform = OntologySharedAttributeDto.transform(ontologySharedAttributePo);
            if(countMap.containsKey(ontologySharedAttributePo.getId())) {
                transform.setObjectTypes(countMap.get(ontologySharedAttributePo.getId()));
            }
            return transform;
        }).collect(Collectors.toList());
        return collect;

    }
}

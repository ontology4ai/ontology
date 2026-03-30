package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.OntologyObjectTypeGroupDto;
import com.asiainfo.po.OntologyObjectTypeGroupPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.repo.OntologyObjectTypeGroupRepository;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.vo.operation.OntologyObjectTypeGroupVo;
import com.asiainfo.vo.search.OntologyObjectTypeGroupSearchVo;
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

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/20
 * @Description
 */
@Service
@Slf4j
public class OntologyObjectTypeGroupService {

    @Autowired
    OntologyObjectTypeGroupRepository  groupRepository;

    @Autowired
    OntologyObjectTypeRepository objectTypeRepository;

    @Transactional
    public Object searchGroup(OntologyObjectTypeGroupSearchVo searchVo) {

        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyObjectTypeGroupPo> ontologyPage = groupRepository.findAll((Specification<OntologyObjectTypeGroupPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                predicates.add(cb.like(cb.lower(root.get("objectGroupLabel").as(String.class)), "%" + keyword + "%"));
            }

            if(StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if(StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if(StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        List<OntologyObjectTypeGroupDto> collect = ontologyPage.getContent().stream().map(groupPo -> OntologyObjectTypeGroupDto.transform(groupPo, true)).collect(Collectors.toList());
        return new PageImpl<>(collect, ontologyPage.getPageable(), ontologyPage.getTotalElements());

    }

    @Transactional
    public Object saveGroup(OntologyObjectTypeGroupVo groupVo) {

        if(StringUtils.isEmpty(groupVo.getOntologyId()) || StringUtils.isEmpty(groupVo.getObjectGroupLabel())) {
            throw new RuntimeException("参数不合法");
        }

        OntologyObjectTypeGroupPo groupPo = new OntologyObjectTypeGroupPo();
        BeanUtils.copyProperties(groupVo, groupPo);
        groupPo.setId(StringUtil.genUuid(32));
        groupPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        groupRepository.save(groupPo);
        return groupPo;

    }

    @Transactional
    public Boolean deleteGroup(List<String> ids) {

//        for(String id : ids) {
//            OntologyObjectTypeGroupPo groupPo = groupRepository.findById(id).orElse(null);
//            if(groupPo == null) {
//                log.error("删除的对象{}不存在",id);
//                continue;
//            }
//
////            groupPo.getObjectTypes().clear();
//            groupRepository.save(groupPo);
//        }

        groupRepository.softDeleteByIds(ids);
        return true;
    }

    @Transactional
    public Boolean updateGroup(String id, OntologyObjectTypeGroupVo groupVo) {

        OntologyObjectTypeGroupPo groupPo = groupRepository.findById(id).orElse(null);
        if(groupPo == null || groupPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("修改的对象不存在");
        }
        if(StringUtils.isNotBlank(groupVo.getObjectGroupLabel()) && !groupVo.getObjectGroupLabel().equals(groupPo.getObjectGroupLabel())) {

            groupPo.setObjectGroupLabel(groupVo.getObjectGroupLabel());
            groupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
            groupRepository.save(groupPo);
        }
        return true;
    }

    @Transactional
    public Boolean objectAdd(String id, List<String> objectIds) {
        OntologyObjectTypeGroupPo groupPo = groupRepository.findById(id).orElse(null);
        if(groupPo == null || groupPo.getSyncStatus() >= ChangeStatusEnum.DELETED.getCode()) {
            throw new RuntimeException("修改的对象不存在");
        }
        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository.findByIdIn(objectIds);

//        groupPo.setObjectTypes(objectTypePos);
        groupPo.setSyncStatus(ChangeStatusEnum.UPDATED.getCode());
        groupRepository.save(groupPo);
        return true;
    }

    public List<OntologyObjectTypeGroupPo> findByIds(List<String> groupIds) {
        return groupRepository.findByIds(groupIds);
    }

    public Object findAll(OntologyObjectTypeGroupSearchVo searchVo) {

        List<OntologyObjectTypeGroupPo> groupPos = groupRepository.findAll((Specification<OntologyObjectTypeGroupPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<Predicate>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                predicates.add(cb.like(cb.lower(root.get("objectGroupLabel").as(String.class)), "%" + keyword + "%"));
            }

            if(StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if(StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
            }
            if(StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId").as(String.class), searchVo.getOntologyId()));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        });
        List<OntologyObjectTypeGroupDto> collect = groupPos.stream().map(groupPo -> OntologyObjectTypeGroupDto.transform(groupPo, true)).collect(Collectors.toList());

        return collect;
    }
}

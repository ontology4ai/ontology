package com.asiainfo.serivce;

import com.asiainfo.common.CenterEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.dto.OntologyCenterObjectAttributeDto;
import com.asiainfo.dto.OntologyCenterDto;
import com.asiainfo.dto.OntologyCenterObjectTypeDto;
import com.asiainfo.po.OntologyCenterObjectAttributePo;
import com.asiainfo.po.OntologyCenterObjectTypePo;
import com.asiainfo.repo.OntologyCenterObjectAttributeRepository;
import com.asiainfo.repo.OntologyCenterObjectTypeRepository;
import com.asiainfo.vo.search.CenterObjectTypeSearchVo;
import lombok.extern.slf4j.Slf4j;
import io.github.suanchou.utils.SpringJdbcUtil;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CenterObjectTypeService {
    @Autowired
    private OntologyCenterObjectTypeRepository centerObjectTypeRepository;

    @Autowired
    private OntologyCenterObjectAttributeRepository centerObjectAttributeRepository;

    @Autowired
    private OntologyCenterService ontologyCenterService;

    public Page<OntologyCenterObjectTypeDto> explorePage(CenterObjectTypeSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyCenterObjectTypePo> objectTypePage = centerObjectTypeRepository.findAll((Specification<OntologyCenterObjectTypePo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (null != searchVo.getCenterId() && ! CenterEnum.ROOT.getValue().equals(searchVo.getCenterId().toLowerCase())) {
                ArrayList<String> centerIdList = new ArrayList<>();
                centerIdList.add(searchVo.getCenterId());
                List<OntologyCenterDto> centerDtoList = ontologyCenterService.findAllByParentId(searchVo.getCenterId());
                for (OntologyCenterDto dto : centerDtoList) {
                    centerIdList.addAll(dto.toIdList());
                }

                log.debug("--trace-- " + centerIdList);
                // predicates.add(cb.equal(root.get("centerId"), searchVo.getCenterId()));
                predicates.add(root.get("centerId").in(centerIdList));
            }

            predicates.add(cb.notEqual(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();
        }, request);

        final List<OntologyCenterObjectTypeDto> collect = objectTypePage.getContent().stream().map(objectTypePo -> {
            OntologyCenterObjectTypeDto objectTypeDto = new OntologyCenterObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo, objectTypeDto);
            return objectTypeDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, objectTypePage.getPageable(), objectTypePage.getTotalElements());
    }

    @Transactional
    public OntologyCenterObjectTypePo updateStatusByTypeId(String objectTypeId, Integer status) {
        try {
            OntologyCenterObjectTypePo existingObjectTypePo = SpringJdbcUtil.getEntityManager().find(OntologyCenterObjectTypePo.class, objectTypeId);
            if (null != existingObjectTypePo) {
                existingObjectTypePo.setStatus(status);
                return SpringJdbcUtil.getEntityManager().merge(existingObjectTypePo);
            }

            return null;
        } catch (Exception e) {
            throw e;
        }
    }

    public OntologyCenterObjectTypeDto exploreDetail(String objectTypeId) {
        Optional<OntologyCenterObjectTypePo>  objectTypePo = centerObjectTypeRepository.findById(objectTypeId);
        if (objectTypePo.isPresent()) {
            OntologyCenterObjectTypeDto objectTypeDto = new OntologyCenterObjectTypeDto();
            BeanUtils.copyProperties(objectTypePo.get(), objectTypeDto);

            List<OntologyCenterObjectAttributePo> attributePoList = centerObjectAttributeRepository.findByObjectTypeId(objectTypeId);
            List<OntologyCenterObjectAttributeDto> attributeDtoList = attributePoList.stream().map(attributePo -> {
                OntologyCenterObjectAttributeDto attributeDto = new OntologyCenterObjectAttributeDto();
                BeanUtils.copyProperties(attributePo, attributeDto);
                return attributeDto;
            }).collect(Collectors.toList());

            objectTypeDto.setAttributeList(attributeDtoList);

            return objectTypeDto;
        }

        return null;
    }
}

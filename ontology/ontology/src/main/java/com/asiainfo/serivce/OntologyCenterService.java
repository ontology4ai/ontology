package com.asiainfo.serivce;

import com.asiainfo.common.CenterEnum;
import com.asiainfo.common.CenterLeafEnum;
import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.OntologyCenterDto;
import com.asiainfo.po.OntologyCenterObjectAttributePo;
import com.asiainfo.po.OntologyCenterObjectTypePo;
import com.asiainfo.po.OntologyCenterPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.repo.OntologyCenterObjectAttributeRepository;
import com.asiainfo.repo.OntologyCenterObjectTypeRepository;
import com.asiainfo.repo.OntologyCenterRepository;
import com.asiainfo.repo.OntologyObjectTypeAttributeRepository;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.vo.operation.CenterSyncVo;
import com.asiainfo.vo.operation.OntologyCenterVo;
import io.github.suanchou.utils.SpringJdbcUtil;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologyCenterService {
    @Autowired
    OntologyCenterRepository centerRepository;

    @Autowired
    OntologyCenterObjectTypeRepository centerObjectTypeRepository;

    @Autowired
    OntologyCenterObjectAttributeRepository centerObjectAttributeRepository;

    @Autowired
    OntologyObjectTypeRepository ontologyObjectTypeRepository;

    @Autowired
    OntologyObjectTypeAttributeRepository objectTypeAttributeRepository;

    public List<OntologyCenterDto> findAllByParentId(String ParentId) {
        List<OntologyCenterPo> centerPoList = centerRepository.findAllByParentId(ParentId);
        List<OntologyCenterDto> centerDtoList = centerPoList.stream().map(centerPo -> {
            OntologyCenterDto centerDto = new OntologyCenterDto();
            BeanUtils.copyProperties(centerPo, centerDto);
            this.loopLeaf(centerDto);
            return centerDto;
        }).collect(Collectors.toList());

        return centerDtoList;
    }

    private void loopLeaf(OntologyCenterDto centerDto) {
        if (CenterLeafEnum.ROOT.getValue() == centerDto.getIsLeaf()) {
            List<OntologyCenterDto> subCenterDtoList = findAllByParentId(centerDto.getId());
            for (OntologyCenterDto subCenterDto : subCenterDtoList) {
                loopLeaf(subCenterDto);
            }
            centerDto.setChildren(subCenterDtoList);
        }
    }


    @Transactional
    public OntologyCenterPo save(OntologyCenterVo ontologyCenterVo) {
        OntologyCenterPo centerPo = new OntologyCenterPo();
        BeanUtils.copyProperties(ontologyCenterVo, centerPo);
        if (null == centerPo.getParentId() || CenterEnum.ROOT.getValue().equalsIgnoreCase(centerPo.getParentId())) {
            centerPo.setParentId(CenterEnum.ROOT.getValue());
        } else {
            centerRepository.updateLeafStatusById(centerPo.getParentId(), CenterLeafEnum.ROOT.getValue());
        }

        centerPo.setIsLeaf(CenterLeafEnum.LEAF.getValue());
        centerPo.setId(StringUtil.genUuid(32));
        centerPo.setStatus(StatusEnum.ENABLED.getCode());
        centerPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
        centerRepository.save(centerPo);
        return centerPo;
    }

    @Transactional
    public OntologyCenterPo update(OntologyCenterVo ontologyCenterVo) {
        OntologyCenterPo centerPo = new OntologyCenterPo();
        BeanUtils.copyProperties(ontologyCenterVo, centerPo);
        OntologyCenterPo existingCenterPo = SpringJdbcUtil.getEntityManager().find(OntologyCenterPo.class, centerPo.getId());
        if (null != existingCenterPo) {
            existingCenterPo.setCenterName(ontologyCenterVo.getCenterName());
            existingCenterPo.setCenterLabel(ontologyCenterVo.getCenterLabel());
            existingCenterPo.setCenterDesc(ontologyCenterVo.getCenterDesc());
            return SpringJdbcUtil.getEntityManager().merge(existingCenterPo);
        }

        return null;
    }

    @Transactional
    public Boolean delete(String centerId, String parentId) {
        try {
            centerRepository.updateSyncStatusById(centerId);
            if (0 >= centerRepository.countAllById(parentId)) {
                centerRepository.updateLeafStatusById(parentId, CenterLeafEnum.LEAF.getValue());
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public Boolean syncObjectTypes(CenterSyncVo centerSyncVo) {
        try {
            List<OntologyObjectTypePo> ontologyObjectTypeList = ontologyObjectTypeRepository.findByIdIn(centerSyncVo.getTypeIdList());
            List<OntologyCenterObjectTypePo> centerTypeList = ontologyObjectTypeList.stream().map(objectTypePo -> {
                OntologyCenterObjectTypePo centerTypePo = new OntologyCenterObjectTypePo();
                BeanUtils.copyProperties(objectTypePo, centerTypePo);
                centerTypePo.setCenterId(centerSyncVo.getCenterId());
                centerTypePo.setStatus(StatusEnum.DISABLED.getCode());
                return centerTypePo;
            }).collect(Collectors.toList());
            centerObjectTypeRepository.saveAllAndFlush(centerTypeList);

            List<OntologyObjectTypeAttributePo> objectAttributeList = objectTypeAttributeRepository.findAvaliableByTypeIdList(centerSyncVo.getTypeIdList());
            List<OntologyCenterObjectAttributePo> centerAttributeList = objectAttributeList.stream().map(objectAttributePo -> {
                OntologyCenterObjectAttributePo attributePo = new OntologyCenterObjectAttributePo();
                BeanUtils.copyProperties(objectAttributePo, attributePo);
                return attributePo;
            }).collect(Collectors.toList());
            centerObjectAttributeRepository.saveAllAndFlush(centerAttributeList);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

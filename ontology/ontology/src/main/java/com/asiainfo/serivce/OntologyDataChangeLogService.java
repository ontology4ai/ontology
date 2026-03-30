package com.asiainfo.serivce;

import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.repo.OntologyObjectTypeAttributeRepository;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;

import org.springframework.beans.BeanUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.asiainfo.common.OperationTypeEnum;
import com.asiainfo.po.OntologyDataChangeLogPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.repo.OntologyDataChangeRepository;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.vo.operation.OntologyDataChangeLogVo;
import com.asiainfo.vo.search.DataChangeLogSearchVo;

import javax.persistence.criteria.Predicate;

@Service
@Slf4j
public class OntologyDataChangeLogService {
    @Autowired
    private OntologyDataChangeRepository ontologyDataChangeRepository;

    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;

    @Autowired
    private OntologyObjectTypeAttributeRepository attributeRepository;

    public Page<OntologyDataChangeLogVo> listAffects(DataChangeLogSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.ASC, "id");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 20, sort);

        log.debug("listAffect() searchVo:{}", searchVo);
        Page<OntologyDataChangeLogPo> dataChangePage = ontologyDataChangeRepository
                .findAll((Specification<OntologyDataChangeLogPo>) (root, query, cb) -> {
                    List<javax.persistence.criteria.Predicate> predicates = new ArrayList<>();

                    predicates.add(cb.equal(root.get("trackId").as(String.class),
                            searchVo.getTrackId()));
                    predicates.add(cb.notEqual(cb.lower(root.get("objectTypeName").as(String.class)),
                            searchVo.getObjectTypeName().toLowerCase()));

                    String keyword = searchVo.getKeyword();
                    if (StringUtils.isNotBlank(keyword)) {
                        predicates.add(cb.like(cb.lower(root.get("objectTypeName").as(String.class)), "%" + keyword
                                .toLowerCase() + "%"));
                    }
                    javax.persistence.criteria.Predicate[] p = new javax.persistence.criteria.Predicate[predicates
                            .size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();

                }, request);
        log.debug("dataChangePage:{}", dataChangePage.getContent());
        Map<String, OntologyObjectTypePo> objectTypePoMap = new HashMap<>();
        Map<String, List<OntologyObjectTypeAttributePo>> attributePoMap = new HashMap<>();
        final List<OntologyDataChangeLogVo> collect = dataChangePage.getContent().stream()
                .map(ontologyDataChangeLogPo -> {
                    OntologyDataChangeLogVo convertPoToVo = new OntologyDataChangeLogVo();
                    BeanUtils.copyProperties(ontologyDataChangeLogPo, convertPoToVo);
                    convertPoToVo.setOperationTypeLabel(
                            OperationTypeEnum.getEnum(ontologyDataChangeLogPo.getOperationType()).getLabel());
                    // 拆解json
                    JSONArray details = new JSONArray();
                    JSONObject detail = JSON.parseObject(ontologyDataChangeLogPo.getChangeDetails());
                    if (detail == null)
                        throw new RuntimeException("记录里的change_details为空");
                    if (OperationTypeEnum.UPDATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject fieldsValue = detail.getJSONObject("fields");
                        if (fieldsValue == null) {
                            throw new RuntimeException("数据变更记录异常:fields为空");
                        } else {
                            for (String key : fieldsValue.keySet()) {
                                log.info("key:{}", key);
                                if (!"primary_key".equals(key)) {
                                    JSONObject newValue = new JSONObject();
                                    JSONObject value = fieldsValue.getJSONObject(key);

                                    log.info("value:{}", value);
                                    if (value == null)
                                        continue;
                                    Object afterValue = value.get("after");
                                    Object beforeValue = value.get("before");

                                    newValue.put("Attribute", key);
                                    newValue.put("Baseline", beforeValue);
                                    newValue.put("Simulation", afterValue);
                                    newValue.put("Delta", calcDeltaValue(beforeValue, afterValue));
                                    details.add(newValue);
                                }

                            }

                        }
                    } else if (OperationTypeEnum.DELETE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject deleteValue = detail.getJSONObject("deleted_record");
                        if (deleteValue == null) {
                            throw new RuntimeException("数据变更记录异常:deleted_record为空");
                        }

                        details.add(deleteValue);
                    } else if (OperationTypeEnum.CREATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject insertValue = detail.getJSONObject("inserted_record");
                        if (insertValue == null) {
                            throw new RuntimeException("数据变更记录异常:inserted_record为空");
                        }

                        details.add(insertValue);
                    }
                    convertPoToVo.setDetails(details);
                    // 根据对象英文名称查找中文名称
                    String objectTypeName = convertPoToVo.getObjectTypeName();
                    OntologyObjectTypePo objectTypePo = objectTypePoMap.get(objectTypeName);
                    if (objectTypePo == null) {
                        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository
                                .findByObjectTypeName(objectTypeName, searchVo.getOntologyId());
                        if (objectTypePos != null && !objectTypePos.isEmpty()) {
                            objectTypePo = objectTypePos.get(0);
                            objectTypePoMap.put(objectTypeName, objectTypePo);
                            convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                        } else {
                            convertPoToVo.setObjectTypeLabel(objectTypeName);
                        }
                    } else {
                        convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                    }

                    JSONObject attribute = new JSONObject();
                    if (objectTypePo != null) {
                        List<OntologyObjectTypeAttributePo> attributePoList = attributePoMap.get(objectTypeName);
                        if (attributePoList == null) {
                            attributePoList = attributeRepository.findAvaliableByTypeId(objectTypePo.getId());
                            attributePoMap.put(objectTypeName, attributePoList);
                        }
                        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                            String fieldName = attributePo.getFieldName();
                            if (StringUtils.isNotBlank(fieldName)) {
                                attribute.put(fieldName, attributePo.getAttributeName());

                                if (attributePo.getIsTitle() == 1) {
                                    JSONObject fullData = JSON.parseObject(ontologyDataChangeLogPo.getFullData());
                                    if (fullData != null) {
                                        convertPoToVo.setTitle(fullData.getString(fieldName.toLowerCase()));
                                    }
                                }
                            }
                        }
                    }
                    convertPoToVo.setAttribute(attribute);

                    return convertPoToVo;
                }).collect(Collectors.toList());

        return new PageImpl<>(collect, dataChangePage.getPageable(),
                dataChangePage.getTotalElements());
    }

    public Page<OntologyDataChangeLogVo> listTargets(DataChangeLogSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.ASC, "id");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 20, sort);

        log.debug("listTarget() searchVo:{}", searchVo);
        Page<OntologyDataChangeLogPo> dataChangePage = ontologyDataChangeRepository
                .findAll((Specification<OntologyDataChangeLogPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    predicates.add(cb.equal(root.get("trackId").as(String.class),
                            searchVo.getTrackId()));
                    predicates.add(cb.equal(cb.lower(root.get("objectTypeName").as(String.class)),
                            searchVo.getObjectTypeName().toLowerCase()));
                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();

                }, request);
        log.debug("dataChangePage:{}", dataChangePage.getContent());
        Map<String, OntologyObjectTypePo> objectTypePoMap = new HashMap<>();
        Map<String, List<OntologyObjectTypeAttributePo>> attributePoMap = new HashMap<>();
        final List<OntologyDataChangeLogVo> collect = dataChangePage.getContent().stream()
                .map(ontologyDataChangeLogPo -> {
                    OntologyDataChangeLogVo convertPoToVo = new OntologyDataChangeLogVo();
                    BeanUtils.copyProperties(ontologyDataChangeLogPo, convertPoToVo);
                    convertPoToVo.setOperationTypeLabel(
                            OperationTypeEnum.getEnum(ontologyDataChangeLogPo.getOperationType()).getLabel());
                    // 拆解json
                    JSONArray details = new JSONArray();
                    JSONObject detail = JSON.parseObject(ontologyDataChangeLogPo.getChangeDetails());
                    if (detail == null)
                        throw new RuntimeException("记录里的change_details为空");
                    if (OperationTypeEnum.UPDATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject fieldsValue = detail.getJSONObject("fields");
                        if (fieldsValue == null) {
                            throw new RuntimeException("数据变更记录异常:fields为空");
                        } else {
                            for (String key : fieldsValue.keySet()) {
                                log.info("key:{}", key);
                                if (!"primary_key".equals(key)) {
                                    JSONObject newValue = new JSONObject();
                                    JSONObject value = fieldsValue.getJSONObject(key);

                                    log.info("value:{}", value);
                                    if (value == null)
                                        continue;
                                    Object afterValue = value.get("after");
                                    Object beforeValue = value.get("before");

                                    newValue.put("Attribute", key);
                                    newValue.put("Baseline", beforeValue);
                                    newValue.put("Simulation", afterValue);
                                    newValue.put("Delta", calcDeltaValue(beforeValue, afterValue));
                                    details.add(newValue);
                                }

                            }

                        }
                    } else if (OperationTypeEnum.DELETE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject deleteValue = detail.getJSONObject("deleted_record");
                        if (deleteValue == null) {
                            throw new RuntimeException("数据变更记录异常:deleted_record为空");
                        }

                        details.add(deleteValue);
                    } else if (OperationTypeEnum.CREATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject insertValue = detail.getJSONObject("inserted_record");
                        if (insertValue == null) {
                            throw new RuntimeException("数据变更记录异常:inserted_record为空");
                        }

                        details.add(insertValue);
                    }
                    convertPoToVo.setDetails(details);
                    // 根据对象英文名称查找中文名称
                    String objectTypeName = convertPoToVo.getObjectTypeName();
                    OntologyObjectTypePo objectTypePo = objectTypePoMap.get(objectTypeName);
                    if (objectTypePo == null) {
                        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository
                                .findByObjectTypeName(objectTypeName, searchVo.getOntologyId());
                        if (objectTypePos != null && !objectTypePos.isEmpty()) {
                            objectTypePo = objectTypePos.get(0);
                            objectTypePoMap.put(objectTypeName, objectTypePo);
                            convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                        } else {
                            convertPoToVo.setObjectTypeLabel(objectTypeName);
                        }
                    } else {
                        convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                    }

                    JSONObject attribute = new JSONObject();
                    if (objectTypePo != null) {
                        List<OntologyObjectTypeAttributePo> attributePoList = attributePoMap.get(objectTypeName);
                        if (attributePoList == null) {
                            attributePoList = attributeRepository.findAvaliableByTypeId(objectTypePo.getId());
                            attributePoMap.put(objectTypeName, attributePoList);
                        }
                        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                            String fieldName = attributePo.getFieldName();
                            if (StringUtils.isNotBlank(fieldName)) {
                                attribute.put(fieldName, attributePo.getAttributeName());

                                if (attributePo.getIsTitle() == 1) {
                                    JSONObject fullData = JSON.parseObject(ontologyDataChangeLogPo.getFullData());
                                    if (fullData != null) {
                                        convertPoToVo.setTitle(fullData.getString(fieldName.toLowerCase()));
                                    }
                                }
                            }
                        }
                    }
                    convertPoToVo.setAttribute(attribute);

                    return convertPoToVo;
                }).collect(Collectors.toList());

        return new PageImpl<>(collect, dataChangePage.getPageable(),
                dataChangePage.getTotalElements());
    }

    public List<OntologyDataChangeLogVo> getTargets(DataChangeLogSearchVo searchVo) {
        log.debug("getTarget() searchVo:{}", searchVo);
        List<OntologyDataChangeLogPo> dataChangePos = ontologyDataChangeRepository
                .findAll((Specification<OntologyDataChangeLogPo>) (root, query, cb) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    predicates.add(cb.equal(root.get("trackId").as(String.class), searchVo.getTrackId()));
                    predicates.add(cb.equal(cb.lower(root.get("objectTypeName").as(String.class)),
                            searchVo.getObjectTypeName().toLowerCase()));

                    Predicate[] p = new Predicate[predicates.size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();

                });
        Map<String, OntologyObjectTypePo> objectTypePoMap = new HashMap<>();
        Map<String, List<OntologyObjectTypeAttributePo>> attributePoMap = new HashMap<>();
        List<OntologyDataChangeLogVo> collect = dataChangePos.stream()
                .map(ontologyDataChangeLogPo -> {
                    OntologyDataChangeLogVo convertPoToVo = new OntologyDataChangeLogVo();
                    BeanUtils.copyProperties(ontologyDataChangeLogPo, convertPoToVo);
                    convertPoToVo.setOperationTypeLabel(
                            OperationTypeEnum.getEnum(ontologyDataChangeLogPo.getOperationType()).getLabel());
                    // 拆解json
                    JSONArray details = new JSONArray();
                    JSONObject detail = JSON.parseObject(ontologyDataChangeLogPo.getChangeDetails());
                    if (detail == null) {
                        throw new RuntimeException("记录里的change_details为空");
                    }
                    if (OperationTypeEnum.UPDATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject fieldsValue = detail.getJSONObject("fields");
                        if (fieldsValue == null) {
                            throw new RuntimeException("数据变更记录异常:fields为空");
                        } else {
                            for (String key : fieldsValue.keySet()) {
                                log.info("key:{}", key);
                                if (!"primary_key".equals(key)) {
                                    JSONObject newValue = new JSONObject();
                                    JSONObject value = fieldsValue.getJSONObject(key);

                                    log.info("value:{}", value);
                                    if (value == null)
                                        continue;
                                    Object afterValue = value.get("after");
                                    Object beforeValue = value.get("before");

                                    newValue.put("Attribute", key);
                                    newValue.put("Baseline", beforeValue);
                                    newValue.put("Simulation", afterValue);
                                    newValue.put("Delta", calcDeltaValue(beforeValue, afterValue));
                                    details.add(newValue);
                                }
                            }
                        }
                    } else if (OperationTypeEnum.DELETE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject deleteValue = detail.getJSONObject("deleted_record");
                        if (deleteValue == null) {
                            throw new RuntimeException("数据变更记录异常:deleted_record为空");
                        }

                        details.add(deleteValue);
                    } else if (OperationTypeEnum.CREATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject insertValue = detail.getJSONObject("inserted_record");
                        if (insertValue == null) {
                            throw new RuntimeException("数据变更记录异常:inserted_record为空");
                        }

                        details.add(insertValue);
                    }
                    convertPoToVo.setDetails(details);
                    // 根据对象英文名称查找中文名称
                    String objectTypeName = convertPoToVo.getObjectTypeName();
                    OntologyObjectTypePo objectTypePo = objectTypePoMap.get(objectTypeName);
                    if (objectTypePo == null) {
                        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository
                                .findByObjectTypeName(objectTypeName, searchVo.getOntologyId());
                        if (objectTypePos != null && !objectTypePos.isEmpty()) {
                            objectTypePo = objectTypePos.get(0);
                            objectTypePoMap.put(objectTypeName, objectTypePo);
                            convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                        } else {
                            convertPoToVo.setObjectTypeLabel(objectTypeName);
                        }
                    } else {
                        convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                    }

                    JSONObject attribute = new JSONObject();
                    if (objectTypePo != null) {
                        List<OntologyObjectTypeAttributePo> attributePoList = attributePoMap.get(objectTypeName);
                        if (attributePoList == null) {
                            attributePoList = attributeRepository.findAvaliableByTypeId(objectTypePo.getId());
                            attributePoMap.put(objectTypeName, attributePoList);
                        }
                        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                            String fieldName = attributePo.getFieldName();
                            if (StringUtils.isNotBlank(fieldName)) {
                                attribute.put(fieldName, attributePo.getAttributeName());

                                if (attributePo.getIsTitle() == 1) {
                                    JSONObject fullData = JSON.parseObject(ontologyDataChangeLogPo.getFullData());
                                    if (fullData != null) {
                                        convertPoToVo.setTitle(fullData.getString(fieldName.toLowerCase()));
                                    }
                                }
                            }
                        }
                    }
                    convertPoToVo.setAttribute(attribute);

                    return convertPoToVo;
                }).collect(Collectors.toList());

        return collect;
    }

    public List<OntologyDataChangeLogVo> getAffects(DataChangeLogSearchVo searchVo) {
        log.debug("getTarget() searchVo:{}", searchVo);
        List<OntologyDataChangeLogPo> dataChangePos = ontologyDataChangeRepository
                .findAll((Specification<OntologyDataChangeLogPo>) (root, query, cb) -> {
                    List<javax.persistence.criteria.Predicate> predicates = new ArrayList<>();

                    predicates.add(cb.equal(root.get("trackId").as(String.class), searchVo.getTrackId()));
                    predicates.add(cb.notEqual(cb.lower(root.get("objectTypeName").as(String.class)),
                            searchVo.getObjectTypeName().toLowerCase()));

                    String keyword = searchVo.getKeyword();
                    if (StringUtils.isNotBlank(keyword)) {
                        predicates.add(cb.like(cb.lower(root.get("objectTypeName").as(String.class)), "%" + keyword
                                .toLowerCase() + "%"));
                    }
                    javax.persistence.criteria.Predicate[] p = new javax.persistence.criteria.Predicate[predicates
                            .size()];
                    query.where(cb.and(predicates.toArray(p)));
                    return query.getRestriction();

                });
        Map<String, OntologyObjectTypePo> objectTypePoMap = new HashMap<>();
        Map<String, List<OntologyObjectTypeAttributePo>> attributePoMap = new HashMap<>();
        List<OntologyDataChangeLogVo> collect = dataChangePos.stream()
                .map(ontologyDataChangeLogPo -> {
                    OntologyDataChangeLogVo convertPoToVo = new OntologyDataChangeLogVo();
                    BeanUtils.copyProperties(ontologyDataChangeLogPo, convertPoToVo);
                    convertPoToVo.setOperationTypeLabel(
                            OperationTypeEnum.getEnum(ontologyDataChangeLogPo.getOperationType()).getLabel());
                    // 拆解json
                    JSONArray details = new JSONArray();
                    JSONObject detail = JSON.parseObject(ontologyDataChangeLogPo.getChangeDetails());
                    if (detail == null)
                        throw new RuntimeException("记录里的change_details为空");
                    if (OperationTypeEnum.UPDATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject fieldsValue = detail.getJSONObject("fields");
                        if (fieldsValue == null) {
                            throw new RuntimeException("数据变更记录异常:fields为空");
                        } else {
                            for (String key : fieldsValue.keySet()) {
                                log.info("key:{}", key);
                                if (!"primary_key".equals(key)) {
                                    JSONObject newValue = new JSONObject();
                                    JSONObject value = fieldsValue.getJSONObject(key);

                                    log.info("value:{}", value);
                                    if (value == null)
                                        continue;
                                    Object afterValue = value.get("after");
                                    Object beforeValue = value.get("before");

                                    newValue.put("Attribute", key);
                                    newValue.put("Baseline", beforeValue);
                                    newValue.put("Simulation", afterValue);
                                    newValue.put("Delta", calcDeltaValue(beforeValue, afterValue));
                                    details.add(newValue);
                                }

                            }

                        }
                    } else if (OperationTypeEnum.DELETE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject deleteValue = detail.getJSONObject("deleted_record");
                        if (deleteValue == null) {
                            throw new RuntimeException("数据变更记录异常:deleted_record为空");
                        }

                        details.add(deleteValue);
                    } else if (OperationTypeEnum.CREATE.getValue()
                            .equals(ontologyDataChangeLogPo.getOperationType())) {
                        JSONObject insertValue = detail.getJSONObject("inserted_record");
                        if (insertValue == null) {
                            throw new RuntimeException("数据变更记录异常:inserted_record为空");
                        }

                        details.add(insertValue);
                    }
                    convertPoToVo.setDetails(details);
                    // 根据对象英文名称查找中文名称
                    String objectTypeName = convertPoToVo.getObjectTypeName();
                    OntologyObjectTypePo objectTypePo = objectTypePoMap.get(objectTypeName);
                    if (objectTypePo == null) {
                        List<OntologyObjectTypePo> objectTypePos = objectTypeRepository
                                .findByObjectTypeName(objectTypeName, searchVo.getOntologyId());
                        if (objectTypePos != null && !objectTypePos.isEmpty()) {
                            objectTypePo = objectTypePos.get(0);
                            objectTypePoMap.put(objectTypeName, objectTypePo);
                            convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                        } else {
                            convertPoToVo.setObjectTypeLabel(objectTypeName);
                        }
                    } else {
                        convertPoToVo.setObjectTypeLabel(objectTypePo.getObjectTypeLabel());
                    }

                    JSONObject attribute = new JSONObject();
                    if (objectTypePo != null) {
                        List<OntologyObjectTypeAttributePo> attributePoList = attributePoMap.get(objectTypeName);
                        if (attributePoList == null) {
                            attributePoList = attributeRepository.findAvaliableByTypeId(objectTypePo.getId());
                            attributePoMap.put(objectTypeName, attributePoList);
                        }
                        for (OntologyObjectTypeAttributePo attributePo : attributePoList) {
                            String fieldName = attributePo.getFieldName();
                            if (StringUtils.isNotBlank(fieldName)) {
                                attribute.put(fieldName, attributePo.getAttributeName());

                                if (attributePo.getIsTitle() == 1) {
                                    JSONObject fullData = JSON.parseObject(ontologyDataChangeLogPo.getFullData());
                                    if (fullData != null) {
                                        convertPoToVo.setTitle(fullData.getString(fieldName.toLowerCase()));
                                    }
                                }
                            }
                        }
                    }
                    convertPoToVo.setAttribute(attribute);

                    return convertPoToVo;
                }).collect(Collectors.toList());

        return collect;
    }

    private Object calcDeltaValue(Object beforeValue, Object afterValue) {
        try {
            BigDecimal before = new BigDecimal(beforeValue.toString());
            BigDecimal after = new BigDecimal(afterValue.toString());
            return after.subtract(before);
        } catch (Exception e) {
            return "--";
        }
    }
}

package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.InitDataTaskStatusEnum;
import com.asiainfo.dto.OntologyLinkTypeDto;
import com.asiainfo.dto.OntologyObjectTypeDto;
import com.asiainfo.dto.TeamDsDto;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.po.*;
import com.asiainfo.repo.*;
import com.asiainfo.vo.operation.*;
import io.github.suanchou.utils.SpringContextUtil;
import io.github.suanchou.utils.StringUtil;
import io.github.suanchou.web.Response;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OntologySimuService {

    @Autowired
    private OntologyCanvasNodeRepository canvasNodeRepository;

    @Autowired
    private OntologySimuCanvasRepository simuCanvasRepository;

    @Autowired
    private OntologySimuSceneRepository sceneRepository;

    @Autowired
    private OntologyRepository ontologyRepository;

    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;

    @Autowired
    private OntologyLogicTypeRepository ontologyLogicTypeRepository;

    @Autowired
    private OntologyObjectTypeActionRepository objectTypeActionRepository;

    @Autowired
    private OntologyLogicTypeObjectRepository ontologyLogicTypeObjectRepository;

    @Autowired
    private OntologyLinkTypeRepository ontologyLinkTypeRepository;

    @Autowired
    private OntologyInitDataTaskRepository initDataTaskRepository;

    @Autowired
    private DataosFeign dataosFeign;

    @Autowired
    private ThreadPoolTaskScheduler applicationTaskExecutor;

    private final Map<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @Transactional
    public OntologySimuSceneVo save(OntologySimuVo simuVo) {
        OntologySimuScenePo ontologySimuScenePo = new OntologySimuScenePo();
        BeanUtils.copyProperties(simuVo, ontologySimuScenePo);

        OntologyPo ontologyPo = ontologyRepository.findById(simuVo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在！ontologyId:" + simuVo.getOntologyId()));

        ontologySimuScenePo.setStatus(ontologyPo.getStatus());
        ontologySimuScenePo.setId(StringUtil.genUuid(32));
        sceneRepository.save(ontologySimuScenePo);
        return convertPoToVo(ontologySimuScenePo, ontologyPo);
    }

    public OntologySimuSceneVo convertPoToVo(OntologySimuScenePo simuScenePo, OntologyPo ontologyPo) {
        OntologySimuSceneVo simuSceneVo = new OntologySimuSceneVo();
        BeanUtils.copyProperties(simuScenePo, simuSceneVo);
        simuSceneVo.setOntologyName(ontologyPo.getOntologyName());
        simuSceneVo.setOntologyLabel(ontologyPo.getOntologyLabel());
        return simuSceneVo;
    }

    @Transactional
    public OntologySimuSceneVo update(OntologySimuVo simuVo) {
        OntologySimuScenePo ontologySimuScenePo = sceneRepository.findById(simuVo.getId())
                .orElseThrow(() -> new RuntimeException("仿真场景不存在"));
        OntologyPo ontologyPo = ontologyRepository.findById(simuVo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在！ontologyId:" + simuVo.getOntologyId()));

        ontologySimuScenePo.setStatus(ontologyPo.getStatus());

        if (!ontologySimuScenePo.getOntologyId().equals(simuVo.getOntologyId())) {
            handleCanvasOnOntologyChange(ontologySimuScenePo);
        } else {
            BeanUtils.copyProperties(simuVo, ontologySimuScenePo);
        }
        sceneRepository.save(ontologySimuScenePo);
        return convertPoToVo(ontologySimuScenePo, ontologyPo);
    }

    private void handleCanvasOnOntologyChange(OntologySimuScenePo ontologySimuScenePo) {
        if (!StringUtils.isEmpty(ontologySimuScenePo.getCanvasId())) {
            simuCanvasRepository.deleteById(ontologySimuScenePo.getCanvasId());
            canvasNodeRepository.deleteByCanvasId(ontologySimuScenePo.getCanvasId());
            ontologySimuScenePo.setCanvasId(null);
        }
    }

    @Transactional
    public boolean delete(List<String> ids) {
        sceneRepository.deleteAllById(ids);
        return true;
    }

    public List<OntologySimuSceneVo> findAllByWorkspaceId(SearchSimuVo searchVo) {
        List<OntologySimuScenePo> scenePoList = new ArrayList<>();

        if (!StringUtils.isEmpty(searchVo.getOntologyLabel()) || !StringUtils.isEmpty(searchVo.getOntologyName())) {
            List<OntologyPo> ontologyPoList = ontologyRepository.findAllByWorkspaceId(searchVo.getWorkspaceId());
            if (ontologyPoList.isEmpty())
                return Collections.emptyList();

            // 策略过滤：多条件聚合
            Predicate<OntologyPo> ontologyLabelPredicate = getLabelPredicate(searchVo.getOntologyLabel());
            Predicate<OntologyPo> ontologyNamePredicate = getNamePredicate(searchVo.getOntologyName());

            // 前两层过滤
            List<OntologyPo> ontologyPos = ontologyPoList.stream()
                    .filter(ontologyLabelPredicate)
                    .filter(ontologyNamePredicate)
                    .collect(Collectors.toList());

            for (OntologyPo ontologyPo : ontologyPos) {
                List<OntologySimuScenePo> foundScenes = sceneRepository.findAllByOntologyId(ontologyPo.getId(),
                        searchVo.getWorkspaceId());
                scenePoList.addAll(foundScenes);
            }
        } else {
            scenePoList = sceneRepository.findAllByWorkspaceId(searchVo.getWorkspaceId());
        }

        // 聚合所有场景过滤器
        Predicate<OntologySimuScenePo> sceneKeywordPredicate = getSceneKeywordPredicate(
                StringUtils.isEmpty(searchVo.getKeyword()) ? null : searchVo.getKeyword().toLowerCase());
        Predicate<OntologySimuScenePo> statusPredicate = getStatusPredicate(searchVo.getStatus());

        return scenePoList.stream()
                .filter(sceneKeywordPredicate)
                .filter(statusPredicate)
                .map(scenePo -> {
                    OntologyPo ontPo = ontologyRepository.findById(scenePo.getOntologyId())
                            .orElseThrow(() -> new RuntimeException("本体不存在！ontologyId:" + scenePo.getOntologyId()));
                    return convertPoToVo(scenePo, ontPo);
                })
                .collect(Collectors.toList());
    }

    // —— 策略管理多个过滤条件（可拓展）

    private Predicate<OntologyPo> getLabelPredicate(String label) {
        if (StringUtils.isEmpty(label)) {
            return po -> true;
        }
        return po -> label.equals(po.getOntologyLabel()) ||
                po.getOntologyLabel() != null && po.getOntologyLabel().contains(label);
    }

    private Predicate<OntologyPo> getNamePredicate(String name) {
        if (StringUtils.isEmpty(name)) {
            return po -> true;
        }
        return po -> name.equals(po.getOntologyName()) ||
                po.getOntologyName() != null && po.getOntologyName().contains(name);
    }

    private Predicate<OntologySimuScenePo> getSceneKeywordPredicate(String keyword) {
        if (StringUtils.isEmpty(keyword)) {
            return po -> true;
        }
        return po -> keyword.equalsIgnoreCase(po.getSceneLabel()) ||
                po.getSceneLabel() != null && po.getSceneLabel().toLowerCase().contains(keyword)
                || keyword.equalsIgnoreCase(po.getSceneName()) ||
                po.getSceneName() != null && po.getSceneName().toLowerCase().contains(keyword);
    }

    private Predicate<OntologySimuScenePo> getSceneLabelCheckPredicate(String sceneLabel) {
        if (StringUtils.isEmpty(sceneLabel)) {
            return po -> true;
        }
        return po -> sceneLabel.equalsIgnoreCase(po.getSceneLabel());
    }

    private Predicate<OntologySimuScenePo> getSceneNameCheckPredicate(String sceneName) {
        if (StringUtils.isEmpty(sceneName)) {
            return po -> true;
        }
        return po -> sceneName.equalsIgnoreCase(po.getSceneName());
    }

    private Predicate<OntologySimuScenePo> getStatusPredicate(Integer status) {
        if (status == null) {
            return po -> true;
        }
        return po -> po.getStatus() != null && status.intValue() == po.getStatus().intValue();
    }

    // —— 判断场景标签/名称是否存在

    public boolean isLabelExists(SearchSimuVo searchVo) {
        return sceneRepository.findAllByWorkspaceId(searchVo.getWorkspaceId()).stream()
                .anyMatch(getSceneLabelCheckPredicate(searchVo.getSceneLabel()));
    }

    public boolean isNameExists(SearchSimuVo searchVo) {
        return sceneRepository.findAllByWorkspaceId(searchVo.getWorkspaceId()).stream()
                .anyMatch(getSceneNameCheckPredicate(searchVo.getSceneName()));
    }

    public OntologyCanvasVo findCanvasById(String canvasId) {
        OntologySimuCanvasPo simuCanvasPo = simuCanvasRepository.findById(canvasId)
                .orElseThrow(() -> new RuntimeException("画布不存在！canvasId:" + canvasId));
        return convertPoToVo(simuCanvasPo);
    }

    private OntologyCanvasVo convertPoToVo(OntologySimuCanvasPo simuCanvasPo) {
        OntologyCanvasVo vo = new OntologyCanvasVo();
        BeanUtils.copyProperties(simuCanvasPo, vo);

        List<OntologyCanvasNodePo> nodes = canvasNodeRepository.findByCanvasId(simuCanvasPo.getId());
        List<OntologyCanvasNodeVo> nodeVos = nodes.stream().map(nodePo -> {
            OntologyCanvasNodeVo nodeVo = new OntologyCanvasNodeVo();
            BeanUtils.copyProperties(nodePo, nodeVo);
            if (nodePo.getNodeType().equals("object")) {
                OntologyObjectTypePo objectPo = objectTypeRepository.findById(nodePo.getElementId())
                        .orElseThrow(() -> new RuntimeException("对象不存在！id:" + nodePo.getElementId()));
                nodeVo.setName(objectPo.getObjectTypeName());
                nodeVo.setLabel(objectPo.getObjectTypeLabel());
                nodeVo.setIcon(objectPo.getIcon());
            } else if (nodePo.getNodeType().equals("logic")) {
                OntologyLogicTypePo logicPo = ontologyLogicTypeRepository.findById(nodePo.getElementId())
                        .orElseThrow(() -> new RuntimeException("逻辑不存在！id:" + nodePo.getElementId()));
                nodeVo.setName(logicPo.getLogicTypeName());
                nodeVo.setLabel(logicPo.getLogicTypeLabel());
            } else if (nodePo.getNodeType().equals("action")) {
                OntologyObjectTypeActionPo actionPo = objectTypeActionRepository.findById(nodePo.getElementId())
                        .orElseThrow(() -> new RuntimeException("动作不存在！id:" + nodePo.getElementId()));
                nodeVo.setName(actionPo.getActionName());
                nodeVo.setLabel(actionPo.getActionLabel());
                nodeVo.setIcon(actionPo.getIcon());
            }
            return nodeVo;
        }).collect(Collectors.toList());
        vo.setNodes(nodeVos);
        return vo;

    }

    public List<OntologyCanvasNodeVo> findAvaliableObject(String[] objectTypeIds) {
        // 查询所有对象
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAll();
        Map<String, OntologyObjectTypeDto> objectTypeDtoMap = new HashMap<>();
        for (OntologyObjectTypePo po : objectTypePoList) {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(po, objectTypeDto);
            objectTypeDtoMap.put(po.getId(), objectTypeDto);
        }
        List<OntologyObjectTypePo> objectTypes = objectTypeRepository.findAllById(Arrays.asList(objectTypeIds));
        List<OntologyCanvasNodeVo> objectVos = objectTypes.stream().map(objectTypePo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            vo.setName(objectTypePo.getObjectTypeName());
            vo.setLabel(objectTypePo.getObjectTypeLabel());
            vo.setNodeType("object");
            vo.setElementId(objectTypePo.getId());
            vo.setIcon(objectTypePo.getIcon());

            // 对象关系
            List<OntologyLinkTypePo> objectSourceRelations = ontologyLinkTypeRepository
                    .findSorceRelationtByObjectTypeId(objectTypePo.getOntologyId(), objectTypePo.getId());
            List<OntologyLinkTypePo> objectTargetRelations = ontologyLinkTypeRepository
                    .findTargetRelationtByObjectTypeId(objectTypePo.getOntologyId(), objectTypePo.getId());
            objectSourceRelations.addAll(objectTargetRelations);
            List<OntologyLinkTypeDto> linkTypeDtoList = objectSourceRelations.stream()
                    .map(linkTypePo -> {
                        OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
                        BeanUtils.copyProperties(linkTypePo, linkTypeDto);
                        linkTypeDto.setSourceObjectType(objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId()));
                        linkTypeDto.setTargetObjectType(objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId()));
                        return linkTypeDto;
                    }).collect(Collectors.toList());

            vo.setObjectRelations(new ArrayList<Object>(linkTypeDtoList));

            // 对象逻辑关系
            List<OntologyLogicTypeObjectPo> logicRelations = ontologyLogicTypeObjectRepository
                    .findRelationByObjectTypeId(objectTypePo.getOntologyId(), objectTypePo.getId());
            vo.setLogicRelations(new ArrayList<Object>(logicRelations));

            // 对象动作关系
            List<OntologyObjectTypeActionPo> actionRelations = objectTypeActionRepository.findRelationbyObjectTypeId(
                    objectTypePo.getOntologyId(),
                    objectTypePo.getId());
            vo.setActionRelations(new ArrayList<Object>(actionRelations));
            return vo;
        }).collect(Collectors.toList());

        // 查询所有逻辑
        List<OntologyLogicTypePo> logicTypes = ontologyLogicTypeRepository
                .findAvailableByObjectTypeIds(Arrays.asList(objectTypeIds));
        List<OntologyCanvasNodeVo> logicVos = logicTypes.stream().map(logicTypePo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            BeanUtils.copyProperties(logicTypePo, vo);
            vo.setName(logicTypePo.getLogicTypeName());
            vo.setLabel(logicTypePo.getLogicTypeLabel());
            vo.setNodeType("logic");
            vo.setElementId(logicTypePo.getId());
            return vo;
        }).collect(Collectors.toList());
        objectVos.addAll(logicVos);

        // 查询所有动作
        List<OntologyObjectTypeActionPo> actions = objectTypeActionRepository
                .findAvailableByObjecTypeIds(Arrays.asList(objectTypeIds));
        List<OntologyCanvasNodeVo> actionVos = actions.stream().map(actionPo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            vo.setName(actionPo.getActionName());
            vo.setLabel(actionPo.getActionLabel());
            vo.setNodeType("action");
            vo.setElementId(actionPo.getId());
            vo.setIcon(actionPo.getIcon());
            return vo;
        }).collect(Collectors.toList());
        objectVos.addAll(actionVos);
        return objectVos;
    }

    public List<OntologyCanvasNodeVo> findAvaliableObjects(String ontologyId) {
        // 查询所有对象
        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAll();
        Map<String, OntologyObjectTypeDto> objectTypeDtoMap = new HashMap<>();
        for (OntologyObjectTypePo po : objectTypePoList) {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(po, objectTypeDto);
            objectTypeDtoMap.put(po.getId(), objectTypeDto);
        }
        List<OntologyObjectTypePo> objectTypes = objectTypeRepository.findObjectTypeByOntologyId(ontologyId);
        List<OntologyCanvasNodeVo> objectVos = objectTypes.stream().map(objectTypePo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            vo.setName(objectTypePo.getObjectTypeName());
            vo.setLabel(objectTypePo.getObjectTypeLabel());
            vo.setNodeType("object");
            vo.setElementId(objectTypePo.getId());
            vo.setIcon(objectTypePo.getIcon());

            // 对象关系
            List<OntologyLinkTypePo> objectSourceRelations = ontologyLinkTypeRepository
                    .findSorceRelationtByObjectTypeId(ontologyId, objectTypePo.getId());
            List<OntologyLinkTypePo> objectTargetRelations = ontologyLinkTypeRepository
                    .findTargetRelationtByObjectTypeId(ontologyId, objectTypePo.getId());
            objectSourceRelations.addAll(objectTargetRelations);
            List<OntologyLinkTypeDto> linkTypeDtoList = objectSourceRelations.stream()
                    .map(linkTypePo -> {
                        OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
                        BeanUtils.copyProperties(linkTypePo, linkTypeDto);
                        linkTypeDto.setSourceObjectType(objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId()));
                        linkTypeDto.setTargetObjectType(objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId()));
                        return linkTypeDto;
                    }).collect(Collectors.toList());

            vo.setObjectRelations(new ArrayList<Object>(linkTypeDtoList));

            // 对象逻辑关系
            List<OntologyLogicTypeObjectPo> logicRelations = ontologyLogicTypeObjectRepository
                    .findRelationByObjectTypeId(ontologyId, objectTypePo.getId());
            vo.setLogicRelations(new ArrayList<Object>(logicRelations));

            // 对象动作关系
            List<OntologyObjectTypeActionPo> actionRelations = objectTypeActionRepository.findRelationbyObjectTypeId(
                    ontologyId,
                    objectTypePo.getId());
            vo.setActionRelations(new ArrayList<Object>(actionRelations));
            return vo;
        }).collect(Collectors.toList());

        // 查询所有逻辑
        List<OntologyLogicTypePo> logicTypes = ontologyLogicTypeRepository.findAvailablebyOntologyId(ontologyId);
        List<OntologyCanvasNodeVo> logicVos = logicTypes.stream().map(logicTypePo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            BeanUtils.copyProperties(logicTypePo, vo);
            vo.setName(logicTypePo.getLogicTypeName());
            vo.setLabel(logicTypePo.getLogicTypeLabel());
            vo.setNodeType("logic");
            vo.setElementId(logicTypePo.getId());
            return vo;
        }).collect(Collectors.toList());
        objectVos.addAll(logicVos);

        // 查询所有动作
        List<OntologyObjectTypeActionPo> actions = objectTypeActionRepository.findAvailablebyOntologyId(ontologyId);
        List<OntologyCanvasNodeVo> actionVos = actions.stream().map(actionPo -> {
            OntologyCanvasNodeVo vo = new OntologyCanvasNodeVo();
            vo.setName(actionPo.getActionName());
            vo.setLabel(actionPo.getActionLabel());
            vo.setNodeType("action");
            vo.setElementId(actionPo.getId());
            vo.setIcon(actionPo.getIcon());
            return vo;
        }).collect(Collectors.toList());
        objectVos.addAll(actionVos);
        return objectVos;
    }

    @Transactional
    public OntologySimuSceneVo saveCanvas(OntologyCanvasVo vo) {
        OntologySimuCanvasPo canvasPo = new OntologySimuCanvasPo();
        BeanUtils.copyProperties(vo, canvasPo);
        canvasPo.setId(StringUtil.genUuid(32));
        canvasPo.setCanvasLayout(vo.getCanvasLayout().toJSONString());
        simuCanvasRepository.save(canvasPo);

        // 保存节点
        List<OntologyCanvasNodePo> nodes = vo.getNodes().stream().map(nodeVo -> {
            OntologyCanvasNodePo nodePo = new OntologyCanvasNodePo();
            BeanUtils.copyProperties(nodeVo, nodePo);
            nodePo.setId(StringUtil.genUuid(32));
            nodePo.setCanvasId(canvasPo.getId());
            return nodePo;
        }).collect(Collectors.toList());

        canvasNodeRepository.saveAll(nodes);
        // 更新canvasId
        OntologySimuScenePo scenePo = sceneRepository.findById(vo.getSceneId())
                .orElseThrow(() -> new RuntimeException("场景不存在"));
        scenePo.setCanvasId(canvasPo.getId());
        sceneRepository.save(scenePo);

        OntologySimuSceneVo sceneVo = new OntologySimuSceneVo();
        BeanUtils.copyProperties(scenePo, sceneVo);
        return sceneVo;
    }

    @Transactional
    public OntologySimuSceneVo updateCanvas(OntologyCanvasVo vo) {
        OntologySimuCanvasPo canvasPo = simuCanvasRepository.findById(vo.getId())
                .orElseThrow(() -> new RuntimeException("画布不存在"));
        BeanUtils.copyProperties(vo, canvasPo);
        canvasPo.setCanvasLayout(vo.getCanvasLayout().toJSONString());
        simuCanvasRepository.save(canvasPo);

        // 删除旧节点
        canvasNodeRepository.deleteByCanvasId(canvasPo.getId());

        // 保存节点
        List<OntologyCanvasNodePo> nodes = vo.getNodes().stream().map(nodeVo -> {
            OntologyCanvasNodePo nodePo = new OntologyCanvasNodePo();
            BeanUtils.copyProperties(nodeVo, nodePo);
            nodePo.setId(StringUtil.genUuid(32));
            nodePo.setCanvasId(canvasPo.getId());
            return nodePo;
        }).collect(Collectors.toList());

        canvasNodeRepository.saveAll(nodes);

        OntologySimuScenePo scenePo = sceneRepository.findById(vo.getSceneId())
                .orElseThrow(() -> new RuntimeException("场景不存在"));
        OntologySimuSceneVo sceneVo = new OntologySimuSceneVo();
        BeanUtils.copyProperties(scenePo, sceneVo);
        return sceneVo;
    }

    public OntologyCanvasVo findCanvas(String canvasId, String workspaceId) {
        OntologyCanvasVo vo = new OntologyCanvasVo();
        OntologySimuCanvasPo canvasPo = simuCanvasRepository.findById(canvasId)
                .orElseThrow(() -> new RuntimeException("画布不存在"));
        List<OntologySimuScenePo> scenePos = sceneRepository.findByCanvasId(workspaceId, canvasId);
        if (scenePos.isEmpty()) {
            throw new RuntimeException("场景不存在");
        }
        OntologySimuScenePo scenePo = scenePos.get(0);
        BeanUtils.copyProperties(canvasPo, vo);
        vo.setCanvasLayout(JSON.parseObject(canvasPo.getCanvasLayout(), JSONObject.class));

        List<OntologyObjectTypePo> objectTypePoList = objectTypeRepository.findAll();
        Map<String, OntologyObjectTypeDto> objectTypeDtoMap = new HashMap<>();
        for (OntologyObjectTypePo po : objectTypePoList) {
            OntologyObjectTypeDto objectTypeDto = new OntologyObjectTypeDto();
            BeanUtils.copyProperties(po, objectTypeDto);
            objectTypeDtoMap.put(po.getId(), objectTypeDto);
        }
        List<OntologyCanvasNodePo> nodes = canvasNodeRepository.findByCanvasId(canvasId);
        vo.setNodes(nodes.stream().map(nodePo -> {
            OntologyCanvasNodeVo nodeVo = new OntologyCanvasNodeVo();
            BeanUtils.copyProperties(nodePo, nodeVo);
            // 只提取对象的关系
            if (nodePo.getNodeType().equals("object")) {
                // 对象关系
                List<OntologyLinkTypePo> objectSourceRelations = ontologyLinkTypeRepository
                        .findSorceRelationtByObjectTypeId(scenePo.getOntologyId(), nodePo.getElementId());
                List<OntologyLinkTypePo> objectTargetRelations = ontologyLinkTypeRepository
                        .findTargetRelationtByObjectTypeId(scenePo.getOntologyId(), nodePo.getElementId());
                objectSourceRelations.addAll(objectTargetRelations);

                List<OntologyLinkTypeDto> linkTypeDtoList = objectSourceRelations.stream()
                        .map(linkTypePo -> {
                            OntologyLinkTypeDto linkTypeDto = new OntologyLinkTypeDto();
                            BeanUtils.copyProperties(linkTypePo, linkTypeDto);
                            linkTypeDto.setSourceObjectType(objectTypeDtoMap.get(linkTypePo.getSourceObjectTypeId()));
                            linkTypeDto.setTargetObjectType(objectTypeDtoMap.get(linkTypePo.getTargetObjectTypeId()));
                            return linkTypeDto;
                        }).collect(Collectors.toList());

                nodeVo.setObjectRelations(new ArrayList<Object>(linkTypeDtoList));

                // 对象逻辑关系
                List<OntologyLogicTypeObjectPo> logicRelations = ontologyLogicTypeObjectRepository
                        .findRelationByObjectTypeId(scenePo.getOntologyId(), nodePo.getElementId());
                nodeVo.setLogicRelations(new ArrayList<Object>(logicRelations));

                // 对象动作关系
                List<OntologyObjectTypeActionPo> actionRelations = objectTypeActionRepository
                        .findRelationbyObjectTypeId(
                                scenePo.getOntologyId(), nodePo.getElementId());
                nodeVo.setActionRelations(new ArrayList<Object>(actionRelations));
            }
            return nodeVo;
        }).collect(Collectors.toList()));
        return vo;
    }

    public Page<OntologySimuSceneVo> list(SearchSimuVo searchVo) {

        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0),
                searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        List<String> ontologyIdList = new ArrayList<>();
        if (!StringUtils.isEmpty(searchVo.getOntologyLabel()) || !StringUtils.isEmpty(searchVo.getOntologyName())) {
            List<OntologyPo> ontologyPoList = ontologyRepository.findAllByWorkspaceId(searchVo.getWorkspaceId());
            if (!ontologyPoList.isEmpty()) {
                // 策略过滤：多条件聚合
                Predicate<OntologyPo> ontologyLabelPredicate = getLabelPredicate(searchVo.getOntologyLabel());
                Predicate<OntologyPo> ontologyNamePredicate = getNamePredicate(searchVo.getOntologyName());

                // 前两层过滤
                List<OntologyPo> ontologyPos = ontologyPoList.stream()
                        .filter(ontologyLabelPredicate)
                        .filter(ontologyNamePredicate)
                        .collect(Collectors.toList());

                ontologyPos.forEach(ontologyPo -> {
                    ontologyIdList.add(ontologyPo.getId());
                });
            }
        }
        log.debug("ontologyIdList:{}", ontologyIdList);
        log.debug("searchVo:{}", searchVo);
        Page<OntologySimuScenePo> scenePage = sceneRepository
                .findAll((Specification<OntologySimuScenePo>) (root, query, cb) -> {
                    List<javax.persistence.criteria.Predicate> predicates = new ArrayList<>();
                    String keyword = searchVo.getKeyword();
                    if (StringUtils.isNotBlank(keyword)) {
                        predicates.add(cb.or(cb.like(root.get("sceneName").as(String.class),
                                        "%" + keyword.toLowerCase() + "%"),
                                cb.like(cb.lower(root.get("sceneLabel").as(String.class)),
                                        "%" + keyword.toLowerCase() + "%")));
                    }

                    // if (StringUtils.isNotBlank(searchVo.getSceneName())) {
                    // predicates.add(cb.like(root.get("sceneName").as(String.class),
                    // "%" + searchVo.getSceneName() + "%"));
                    // }

                    // if (StringUtils.isNotBlank(searchVo.getSceneLabel())) {
                    // predicates.add(cb.like(root.get("sceneLabel").as(String.class),
                    // "%" + searchVo.getSceneLabel() + "%"));
                    // }

                    if (StringUtils.isNotBlank(searchVo.getWorkspaceId())) {
                        predicates.add(cb.equal(root.get("workspaceId").as(String.class), searchVo.getWorkspaceId()));
                    }

                    if (searchVo.getStatus() != null) {
                        predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
                    }

                    if (!ontologyIdList.isEmpty()) {
                        predicates.add(root.get("ontologyId").in(ontologyIdList));
                    }

                    javax.persistence.criteria.Predicate[] p = new javax.persistence.criteria.Predicate[predicates
                            .size()];
                    query.where(cb.and(predicates.toArray(p)));
                    log.info("query.getRestriction():{}", query.getRestriction().getExpressions());
                    return query.getRestriction();

                }, request);
        log.debug("scenePage:{}", scenePage.getContent());
        final List<OntologySimuSceneVo> collect = scenePage.getContent().stream().map(ontologySimuScenePo -> {
            OntologyPo ontPo = ontologyRepository.findById(ontologySimuScenePo.getOntologyId())
                    .orElseThrow(() -> new RuntimeException("本体不存在！ontologyId:" + ontologySimuScenePo.getOntologyId()));
            return convertPoToVo(ontologySimuScenePo, ontPo);
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, scenePage.getPageable(), scenePage.getTotalElements());
    }

    public OntologySimuSceneVo findById(String id) {
        OntologySimuScenePo scenePo = sceneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("仿真场景不存在！id:" + id));
        OntologyPo ontPo = ontologyRepository.findById(scenePo.getOntologyId())
                .orElseThrow(() -> new RuntimeException("本体不存在！ontologyId:" + scenePo.getOntologyId()));
        return convertPoToVo(scenePo, ontPo);
    }

    /**
     * 初始化本体仿真数据
     */
    @Transactional
    public String initData(InitDataVo initDataVo) {
        // todo: 这块逻辑待优化，先保存任务数据再调相关的接口
        String taskId = StringUtil.genUuid(32);
        // 1. 根据本体ID查询仿真场景中导入的对象节点
        if (StringUtils.isBlank(initDataVo.getSceneId())) {
            throw new RuntimeException("仿真场景ID为空");
        }
        // 根据工作空间名获取对应ID
        DatasourceService datasourceService = SpringContextUtil.getBean(DatasourceService.class);
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder
                .getRequestAttributes();
        String cookie = dataosFeign.getCookie(requestAttributes.getRequest());
        String workspaceName = initDataVo.getWorkspaceName();
        Response<Map<String, Object>> response = dataosFeign.findWorkspaceInfoByName(workspaceName, cookie);
        Map<String, Object> workspaceInfo = response.getData();
        if (MapUtils.isEmpty(workspaceInfo)) {
            throw new RuntimeException("工作空间信息为空");
        }
        String workspaceId = MapUtils.getString(workspaceInfo, "id");

        String sceneId = initDataVo.getSceneId();
        OntologySimuScenePo scenePo = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new RuntimeException("本体仿真场景不存在"));

        // 2. 生成多表同步程序，执行同步操作
        List<OntologyInitDataTaskPo> initDataTaskPoList = new ArrayList<>();

        // 查询仿真场景中的对象类型
        // 判断对象类型关联的数据源生产和仿真环境是否为同一个数据源
        // 如果相同就不需要同步
        // 如果不同则根据数据源归类，将同一个数据源下的多个对象放在一个同步任务中
        List<OntologyObjectTypePo> objectTypePolist = objectTypeRepository.findByIdIn(initDataVo.getObjectIds());
        Map<String, List<OntologyObjectTypePo>> objectTypePoMap = new HashMap<>();
        Map<String, OntologyInitDataTaskPo> taskPoMap = new HashMap<>();

        // 先保存数据初始化任务
        LocalDateTime now = LocalDateTime.now();
        for (OntologyObjectTypePo objectTypePo : objectTypePolist) {
            OntologyInitDataTaskPo taskPo = new OntologyInitDataTaskPo();
            taskPo.setId(StringUtil.genUuid(32));
            taskPo.setObjectTypeId(objectTypePo.getId());
            taskPo.setObjectTypeName(objectTypePo.getObjectTypeName());
            taskPo.setSceneId(sceneId);
            taskPo.setSceneName(scenePo.getSceneName());
            taskPo.setTaskId(taskId);
            taskPo.setCreateUser(initDataVo.getOwnerId());
            taskPo.setCreateTime(now);

            String dsName = objectTypePo.getDsName();
            String dsSchema = objectTypePo.getDsSchema();

            if (StringUtils.isBlank(dsName)) {
                String dsId = objectTypePo.getDsId();
                if (StringUtils.isBlank(dsId)) {
                    taskPo.setStatus(InitDataTaskStatusEnum.NODATASOURCE.getValue());
                    taskPo.setMessage(InitDataTaskStatusEnum.NODATASOURCE.getLabel());
                    initDataTaskPoList.add(taskPo);
                    continue;
                }
                TeamDsDto teamDs = datasourceService.getTeamDs(dsId);
                if (teamDs == null) {
                    taskPo.setStatus(InitDataTaskStatusEnum.NODATASOURCE.getValue());
                    taskPo.setMessage(InitDataTaskStatusEnum.NODATASOURCE.getLabel());
                    initDataTaskPoList.add(taskPo);
                    continue;
                }
                dsName = teamDs.getModoTeamDs().getDsName();
                objectTypePo.setDsName(dsName);
            }
            taskPo.setDsName(dsName);
            taskPo.setDsSchema(dsSchema);
            taskPo.setTableName(objectTypePo.getTableName());
            taskPo.setCreateUser(initDataVo.getOwnerId());
            taskPo.setStatus(InitDataTaskStatusEnum.INIT.getValue());
            taskPo.setMessage(InitDataTaskStatusEnum.INIT.getLabel());
            initDataTaskPoList.add(taskPo);
            taskPoMap.put(objectTypePo.getId(), taskPo);

            List<OntologyObjectTypePo> list = objectTypePoMap.computeIfAbsent(dsName + "_" + dsSchema,
                    k -> new ArrayList<>());
            list.add(objectTypePo);
        }

        // 保存初始化任务
        if (!initDataTaskPoList.isEmpty()) {
            initDataTaskRepository.saveAll(initDataTaskPoList);
        }

        objectTypePoMap.forEach((key, list) -> {
            OntologyObjectTypePo objectTypePo = list.get(0);
            String dsName = objectTypePo.getDsName();
            String dsSchema = objectTypePo.getDsSchema();

            // 查询仿真环境的数据源
            TeamDsDto teamDs = datasourceService.getTeamDs(workspaceName, dsName, "sim");
            if (teamDs == null) {
                throw new RuntimeException("仿真数据源不存在");
            }
            JSONObject dsConf = JSONObject.parseObject(teamDs.getModoTeamDs().getDsConf());
            String sinkSchema = dsConf.getString("dsSchema");
            if (sinkSchema.contains(",")) {
                sinkSchema = sinkSchema.split(",")[0];
            }

            // 如果源schema与目标schema一致，就认为是同一个数据源，不需要生成任务同步，直接成功
            if (dsSchema.equals(sinkSchema)) {
                for (OntologyObjectTypePo po : list) {
                    OntologyInitDataTaskPo taskPo = taskPoMap.get(po.getId());
                    taskPo.setStatus(InitDataTaskStatusEnum.SUCCESS.getValue());
                    taskPo.setMessage("同一个数据库，直接成功");
                    initDataTaskRepository.save(taskPo);
                }
                return;
            }

            // 2.1. 创建多表任务
            String name = StringUtil.genUuid(8);
            Map<String, Object> param = new HashMap<>();
            param.put("state", "NEW");
            param.put("name", name);
            param.put("label", name);
            param.put("teamName", workspaceName);
            param.put("workspaceId", workspaceId);
            param.put("workspaceName", workspaceName);
            param.put("createUser", initDataVo.getOwnerId());
            param.put("parentType", "dataStash");
            param.put("childrenType", "batch_row_extract");
            param.put("domain", "datastash");
            log.info("创建多表任务请求: {}", JSON.toJSONString(param));
            Response<Map<String, Object>> procResponse = dataosFeign.createProc(param, cookie);
            log.info("创建多表任务返回: {}", JSON.toJSONString(procResponse));
            if (!procResponse.isSuccess()) {
                log.error("创建多表任务失败: {}", procResponse.getMessage());
                throw new RuntimeException(procResponse.getMessage());
            }
            Map<String, Object> procData = procResponse.getData();
            String procId = MapUtils.getString(procData, "id");
            String procName = MapUtils.getString(procData, "name");

            // 2.2. 保存多表任务
            Response<List<Map<String, Object>>> brokerResponse = dataosFeign.listBroker(workspaceName, cookie);
            if (!brokerResponse.isSuccess()) {
                log.error("查询调度集群组失败: {}", brokerResponse.getMessage());
                throw new RuntimeException(brokerResponse.getMessage());
            }
            List<Map<String, Object>> brokerList = brokerResponse.getData();
            if (brokerList.isEmpty()) {
                log.error("调度集群组为空");
                throw new RuntimeException("调度集群组为空");
            }
            String workgroup = MapUtils.getString(brokerList.get(0), "jobPermitValue");

            Map<String, Object> procParam = new HashMap<>();
            procParam.put("id", procId);
            procParam.put("name", procName);

            JSONObject procConf = new JSONObject();
            JSONObject schedule = new JSONObject();
            schedule.put("batchTabAmount", 10000);
            schedule.put("intervalNum", 1);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            schedule.put("startTime", now.format(formatter));
            schedule.put("workGroup", workgroup);
            procConf.put("schedule", schedule);
            JSONObject source = new JSONObject();
            source.put("dsName", dsName);
            source.put("schema", dsSchema);
            procConf.put("source", source);

            JSONObject sink = new JSONObject();
            sink.put("dsName", dsName);
            sink.put("schema", sinkSchema);
            procConf.put("sink", sink);

            JSONObject syncRule = new JSONObject();
            syncRule.put("tables", "[]");
            procConf.put("syncRule", syncRule);

            procParam.put("procConf", procConf.toJSONString());
            log.info("保存多表任务请求: {}", JSON.toJSONString(procParam));
            Response<Map<String, Object>> saveProcResponse = dataosFeign.saveProc(procParam, cookie);
            log.info("保存多表任务返回: {}", JSON.toJSONString(saveProcResponse));
            if (!saveProcResponse.isSuccess()) {
                log.error("保存多表任务失败: {}", saveProcResponse.getMessage());
                throw new RuntimeException(saveProcResponse.getMessage());
            }

            // 仅在当前具体的 年-月-日 时:分:秒 执行一次 (One-time)
            // 格式: 秒 分 时 日 月 ? 年
            String specificCron = String.format("%d %d %d %d %d %d",
                    now.getYear(),
                    now.getMonthValue(),
                    now.getDayOfMonth(),
                    now.getHour(),
                    now.getMinute(),
                    now.getSecond());

            for (OntologyObjectTypePo po : list) {
                OntologyInitDataTaskPo taskPo = taskPoMap.get(po.getId());
                taskPo.setJobCode(name + "_" + dsName + "_" + po.getTableName() + "_" + "once");
                taskPo.setStatus(InitDataTaskStatusEnum.RUNNING.getValue());
                taskPo.setMessage(InitDataTaskStatusEnum.RUNNING.getLabel());
                initDataTaskRepository.save(taskPo);
            }

            String schema = sinkSchema;
            List<Map<String, Object>> collect = list.stream()
                    .map(OntologyObjectTypePo::getTableName)
                    .distinct()
                    .map(tableName -> {
                        Map<String, Object> obj = new HashMap<>();
                        obj.put("id", "");
                        obj.put("procName", name);
                        obj.put("sourceDsName", dsName);
                        obj.put("sourceTableSchema", dsSchema);
                        obj.put("sourceTableName", tableName);
                        obj.put("targetDsName", dsName);
                        obj.put("targetTableSchema", schema);
                        obj.put("targetTableName", tableName);
                        obj.put("state", "unknown");
                        obj.put("conflictDealStrategy", "ignore");
                        obj.put("priority", "high");
                        obj.put("ifcrtmodel", "1");
                        JSONObject sched = new JSONObject();
                        sched.put("cronexp", specificCron);
                        sched.put("workGroup", workgroup);
                        sched.put("profile", "sim");
                        obj.put("schedule", sched.toJSONString());

                        return obj;
                    }).collect(Collectors.toList());

            log.info("保存创建表请求: {}", JSON.toJSONString(collect));
            Response<Map<String, Object>> saveListResponse = dataosFeign.saveList(collect, cookie);
            log.info("保存创建表返回: {}", JSON.toJSONString(saveListResponse));
            if (!saveListResponse.isSuccess()) {
                log.error("保存创建表失败: {}", saveListResponse.getMessage());
                throw new RuntimeException(saveListResponse.getMessage());
            }
        });

        if (!initDataTaskPoList.isEmpty()) {
            // 创建获取任务状态的线程
            List<String> jobCodeList = initDataTaskPoList.stream()
                    .map(OntologyInitDataTaskPo::getJobCode)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!jobCodeList.isEmpty()) {
                long startTime = System.currentTimeMillis();
                ScheduledFuture<?> future = applicationTaskExecutor.scheduleWithFixedDelay(() -> {
                    pollStatusWithTimeout(taskId, jobCodeList, workspaceName, startTime, cookie);
                }, Duration.ofSeconds(10));
                scheduledTasks.put(taskId, future);
            }
        }

        return taskId;
    }

    /**
     * 查询初始化任务状态
     */
    public List<Map<String, Object>> initDataStatus(InitDataVo initDataVo) {
        List<Map<String, Object>> result = new ArrayList<>();
        String taskId = initDataVo.getTaskId();
        List<OntologyInitDataTaskPo> initDataTaskPoList = initDataTaskRepository.findByTaskId(taskId);
        if (initDataTaskPoList.isEmpty()) {
            return result;
        }

        for (OntologyInitDataTaskPo initDataTaskPo : initDataTaskPoList) {
            // 查询调度任务状态
            Map<String, Object> obj = new HashMap<>();
            obj.put("objectTypeId", initDataTaskPo.getObjectTypeId());
            obj.put("status", initDataTaskPo.getStatus());
            result.add(obj);
        }
        return result;
    }

    private void pollStatusWithTimeout(String taskId, List<String> jobCodeList, String workspaceName, long startTime, String cookie) {
        try {
            long duration = System.currentTimeMillis() - startTime;
            if (duration > 5 * 60 * 1000L) {
                log.error("任务 {} 轮询超时，已超过5分钟，强制停止", taskId);

                // 更新失败任务
                initDataTaskRepository.updateTaskStatus(taskId, jobCodeList, InitDataTaskStatusEnum.FAILED.getValue(), "任务超时失败");
                // 停止轮询
                stopPolling(taskId);
                return;
            }

            // 查询任务状态
            Map<String, Object> param = new HashMap<>();
            param.put("batchTypes", "daily");
            param.put("desc", "desc");
            param.put("isVague", true);
            param.put("jobLabel", String.join(";", jobCodeList));
            param.put("pageNum", 0);
            param.put("pageSize", 10000);
            param.put("queryType", 0);
            param.put("readTeamNames", workspaceName);
            param.put("runStateNum", 1);
            param.put("sortColumn", "batchNo");
            param.put("taskType", "all");
            param.put("teamName", workspaceName);

            log.debug("查询任务状态请求: {}", JSON.toJSONString(param));
            Response<Map<String, Object>> response = dataosFeign.getJobData(param, cookie);
            log.debug("查询任务状态返回: {}", JSON.toJSONString(response));

            if (!response.isSuccess()) {
                log.error("查询任务状态接口调用失败: {}", response.getMessage());
            }
            Map<String, Object> data = response.getData();
            List<Map<String, Object>> content = (List<Map<String, Object>>) data.get("content");
            for (Map<String, Object> map : content) {
                String state = MapUtils.getString(map, "state");
                String jobCode = MapUtils.getString(map, "jobCode");
                if ("1".equals(state)) {
                    initDataTaskRepository.updateTaskStatus(taskId, jobCode, InitDataTaskStatusEnum.SUCCESS.getValue(), InitDataTaskStatusEnum.SUCCESS.getLabel());
                    jobCodeList.remove(jobCode);
                } else if ("-1".equals(state)) {
                    String message = MapUtils.getString(map, "message");
                    initDataTaskRepository.updateTaskStatus(taskId, jobCode, InitDataTaskStatusEnum.FAILED.getValue(), message);
                    jobCodeList.remove(jobCode);
                }
            }

            if (jobCodeList.isEmpty()) {
                stopPolling(taskId);
            }
        } catch (Exception e) {
            log.error("轮询任务 {} 发生异常", taskId, e);
        }
    }

    private void stopPolling(String taskId) {
        ScheduledFuture<?> future = scheduledTasks.get(taskId);
        if (future != null) {
            future.cancel(false); // 停止定时器
            scheduledTasks.remove(taskId);
        }
    }
}

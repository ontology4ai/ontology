package com.asiainfo.util;

import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

import org.springframework.beans.BeanUtils;

import com.asiainfo.po.OntologyApiParamPo;
import com.asiainfo.vo.operation.ApiParamVo;

import io.github.suanchou.utils.StringUtil;

/**
 * JSON层级转换工具类
 */
public class HierarchyConverter {

    /**
     * 将JSON节点列表转换为带parent_id关系的层级节点
     */
    public static List<ApiParamVo> convertToHierarchy(List<ApiParamVo> jsonNodes, String apiId, String parentId) {
        List<ApiParamVo> result = new ArrayList<>();

        for (ApiParamVo jsonNode : jsonNodes) {
            // 创建当前节点
            ApiParamVo currentNode = new ApiParamVo(
                    StringUtil.genUuid(32),
                    apiId,
                    jsonNode.getParamType(),
                    jsonNode.getParamName(),
                    jsonNode.getParamMethod(),
                    jsonNode.getParamMode(),
                    jsonNode.getIsRequired(),
                    jsonNode.getIsBuiltins(),
                    jsonNode.getParamDesc(),
                    jsonNode.getDefaultValue(),
                    jsonNode.getIsVirtual(),
                    parentId,
                    jsonNode.getFunctionId());

            // 递归处理子节点
            if (jsonNode.getChildren() != null && !jsonNode.getChildren().isEmpty()) {
                List<ApiParamVo> childNodes = convertToHierarchy(jsonNode.getChildren(), apiId, currentNode.getId());
                currentNode.setChildren(childNodes);
            }

            result.add(currentNode);
        }

        return result;
    }

    /**
     * 打印层级结构（用于调试）
     */
    public static void printHierarchy(List<ApiParamVo> nodes, int level) {
        for (ApiParamVo node : nodes) {
            StringBuilder indent = new StringBuilder();
            for (int i = 0; i < level; i++) {
                indent.append("  ");
            }

            System.out.println(indent + "└── " + node.getParamName() +
                    " (id: " + node.getId() +
                    ", parentId: " + node.getParentId() +
                    ", type: " + node.getParamType() + ")");

            // 递归打印子节点
            if (!node.getChildren().isEmpty()) {
                printHierarchy(node.getChildren(), level + 1);
            }
        }
    }

    public static List<OntologyApiParamPo> hierarchyOntologyApiParamPo(List<ApiParamVo> nodes, int level) {
        List<OntologyApiParamPo> result = new ArrayList<>();
        for (ApiParamVo node : nodes) {
            OntologyApiParamPo apiParamPo = new OntologyApiParamPo();
            BeanUtils.copyProperties(node, apiParamPo);
            result.add(apiParamPo);

            // 递归打印子节点
            if (!node.getChildren().isEmpty()) {
                result.addAll(hierarchyOntologyApiParamPo(node.getChildren(), level + 1));
            }
        }
        return result;
    }

    /**
     * 查找所有根节点（parentId为null）
     */
    public static List<ApiParamVo> findRootNodes(List<ApiParamVo> allNodes) {
        List<ApiParamVo> rootNodes = new ArrayList<>();
        for (ApiParamVo node : allNodes) {
            if (node.getParentId() == null) {
                rootNodes.add(node);
            }
        }
        return rootNodes;
    }

    /**
     * 根据ID查找节点
     */
    public static ApiParamVo findNodeById(List<ApiParamVo> nodes, String id) {
        for (ApiParamVo node : nodes) {
            if (node.getId().equals(id)) {
                return node;
            }
            ApiParamVo found = findNodeById(node.getChildren(), id);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    /**
     * 将扁平化节点列表转换为层级结构
     */
    public static List<ApiParamVo> convertToHierarchy(List<ApiParamVo> flatNodes) {
        // 创建ID到节点的映射
        Map<String, ApiParamVo> nodeMap = new HashMap<>();
        List<ApiParamVo> rootNodes = new ArrayList<>();

        // 第一遍遍历：创建所有节点
        for (ApiParamVo flatNode : flatNodes) {
            nodeMap.put(flatNode.getId(), flatNode);
        }

        // 第二遍遍历：建立父子关系
        for (ApiParamVo flatNode : flatNodes) {
            ApiParamVo currentNode = nodeMap.get(flatNode.getId());

            if (flatNode.getParentId() == null) {
                // 根节点
                rootNodes.add(currentNode);
            } else {
                // 子节点，找到父节点并添加
                ApiParamVo parentNode = nodeMap.get(flatNode.getParentId());
                if (parentNode != null) {
                    List<ApiParamVo> children = parentNode.getChildren();
                    if (children == null) {
                        children = new ArrayList<>();
                    }
                    children.add(currentNode);
                    parentNode.setChildren(children);
                }
            }
        }

        return rootNodes;
    }

}

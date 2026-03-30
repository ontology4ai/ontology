package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyInterfaceService;
import com.asiainfo.vo.operation.OntologyInterfaceVo;
import com.asiainfo.vo.search.InterfaceSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/_api/ontology/interface")
@Slf4j
public class OntologyInterfaceController {

    @Autowired
    OntologyInterfaceService ontologyInterfaceService;

    @PostMapping({"/create"})
    @Operation(summary = "新增接口")
    public Response save(HttpServletRequest request, @RequestBody OntologyInterfaceVo ontologyInterfaceVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyInterfaceVo.setOwnerId(identity.getUserId());
        ontologyInterfaceVo.setWorkspaceId(identity.getTeamName());

        try {
            OntologyInterfaceService.InterfaceDuplicateResult duplicateResult =
                    ontologyInterfaceService.checkExists(ontologyInterfaceVo.getOntologyId(), ontologyInterfaceVo.getName(), ontologyInterfaceVo.getLabel());
            if (duplicateResult.isNameExists()) {
                return Response.error("新增接口失败", String.format("接口英文名(%s)已存在", ontologyInterfaceVo.getName()));
            }
            if (duplicateResult.isLabelExists()) {
                return Response.error("新增接口失败", String.format("接口中文名(%s)已存在", ontologyInterfaceVo.getLabel()));
            }

            return Response.ok(ontologyInterfaceService.save(ontologyInterfaceVo));
        } catch (Exception e) {
            log.error("新增接口失败", e);
            return Response.error("新增接口失败", e.getMessage());
        }
    }

    @PostMapping("/checkExists")
    @Operation(summary = "检查接口名称是否存在")
    public Response checkExists(@RequestBody Map<String, String> payload) {
        String ontologyId = payload.get("ontologyId");
        String interfaceName = payload.get("name");
        String interfaceLabel = payload.get("label");
        if (StringUtils.isBlank(ontologyId)) {
            return Response.error("新增接口失败", "本体ID不能为空");
        }
        if (StringUtils.isBlank(interfaceName) && StringUtils.isBlank(interfaceLabel)) {
            return Response.error("新增接口失败", "接口英文名和中文名不能同时为空");
        }
        try {
            OntologyInterfaceService.InterfaceDuplicateResult duplicateResult =
                    ontologyInterfaceService.checkExists(ontologyId, interfaceName, interfaceLabel);
            Map<String, Object> result = new HashMap<>();
            if (duplicateResult.isNameExists()) {
                result.put("exists", Boolean.TRUE);
                result.put("type", "name");
                result.put("message", String.format("接口英文名(%s)已存在", interfaceName));
                return Response.ok(result);
            }
            if (duplicateResult.isLabelExists()) {
                result.put("exists", Boolean.TRUE);
                result.put("type", "label");
                result.put("message", String.format("接口中文名(%s)已存在", interfaceLabel));
                return Response.ok(result);
            }
            result.put("exists", Boolean.FALSE);
            return Response.ok(result);
        } catch (Exception e) {
            log.error("检查接口名称是否存在失败", e);
            return Response.error("新增接口失败", e.getMessage());
        }
    }

    @PostMapping({"/update"})
    @Operation(summary = "更新接口")
    public Response update(HttpServletRequest request, @RequestBody OntologyInterfaceVo ontologyInterfaceVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyInterfaceVo.setOwnerId(identity.getUserId());
        ontologyInterfaceVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyInterfaceService.update(ontologyInterfaceVo));
        } catch (Exception e) {
            log.error("更新接口失败", e);
            return Response.error("更新接口失败", e.getMessage());
        }
    }

    @PostMapping({"/affected"})
    @Operation(summary = "分析接口属性变更影响")
    public Response analysisAffected(HttpServletRequest request, @RequestBody OntologyInterfaceVo ontologyInterfaceVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyInterfaceVo.setOwnerId(identity.getUserId());
        ontologyInterfaceVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyInterfaceService.analysisAffected(ontologyInterfaceVo));
        } catch (Exception e) {
            log.error("分析接口属性变更影响失败", e);
            return Response.error("分析接口属性变更影响失败", e.getMessage());
        }
    }

    @PostMapping({"/updateStatus"})
    @Operation(summary = "启用/禁用接口")
    public Response save(HttpServletRequest request, @RequestBody List<InterfaceSearchVo> searchVoList) {
        try {
            return Response.ok(ontologyInterfaceService.updateStatus(searchVoList));
        } catch (Exception e) {
            log.error("启用/禁用失败", e);
            return Response.error("启用/禁用失败", e.getMessage());
        }
    }

    @PostMapping("/delete")
    @Operation(summary = "删除接口")
    @SuppressWarnings("rawtypes")
    public Response delete(HttpServletRequest request,
                                @RequestBody List<InterfaceSearchVo> searchVoList) {
        try {
            ontologyInterfaceService.delete(searchVoList);
            return Response.ok();
        } catch (Exception e) {
            log.error("删除接口失败", e);
            return Response.error("删除接口失败", e.getMessage());
        }
    }

    @PostMapping("/explorePage")
    @Operation(summary = "分页查询接口")
    @SuppressWarnings("rawtypes")
    public Response explorePage(HttpServletRequest request,
                                @RequestBody InterfaceSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setOwnerId(identity.getUserId());
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyInterfaceService.explorePage(searchVo));
        } catch (Exception e) {
            log.error("分页查询接口异常", e);
            return Response.error("分页查询接口异常", e.getMessage());
        }
    }

    @PostMapping("/exploreExtendedPage")
    @Operation(summary = "分页查询继承对象接口")
    @SuppressWarnings("rawtypes")
    public Response exploreExtendedPage(HttpServletRequest request,
                                @RequestBody InterfaceSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setOwnerId(identity.getUserId());
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyInterfaceService.exploreExtendedPage(searchVo));
        } catch (Exception e) {
            log.error("分页查询继承对象接口异常", e);
            return Response.error("分页查询继承对象接口异常", e.getMessage());
        }
    }

    @GetMapping("/overview")
    @Operation(summary = "接口详情")
    @SuppressWarnings("rawtypes")
    public Response findById(HttpServletRequest request,
                                      @RequestParam("interfaceId") String interfaceId) {
        try {
            return Response.ok(ontologyInterfaceService.findById(interfaceId));
        } catch (Exception e) {
            log.error("获取接口详情异常", e);
            return Response.error("获取接口详情异常", e.getMessage());
        }
    }

    @GetMapping("/filterAttributes")
    @Operation(summary = "过滤接口属性列表")
    @SuppressWarnings("rawtypes")
    public Response filterByLabel(HttpServletRequest request,
                             @RequestParam("interfaceId") String interfaceId,
                             @RequestParam("label") String label) {
        try {
            return Response.ok(ontologyInterfaceService.findAllAttributes(interfaceId, label));
        } catch (Exception e) {
            log.error("过滤接口属性列表异常", e);
            return Response.error("过滤接口属性列表异常", e.getMessage());
        }
    }

    @GetMapping("/findAll")
    @Operation(summary = "获取所有接口详情")
    @SuppressWarnings("rawtypes")
    public Response findAll(HttpServletRequest request,
                                      @RequestParam("ontologyId") String ontologyId) {
        try {
            return Response.ok(ontologyInterfaceService.findAll(ontologyId));
        } catch (Exception e) {
            log.error("获取所有接口详情异常", e);
            return Response.error("获取所有接口详情异常", e.getMessage());
        }
    }


    @PostMapping({"/removeObj/{interfaceId}"})
    @Operation(summary = "移除对象接口")
    public Response removeObj(HttpServletRequest request, @PathVariable String interfaceId, @RequestBody List<String> objectIds) {
        try {
            return Response.ok(ontologyInterfaceService.removeObj(interfaceId, objectIds));
        } catch (Exception e) {
            log.error("启用/禁用失败", e);
            return Response.error("移除对象接口", e.getMessage());
        }
    }

}

package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.LogicTypeService;
import com.asiainfo.vo.operation.LogicTypeVo;
import com.asiainfo.vo.search.LogicTypeSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 逻辑类型接口类
 */
@Slf4j
@RestController
@RequestMapping("/_api/ontology/logic/type")
public class LogicTypeController {
    @Autowired
    private LogicTypeService logicTypeService;

    /**
     * 通过调用 REST 接口获取文件列表，主要用于创建逻辑类型时选择文件的下拉选项。
     *
     * @param ontologyName 本体英文名
     * @return 文件列表
     */
    @GetMapping({"/file/list"})
    @Operation(summary = "查询文件列表")
    public Object listFile(String ontologyName) {
        try {
            return Response.ok(logicTypeService.listFile(ontologyName));
        } catch (Exception e) {
            log.error("文件列表查询失败", e);
            return Response.error("文件列表查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/list")
    @Operation(summary = "查询逻辑类型列表")
    public Object list(LogicTypeSearchVo searchVo) {
        try {
            return Response.ok(logicTypeService.list(searchVo));
        } catch (Exception e) {
            log.error("逻辑类型列表查询失败", e);
            return Response.error("查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/checkExists")
    @Operation(summary = "查询逻辑类型名称是否存在")
    public Object checkExists(LogicTypeSearchVo searchVo) {
        if (StringUtils.isBlank(searchVo.getOntologyId())) {
            return Response.error("本体ID为空", null);
        }
        if (StringUtils.isBlank(searchVo.getLogicTypeName()) && StringUtils.isBlank(searchVo.getLogicTypeLabel())) {
            return Response.error("查询失败，中文名和英文名同时为空", null);
        }
        try {
            return Response.ok(logicTypeService.checkExists(searchVo));
        } catch (Exception e) {
            log.error("逻辑类型名称是否存在查询失败", e);
            return Response.error("查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/save")
    @Operation(summary = "新增逻辑类型")
    public Object save(HttpServletRequest request, @RequestBody LogicTypeVo logicTypeVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        logicTypeVo.setOwnerId(identity.getUserId());

        try {
            return Response.ok(logicTypeService.save(logicTypeVo));
        } catch (Exception e) {
            log.error("逻辑类型新增失败", e);
            return Response.error("新增失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/update/{id}")
    @Operation(summary = "修改逻辑类型")
    public Object update(@PathVariable String id, @RequestBody LogicTypeVo logicTypeVo) {
        logicTypeVo.setId(id);
        try {
            return Response.ok(logicTypeService.update(logicTypeVo));
        } catch (Exception e) {
            log.error("逻辑类型修改失败", e);
            return Response.error("修改失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/delete")
    @Operation(summary = "删除逻辑类型")
    public Object delete(@RequestBody List<String> ids) {
        try {
            return Response.ok(logicTypeService.delete(ids));
        } catch (Exception e) {
            log.error("逻辑类型删除失败", e);
            return Response.error("删除失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/changeStatus")
    @Operation(summary = "修改逻辑类型状态")
    public Object changeStatus(@RequestBody LogicTypeVo logicTypeVo) {
        try {
            return Response.ok(logicTypeService.changeStatus(logicTypeVo));
        } catch (Exception e) {
            log.error("修改状态失败", e);
            return Response.error("修改状态失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "查询逻辑类型详情")
    public Object get(@PathVariable String id) {
        try {
            return Response.ok(logicTypeService.get(id));
        } catch (Exception e) {
            log.error("逻辑类型详情查询失败", e);
            return Response.error("查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/getByName")
    @Operation(summary = "根据英文名查询逻辑类型详情")
    public Object getByName(@RequestParam String ontologyId, @RequestParam String logicTypeName) {
        if (StringUtils.isAnyBlank(ontologyId, logicTypeName)) {
            return Response.error("本体ID或英文名为空", null);
        }
        try {
            return Response.ok(logicTypeService.getByName(ontologyId, logicTypeName));
        } catch (Exception e) {
            log.error("逻辑类型详情查询失败", e);
            return Response.error("查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/sync")
    @Operation(summary = "同步函数")
    public Object sync(HttpServletRequest request, String ontologyId) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            return Response.ok(logicTypeService.sync(ontologyId, identity.getUserId()));
        } catch (Exception e) {
            log.error("函数同步失败", e);
            return Response.error("函数同步失败，" + e.getMessage(), e.getMessage());
        }
    }
}

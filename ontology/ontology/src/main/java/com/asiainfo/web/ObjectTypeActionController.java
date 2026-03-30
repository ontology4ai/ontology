package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.ObjectTypeActionService;
import com.asiainfo.vo.operation.ObjectTypeActionVo;
import com.asiainfo.vo.search.ObjectTypeActionSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 动作类型
 *
 * @author hulin
 * @since 2025-09-12
 */
@RestController
@RequestMapping("/_api/ontology/action/type")
@Slf4j
public class ObjectTypeActionController {
    @Autowired
    ObjectTypeActionService objectTypeActionService;

    @GetMapping({"/file/list"})
    @Operation(summary = "查询文件列表")
    public Object listFile(String ontologyName) {
        try {
            return Response.ok(objectTypeActionService.listFile(ontologyName));
        } catch (Exception e) {
            log.error("文件列表查询失败", e);
            return Response.error("文件列表查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/list")
    @Operation(summary = "动作类型列表")
    public Object list(ObjectTypeActionSearchVo searchVo) {
        try {
            return Response.ok(objectTypeActionService.list(searchVo));
        } catch (Exception e) {
            log.error("动作类型列表查询异常", e);
            return Response.error("动作类型列表查询异常", e.getMessage());
        }
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "动作类型详情")
    public Object get(@PathVariable String id) {
        try {
            return Response.ok(objectTypeActionService.get(id));
        } catch (Exception e) {
            log.error("动作类型详情查询异常", e);
            return Response.error("动作类型详情查询异常", e.getMessage());
        }
    }

    @GetMapping("/checkExists")
    @Operation(summary = "检查动作类型名称是否存在")
    public Object checkExists(ObjectTypeActionVo actionVo) {
        if (StringUtils.isBlank(actionVo.getOntologyId())) {
            return Response.error("本体ID为空", null);
        }

        if (StringUtils.isBlank(actionVo.getActionLabel()) && StringUtils.isBlank(actionVo.getActionName())) {
            return Response.error("动作类型名称为空", null);
        }
        try {
            return Response.ok(objectTypeActionService.checkExists(actionVo));
        } catch (Exception e) {
            log.error("名称是否存在查询失败", e);
            return Response.error("名称是否存在查询失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/save")
    @Operation(summary = "动作类型新增")
    public Object save(HttpServletRequest request, @RequestBody ObjectTypeActionVo objectTypeActionVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        objectTypeActionVo.setOwnerId(identity.getUserId());
        objectTypeActionVo.setWorkspaceId(identity.getTeamName());
        if (StringUtils.isBlank(objectTypeActionVo.getOntologyId())) {
            return Response.error("本体ID为空", "本体ID不能为空");
        }
        if (StringUtils.isBlank(objectTypeActionVo.getObjectTypeId())) {
            return Response.error("对象类型ID为空", "对象类型ID不能为空");
        }
        try {
            return Response.ok(objectTypeActionService.save(objectTypeActionVo));
        } catch (Exception e) {
            log.error("新增动作类型异常", e);
            return Response.error("新增动作类型异常", e.getMessage());
        }
    }

    @PostMapping("/update/{id}")
    @Operation(summary = "动作类型修改")
    public Object update(@PathVariable String id, @RequestBody ObjectTypeActionVo objectTypeActionVo) {
        if (StringUtils.isBlank(objectTypeActionVo.getOntologyId())) {
            return Response.error("本体ID为空", "本体ID不能为空");
        }
        if (StringUtils.isBlank(objectTypeActionVo.getObjectTypeId())) {
            return Response.error("对象类型ID为空", "对象类型ID不能为空");
        }
        try {
            return Response.ok(objectTypeActionService.update(id, objectTypeActionVo));
        } catch (Exception e) {
            log.error("修改动作类型失败", e);
            return Response.error("修改动作类型失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/changeStatus")
    @Operation(summary = "修改动作类型状态")
    public Object changeStatus(@RequestBody ObjectTypeActionVo objectTypeActionVo) {
        try {
            return Response.ok(objectTypeActionService.changeStatus(objectTypeActionVo));
        } catch (Exception e) {
            log.error("修改状态失败", e);
            return Response.error("修改状态失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/delete")
    @Operation(summary = "动作类型删除")
    public Object delete(@RequestBody List<String> ids) {
        return Response.ok(objectTypeActionService.delete(ids));
    }

    @PostMapping("/param/delete")
    @Operation(summary = "动作类型参数删除")
    public Object deleteParam(@RequestBody List<String> ids) {
        return Response.ok(objectTypeActionService.deleteParam(ids));
    }

    @GetMapping("/sync")
    @Operation(summary = "同步函数")
    public Object sync(HttpServletRequest request, String ontologyId) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            return Response.ok(objectTypeActionService.sync(ontologyId, identity.getUserId()));
        } catch (Exception e) {
            log.error("函数同步失败", e);
            return Response.error("函数同步失败，" + e.getMessage(), e.getMessage());
        }
    }
}

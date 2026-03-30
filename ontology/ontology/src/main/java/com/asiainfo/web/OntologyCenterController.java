package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.po.OntologyCenterPo;
import com.asiainfo.serivce.OntologyCenterService;
import com.asiainfo.vo.operation.CenterDeleteVo;
import com.asiainfo.vo.operation.CenterSyncVo;
import com.asiainfo.vo.operation.OntologyCenterVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/_api/ontology/center")
@Slf4j
public class OntologyCenterController {

    @Autowired
    OntologyCenterService ontologyCenterService;

    @PostMapping({"/save"})
    @Operation(summary = "新增共享中心")
    public Response save(HttpServletRequest request, @Valid  @RequestBody OntologyCenterVo ontologyCenterVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyCenterVo.setOwnerId(identity.getUserId());
        ontologyCenterVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyCenterService.save(ontologyCenterVo));
        } catch (Exception e) {
            log.error("新增共享中心失败", e);
            return Response.error("新增共享中心失败", e.getMessage());
        }
    }

    @PostMapping({"/update"})
    @Operation(summary = "更新共享中心")
    public Response update(HttpServletRequest request, @RequestBody OntologyCenterVo ontologyCenterVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        ontologyCenterVo.setOwnerId(identity.getUserId());
        ontologyCenterVo.setWorkspaceId(identity.getTeamName());

        try {
            OntologyCenterPo result = ontologyCenterService.update(ontologyCenterVo);
            if (null != result) {
                return Response.ok(result);
            }

            return Response.error("更新共享中心失败", "根据id无法找到共享中心实例");
        } catch (Exception e) {
            log.error("更新共享中心失败", e);
            return Response.error("更新共享中心失败", e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "删除共享中心")
    public Response delete(HttpServletRequest request,
                           @RequestBody  CenterDeleteVo centerDeleteVo) {
        try {
            ontologyCenterService.delete(centerDeleteVo.getCenterId(), centerDeleteVo.getParentId());
            return Response.ok();
        } catch (Exception e) {
            log.error("删除共享中心失败", e);
            return Response.error("删除共享中心失败", e.getMessage());
        }
    }

    @GetMapping({"/search"})
    @Operation(summary = "获取共享中心")
    public Response search(HttpServletRequest request, @RequestParam("parentId") String parentId) {
        try {
            return Response.ok(ontologyCenterService.findAllByParentId(parentId));
        } catch (Exception e) {
            log.error("获取共享中心失败", e);
            return Response.error("获取共享中心失败", e.getMessage());
        }
    }

    @PostMapping({"/syncObjectTypes"})
    @Operation(summary = "同步本体对象类型")
    public Response syncObjectTypes(HttpServletRequest request, @RequestBody CenterSyncVo centerSyncVo) {
        try {
            return Response.ok(ontologyCenterService.syncObjectTypes(centerSyncVo));
        } catch (Exception e) {
            log.error("同步本体对象类型失败", e);
            return Response.error("同步本体对象类型失败", e.getMessage());
        }
    }
}

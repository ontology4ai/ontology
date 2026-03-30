package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologySimuService;
import com.asiainfo.vo.operation.OntologyCanvasVo;

import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/_api/ontology/simu/canvas")
@Slf4j
public class SimuCanvasController {
    @Autowired
    private OntologySimuService ontologySimuService;

    /**
     * 保存画布
     */
    @PostMapping({ "/save" })
    @Operation(summary = "保存画布")
    public Response save(HttpServletRequest request, @Valid @RequestBody OntologyCanvasVo canvasVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        canvasVo.setOwnerId(identity.getUserId());
        canvasVo.setWorkspaceId(identity.getTeamName());
        try {

            return Response.ok(ontologySimuService.saveCanvas(canvasVo));
        } catch (Exception e) {
            log.error("保存画布失败", e);
            return Response.error("保存画布失败", e.getMessage());
        }
    }

    /**
     * 更新画布
     */
    @PostMapping({ "/update/{id}" })
    @Operation(summary = "更新画布")
    public Response update(HttpServletRequest request, @PathVariable String id,
            @Valid @RequestBody OntologyCanvasVo canvasVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        canvasVo.setOwnerId(identity.getUserId());
        canvasVo.setWorkspaceId(identity.getTeamName());
        canvasVo.setId(id);
        try {

            return Response.ok(ontologySimuService.updateCanvas(canvasVo));
        } catch (Exception e) {
            log.error("更新画布失败", e);
            return Response.error("更新画布失败", e.getMessage());
        }
    }

    /**
     * 获取画布
     */
    @GetMapping({ "/find/{id}" })
    @Operation(summary = "获取画布")
    public Response findById(HttpServletRequest request, @PathVariable String id) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            return Response.ok(ontologySimuService.findCanvas(id, identity.getTeamName()));
        } catch (Exception e) {
            log.error("获取画布失败", e);
            return Response.error("获取画布失败", e.getMessage());
        }
    }

}

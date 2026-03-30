package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyDataChangeLogService;
import com.asiainfo.vo.search.DataChangeLogSearchVo;

import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/ontology/data/change/log")
@Slf4j
public class OntologyDataChangeLogController {

    @Autowired
    private OntologyDataChangeLogService ontologyDataChangeLogService;

    @GetMapping({ "/getTarget/{trackId}" })
    @Operation(summary = "目标对象的本体仿真数据变更日志查询")
    public Response getTarget(HttpServletRequest request, @PathVariable String trackId,
            DataChangeLogSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("getTarget() trackId:{}", trackId);
        searchVo.setTrackId(trackId);
        try {
            return Response.ok(ontologyDataChangeLogService.getTargets(searchVo));
        } catch (Exception e) {
            log.error("目标对象的本体仿真数据变更日志查询失败", e);
            return Response.error("目标对象的本体仿真数据变更日志查询失败", e.getMessage());
        }
    }

    @GetMapping({ "/getAffect/{trackId}" })
    @Operation(summary = "受影响对象的本体仿真数据变更日志查询")
    public Response getAffect(HttpServletRequest request, @PathVariable String trackId,
            DataChangeLogSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("getAffect() trackId:{}", trackId);
        searchVo.setTrackId(trackId);
        try {
            return Response.ok(ontologyDataChangeLogService.getAffects(searchVo));
        } catch (Exception e) {
            log.error("受影响对象的本体仿真数据变更日志查询失败", e);
            return Response.error("受影响对象的本体仿真数据变更日志查询失败", e.getMessage());
        }
    }

    @GetMapping({ "/listAffect/{trackId}" })
    @Operation(summary = "受影响对象的本体仿真数据变更日志分页查询")
    public Response listAffect(HttpServletRequest request, @PathVariable String trackId,
            DataChangeLogSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("listAffect() trackId:{}", trackId);
        searchVo.setTrackId(trackId);
        try {
            return Response.ok(ontologyDataChangeLogService.listAffects(searchVo));
        } catch (Exception e) {
            log.error("受影响对象的本体仿真数据变更日志分页查询失败", e);
            return Response.error("受影响对象的本体仿真数据变更日志分页查询失败", e.getMessage());
        }
    }

    @GetMapping({ "/listTarget/{trackId}" })
    @Operation(summary = "目标对象的本体仿真数据变更日志分页查询")
    public Response listTarget(HttpServletRequest request, @PathVariable String trackId,
            DataChangeLogSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        searchVo.setWorkspaceId(identity.getTeamName());
        log.debug("listTarget() trackId:{}", trackId);
        searchVo.setTrackId(trackId);
        try {
            return Response.ok(ontologyDataChangeLogService.listTargets(searchVo));
        } catch (Exception e) {
            log.error("目标对象的本体仿真数据变更日志分页查询失败", e);
            return Response.error("目标对象的本体仿真数据变更日志分页查询失败", e.getMessage());
        }
    }
}

package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyObjectTypeGroupService;
import com.asiainfo.vo.operation.OntologyObjectTypeGroupVo;
import com.asiainfo.vo.search.OntologyObjectTypeGroupSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@RestController
@RequestMapping("/_api/ontology/object/group")
@Slf4j
public class ObjectTypeGroupController {

    @Autowired
    OntologyObjectTypeGroupService ontologyObjectTypeGroupService;

    @GetMapping({"/list"})
    @Operation(summary = "本体类型分组分页查询")
    public Response searchGroup(HttpServletRequest request, OntologyObjectTypeGroupSearchVo searchVo

    ) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
//
//        searchVo.setUserId(identity.getUserName());
//        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyObjectTypeGroupService.searchGroup(searchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体对象类型分组失败", e.getMessage());
        }

    }

    @GetMapping({"/findAll"})
    @Operation(summary = "本体类型分组列表")
    public Response findAll(HttpServletRequest request, OntologyObjectTypeGroupSearchVo searchVo

    ) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
//
//        searchVo.setUserId(identity.getUserName());
//        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(ontologyObjectTypeGroupService.findAll(searchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping({"/save"})
    @Operation(summary = "本体类型分组新增")
    public Response save(HttpServletRequest request, @Valid @RequestBody OntologyObjectTypeGroupVo ontologyVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        ontologyVo.setOwnerId(identity.getUserId());
        ontologyVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyObjectTypeGroupService.saveGroup(ontologyVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("新增本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping({"/update/{id}"})
    @Operation(summary = "对象类型分组修改")
    public Response update(HttpServletRequest request, @PathVariable String id, @Valid @RequestBody OntologyObjectTypeGroupVo ontologyVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        ontologyVo.setOwnerId(identity.getUserId());
        ontologyVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(ontologyObjectTypeGroupService.updateGroup(id, ontologyVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping({"/delete"})
    @Operation(summary = "本体对象类型分组删除")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(ontologyObjectTypeGroupService.deleteGroup(ids));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体失败", e.getMessage());
        }

    }

    @PostMapping({"/object/add/{id}"})
    @Operation(summary = "对象类型分组修改")
    public Response objectAdd(HttpServletRequest request, @PathVariable String id, @RequestBody List<String> objectIds
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);


        try {
            return Response.ok(ontologyObjectTypeGroupService.objectAdd(id, objectIds));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体对象类型分组失败", e.getMessage());
        }

    }
}

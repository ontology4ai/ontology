package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.serivce.OntologyService;
import com.asiainfo.serivce.SharedAttributeService;
import com.asiainfo.vo.operation.OntologyVo;
import com.asiainfo.vo.operation.SharedAttributeVo;
import com.asiainfo.vo.search.OntologySearchVo;
import com.asiainfo.vo.search.SharedAttributeSearchVo;
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
@RequestMapping("/_api/shared/attribute")
@Slf4j
public class SharedAttributeController {


    @Autowired
    SharedAttributeService sharedAttributeService;

    @GetMapping({"/list"})
    @Operation(summary = "共享属性分页查询")
    public Response search(HttpServletRequest request, SharedAttributeSearchVo searchVo

    ) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
//
//        searchVo.setUserId(identity.getUserName());
//        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(sharedAttributeService.search(searchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询共享属性失败", e.getMessage());
        }

    }

    @GetMapping({"/findAll"})
    @Operation(summary = "共享属性查询")
    public Response findAll(HttpServletRequest request, SharedAttributeSearchVo searchVo

    ) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
//
//        searchVo.setUserId(identity.getUserName());
//        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(sharedAttributeService.findAll(searchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询共享属性失败", e.getMessage());
        }

    }

    @PostMapping({"/save"})
    @Operation(summary = "共享属性新增")
    public Response save(HttpServletRequest request,@Valid @RequestBody SharedAttributeVo sharedAttributeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        sharedAttributeVo.setOwnerId(identity.getUserId());
        sharedAttributeVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(sharedAttributeService.save(sharedAttributeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("共享属性新增失败", e.getMessage());
        }
    }

    @PostMapping({"/update/{id}"})
    @Operation(summary = "共享属性修改")
    public Response update(HttpServletRequest request, @PathVariable String id, @RequestBody SharedAttributeVo sharedAttributeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        sharedAttributeVo.setOwnerId(identity.getUserId());
        sharedAttributeVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(sharedAttributeService.update(id, sharedAttributeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改共享属性失败", e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "本体删除")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(sharedAttributeService.delete(ids));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("删除本体失败", e.getMessage());
        }
    }
}

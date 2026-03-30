package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.FunctionService;
import com.asiainfo.vo.search.FunctionSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@RestController
@RequestMapping("/_api/ontology/function")
@Slf4j
public class FunctionController {

    @Autowired
    FunctionService functionService;

    @GetMapping({"/findAll"})
    @Operation(summary = "查询所有函数")
    public Response findAll(HttpServletRequest request, FunctionSearchVo functionSearchVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        functionSearchVo.setOwnerId(identity.getUserId());
        functionSearchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(functionService.findAll(functionSearchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询所有函数失败", e.getMessage());
        }
    }

    @GetMapping({"/publish"})
    @Operation(summary = "函数发布")
    public Response publish(HttpServletRequest request, String ontologyId) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        try {
            return Response.ok(functionService.publish(ontologyId, identity.getUserId()));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("函数发布失败", e.getMessage());
        }
    }

    @GetMapping("/list")
    @Operation(summary = "查询函数列表")
    public Object list(FunctionSearchVo searchVo) {
        try {
            return Response.ok(functionService.list(searchVo));
        } catch (Exception e) {
            log.error("函数列表查询异常", e);
            return Response.error("函数列表查询异常", e.getMessage());
        }
    }

    @GetMapping("/view/{id}")
    @Operation(summary = "函数详情")
    public Object view(@PathVariable String id) {
        try {
            return Response.ok(functionService.view(id));
        } catch (Exception e) {
            log.error("函数详情查询异常", e);
            return Response.error("函数详情查询异常", e.getMessage());
        }
    }
}

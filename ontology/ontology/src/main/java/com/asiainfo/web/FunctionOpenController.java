package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.FunctionService;
import com.asiainfo.serivce.ObjectTypeActionService;
import com.asiainfo.vo.search.FunctionSearchVo;
import com.asiainfo.vo.search.ObjectTypeActionSearchVo;
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
@RequestMapping("/api/open/ontology/function")
@Slf4j
public class FunctionOpenController {

    @Autowired
    FunctionService functionService;

    @Autowired
    ObjectTypeActionService objectTypeActionService;


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

    @GetMapping("/actionFind")
    @Operation(summary = "动作类型获取")
    public Object actionFind(@RequestParam("key") String key) {
        try {
            return Response.ok(objectTypeActionService.getAction(key));
        } catch (Exception e) {
            log.error("动作类型列表查询异常", e);
            return Response.error("动作类型列表查询异常", e.getMessage());
        }
    }

}

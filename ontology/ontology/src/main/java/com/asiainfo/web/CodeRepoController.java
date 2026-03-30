package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.CodeRepoService;
import com.asiainfo.vo.operation.CodeRepoVo;
import com.asiainfo.vo.search.CodeRepoSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 代码仓库接口相关
 *
 * @author hulin
 * @since 2025-09-18
 */
@RestController
@RequestMapping("/_api/ontology/code/repo")
@Slf4j
public class CodeRepoController {
    @Autowired
    private CodeRepoService codeRepoService;

    @GetMapping("/list")
    @Operation(summary = "查询代码仓库列表")
    public Object list(CodeRepoSearchVo searchVo) {
        try {
            return Response.ok(codeRepoService.list(searchVo));
        } catch (Exception e) {
            log.error("代码仓库列表查询异常", e);
            return Response.error("代码仓库列表查询异常", e.getMessage());
        }
    }

    @PostMapping("/save")
    @Operation(summary = "创建代码仓库")
    public Object save(HttpServletRequest request, @RequestBody CodeRepoVo codeRepoVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        codeRepoVo.setOwnerId(identity.getUserId());
        codeRepoVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(codeRepoService.save(codeRepoVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }
}

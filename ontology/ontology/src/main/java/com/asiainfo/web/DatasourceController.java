package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.DatasourceService;
import com.asiainfo.vo.datasource.DatasourceVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@RestController
@RequestMapping("/_api/datasource")
@Slf4j
public class DatasourceController {

    @Autowired
    DatasourceService datasourceService;

    @GetMapping({"/list"})
    @Operation(summary = "数据源列表")
    public Response list(HttpServletRequest request, @RequestParam(defaultValue = "mysql") List<String> dsType

    ) {
        dsType = Arrays.asList("mysql", "postgresql");
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(datasourceService.list(identity.getTeamName(), dsType));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/tables"})
    @Operation(summary = "数据表列表")
    public Response tables(HttpServletRequest request, DatasourceVo datasourceVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(datasourceService.tables(identity.getTeamName(), datasourceVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @GetMapping({"/table/infos"})
    @Operation(summary = "数据表详情")
    public Response tableInfos(HttpServletRequest request, DatasourceVo datasourceVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(datasourceService.tableInfos(identity.getTeamName(), datasourceVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }


}

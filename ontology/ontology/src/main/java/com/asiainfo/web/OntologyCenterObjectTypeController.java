package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.CenterObjectTypeService;
import com.asiainfo.vo.search.CenterObjectTypeSearchVo;
import com.asiainfo.vo.search.CenterObjectTypeUpdateVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/ontology/center/type")
@Slf4j
public class OntologyCenterObjectTypeController {

    @Autowired
    CenterObjectTypeService centerObjectTypeService;

    @PostMapping("/explorePage")
    @Operation(summary = "分页查询对象类型")
    @SuppressWarnings("rawtypes")
    public Response explorePage(HttpServletRequest request,
                                @RequestBody CenterObjectTypeSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setOwnerId(identity.getUserId());
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(centerObjectTypeService.explorePage(searchVo));
        } catch (Exception e) {
            log.error("分页查询对象类型异常", e);
            return Response.error("分页查询对象类型异常", e.getMessage());
        }
    }

    @PostMapping("/updateStatus")
    @Operation(summary = "更新对象类型状态")
    @SuppressWarnings("rawtypes")
    public Response updateStatus(HttpServletRequest request,
                                 @RequestBody CenterObjectTypeUpdateVo  updateVo) {
        try {
            return Response.ok(centerObjectTypeService.updateStatusByTypeId(updateVo.getObjectTypeId(), updateVo.getStatus()));
        } catch (Exception e) {
            log.error("更新对象类型状态异常", e);
            return Response.error("更新对象类型状态异常", e.getMessage());
        }
    }

    @GetMapping("/exploreDetail")
    @Operation(summary = "查询对象类型详情")
    public Response exploreDetail(HttpServletRequest request,
                                  @RequestParam("objectTypeId") String objectTypeId) {
        try {
            return Response.ok(centerObjectTypeService.exploreDetail(objectTypeId));
        } catch (Exception e) {
            log.error("查询对象类型详情异常", e);
            return Response.error("查询对象类型详情异常", e.getMessage());
        }
    }
}

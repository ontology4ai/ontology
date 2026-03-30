package com.asiainfo.web;

import com.asiainfo.dto.ParseSqlResultDto;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.ObjectTypeExploreService;
import com.asiainfo.serivce.ObjectTypeService;
import com.asiainfo.vo.operation.AttributeVo;
import com.asiainfo.vo.operation.ObjectTypeVo;
import com.asiainfo.vo.search.ObjectTypeExploreVo;
import com.asiainfo.vo.search.ObjectTypeSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@RestController
@RequestMapping("/_api/ontology/object/type")
@Slf4j
public class ObjectTypeController {

    @Autowired
    ObjectTypeService objectTypeService;

    @Autowired
    ObjectTypeExploreService exploreService;

    @GetMapping({"/list"})
    @Operation(summary = "对象类型列表")
    public Response list(HttpServletRequest request, ObjectTypeSearchVo objectTypeSearchVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(objectTypeService.list(objectTypeSearchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询对象类型失败", e.getMessage());
        }
    }

    @GetMapping({"/findAll"})
    @Operation(summary = "所有对象类型")
    public Response findAll(HttpServletRequest request, ObjectTypeSearchVo objectTypeSearchVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(objectTypeService.findAll(objectTypeSearchVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询对象类型失败", e.getMessage());
        }
    }

    @GetMapping({"/get/{id}"})
    @Operation(summary = "对象类型列表")
    public Response get(HttpServletRequest request, @PathVariable String id

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(objectTypeService.get(id));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询本体失败", e.getMessage());
        }
    }

    @PostMapping({"/save"})
    @Operation(summary = "对象类型新增")
    public Response save(HttpServletRequest request, @RequestBody ObjectTypeVo objectTypeVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        objectTypeVo.setOwnerId(identity.getUserId());
        objectTypeVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(objectTypeService.save(objectTypeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("新增对象类型失败", e.getMessage());
        }

    }

    @PostMapping({"/update/{id}"})
    @Operation(summary = "对象类型修改")
    public Response update(HttpServletRequest request, @PathVariable String id, @RequestBody ObjectTypeVo objectTypeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        objectTypeVo.setOwnerId(identity.getUserId());
        objectTypeVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(objectTypeService.update(id, objectTypeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping("/changeStatus")
    @Operation(summary = "修改对象类型状态")
    public Response changeStatus(@RequestBody ObjectTypeVo objectTypeVo) {
        try {
            return Response.ok(objectTypeService.changeStatus(objectTypeVo));
        } catch (Exception e) {
            log.error("修改对象类型状态失败", e);
            return Response.error("修改对象类型状态失败: " + e.getMessage(), e.getMessage());
        }
    }

    /**
     * 删除对象类型
     * <ul>
     *     <li>删除指定的对象类型</li>
     *     <li>删除对应的属性</li>
     *     <li>关系类型直接删除</li>
     *     <li>动作类型根据指定的规则禁用或者删除，同时调用后台（Python）的删除接口</li>
     *     <li>逻辑类型根据指定的规则禁用或则删除，同时调用后台（Python）的删除接口</li>
     * </ul>
     *
     * 由于动作类型和逻辑类型可以禁用而不是删除，所以在启用动作类型或逻辑类型时需要判断关联的对象类型是否存在或删除。
     *
     * @param params 指定的对象类型ID
     * @return 删除结果
     */
    @SuppressWarnings("unchecked")
    @PostMapping({"/delete"})
    @Operation(summary = "删除本体对象类型")
    public Response delete(@RequestBody Map<String, Object> params) {
        List<String> ids = (List<String>) params.get("ids");
        boolean cascadeDelete = MapUtils.getBoolean(params, "cascadeDelete");
        try {
            return Response.ok(objectTypeService.delete(ids, cascadeDelete));
        } catch (Exception e) {
            log.error("删除本体对象类型失败", e);
            return Response.error("删除本体对象类型失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/update/attr/{id}"})
    @Operation(summary = "对象类型属性修改")
    public Response updateAttr(HttpServletRequest request, @PathVariable String id, @RequestBody ObjectTypeVo objectTypeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        objectTypeVo.setOwnerId(identity.getUserId());
        objectTypeVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(objectTypeService.updateAttr(id, objectTypeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping({"/update/attr/info/{id}"})
    @Operation(summary = "对象类型属性修改")
    public Response updateAttrInfo(HttpServletRequest request, @PathVariable String id, @RequestBody AttributeVo attributeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);


        try {
            return Response.ok(objectTypeService.updateAttrInfo(id, attributeVo));
        } catch (Exception e) {
            log.error("",e);
            return Response.error("修改本体对象类型分组失败", e.getMessage());
        }

    }

    @PostMapping({"/attr/changeStatus"})
    @Operation(summary = "修改对象类型属性状态")
    public Response updateAttrStatus(@RequestBody AttributeVo attributeVo) {
        try {
            return Response.ok(objectTypeService.updateAttrStatus(attributeVo));
        } catch (Exception e) {
            log.error("修改对象类型属性状态失败", e);
            return Response.error("修改对象类型属性状态失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/attr/delete")
    @Operation(summary = "删除对象类型属性")
    public Response deleteAttribute(@RequestBody AttributeVo attributeVo) {
        try {
            return Response.ok(objectTypeService.deleteAttribute(attributeVo));
        } catch (Exception e) {
            log.error("删除对象类型属性失败", e);
            return Response.error("删除对象类型属性失败，" + e.getMessage(), e.getMessage());
        }
    }

    /**
     * 对象类型属性名称推荐
     * @param fieldNames 字段列表
     * @return 推荐的属性名
     */
    @PostMapping("/attr/suggest")
    @Operation(summary = "对象类型属性名称推荐")
    public Response suggestAttribute(@RequestBody Map<String, List<String>> fieldNames) {
        try {
            return Response.ok(objectTypeService.suggestAttribute(fieldNames.get("fieldNames")));
        } catch (Exception e) {
            log.error("属性名称推荐异常", e);
            return Response.error("属性名称推荐异常", e.getMessage());
        }
    }

    @GetMapping("/explore")
    @Operation(summary = "查询所有对象类型")
    @SuppressWarnings("rawtypes")
    public Response explore(HttpServletRequest request, ObjectTypeSearchVo searchVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        searchVo.setOwnerId(identity.getUserId());
        searchVo.setWorkspaceId(identity.getTeamName());
        try {
            return Response.ok(exploreService.explorePage(searchVo));
        } catch (Exception e) {
            log.error("查询所有对象类型异常", e);
            return Response.error("查询所有对象类型异常", e.getMessage());
        }
    }

    @GetMapping("/explore/detail")
    @Operation(summary = "对象类型详情")
    public Response detail(String objectTypeId) {
        return Response.ok(exploreService.exploreDetail(objectTypeId));
    }

    @GetMapping("/explore/summary")
    @Operation(summary = "对象类型摘要")
    public Object summary(ObjectTypeExploreVo exploreVo) {
        try {
            return Response.ok(exploreService.summary(exploreVo));
        } catch (Exception e) {
            log.error("对象类型摘要查询异常", e);
            return Response.error("对象类型摘要查询异常", e.getMessage());
        }
    }

    @GetMapping("/explore/preview")
    @Operation(summary = "对象类型数据预览")
    public Response preview(ObjectTypeExploreVo exploreVo) {
        try {
            return Response.ok(exploreService.preview(exploreVo));
        } catch (Exception e) {
            log.error("对象类型数据预览数据查询异常", e);
            return Response.error("对象类型数据预览数据查询异常", e.getMessage());
        }
    }

    @PostMapping("/parseCustomSql")
    @Operation(summary = "解析自定义sql")
    public ParseSqlResultDto parseCustomSql(HttpServletRequest request, @RequestBody ObjectTypeExploreVo validateVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        validateVo.setWorkspaceId(identity.getTeamName());
        return exploreService.parseCustomSql(validateVo);
    }

    @GetMapping("/checkExists")
    @Operation(summary = "检查名称是否存在")
    public Response checkExists(String ontologyId, String objectTypeName, String objectTypeLabel) {
        if (StringUtils.isBlank(ontologyId)) {
            return Response.error("本体ID不能为空", "本体ID不能为空");
        }
        if (StringUtils.isBlank(objectTypeName) && StringUtils.isBlank(objectTypeLabel)) {
            return Response.error("英文名和中文名不能同时为空", "英文名和中文名不能同时为空");
        }
        try {
            return Response.ok(objectTypeService.checkExists(ontologyId, objectTypeName, objectTypeLabel));
        } catch (Exception e) {
            log.error("检查名称是否存在异常", e);
            return Response.error("检查名称是否存在异常，" + e.getMessage(), e.getMessage());
        }
    }

    @GetMapping("/graphObjectType")
    @Operation(summary = "获取本体对象类型")
    public Response graphObjectType(HttpServletRequest request,
                                    @RequestParam("objectTypeId") String objectTypeId) {
        try {
            return Response.ok(objectTypeService.expandByObjectTypeId(objectTypeId));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("", e.getMessage());
        }
    }
}

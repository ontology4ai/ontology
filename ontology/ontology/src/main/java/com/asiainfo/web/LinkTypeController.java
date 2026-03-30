package com.asiainfo.web;

import com.asiainfo.dto.OntologyTagDto;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.LinkTypeService;
import com.asiainfo.vo.operation.OntologyLinkTypeVo;
import com.asiainfo.vo.operation.OntologyTagVo;
import com.asiainfo.vo.search.LinkTypeSearchVo;
import com.asiainfo.vo.search.OntologyTagSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@RestController
@RequestMapping("/_api/ontology/link/type")
@Slf4j
public class LinkTypeController {

    @Autowired
    LinkTypeService linkTypeService;

    @GetMapping({"/list"})
    @Operation(summary = "连接类型列表")
    public Response list(HttpServletRequest request, LinkTypeSearchVo linkTypeSearchVo

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(linkTypeService.list(linkTypeSearchVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询连接类型失败", e.getMessage());
        }
    }

//    @GetMapping({"/findAll"})
//    @Operation(summary = "所有对象类型")
//    public Response findAll(HttpServletRequest request, ObjectTypeSearchVo objectTypeSearchVo
//
//    ) {
//        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
//
//        try {
//            return Response.ok(objectTypeService.findAll(objectTypeSearchVo));
//        } catch (Exception e) {
//            log.error("",e);
//            return Response.error("查询对象类型失败", e.getMessage());
//        }
//    }

    @GetMapping({"/get/{id}"})
    @Operation(summary = "连接类型详情")
    public Response get(HttpServletRequest request, @PathVariable String id

    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(linkTypeService.get(id));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("查询连接类型失败", e.getMessage());
        }
    }

    @PostMapping({"/save"})
    @Operation(summary = "连接类型新增")
    public Response save(HttpServletRequest request, @RequestBody OntologyLinkTypeVo linkTypeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        linkTypeVo.setOwnerId(identity.getUserId());
        linkTypeVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(linkTypeService.save(linkTypeVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("新增连接类型失败", e.getMessage());
        }

    }

    @PostMapping({"/update/{id}"})
    @Operation(summary = "连接类型修改")
    public Response update(HttpServletRequest request, @PathVariable String id, @RequestBody OntologyLinkTypeVo linkTypeVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        linkTypeVo.setOwnerId(identity.getUserId());
        linkTypeVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(linkTypeService.update(id, linkTypeVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("修改连接类型失败", e.getMessage());
        }
    }

    @PostMapping("/changeStatus")
    @Operation(summary = "修改连接类型状态")
    public Response changeStatus(@RequestBody OntologyLinkTypeVo linkTypeVo) {
        try {
            return Response.ok(linkTypeService.changeStatus(linkTypeVo));
        } catch (Exception e) {
            log.error("修改连接类型状态失败", e);
            return Response.error("修改连接类型状态失败，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "连接类型删除")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        try {
            return Response.ok(linkTypeService.delete(ids));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("删除连接类型失败", e.getMessage());
        }

    }

    @PostMapping({"/tag/add"})
    @Operation(summary = "标签新增")
    public Response save(HttpServletRequest request, @RequestBody OntologyTagVo tagVo
    ) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);

        tagVo.setOwnerId(identity.getUserId());
        tagVo.setWorkspaceId(identity.getTeamName());

        try {
            return Response.ok(linkTypeService.saveTag(tagVo));
        } catch (Exception e) {
            log.error("", e);
            return Response.error("新增连接类型失败", e.getMessage());
        }
    }

    @GetMapping({"/tag/list"})
    @Operation(summary = "标签查询")
    public Response tagList(OntologyTagSearchVo tagSearchVo) {
        List<OntologyTagDto> result = linkTypeService.listTag(tagSearchVo);
        return Response.ok(result);
    }

    @DeleteMapping({"/tag/delete/{id}"})
    @Operation(summary = "删除标签")
    public Response tagDelete(HttpServletRequest request, @PathVariable String id) {
        try {
            linkTypeService.tagDelete(id);
            return Response.ok("删除成功！");
        } catch (Exception e) {
            log.error("", e);
            return Response.error("删除标签失败", e.getMessage());
        }
    }

    @GetMapping({"/tag/find/{id}"})
    @Operation(summary = "通过id查询标签")
    public Response findTagById(@PathVariable String id) {
        OntologyTagDto result = linkTypeService.findTagById(id);
        return Response.ok(result);
    }

    @GetMapping("/tag/search")
    public Response<Page<OntologyTagDto>> search(@RequestParam(name = "keyWord", required = false) String keyWord,
                                                 @RequestParam(name = "offset", defaultValue = "0") int offset,
                                                 @RequestParam(name = "limit", defaultValue = "10") int limit) {
        Page<OntologyTagDto> ontologyTagDtoPage = linkTypeService.search(keyWord, offset, limit);
        return Response.ok(ontologyTagDtoPage);
    }

}

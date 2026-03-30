package com.asiainfo.web;

import com.asiainfo.serivce.OntologyInterfaceConstraintService;
import com.asiainfo.vo.operation.OntologyInterfaceConstraintVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/ontology/interface/constraint")
@Slf4j
public class OntologyInterfaceConstraintController {

    @Autowired
    OntologyInterfaceConstraintService interfaceConstraintService;

    @PostMapping({"/create"})
    @Operation(summary = "新增接口约束")
    public Response save(HttpServletRequest request, @RequestBody OntologyInterfaceConstraintVo interfaceConstraintVo) {
        try {
            return Response.ok(interfaceConstraintService.save(interfaceConstraintVo));
        } catch (Exception e) {
            log.error("新增接口约束失败", e);
            return Response.error("新增接口约束失败", e.getMessage());
        }
    }

    @PostMapping({"/update"})
    @Operation(summary = "更新接口约束")
    public Response update(HttpServletRequest request, @RequestBody OntologyInterfaceConstraintVo interfaceConstraintVo) {
        try {
            return Response.ok(interfaceConstraintService.update(interfaceConstraintVo));
        } catch (Exception e) {
            log.error("更新接口约束失败", e);
            return Response.error("更新接口约束失败", e.getMessage());
        }
    }

    @PostMapping({"/affected"})
    @Operation(summary = "分析接口约束变更影响")
    public Response analysisAffected(HttpServletRequest request, @RequestBody OntologyInterfaceConstraintVo interfaceConstraintVo) {
        try {
            return Response.ok(interfaceConstraintService.analysisAffected(interfaceConstraintVo));
        } catch (Exception e) {
            log.error("接口约束变更影响分析失败", e);
            return Response.error("接口约束变更影响分析", e.getMessage());
        }
    }

    @PostMapping({"/delete"})
    @Operation(summary = "删除接口约束")
    public Response delete(HttpServletRequest request, @RequestBody OntologyInterfaceConstraintVo interfaceConstraintVo) {
        try {
            interfaceConstraintService.delete(interfaceConstraintVo);
            return Response.ok();
        } catch (Exception e) {
            log.error("删除接口约束失败", e);
            return Response.error("删除接口约束失败", e.getMessage());
        }
    }

    @PostMapping("/explorePage")
    @Operation(summary = "分页查询接口")
    @SuppressWarnings("rawtypes")
    public Response explorePage(HttpServletRequest request,
                                @RequestBody OntologyInterfaceConstraintVo interfaceConstraintVo) {
        try {
            return Response.ok(interfaceConstraintService.explorePage(interfaceConstraintVo));
        } catch (Exception e) {
            log.error("分页查询接口异常", e);
            return Response.error("分页查询接口异常", e.getMessage());
        }
    }

    @GetMapping("/overview")
    @Operation(summary = "接口约束详情")
    @SuppressWarnings("rawtypes")
    public Response findById(HttpServletRequest request,
                             @RequestParam("constraintId") String constraintId) {
        try {
            return Response.ok(interfaceConstraintService.findByConstraintId(constraintId));
        } catch (Exception e) {
            log.error("获取接口约束详情异常", e);
            return Response.error("获取接口约束详情异常", e.getMessage());
        }
    }

}

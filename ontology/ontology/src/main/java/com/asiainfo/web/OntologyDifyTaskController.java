package com.asiainfo.web;

import com.asiainfo.feign.response.CommonDifyResponse;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyDifyBatchService;
import com.asiainfo.serivce.OntologyDifyTaskService;
import com.asiainfo.vo.operation.DifyBatchTaskVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/_api/v1/task")
@Slf4j
public class OntologyDifyTaskController {
    private final static String DIFY_USER = "%s-%s";

    @Autowired
    private OntologyDifyTaskService difyTaskService;

    @Autowired
    private OntologyDifyBatchService difyBatchService;

    @PostMapping({"/start"})
    @Operation(summary = "开始批量测试任务")
    public Response save(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            String execUser = String.format(DIFY_USER, identity.getTeamName(), difyTaskVo.getOntologyName());
            difyTaskVo.setExecUser(execUser);
            return Response.ok(difyBatchService.saveAndStart(difyTaskVo));
        } catch (Exception e) {
            log.error("开始批量测试异常", e);
            return Response.error("开始批量测试异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/restart"})
    @Operation(summary = "重新测试")
    public Response restart(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            return Response.ok(difyBatchService.runBatchTask(difyTaskVo.getBatchIdList(), true));
        } catch (Exception e) {
            log.error("重新测试测试异常", e);
            return Response.error("重新测试测试异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/stop"})
    @Operation(summary = "停止测试")
    public CommonDifyResponse stop(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            return difyBatchService.stop(difyTaskVo);
        } catch (Exception e) {
            log.error("停止测试异常", e);
            CommonDifyResponse errorResponse = new CommonDifyResponse();
            errorResponse.setMessage(e.getMessage());
            errorResponse.setCode("500");
            errorResponse.setStatus("failed");
            return errorResponse;
        }
    }

    @PostMapping({"/status"})
    @Operation(summary = "获取任务执行状态")
    public Response status(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            return Response.ok(difyTaskService.status(difyTaskVo.getBatchNum()));
        } catch (Exception e) {
            log.error("获取任务执行状态异常", e);
            return Response.error("获取任务执行状态异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/update"})
    @Operation(summary = "更新任务执行状态")
    public Response update(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            return Response.ok(difyTaskService.update(difyTaskVo));
        } catch (Exception e) {
            log.error("更新任务执行状态异常", e);
            return Response.error("更新任务执行状态异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping({"/compareResult"})
    @Operation(summary = "获取对比分析结果")
    public Response compareResult(HttpServletRequest request, @RequestBody DifyBatchTaskVo difyTaskVo) {
        try {
            return Response.ok(difyTaskService.getDetailById(difyTaskVo.getId()));
        } catch (Exception e) {
            log.error("获取任务执行状态异常", e);
            return Response.error("获取任务执行状态异常，" + e.getMessage(), e.getMessage());
        }
    }

    @PostMapping("/exploreHisTask")
    @Operation(summary = "分页查询历史任务")
    public Response exploreHisTask(HttpServletRequest request,
                                @RequestBody DifyBatchTaskVo searchVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            String execUser = String.format(DIFY_USER, identity.getTeamName(), searchVo.getOntologyName());
            searchVo.setExecUser(execUser);
            return Response.ok(difyTaskService.exploreHisTask(searchVo));
        } catch (Exception e) {
            log.error("分页查询历史任务异常", e);
            return Response.error("分页查询历史任务异常", e.getMessage());
        }
    }

    @PostMapping("/deleteHisTask")
    @Operation(summary = "删除历史任务")
    public Response deleteHisTask(HttpServletRequest request,
                                   @RequestBody DifyBatchTaskVo searchVo) {
        try {
            ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
            String execUser = String.format(DIFY_USER, identity.getTeamName(), searchVo.getOntologyName());
            searchVo.setExecUser(execUser);
            return Response.ok(difyTaskService.deleteHisTask(searchVo));
        } catch (Exception e) {
            log.error("删除历史任务异常", e);
            return Response.error("删除历史任务异常", e.getMessage());
        }
    }

    @PostMapping("/exploreBatchTask")
    @Operation(summary = "分页查询批量测试任务")
    public Response exploreBatchTask(HttpServletRequest request,
                                   @RequestBody DifyBatchTaskVo searchVo) {
        try {
            return Response.ok(difyTaskService.exploreBatchTask(searchVo));
        } catch (Exception e) {
            log.error("分页查询批量测试任务异常", e);
            return Response.error("分页查询批量测试任务异常", e.getMessage());
        }
    }

}

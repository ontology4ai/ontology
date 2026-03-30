package com.asiainfo.web;

import com.asiainfo.serivce.OntologyConfigService;
import com.asiainfo.vo.operation.OntologyConfigVo;

import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/_api/ontology/config")
@Slf4j
public class OntologyConfigController {

    @Autowired
    OntologyConfigService configService;

    @GetMapping("/findAll")
    @Operation(summary = "获取所有配置详情")
    @SuppressWarnings("rawtypes")
    public Response findAll(HttpServletRequest request,
            @RequestParam(value = "configType", required = false) String configType) {
        try {
            log.debug("findKey() configType:{}", configType);
            return Response.ok(configService.findAll(configType));
        } catch (Exception e) {
            log.error("获取所有配置详情异常", e);
            return Response.error("获取所有配置详情异常", e.getMessage());
        }
    }

    @GetMapping("/findKey")
    @Operation(summary = "获取配置详情")
    @SuppressWarnings("rawtypes")
    public Response findKey(HttpServletRequest request, @RequestParam String key) {
        try {
            log.debug("findKey() key:{}", key);
            return Response.ok(configService.findKey(key));
        } catch (Exception e) {
            log.error("获取所有配置详情异常", e);
            return Response.error("获取所有配置详情异常", e.getMessage());
        }
    }

    @PostMapping("/create")
    @Operation(summary = "保存配置")
    @SuppressWarnings("rawtypes")
    public Response save(HttpServletRequest request, @RequestBody List<OntologyConfigVo> configVo) {
        try {
            log.debug("save() configVo:{}", configVo);
            return Response.ok(configService.save(configVo));
        } catch (Exception e) {
            log.error("保存配置异常", e);
            return Response.error("保存配置异常", e.getMessage());
        }
    }

    @PostMapping({ "/update/{id}" })
    @Operation(summary = "修改配置")
    public Response update(HttpServletRequest request, @PathVariable String id,
            @Valid @RequestBody OntologyConfigVo configVo) {

        try {
            log.debug("update() id:{}", id);
            log.debug("update() configVo:{}", configVo);
            return Response.ok(configService.update(id, configVo));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("修改配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/update" })
    @Operation(summary = "修改配置")
    public Response update(HttpServletRequest request, @Valid @RequestBody List<OntologyConfigVo> configVo) {

        try {
            log.debug("update() configType:{}\t configVo:{}", configVo.get(0).getConfigType(), configVo);
            return Response.ok(configService.saveAll(configVo.get(0).getConfigType(), null, configVo));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("修改配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/delete/{id}" })
    @Operation(summary = "删除配置")
    public Response delete(HttpServletRequest request, @PathVariable String id) {

        try {
            log.debug("delete() id:{}", id);
            return Response.ok(configService.delete(id));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("修改配置分组失败", e.getMessage());
        }
    }

    @PostMapping({ "/delete" })
    @Operation(summary = "删除多个配置")
    public Response delete(HttpServletRequest request, @RequestBody List<String> ids) {
        try {
            return Response.ok(configService.delete(ids));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("删除配置分组失败", e.getMessage());
        }
    }

    @GetMapping({ "/checkExists" })
    @Operation(summary = "校验key和config_type是否重复")
    public Response checkExists(HttpServletRequest request, @RequestParam("config_type") String configType,
            @RequestParam("config_key") String configKey) {
        try {
            log.debug("checkExists() configType:{}\t configKey:{}", configType, configKey);
            return Response.ok(configService.checkExists(configType, configKey));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Response.error("校验key和config_type是否重复失败", e.getMessage());
        }
    }
}

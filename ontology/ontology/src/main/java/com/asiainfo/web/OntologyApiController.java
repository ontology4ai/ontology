package com.asiainfo.web;

import com.asiainfo.common.ApiMethodEnum;
import com.asiainfo.common.ParamMethodEnum;
import com.asiainfo.common.ParamModeEnum;
import com.asiainfo.common.ParamTypeEnum;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.serivce.OntologyApiService;
import com.asiainfo.vo.operation.ApiVo;
import com.asiainfo.vo.operation.DeleteApiVo;
import com.asiainfo.vo.operation.UpdateApiVo;
import com.asiainfo.vo.operation.SearchApiVo;
import com.asiainfo.vo.operation.TestApiVo;
import com.asiainfo.vo.operation.TestApiParamVo;
import com.asiainfo.util.ApiValidatorUtils;

import io.github.suanchou.web.Response;
import io.github.suanchou.utils.HttpUtil;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/_api/ontology/api")
@Slf4j
public class OntologyApiController {

    @Autowired
    private OntologyApiService ontologyApiService;

    /**
     * 新增API
     */
    @PostMapping({ "/save" })
    @Operation(summary = "新增API")
    public Response save(HttpServletRequest request, @Valid @RequestBody ApiVo apiVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        apiVo.setCreateUser(identity.getUserId());
        apiVo.setOwnerId(identity.getUserId());
        apiVo.setWorkspaceId(identity.getTeamName());
        logSave(identity, apiVo.getId());
        try {
            SearchApiVo searchApiVo = new SearchApiVo();
            searchApiVo.setApiName(apiVo.getApiName());
            searchApiVo.setWorkspaceId(apiVo.getWorkspaceId());
            if (ontologyApiService.apiNameExist(searchApiVo))
                return Response.error("新增API失败", "API名称已存在");
            ApiValidatorUtils.validateApi(apiVo);
            return Response.ok(ontologyApiService.save(apiVo));
        } catch (Exception e) {
            log.error("新增API失败", e);
            return Response.error("新增API失败", e.getMessage());
        }
    }

    /**
     * 更新API
     */
    @PostMapping({ "/update" })
    @Operation(summary = "更新API")
    public Response update(HttpServletRequest request, @Valid @RequestBody UpdateApiVo apiVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        apiVo.setUpdateUser(identity.getUserId());
        apiVo.setOwnerId(identity.getUserId());
        apiVo.setWorkspaceId(identity.getTeamName());
        logUpdate(identity, apiVo.getId());
        try {
            ApiValidatorUtils.validateApi(apiVo);
            ApiVo result = ontologyApiService.update(apiVo.getId(), apiVo);
            if (null != result) {
                return Response.ok(result);
            }
            return Response.error("更新API失败", "根据id无法找到API实例");
        } catch (Exception e) {
            log.error("更新API失败", e);
            return Response.error("更新API失败", e.getMessage());
        }
    }

    /**
     * 删除API
     */
    @PostMapping({ "/delete" })
    @Operation(summary = "删除API")
    public Response delete(HttpServletRequest request, @Valid @RequestBody DeleteApiVo apiVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        apiVo.setUpdateUser(identity.getUserId());
        apiVo.setOwnerId(identity.getUserId());
        apiVo.setWorkspaceId(identity.getTeamName());
        log.debug("delete() api Id:{}", apiVo.getId());
        try {
            ontologyApiService.delete(apiVo.getId());
            return Response.ok();
        } catch (Exception e) {
            log.error("删除API失败", e);
            return Response.error("删除API失败", e.getMessage());
        }
    }

    /**
     * 获取API
     */
    @GetMapping({ "/search" })
    @Operation(summary = "获取API")
    public Response search(HttpServletRequest request, SearchApiVo apiVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        apiVo.setWorkspaceId(identity.getTeamName());
        logSearch(apiVo);
        try {
            return Response.ok(ontologyApiService.findAllByWorkspaceId(apiVo));
        } catch (Exception e) {
            log.error("获取API失败", e);
            return Response.error("获取API失败", e.getMessage());
        }
    }

    @PostMapping({ "/test" })
    @Operation(summary = "测试API")
    public Response test(HttpServletRequest request, @Valid @RequestBody TestApiVo apiVo) {
        logTest(apiVo);
        Map<String, String> headers = new HashMap<>();
        String paths = apiVo.getUrl();
        String cookies = "";
        Object bodys = null;

        Map<String, String> querys = new HashMap<>();

        if (null != apiVo.getParams() && !apiVo.getParams().isEmpty()) {
            for (TestApiParamVo apiParam : apiVo.getParams()) {
                if (ParamModeEnum.RESPONSE.getMode().equals(apiParam.getParamMode())) {
                    continue;
                }

                // 只有cookie、body支持多数据类型，其他的只支持字符串类型。
                if (ParamMethodEnum.COOKIE.getMethod().equals(apiParam.getParamMethod())) {
                    cookies = cookies + apiParam.getParamName() + "=" + getParamValue(apiParam) + ";";
                } else if (ParamMethodEnum.HEADER.getMethod().equals(apiParam.getParamMethod())) {
                    headers.put(apiParam.getParamName(), apiParam.getParamValue());
                } else if (ParamMethodEnum.PATH.getMethod().equals(apiParam.getParamMethod())) {
                    paths = paths + "/" + apiParam.getParamValue();
                } else if (ParamMethodEnum.BODY.getMethod().equals(apiParam.getParamMethod())) {
                    bodys = apiVo.getApiBody();
                } else if (ParamMethodEnum.QUERY.getMethod().equals(apiParam.getParamMethod())) {
                    querys.put(apiParam.getParamName(), apiParam.getParamValue());
                }
            }
            if (!StringUtils.isEmpty(cookies)) {
                headers.put("Cookie", cookies);
            }
        }
        try {
            String result = "";
            log.debug("test() paths:{}", paths);
            log.debug("test() bodys:{}", bodys);
            log.debug("test() headers:{}", headers);
            log.debug("test() querys:{}", querys);
            if (ApiMethodEnum.POST.name().equals(apiVo.getApiMethod())) {
                bodys = apiVo.getApiBody();
                if (apiVo.getApiTimeout() == null) {
                    result = HttpUtil.post(paths, bodys, headers);
                } else {
                    result = HttpUtil.post(paths, bodys, headers, apiVo.getApiTimeout());
                }
            } else if (ApiMethodEnum.GET.name().equals(apiVo.getApiMethod())) {
                if (apiVo.getApiTimeout() == null) {
                    result = HttpUtil.get(paths, querys, headers);
                } else {
                    result = HttpUtil.get(paths, querys, headers, apiVo.getApiTimeout() );
                }
            } else if (ApiMethodEnum.PUT.name().equals(apiVo.getApiMethod())) {
                if (apiVo.getApiTimeout() == null) {
                    result = HttpUtil.put(paths, bodys, headers);
                } else {
                    result = HttpUtil.put(paths, bodys, headers, apiVo.getApiTimeout());
                }
            } else {
                throw new Exception("请求方式只支持GET/POST/PUT");
            }
            return Response.ok(result);
        } catch (Exception e) {
            log.error("测试API失败", e);
            return Response.error("测试API失败", e.getMessage());
        }
    }

    @GetMapping({ "/valid_name" })
    @Operation(summary = "校验API的名称")
    public Response validName(HttpServletRequest request, SearchApiVo apiVo) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        apiVo.setWorkspaceId(identity.getTeamName());
        log.debug("validName() apiName:{}", apiVo.getApiName());
        log.debug("validName() workspaceId:{}", apiVo.getWorkspaceId());
        try {
            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("apiNameIsExist", ontologyApiService.apiNameExist(apiVo));
            return Response.ok(resultMap);
        } catch (Exception e) {
            log.error("校验API的名称失败", e);
            return Response.error("校验API的名称失败", e.getMessage());
        }
    }

    private void logSave(ModoWebUtils.CookieIdentity identity, Object apiId) {
        log.debug("save() userId:{}", identity.getUserId());
        log.debug("save() workspaceId:{}", identity.getTeamName());
        log.debug("save() api Id:{}", apiId);
    }

    private void logUpdate(ModoWebUtils.CookieIdentity identity, Object apiId) {
        log.debug("update() userId:{}", identity.getUserId());
        log.debug("update() workspaceId:{}", identity.getTeamName());
        log.debug("update() api Id:{}", apiId);
    }

    private void logTest(TestApiVo apiVo) {
        log.debug("test() url:{}", apiVo.getUrl());
        log.debug("test() timeout:{}", apiVo.getApiTimeout());
        log.debug("test() params:{}", apiVo.getParams());
    }

    private void logSearch(SearchApiVo apiVo) {
        log.debug("search() workspaceId:{}", apiVo.getWorkspaceId());
        log.debug("search() apiName:{}", apiVo.getApiName());
        log.debug("search() apiType:{}", apiVo.getApiType());
    }

    private static Object getParamValue(TestApiParamVo param) {
        if (ParamTypeEnum.STRING.getType().equals(param.getParamType())) {
            return StringUtils.isEmpty(param.getParamValue()) ? param.getDefaultValue() : param.getParamValue();
        } else if (ParamTypeEnum.NUMBER.getType().equals(param.getParamType())
                || ParamTypeEnum.INTEGER.getType().equals(param.getParamType())) {
            try {
                return Integer.valueOf(
                        StringUtils.isEmpty(param.getParamValue()) ? param.getDefaultValue() : param.getParamValue());
            } catch (Exception e) {
                return StringUtils.isEmpty(param.getParamValue()) ? param.getDefaultValue() : param.getParamValue(); // 如果转失败保留原值
            }
        } else if (ParamTypeEnum.BOOLEAN.getType().equals(param.getParamType())) {
            return Boolean.valueOf(
                    StringUtils.isEmpty(param.getParamValue()) ? param.getDefaultValue() : param.getParamValue());
        }
        return param.getParamValue();
    }

}

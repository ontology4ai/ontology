package com.asiainfo.web;


import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.ApiMethodEnum;
import com.asiainfo.common.ParamMethodEnum;
import com.asiainfo.common.ParamModeEnum;
import com.asiainfo.serivce.OntologyApiService;
import com.asiainfo.util.*;
import com.asiainfo.vo.operation.*;
import com.asiainfo.vo.search.CustomApiResponseVo;
import io.github.suanchou.web.Response;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/_api/ontology/external")
@Slf4j
public class OntologyExternalApiController {

    @Autowired
    private OntologyApiService apiService;

    @GetMapping({ "/get" })
    @Operation(summary = "请求外部api")
    public Response save(HttpServletRequest request,
                         @RequestParam("apiId") String apiId,
                         @RequestParam("ontologyName") String ontologyName,
                         @RequestParam("objectName") String objectName) {
        try {
            ApiVo apiVo = apiService.findById(apiId);
            Headers.Builder headerBuilder = new Headers.Builder();
            List<String> cookieList = new ArrayList<>();
            for (ApiParamVo apiParam : apiVo.getParams()) {
                if (ParamModeEnum.REQUEST.getMode().equals(apiParam.getParamMode())
                        && ParamMethodEnum.HEADER.getMethod().equals(apiParam.getParamMethod())) {
                    headerBuilder.add(apiParam.getParamName(), apiParam.getDefaultValue());
                }

                if (ParamModeEnum.REQUEST.getMode().equals(apiParam.getParamMode())
                        && ParamMethodEnum.COOKIE.getMethod().equals(apiParam.getParamMethod())) {
                    cookieList.add(String.format("%s=%s", apiParam.getParamName(), apiParam.getDefaultValue()));
                }
            }

            if (null == headerBuilder.get("Cookie")) {
                headerBuilder.add("Cookie", String.join(";", cookieList));
            }

            OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder();
            if (null != apiVo.getApiTimeout()) {
                clientBuilder.connectTimeout(apiVo.getApiTimeout(), TimeUnit.MILLISECONDS);
            } else {
                clientBuilder.connectTimeout(30, TimeUnit.SECONDS);
            }

            OkHttpClient client = clientBuilder.build();
            if (ApiMethodEnum.POST.name().equals(apiVo.getApiMethod())) {
                return Response.ok(doPost(client, headerBuilder.build(), apiVo.getUrl(), ontologyName, objectName));
            } else if (ApiMethodEnum.GET.name().equals(apiVo.getApiMethod())) {
                return Response.ok(doGet(client, headerBuilder.build(), apiVo.getUrl(), ontologyName, objectName));
            } else {
                return Response.error("请求API失败", "不支持的请求方式" + apiVo.getApiMethod());
            }
        } catch (Exception e) {
            log.error("请求API失败", e);
            return Response.error("请求API失败", e.getMessage());
        }
    }

    private List<CustomApiResponseVo> doGet(OkHttpClient client,
                       Headers headers,
                       String url,
                       String ontologyName,
                       String objectName) throws IOException {
        Request request = new Request.Builder()
                .url(String.format("%s?ontologyName=%s&objectName=%s", url, ontologyName, objectName))
                .headers(headers)
                .get()
                .build();

        return handleRequest(client, request);
    }

    public List<CustomApiResponseVo> doPost(OkHttpClient client,
                       Headers headers,
                       String url,
                       String ontologyName,
                       String objectName) throws IOException {
        JSONObject bodys = new JSONObject();
        bodys.put("ontologyName", ontologyName);
        bodys.put("objectName", objectName);
        MediaType mediaType = MediaType.parse("application/json; charset=utf-8");
        okhttp3.RequestBody body = okhttp3.RequestBody.create(mediaType, bodys.toJSONString());
        Request request = new Request.Builder()
                .headers(headers)
                .url(url)
                .post(body)
                .build();

        return handleRequest(client, request);
    }

    private List<CustomApiResponseVo> handleRequest(OkHttpClient client, Request request) throws IOException {
        okhttp3.Response response = client.newCall(request).execute();

        JSONObject resultJson = JSON.parseObject(response.body().string());
        return JSON.parseArray(resultJson.getString("data"), CustomApiResponseVo.class);
    }

}

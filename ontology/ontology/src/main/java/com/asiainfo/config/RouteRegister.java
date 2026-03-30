package com.asiainfo.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RouteRegister {
    @Value("${suanchou.microservice.admin.host}")
    private String adminHost;

    @Value("${suanchou.microservice.gateway.app-secret}")
    private String apiKey;

    public void registerRoute(String tag, String host, String port, String reg) {
        log.info("开始自动注册{}路由...", tag);
        try {
            if (StringUtils.isEmpty(host) || StringUtils.isEmpty(port) || StringUtils.isEmpty(reg)) {
                log.error("tag= {}", tag);
                log.error("host= {}", host);
                log.error("port= {}", port);
                log.error("reg= {}", reg);
                throw new RuntimeException(tag + "路由注册信息不完整");
            }

            String regInfo = reg.replace("<host>", host).replace("<port>", port);
            com.alibaba.fastjson.JSONObject aapJson = com.alibaba.fastjson.JSONObject.parseObject(regInfo);

            String routeId = aapJson.getString("name");
            String adminApiUri = "/apisix/admin/routes/" + routeId;

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String putUrl = adminHost + adminApiUri;
            org.springframework.http.HttpHeaders putHeaders = new org.springframework.http.HttpHeaders();
            putHeaders.set("X-API-KEY", apiKey);
            putHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<String> putEntity = new org.springframework.http.HttpEntity<>(regInfo, putHeaders);
            org.springframework.http.ResponseEntity<String> putResp = restTemplate.exchange(putUrl, org.springframework.http.HttpMethod.PUT, putEntity, String.class);
            log.info("{}路由注册结果: {}", tag, putResp.getBody());
        } catch (Exception e) {
            log.error("{}自动注册异常: {}", tag, e.getMessage());
        }
    }
}

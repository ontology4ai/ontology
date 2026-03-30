package com.asiainfo.config;

// import com.alibaba.fastjson.JSONObject;
// import org.apache.commons.lang3.StringUtils;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.boot.ApplicationArguments;
// import org.springframework.boot.ApplicationRunner;
// import org.springframework.stereotype.Component;
// import org.springframework.core.annotation.Order;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;

// 将代码移到AgentPlatformUtils里，以便激活AAP时再次执行
// @Component
// @Order(2)
public class AapRegisterRunner
// implements ApplicationRunner
{

    // private static final Logger log =
    // LoggerFactory.getLogger(AapRegisterRunner.class);

    // @Value("${suanchou.microservice.gateway.host}")
    // private String gatewayHost;

    // @Value("${aap.admin.username:admin}")
    // private String adminUsername;

    // @Value("${aap.user.username:DataAdmin1}")
    // private String userUsername;

    // @Value("${aap.user.password:phRzq38prdlsqEZKAagym+PHIClhtzrx6VmJf9jA49TwuLpfqVkLD3QAfbTOsYlhTByXSBCfq0M0iuoUMlgMIunjWRAisCGFxjTp7pDDUKxVb0ahn/Y2cOUVXOm8Q63Mx9OQ9+JdQTH8yhflMbgahjgUHG414P2CtYLPNJAXmNkmzRbqMYg1R4ru5rsn2xsIoh36Mu5eUbGWaG1+PLD958lIFfoOhnKoZc9y/6ZsHWVKx4I59v4MpzStpMDN+/iRW8l+i5xP3QCDVbuDU4RXdYSLOgg73pQfB2w+qPxE+bCqFfxAUEKJVSAFL4OdKoizpQSSCj2fZBlgPK5H1zqFIA==}")
    // private String userPassword;

    // @Value("${aap.workspace.name:default}")
    // private String aapWorkspaceName;

    // @Value("${aap.context-path:}")
    // private String aapContextPath;

    // @Value("${aap.security.pem:-----BEGIN PUBLIC KEY-----\n" +
    // "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvLEhasIhkJiRkghZLtF6\n" +
    // "5juKJJz1SivhLn5Yrk+dLL7piLJfoGwjvkNOA9+PjJYyrcxhK09qujVS9h92vnrC\n" +
    // "L3jWcF4Q5OzInwCS1OcZQR0/WVGiN7Jig2sGWgB2LUToTfZNgj1ZtRBwcaiztyDn\n" +
    // "s1lei/n7462u8FxpaHCqhQooGYDosnvcqb63k/1pNwg0Xbnec7osh+V+FBHaC5/G\n" +
    // "7YDupsCpr6FNEVa/7JB5Gbv7gPTxFBzuaKfli1dySl7Y+5mZ5aYtbFr3c5VckNke\n" +
    // "3oYz6tFMph3f+n/eVr6RQE+JUEtXZ2ojFJ1EyPIqc++hiUPkYOwdOIMZHk+r7TWE\n" +
    // "9QIDAQAB\n" +
    // "-----END PUBLIC KEY-----}")
    // private String pem;

    // @Override
    // public void run(ApplicationArguments args) {
    // // 第一步：启动时读取admin账户信息
    // log.info("AAP Admin 用户名: {}", adminUsername);
    // log.info("AAP 新用户用户名: {}", userUsername);
    // log.info("AAP 新用户密码: {}", userPassword);

    // // 第二步：仿造RSAPublicKeyEncode的main方法，创建用户秘钥
    // try {
    // com.alibaba.fastjson.JSONObject authInfo = new
    // com.alibaba.fastjson.JSONObject();
    // authInfo.put("user_name", adminUsername);

    // String encryptedMessage =
    // com.asiainfo.util.RSAPublicKeyEncode.encryptStr(pem, authInfo.toString());
    // log.info("加密后的用户秘钥: {}", encryptedMessage);

    // // 第三步：通过用户秘钥获取用户token
    // String tokenUrl = gatewayHost + aapContextPath +
    // "/console/api/v1/user/third/dologin";
    // String tokenBody = "{\"auth\":\"" + encryptedMessage + "\"}";
    // String token = null;
    // try {
    // org.springframework.http.HttpHeaders headers = new
    // org.springframework.http.HttpHeaders();
    // headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    // org.springframework.http.HttpEntity<String> entity = new
    // org.springframework.http.HttpEntity<>(
    // tokenBody, headers);
    // org.springframework.web.client.RestTemplate restTemplate = new
    // org.springframework.web.client.RestTemplate();
    // org.springframework.http.ResponseEntity<java.util.Map> response =
    // restTemplate.postForEntity(tokenUrl,
    // entity, java.util.Map.class);
    // java.util.Map respMap = response.getBody();
    // if (respMap != null && respMap.containsKey("data")) {
    // Object dataObj = respMap.get("data");
    // if (dataObj instanceof java.util.Map) {
    // token = (String) ((java.util.Map) dataObj).get("access_token");
    // }
    // }
    // log.info("获取到的用户token: {}", token);
    // } catch (Exception e) {
    // log.error("获取用户token失败: {}", e.getMessage());
    // }

    // // 第四步：从yaml获取新用户信息（已在aapConfig.getUser()）

    // // 第五步：使用token，调用接口创建用户
    // if (token != null && !token.isEmpty()) {
    // String createUserUrl = gatewayHost + aapContextPath +
    // "/console/api/v1/user/createUserByAdmin";
    // com.alibaba.fastjson.JSONObject userBody = new
    // com.alibaba.fastjson.JSONObject();
    // userBody.put("user_name", userUsername);
    // userBody.put("password", userPassword); // 密码已加密存储

    // try {
    // org.springframework.http.HttpHeaders userHeaders = new
    // org.springframework.http.HttpHeaders();
    // userHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    // userHeaders.set("Authorization", "Bearer " + token);
    // org.springframework.http.HttpEntity<String> userEntity = new
    // org.springframework.http.HttpEntity<>(
    // userBody.toJSONString(), userHeaders);
    // org.springframework.web.client.RestTemplate userRestTemplate = new
    // org.springframework.web.client.RestTemplate();
    // org.springframework.http.ResponseEntity<String> userResp = userRestTemplate
    // .postForEntity(createUserUrl, userEntity, String.class);
    // log.info("创建用户接口返回: {}", userResp.getBody());
    // } catch (Exception e) {
    // log.error("创建用户失败: {}", e.getMessage());
    // }
    // } else {
    // log.error("token为空，无法创建用户");
    // }
    // } catch (Exception e) {
    // log.error("", e);
    // log.error("生成用户秘钥失败: {}", e.getMessage());
    // }
    // // 第六步：通过新用户token获取工作空间ID，保存在内存
    // try {
    // // 1. 用新用户信息生成秘钥
    // com.alibaba.fastjson.JSONObject newAuthInfo = new
    // com.alibaba.fastjson.JSONObject();
    // newAuthInfo.put("user_name", userUsername);
    // String newEncryptedMessage =
    // com.asiainfo.util.RSAPublicKeyEncode.encryptStr(pem, newAuthInfo.toString());

    // // 2. 获取新用户token
    // String newTokenUrl = gatewayHost + aapContextPath +
    // "/console/api/v1/user/third/dologin";
    // String newTokenBody = "{\"auth\":\"" + newEncryptedMessage + "\"}";
    // String newToken = null;
    // try {
    // org.springframework.http.HttpHeaders headers = new
    // org.springframework.http.HttpHeaders();
    // headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    // org.springframework.http.HttpEntity<String> entity = new
    // org.springframework.http.HttpEntity<>(
    // newTokenBody, headers);
    // org.springframework.web.client.RestTemplate restTemplate = new
    // org.springframework.web.client.RestTemplate();
    // org.springframework.http.ResponseEntity<java.util.Map> response =
    // restTemplate
    // .postForEntity(newTokenUrl, entity, java.util.Map.class);
    // java.util.Map respMap = response.getBody();
    // if (respMap != null && respMap.containsKey("data")) {
    // Object dataObj = respMap.get("data");
    // if (dataObj instanceof java.util.Map) {
    // newToken = (String) ((java.util.Map) dataObj).get("access_token");
    // }
    // }
    // log.info("新用户token: {}", newToken);
    // } catch (Exception e) {
    // log.error("新用户获取token失败: {}", e.getMessage());
    // }

    // // 3. 用新用户token获取工作空间ID
    // if (newToken != null && !newToken.isEmpty()) {
    // String wsUrl = gatewayHost + aapContextPath +
    // "/console/api/v1/workspace/getWorkspacesByCurrentUser";
    // try {
    // org.springframework.http.HttpHeaders wsHeaders = new
    // org.springframework.http.HttpHeaders();
    // wsHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    // wsHeaders.set("Authorization", "Bearer " + newToken);
    // org.springframework.http.HttpEntity<String> wsEntity = new
    // org.springframework.http.HttpEntity<>(
    // null, wsHeaders);
    // org.springframework.web.client.RestTemplate wsRestTemplate = new
    // org.springframework.web.client.RestTemplate();
    // org.springframework.http.ResponseEntity<String> wsResp =
    // wsRestTemplate.exchange(wsUrl,
    // org.springframework.http.HttpMethod.GET, wsEntity, String.class);
    // String wsBody = wsResp.getBody();
    // log.info("工作空间接口返回: {}", wsBody);

    // // 解析workspaceId
    // String workspaceId = null;
    // com.alibaba.fastjson.JSONObject wsJson =
    // com.alibaba.fastjson.JSONObject.parseObject(wsBody);
    // if (wsJson.getBoolean("success") && wsJson.containsKey("data")) {
    // com.alibaba.fastjson.JSONArray wsArr = wsJson.getJSONArray("data");
    // if (wsArr != null && !wsArr.isEmpty()) {
    // for (int i = 0; i < wsArr.size(); i++) {
    // JSONObject workspace = wsArr.getJSONObject(i);
    // if (StringUtils.equalsIgnoreCase(workspace.getString("name"),
    // aapWorkspaceName)) {
    // workspaceId = workspace.getString("workspaceId");
    // }
    // }
    // }
    // }
    // if (workspaceId != null) {
    // // 保存到静态变量
    // WorkspaceHolder.workspaceId = workspaceId;
    // log.info("新用户工作空间ID: {}", workspaceId);
    // } else {
    // log.error("未获取到工作空间ID");
    // }
    // } catch (Exception e) {
    // log.error("获取工作空间ID失败: {}", e.getMessage());
    // }
    // }
    // } catch (Exception e) {
    // log.error("新用户token/工作空间ID流程异常: {}", e.getMessage());
    // }
    // }

    // // 静态内存保存
    // public static class WorkspaceHolder {
    // public static String workspaceId;
    // }
}

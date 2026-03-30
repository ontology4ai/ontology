package com.asiainfo.util;

import com.asiainfo.common.AgentTypeEnum;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.AapConstant;
import com.asiainfo.common.DifyConstant;
import com.asiainfo.common.ApisixReg;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;
import com.asiainfo.vo.operation.OntologyConfigVo;
import com.asiainfo.po.OntologyConfigPo;

import java.util.List;

@Component
@Slf4j
public class AgentPlatformUtils {

    @Value("${suanchou.microservice.gateway.host}")
    private String gatewayHost;
    @Value("${suanchou.microservice.admin.host}")
    private String adminHost;
    @Value("${suanchou.microservice.gateway.app-secret}")
    private String apiKey;

    public String getAgentType(OntologyConfigGroupVo agentPlatform) {
        if (agentPlatform != null) {
            return agentPlatform.getCode();
        }
        return null;
    }

    public String getAgentConfig(OntologyConfigGroupVo agentPlatform, String aapKey) {
        String aapValue = null;
        if (agentPlatform != null && agentPlatform.getConfigs() != null) {
            for (OntologyConfigVo config : agentPlatform.getConfigs()) {
                if (config.getConfigKey().equals(aapKey)) {
                    aapValue = config.getConfigValue();
                    break;
                }
            }
            if (StringUtils.isEmpty(aapValue)) {
                if (aapKey.equals(AapConstant.AAP_CONTEXT_PATH) || aapKey.equals(DifyConstant.DIFY_CONTEXT_PATH)) {
                    return "";
                } else {
                    throw new RuntimeException("没有配置" + aapKey);
                }
            }
        }
        return aapValue;
    }

    public String getAgentConfig(List<OntologyConfigPo> configList, String aapKey) {
        String aapValue = null;
        if (configList != null) {
            for (OntologyConfigPo config : configList) {
                if (config.getConfigKey().equals(aapKey)) {
                    aapValue = config.getConfigValue();
                    break;
                }
            }
            if (StringUtils.isEmpty(aapValue)) {
                if (aapKey.equals(AapConstant.AAP_CONTEXT_PATH) || aapKey.equals(DifyConstant.DIFY_CONTEXT_PATH)) {
                    return "";
                } else {
                    throw new RuntimeException("没有配置" + aapKey);
                }
            }
        }
        return aapValue;
    }

    // 将AAP放在runner里的代码移动到这里
    // 当激活AAP时需要再次执行
    public void runAap(OntologyConfigGroupVo agentPlatform) {
        if (agentPlatform == null) {
            log.warn("没有配置AAP或没有设置AAP为激活状态!终止AAP注册");
            return;
        }
        if (!AgentTypeEnum.AAP.getValue().equals(agentPlatform.getGroupType())) {
            log.info("智能体环境不是AAP类型，跳过");
            return;
        }
        // 第一步：启动时读取admin账户信息
        log.info("AAP Admin 用户名: {}", getAgentConfig(agentPlatform, AapConstant.AAP_ADMIN_USERNAME));
        log.info("AAP 新用户用户名: {}", getAgentConfig(agentPlatform, AapConstant.AAP_USER_USERNAME));
        log.info("AAP 新用户密码: {}", getAgentConfig(agentPlatform, AapConstant.AAP_USER_PASSWORD));

        // 第二步：仿造RSAPublicKeyEncode的main方法，创建用户秘钥
        try {
            com.alibaba.fastjson.JSONObject authInfo = new com.alibaba.fastjson.JSONObject();
            authInfo.put("user_name", getAgentConfig(agentPlatform, AapConstant.AAP_ADMIN_USERNAME));

            String encryptedMessage = com.asiainfo.util.RSAPublicKeyEncode
                    .encryptStr(getAgentConfig(agentPlatform, AapConstant.AAP_SECURITY_PEM), authInfo.toString());
            log.info("加密后的用户秘钥: {}", encryptedMessage);

            // 第三步：通过用户秘钥获取用户token
            String tokenUrl = gatewayHost + getAgentConfig(agentPlatform, AapConstant.AAP_CONTEXT_PATH)
                    + "/console/api/v1/user/third/dologin";
            String tokenBody = "{\"auth\":\"" + encryptedMessage + "\"}";
            String token = null;
            try {
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(
                        tokenBody, headers);
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(tokenUrl,
                        entity, java.util.Map.class);
                java.util.Map respMap = response.getBody();
                if (respMap != null && respMap.containsKey("data")) {
                    Object dataObj = respMap.get("data");
                    if (dataObj instanceof java.util.Map) {
                        token = (String) ((java.util.Map) dataObj).get("access_token");
                    }
                }
                log.info("获取到的用户token: {}", token);
            } catch (Exception e) {
                log.error("获取用户token失败: {}", e.getMessage());
            }

            // 第四步：从yaml获取新用户信息（已在aapConfig.getUser()）

            // 第五步：使用token，调用接口创建用户
            if (token != null && !token.isEmpty()) {
                String createUserUrl = gatewayHost + getAgentConfig(agentPlatform, AapConstant.AAP_CONTEXT_PATH)
                        + "/console/api/v1/user/createUserByAdmin";
                com.alibaba.fastjson.JSONObject userBody = new com.alibaba.fastjson.JSONObject();
                userBody.put("user_name", getAgentConfig(agentPlatform, AapConstant.AAP_USER_USERNAME));
                userBody.put("password", getAgentConfig(agentPlatform, AapConstant.AAP_USER_PASSWORD)); // 密码已加密存储

                try {
                    org.springframework.http.HttpHeaders userHeaders = new org.springframework.http.HttpHeaders();
                    userHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                    userHeaders.set("Authorization", "Bearer " + token);
                    org.springframework.http.HttpEntity<String> userEntity = new org.springframework.http.HttpEntity<>(
                            userBody.toJSONString(), userHeaders);
                    org.springframework.web.client.RestTemplate userRestTemplate = new org.springframework.web.client.RestTemplate();
                    org.springframework.http.ResponseEntity<String> userResp = userRestTemplate
                            .postForEntity(createUserUrl, userEntity, String.class);
                    log.info("创建用户接口返回: {}", userResp.getBody());
                } catch (Exception e) {
                    log.error("创建用户失败: {}", e.getMessage());
                }
            } else {
                log.error("token为空，无法创建用户");
            }
        } catch (Exception e) {
            log.error("", e);
            log.error("生成用户秘钥失败: {}", e.getMessage());
        }
        // 第六步：通过新用户token获取工作空间ID，保存在内存
        try {
            // 1. 用新用户信息生成秘钥
            com.alibaba.fastjson.JSONObject newAuthInfo = new com.alibaba.fastjson.JSONObject();
            newAuthInfo.put("user_name", getAgentConfig(agentPlatform, AapConstant.AAP_USER_USERNAME));
            String newEncryptedMessage = com.asiainfo.util.RSAPublicKeyEncode
                    .encryptStr(getAgentConfig(agentPlatform, AapConstant.AAP_SECURITY_PEM), newAuthInfo.toString());

            // 2. 获取新用户token
            String newTokenUrl = gatewayHost + getAgentConfig(agentPlatform, AapConstant.AAP_CONTEXT_PATH)
                    + "/console/api/v1/user/third/dologin";
            String newTokenBody = "{\"auth\":\"" + newEncryptedMessage + "\"}";
            String newToken = null;
            try {
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(
                        newTokenBody, headers);
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate
                        .postForEntity(newTokenUrl, entity, java.util.Map.class);
                java.util.Map respMap = response.getBody();
                if (respMap != null && respMap.containsKey("data")) {
                    Object dataObj = respMap.get("data");
                    if (dataObj instanceof java.util.Map) {
                        newToken = (String) ((java.util.Map) dataObj).get("access_token");
                    }
                }
                log.info("新用户token: {}", newToken);
            } catch (Exception e) {
                log.error("新用户获取token失败: {}", e.getMessage());
            }

            // 3. 用新用户token获取工作空间ID
            if (newToken != null && !newToken.isEmpty()) {
                String wsUrl = gatewayHost + getAgentConfig(agentPlatform, AapConstant.AAP_CONTEXT_PATH)
                        + "/console/api/v1/workspace/getWorkspacesByCurrentUser";
                try {
                    org.springframework.http.HttpHeaders wsHeaders = new org.springframework.http.HttpHeaders();
                    wsHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                    wsHeaders.set("Authorization", "Bearer " + newToken);
                    org.springframework.http.HttpEntity<String> wsEntity = new org.springframework.http.HttpEntity<>(
                            null, wsHeaders);
                    org.springframework.web.client.RestTemplate wsRestTemplate = new org.springframework.web.client.RestTemplate();
                    org.springframework.http.ResponseEntity<String> wsResp = wsRestTemplate.exchange(wsUrl,
                            org.springframework.http.HttpMethod.GET, wsEntity, String.class);
                    String wsBody = wsResp.getBody();
                    log.info("工作空间接口返回: {}", wsBody);

                    // 解析workspaceId
                    String workspaceId = null;
                    com.alibaba.fastjson.JSONObject wsJson = com.alibaba.fastjson.JSONObject.parseObject(wsBody);
                    if (wsJson.getBoolean("success") && wsJson.containsKey("data")) {
                        com.alibaba.fastjson.JSONArray wsArr = wsJson.getJSONArray("data");
                        if (wsArr != null && !wsArr.isEmpty()) {
                            for (int i = 0; i < wsArr.size(); i++) {
                                JSONObject workspace = wsArr.getJSONObject(i);
                                if (StringUtils.equalsIgnoreCase(workspace.getString("name"),
                                        getAgentConfig(agentPlatform, AapConstant.AAP_WORKSPACE_NAME))) {
                                    workspaceId = workspace.getString("workspaceId");
                                }
                            }
                        }
                    }
                    if (workspaceId != null) {
                        // 保存到静态变量
                        WorkspaceHolder.workspaceId = workspaceId;
                        log.info("新用户工作空间ID: {}", workspaceId);
                    } else {
                        log.error("未获取到工作空间ID");
                    }
                } catch (Exception e) {
                    log.error("获取工作空间ID失败: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("新用户token/工作空间ID流程异常: {}", e.getMessage());
        }
    }

    // 静态内存保存
    public static class WorkspaceHolder {
        public static String workspaceId;
    }

    public void registerAapRoute(OntologyConfigGroupVo agentPlatform) {
        if (agentPlatform == null) {
            log.warn("没有配置AAP或没有设置AAP为激活状态！终止AAP路由注册");
            return;
        }
        try {
            // reg不需要配置，直接读取
            String aapJsonStr = ApisixReg.AAP_REG;
            String contextPath = "";
            String host = "";
            String port = "";
            if (AgentTypeEnum.AAP.getValue().equals(agentPlatform.getGroupType())) {
                contextPath = getAgentConfig(agentPlatform, AapConstant.AAP_CONTEXT_PATH);
                host = getAgentConfig(agentPlatform, AapConstant.AAP_HOST);
                port = getAgentConfig(agentPlatform, AapConstant.AAP_PORT);
            } else if (AgentTypeEnum.DIFY.getValue().equals(agentPlatform.getGroupType())) {
                contextPath = getAgentConfig(agentPlatform, DifyConstant.DIFY_CONTEXT_PATH);
                host = getAgentConfig(agentPlatform, DifyConstant.DIFY_HOST);
                port = getAgentConfig(agentPlatform, DifyConstant.DIFY_PORT);
            }

            aapJsonStr = aapJsonStr
                    .replace("<context-path>", contextPath)
                    .replace("<host>", host)
                    .replace("<port>", port);
            com.alibaba.fastjson.JSONObject aapJson = com.alibaba.fastjson.JSONObject.parseObject(aapJsonStr);

            String routeId = aapJson.getString("name");
            String adminApiUri = "/apisix/admin/routes/" + routeId;

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String putUrl = adminHost + adminApiUri;
            org.springframework.http.HttpHeaders putHeaders = new org.springframework.http.HttpHeaders();
            putHeaders.set("X-API-KEY", apiKey);
            putHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<String> putEntity = new org.springframework.http.HttpEntity<>(
                    aapJsonStr, putHeaders);
            org.springframework.http.ResponseEntity<String> putResp = restTemplate.exchange(putUrl,
                    org.springframework.http.HttpMethod.PUT, putEntity, String.class);
            log.info("AAP路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("AAP自动注册异常: {}", e.getMessage());
        }
    }

}

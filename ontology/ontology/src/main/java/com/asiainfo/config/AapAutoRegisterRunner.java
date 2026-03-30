package com.asiainfo.config;

import com.asiainfo.common.ApisixReg;
import com.asiainfo.serivce.OntologyConfigGroupService;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class AapAutoRegisterRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AapAutoRegisterRunner.class);

    @Value("${suanchou.microservice.admin.host}")
    private String adminHost;
    @Value("${suanchou.microservice.gateway.host}")
    private String gatewayHost;

    @Value("${suanchou.microservice.gateway.app-secret}")
    private String apiKey;

    // @Value("${aap.host}")
    // private String appHost;

    // @Value("${aap.port}")
    // private String appPort;

    // @Value("${aap.context-path:}")
    // private String aapContextPath;

    @Value("${sandbox.pro.host}")
    private String sandboxProHost;

    @Value("${sandbox.pro.port}")
    private String sandBoxProPort;

    @Value("${sandbox.pro.dest-port}")
    private String sandBoxProDestPort;

    @Value("${sandbox.dev.host}")
    private String sandboxHost;

    @Value("${sandbox.dev.port}")
    private String sandBoxPort;

    @Value("${sandbox.dev.dest-port}")
    private String sandBoxDestPort;

    // @Value("${agent_type:}")
    // private String agentType;
    @Autowired
    // 不再从环境中读取，改为从数据库中读取配置
    private OntologyConfigGroupService configGroupService;

    @Autowired
    private AgentPlatformUtils agentPlatformUtils;

    @Override
    public void run(ApplicationArguments args) {
        log.info("开始自动注册AAP路由...");
        OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
        agentPlatformUtils.registerAapRoute(configVo);
        // registerAapRoute();
        registerLogoRoute();
        registerSandboxProRoute();
        registerSandboxRoute();
        registerSandboxDevRoute();
        registerSandboxDevProRoute();
        agentPlatformUtils.runAap(configVo);
    }

    private void registerSandboxRoute() {
        try {
            String aapJsonStr = ApisixReg.ONTOLOGY_SANDBOX;
            aapJsonStr = aapJsonStr.replace("<host>", sandboxHost).replace("<port>", sandBoxPort);
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
            log.info("生产沙箱路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("生成沙箱自动注册异常: {}", e.getMessage());
        }
    }

    private void registerSandboxProRoute() {
        try {
            String aapJsonStr = ApisixReg.SANDBOX_PRO;
            aapJsonStr = aapJsonStr.replace("<host>", sandboxProHost).replace("<port>", sandBoxProPort);
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
            log.info("生产沙箱路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("生成沙箱自动注册异常: {}", e.getMessage());
        }
    }

    private void registerSandboxDevRoute() {
        try {
            String aapJsonStr = ApisixReg.ONTOLOGY_SANDBOX_DEV_DEV;
            aapJsonStr = aapJsonStr.replace("<host>", sandboxHost).replace("<port>", sandBoxDestPort);
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
            log.info("生产沙箱路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("生成沙箱自动注册异常: {}", e.getMessage());
        }
    }

    private void registerSandboxDevProRoute() {
        try {
            String aapJsonStr = ApisixReg.ONTOLOGY_SANDBOX_DEV_PRO;
            aapJsonStr = aapJsonStr.replace("<host>", sandboxProHost).replace("<port>", sandBoxProDestPort);
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
            log.info("生产沙箱路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("生成沙箱自动注册异常: {}", e.getMessage());
        }
    }

    /**
     * 注册AAP路由
     */
    // 将代码移到AgentPlatformUtils里，以便激活AAP时再次执行
    // private void registerAapRoute() {
    // try {
    // String aapJsonStr = ApisixReg.AAP_REG;
    // aapJsonStr = aapJsonStr.replace("<context-path>",
    // aapContextPath).replace("<host>", appHost).replace("<port>", appPort);
    // com.alibaba.fastjson.JSONObject aapJson =
    // com.alibaba.fastjson.JSONObject.parseObject(aapJsonStr);

    // String routeId = aapJson.getString("name");
    // String adminApiUri = "/apisix/admin/routes/" + routeId;

    // org.springframework.web.client.RestTemplate restTemplate = new
    // org.springframework.web.client.RestTemplate();
    // String putUrl = adminHost + adminApiUri;
    // org.springframework.http.HttpHeaders putHeaders = new
    // org.springframework.http.HttpHeaders();
    // putHeaders.set("X-API-KEY", apiKey);
    // putHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
    // org.springframework.http.HttpEntity<String> putEntity = new
    // org.springframework.http.HttpEntity<>(aapJsonStr, putHeaders);
    // org.springframework.http.ResponseEntity<String> putResp =
    // restTemplate.exchange(putUrl, org.springframework.http.HttpMethod.PUT,
    // putEntity, String.class);
    // log.info("AAP路由注册结果: {}", putResp.getBody());
    // } catch (Exception e) {
    // log.error("AAP自动注册异常: {}", e.getMessage());
    // }
    // }

    /**
     * 注册路由
     */
    private void registerRoute() {
        // RegisterFactory.getRegister(agentType).registerRoute();
    }

    /**
     * 注册LOGO路由
     */
    private void registerLogoRoute() {
        log.info("开始自动注册LOGO路由...");
        try {
            // 解析gatewayHost，获取host和port
            String host = "";
            String port = "";
            String url = gatewayHost.trim();
            if (url.startsWith("http://")) {
                url = url.substring(7);
            } else if (url.startsWith("https://")) {
                url = url.substring(8);
            }
            int colonIdx = url.indexOf(':');
            int slashIdx = url.indexOf('/');
            if (colonIdx > 0) {
                host = url.substring(0, colonIdx);
                if (slashIdx > colonIdx) {
                    port = url.substring(colonIdx + 1, slashIdx);
                } else {
                    port = url.substring(colonIdx + 1);
                }
            } else {
                if (slashIdx > 0) {
                    host = url.substring(0, slashIdx);
                } else {
                    host = url;
                }
                // 默认端口
                if (gatewayHost.startsWith("https://")) {
                    port = "443";
                } else {
                    port = "80";
                }
            }

            String logoJsonStr = ApisixReg.LOGO_REG;
            logoJsonStr = logoJsonStr.replace("<host>", host).replace("<port>", port);
            com.alibaba.fastjson.JSONObject logoJson = com.alibaba.fastjson.JSONObject.parseObject(logoJsonStr);

            String routeId = logoJson.getString("name");
            String adminApiUri = "/apisix/admin/routes/" + routeId;

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String putUrl = adminHost + adminApiUri;
            org.springframework.http.HttpHeaders putHeaders = new org.springframework.http.HttpHeaders();
            putHeaders.set("X-API-KEY", apiKey);
            putHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<String> putEntity = new org.springframework.http.HttpEntity<>(
                    logoJsonStr, putHeaders);
            org.springframework.http.ResponseEntity<String> putResp = restTemplate.exchange(putUrl,
                    org.springframework.http.HttpMethod.PUT, putEntity, String.class);
            log.info("LOGO路由注册结果: {}", putResp.getBody());
        } catch (Exception e) {
            log.error("LOGO自动注册异常: {}", e.getMessage());
        }
    }
}

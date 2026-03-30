package com.asiainfo.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import okhttp3.*;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

@Component
public class DifyUtil {

    // 默认参数
    private static final String DEFAULT_BASE_URL = "http://10.21.20.170:1909";
    private static final String DEFAULT_EMAIL = "dify@163.com";
    private static final String DEFAULT_PASSWORD = "a12345678";
    private static final String DEFAULT_MODE = "agent-chat";

    // 通过yaml配置参数
    private String baseUrl;
    private String email;
    private String password;
    private String mode;

    public DifyUtil() {
        loadYamlConfig();
    }

    // 加载yaml配置
    private void loadYamlConfig() {
        try {
            Yaml yaml = new Yaml();
            InputStream in = new ClassPathResource("application.yaml").getInputStream();
            Map<String, Object> obj = yaml.load(in);
            // 这里假设配置在 dify 节点下，如无则用默认值
            Map<String, Object> dify = obj != null && obj.containsKey("dify") ? (Map<String, Object>) obj.get("dify") : new HashMap<>();
            baseUrl = dify.getOrDefault("baseUrl", DEFAULT_BASE_URL).toString();
            email = dify.getOrDefault("email", DEFAULT_EMAIL).toString();
            password = dify.getOrDefault("password", DEFAULT_PASSWORD).toString();
            mode = dify.getOrDefault("mode", DEFAULT_MODE).toString();
        } catch (Exception e) {
            baseUrl = DEFAULT_BASE_URL;
            email = DEFAULT_EMAIL;
            password = DEFAULT_PASSWORD;
            mode = DEFAULT_MODE;
        }
    }

    // 登录接口，返回 access_token
    public String login() throws Exception {
        OkHttpClient client = new OkHttpClient();
        String url = baseUrl + "/console/api/login";
        String json = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);

        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            String resp = response.body().string();
            JSONObject obj = JSON.parseObject(resp);
            if ("success".equals(obj.getString("result"))) {
                JSONObject data = obj.getJSONObject("data");
                return data.getString("access_token");
            }
            throw new RuntimeException("登录失败: " + resp);
        }
    }

    // 创建智能体，返回 agentId
    public String createAgent(String accessToken, String name, String description) throws Exception {
        OkHttpClient client = new OkHttpClient();
        String url = baseUrl + "/console/api/apps";
        String json = String.format("{\"name\":\"%s\",\"mode\":\"%s\",\"description\":\"%s\"}", name, mode, description);

        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Authorization", "Bearer " + accessToken)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            String resp = response.body().string();
            JSONObject obj = JSON.parseObject(resp);
            String id = obj.getString("id");
            if (id != null && !id.isEmpty()) {
                return id;
            }
            throw new RuntimeException("创建智能体失败: " + resp);
        }
    }

    // 获取智能体 appToken
    public String getAgentToken(String accessToken, String agentId) throws Exception {
        OkHttpClient client = new OkHttpClient();
        String url = baseUrl + "/console/api/apps/" + agentId + "/api-keys";

        Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("Authorization", "Bearer " + accessToken)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String resp = response.body().string();
            JSONObject obj = JSON.parseObject(resp);
            if (obj.containsKey("data")) {
                Object dataObj = obj.get("data");
                if (dataObj instanceof List) {
                    List<?> dataList = (List<?>) dataObj;
                    if (!dataList.isEmpty()) {
                        JSONObject tokenObj = JSON.parseObject(JSON.toJSONString(dataList.get(0)));
                        return tokenObj.getString("token");
                    }
                }
            }
            return null;
        }
    }

    // 创建新的智能体 appToken
    public String createAgentToken(String accessToken, String agentId) throws Exception {
        OkHttpClient client = new OkHttpClient();
        String url = baseUrl + "/console/api/apps/" + agentId + "/api-keys";

        RequestBody body = RequestBody.create("", MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Authorization", "Bearer " + accessToken)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String resp = response.body().string();
            JSONObject obj = JSON.parseObject(resp);
            String token = obj.getString("token");
            if (token != null && !token.isEmpty()) {
                return token;
            }
            throw new RuntimeException("创建appToken失败: " + resp);
        }
    }

    public static void main(String[] args) throws Exception {
        String name = "自动测试智能体";
        String description = "自动测试智能体描述";
        DifyUtil difyUtil = new DifyUtil();
        // 登录获取 access_token
        String accessToken = difyUtil.login();
        System.out.println("accessToken: " + accessToken);

        // 创建智能体，获取 agentId
        String agentId = difyUtil.createAgent(accessToken, name, description);
        System.out.println("agentId: " + agentId);

        // 获取智能体 apiToken
        String apiToken = difyUtil.getAgentToken(accessToken, agentId);
        System.out.println("apiToken: " + apiToken);

        // 断言 apiToken 不为空
        if(apiToken != null && !apiToken.isEmpty()) {
            System.out.println("apiToken: " + apiToken);
        } else {
            String agentToken = difyUtil.createAgentToken(accessToken, agentId);
            System.out.println("agentToken: " + agentToken);
        }
    }
}
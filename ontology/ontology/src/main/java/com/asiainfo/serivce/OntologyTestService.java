package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.modo.app.web.flux.WebFluxClient;
import com.asiainfo.modo.app.web.sse.SseEmitterServer;
import com.asiainfo.vo.operation.ChatVo;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.Disposable;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 *
 *
 * @author hulin
 * @since 2025-12-17
 */
@Slf4j
@Service
public class OntologyTestService {
    private final static String EVENT = "event";

    @Autowired
    private WebFluxClient webFluxClient;

    public void chat(ChatVo chatVo) {
        Disposable subscribe = null;
        AtomicBoolean stopFlag = new AtomicBoolean(false);

        Map<String, String> headers = new HashMap<>();

        Map<String, Object> params = new HashMap<>();
        params.put("query", "你好");
        params.put("response_mode", "streaming");
        params.put("user", "admin");

        try {
            subscribe = webFluxClient.post("http://10.19.29.140:9080/ontology_back/api/v1/ontology/agent/chat", headers, params, resp -> {
                log.info("response: {}", resp);

                if (StringUtils.isBlank(resp)) return;

                JSONObject respMap = JSON.parseObject(resp);
                // 获取时间类型，做对应操作
                String event = respMap.getString(EVENT);

                // 根据clientId返回SSE消息
                SseEmitterServer.sendMsg(chatVo.getClientId(), resp);

                if ("message_end".equals(event)) {
                    stopFlag.set(true);
                }
            });

            while (!stopFlag.get()) {
                Thread.sleep(100L);
            }
        } catch (Exception e) {
            log.error("request dify api error!!", e);
            throw new RuntimeException(e.getMessage(), e.getCause());
        } finally {
            // 发送结束消息
            if (subscribe != null && !subscribe.isDisposed()) {
                subscribe.dispose();
            }
            SseEmitterServer.removeUser(SseEmitterServer.getCacheKey(chatVo.getClientId())); //关闭SSE连接
        }
    }
}

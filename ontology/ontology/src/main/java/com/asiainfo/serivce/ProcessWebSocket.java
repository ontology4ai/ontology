package com.asiainfo.serivce;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class ProcessWebSocket implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")        // 你可以改为需要的连接端点
                .setAllowedOriginPatterns("*")
                .withSockJS();             // 如果不用 SockJS，可去掉 .withSockJS()
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 客户端发送到服务端的应用前缀（@MessageMapping），可按需调整
        registry.setApplicationDestinationPrefixes("/action");

        // 开启简单消息代理，并设定你要使用的订阅前缀
        // 这里用 "/action/websocket" 前缀，客户端订阅 "/action/websocket/{processId}"
        registry.enableSimpleBroker("/action/websocket");
    }
}
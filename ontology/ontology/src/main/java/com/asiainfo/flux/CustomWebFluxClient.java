package com.asiainfo.flux;

import java.util.Map;
import java.util.function.Consumer;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Disposable;

@Service
public class CustomWebFluxClient {
    private final ClientHttpConnector connector;

    public CustomWebFluxClient(ClientHttpConnector connector) {
        this.connector = connector;
    }

    public Disposable get(String url, Map<String, String> headers, Consumer<String> consumer) {
        WebClient webClient = this.getWebClient(headers);
        return ((WebClient.RequestBodySpec)webClient.method(HttpMethod.GET).uri(url, new Object[0])).retrieve().bodyToFlux(String.class).subscribe(consumer);
    }

    public Disposable post(String url, Map<String, String> headers, Object body, Consumer<String> consumer) {
        WebClient webClient = this.getWebClient(headers);
        return ((WebClient.RequestBodySpec)webClient.method(HttpMethod.POST).uri(url, new Object[0])).bodyValue(body).retrieve().bodyToFlux(String.class).subscribe(consumer);
    }

    private WebClient getWebClient(Map<String, String> customHeaders) {
        if (!customHeaders.containsKey("Cookie")) {
            customHeaders.put("Cookie", cookieFromRequestContext());
        }

        return WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))    // 10MB
                .clientConnector(this.connector)
                .defaultHeaders((headers) -> {customHeaders.forEach(headers::add);})
                .build();
    }

    private static String cookieFromRequestContext() {
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes)RequestContextHolder.getRequestAttributes();
        if (requestAttributes == null) {
            return "";
        } else {
            HttpServletRequest request = requestAttributes.getRequest();
            StringBuilder cookieBuilder = new StringBuilder();
            Cookie[] var3 = request.getCookies();
            int var4 = var3.length;

            for(int var5 = 0; var5 < var4; ++var5) {
                Cookie cookie = var3[var5];
                cookieBuilder.append(cookie.getName()).append("=").append(cookie.getValue()).append(";");
            }

            return cookieBuilder.toString();
        }
    }
}

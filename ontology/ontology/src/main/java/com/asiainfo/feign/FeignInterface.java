package com.asiainfo.feign;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

/**
 * @Author luchao
 * @Date 2024/8/26
 * @Description
 */
public interface FeignInterface {

    default String getCookie(HttpServletRequest request) {
        StringBuilder builder = new StringBuilder();
        Cookie[] cookies = request.getCookies();
        for (Cookie cookie : cookies) {
            builder.append(cookie.getName()).append("=").append(cookie.getValue()).append(";");
        }
        return builder.deleteCharAt(builder.length() - 1).toString();
    }
}

package com.asiainfo.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.modo.utils.JwtUtil;
import io.github.suanchou.utils.StringUtil;
import io.github.suanchou.web.Response;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 获取当前用户当前工作空间的JWT Token
 *
 * @author hulin
 * @since 2025-12-08
 */
@Slf4j
@RestController
@RequestMapping("/_api/token")
public class TokenController {
    @GetMapping
    public Object getToken(HttpServletRequest request) {
        ModoWebUtils.CookieIdentity identity = ModoWebUtils.getCookieIdentity(request);
        String userId = identity.getUserId();
        String teamName = identity.getTeamName();

        return Response.ok("成功", generateToken(userId, teamName));
    }

    private String generateToken(String userId, String teamName) {
        Date now = new Date();

        Map<String, Object> claims = new HashMap<>();
        String appKey = StringUtil.genUuid(32);
        claims.put("key", appKey);
        claims.put("ts", now.getTime());
        if (userId != null) {
            claims.put(JwtUtil.USER_ID_KEY, userId);
        }
        if (teamName != null) {
            claims.put(JwtUtil.TEAM_NAME_KEY, teamName);
        }

        Calendar cal = GregorianCalendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.YEAR, 99);

        log.info("生成jwt, appId={}, appKey={}, teamName={}, time( in year)={}", userId, appKey, teamName, 99);

        return Jwts.builder()
                .setClaims(claims)
                .setExpiration(cal.getTime())
                .signWith(SignatureAlgorithm.HS256, JwtUtil.JWT_SIGN_KEY.getBytes(StandardCharsets.UTF_8))
                .compact();
    }
}

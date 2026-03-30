package com.asiainfo.minio;

import io.minio.messages.Expiration;
import io.minio.messages.LifecycleRule;
import io.minio.messages.RuleFilter;
import io.minio.messages.Status;

import java.time.ZonedDateTime;
import java.util.LinkedList;
import java.util.List;

public class LifecycleRulesBuilder {

    public final static int DEFAULT_EXPIRED_DAY = 7;

    /**
     * 设置文件过期删除规则
     */
    public static List<LifecycleRule> buildExpirationRules(int expireDay) {
        // 规则1: 临时文件expireDay天后过期
        LifecycleRule tempRule = new LifecycleRule(
                Status.ENABLED,                     // 启用规则
                null,
                new Expiration((ZonedDateTime)null, expireDay, null),  // expireDay天后过期
                new RuleFilter(""),           // 前缀过滤,空字符串匹配所有前缀
                null,
                null,
                null,
                null
        );

        List<LifecycleRule> rules = new LinkedList<>();
        rules.add(tempRule);
        return rules;
    }
}

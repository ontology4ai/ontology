package com.asiainfo.config;

import com.asiainfo.common.AgentTypeEnum;
import com.asiainfo.modo.utils.SpringContextUtil;
import org.apache.commons.lang3.StringUtils;

public class RegisterFactory {
    public static Register getRegister(String agentType) {
        if (StringUtils.equalsIgnoreCase(agentType, AgentTypeEnum.DIFY.getValue())) {
            return SpringContextUtil.getBean(DifyRegister.class);
        }
        return SpringContextUtil.getBean(AapRegister.class);
    }
}

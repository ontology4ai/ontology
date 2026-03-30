package com.asiainfo.config;

import com.asiainfo.common.AapConstant;
import com.asiainfo.common.AgentTypeEnum;
import com.asiainfo.serivce.OntologyConfigGroupService;
import com.asiainfo.common.ApisixReg;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AapRegister implements Register {
    // AAP常量定义统一到AapConstant
    // public static final String AAP_HOST = "aap.host";
    // public static final String AAP_PORT = "aap.port";
    // public static final String AAP_REG = "aap.reg";
    @Autowired
    private RouteRegister routeRegister;

    @Autowired
    // 不再从环境中读取，改为从数据库中读取配置
    // private Environment environment;
    private OntologyConfigGroupService configGroupService;
    @Autowired
    private AgentPlatformUtils agentPlatformUtils;

    @Override
    public void registerRoute() {
        // String host = environment.getProperty(AAP_HOST);
        // String port = environment.getProperty(AAP_PORT);
        // String reg = environment.getProperty(AAP_REG, ApisixReg.AAP_REG);
        OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
        if (configVo != null
                && AgentTypeEnum.AAP.getValue().equals(agentPlatformUtils.getAgentType(configVo))) {
            routeRegister.registerRoute(AgentTypeEnum.AAP.getValue(),
                    agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_HOST),
                    agentPlatformUtils.getAgentConfig(configVo, AapConstant.AAP_PORT),
                    ApisixReg.AAP_REG);
        } else
            log.warn("没有配置AAP或没有设置AAP为激活状态!终止AAP注册");
    }
}

package com.asiainfo.config;

import com.asiainfo.common.AgentTypeEnum;
import com.asiainfo.common.ApisixReg;
import com.asiainfo.common.DifyConstant;
import com.asiainfo.serivce.OntologyConfigGroupService;
import com.asiainfo.util.AgentPlatformUtils;
import com.asiainfo.vo.operation.OntologyConfigGroupVo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DifyRegister implements Register {
    // DIFY常量定义统一到DifyConstant
    // public static final String DIFY_HOST = "dify.host";
    // public static final String DIFY_PORT = "dify.port";
    // public static final String DIFY_REG = "dify.reg";
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
        // String host = environment.getProperty(DIFY_HOST);
        // String port = environment.getProperty(DIFY_PORT);
        // String reg = environment.getProperty(DIFY_REG, ApisixReg.AAP_REG);
        OntologyConfigGroupVo configVo = configGroupService.getEnabledAgentPlatform();
        if (configVo != null
                && AgentTypeEnum.DIFY.getValue().equals(agentPlatformUtils.getAgentType(configVo))) {
            routeRegister.registerRoute(AgentTypeEnum.DIFY.getValue(),
                    agentPlatformUtils.getAgentConfig(configVo, DifyConstant.DIFY_HOST),
                    agentPlatformUtils.getAgentConfig(configVo, DifyConstant.DIFY_PORT),
                    ApisixReg.AAP_REG);
        } else
            log.warn("没有配置DIFY或没有设置DIFY为激活状态!终止DIFY注册");
    }
}

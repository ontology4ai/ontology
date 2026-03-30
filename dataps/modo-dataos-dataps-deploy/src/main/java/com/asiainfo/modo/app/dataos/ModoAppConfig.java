package com.asiainfo.modo.app.dataos;

import com.asiainfo.modo.app.datasource.dynamic.DataSourceConfig;
import com.asiainfo.modo.app.datasource.dynamic.DynamicDataSource;
import com.asiainfo.modo.app.datasource.dynamic.ExtDataSourceConfig;
import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.modo.utils.ModoConstant;
import io.github.suanchou.datasource.DatasourceLoader;
import io.github.suanchou.utils.SpringContextUtil;
import io.github.suanchou.utils.SpringJdbcUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * @authro QvQ
 * @date 2021-11-22
 */
@Slf4j
@Component
public class ModoAppConfig implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("检查Modo核心配置完整性...");

        //TODO 建业务日志表，记录业务日志，而不是所有请求的详细日志

        try{
            SpringContextUtil.getBean(DatasourceLoader.class).initDatasource();
        }catch (Exception e){
            log.warn("初始化ModoDatasource失败", e);
        }
        log.info("更新菜单i18n中英文配置");
        SpringJdbcUtil.getJdbcTemplate().execute("update modo_menu set menu_name_en = menu_name, menu_name_cn = menu_label where menu_name_cn is null");

//        try{
//            ExtDataSourceConfig extDynamicDataSourceConfig = SpringContextUtil.getBean(ExtDataSourceConfig.class);
//            Map<Object, Object> dataSourceMap = extDynamicDataSourceConfig.injectDynamicDatasource();
//
//            DataSourceConfig dynamicDataSourceConfig = SpringContextUtil.getBean(DataSourceConfig.class);
//            Map<Object, Object> defaultTargetDataSource = dynamicDataSourceConfig.getDefaultTargetDataSource();
//
//            dataSourceMap.putAll(defaultTargetDataSource);
//
//            DynamicDataSource dynamicDatasource = SpringContextUtil.getBean(DynamicDataSource.class);
//            dynamicDatasource.setTargetDataSources(dataSourceMap);
//            dynamicDatasource.afterPropertiesSet();
//
//            log.info("加载应用动态数据源");
//        }catch (NoSuchBeanDefinitionException ignored){
//
//        }catch (Exception e){
//            log.error("加载应用动态数据源失败", e);
//        }

    }

}

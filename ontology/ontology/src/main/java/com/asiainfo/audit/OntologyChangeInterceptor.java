package com.asiainfo.audit;

import com.asiainfo.po.BasePo;
import com.asiainfo.serivce.OntologyChangeLogService;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Configuration
@Aspect
@Component
@Slf4j
public class OntologyChangeInterceptor {
    @Autowired
    private OntologyChangeLogService ontologyChangeLogService;

    @Around("execution(* com.asiainfo.repo.Ontology*Repository.save(..))")
    public Object interceptSaveOperation(ProceedingJoinPoint joinPoint) {
        Object returnObj = null;
        try {
            // 执行原有方法
            returnObj = joinPoint.proceed();

            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0 && args[0] instanceof BasePo) {
                ontologyChangeLogService.saveChangeLog("保存", args[0]);
            }
        } catch (Throwable e) {
            log.error("记录日志信息出错:{}", e.getMessage());
        }
        return returnObj;
    }

    @Around("execution(* com.asiainfo.repo.Ontology*Repository.softDeleteByIds(..))")
    public Object interceptDeleteOperation(ProceedingJoinPoint joinPoint) {
        Object returnObj = null;
        try {
            // 执行原有方法
            returnObj = joinPoint.proceed();

            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0 && args[0] instanceof List) {
                List<String> ids = (List)args[0];
                if(joinPoint.getTarget() instanceof CrudRepository)  {
                    CrudRepository repository = (CrudRepository)joinPoint.getTarget();
                    Iterable it = repository.findAllById(ids);
                    if (it.iterator().hasNext()) {
                        Object deleteObject = it.iterator().next();
                        ontologyChangeLogService.saveChangeLog("删除", deleteObject);
                    }
                }
            }
        } catch (Throwable e) {
            log.error("记录日志信息出错:{}", e.getMessage());
        }
        return returnObj;
    }
}

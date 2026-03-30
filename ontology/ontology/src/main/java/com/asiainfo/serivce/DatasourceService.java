package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.ProfileEnum;
import com.asiainfo.dto.DatasourceDto;
import com.asiainfo.dto.TeamDsDto;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.DataAccessParam;
import com.asiainfo.modo.app.datasource.rela.ModoTeamDsRepo;
import com.asiainfo.vo.datasource.DatasourceVo;
import io.github.suanchou.utils.StringUtil;
import io.github.suanchou.web.Response;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.formula.functions.Na;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/8/19
 * @Description
 */

@Service
@Slf4j
public class DatasourceService {
    private ReentrantLock lock = new ReentrantLock();

    @Autowired
    EntityManager entityManager;

    @Autowired
    ModoTeamDsRepo modoTeamDsRepo;

    @Autowired
    DataosFeign dataosFeign;

    String datasourceNameFormat = "%s(%s)";


    public Object list(String teamName, List<String> dsTypes) {

        String jpql = "select new com.asiainfo.dto.TeamDsDto(p, d.label) from ModoTeamDs p left join ModoDatasource d on p.dsName = d.name " +
                "where p.teamName = :teamName and d.dsType in :dsTypes and p.dsProfile = :dsProfile";
        TypedQuery<TeamDsDto> query = entityManager.createQuery(jpql, TeamDsDto.class);
        query.setParameter("teamName", teamName);
        query.setParameter("dsTypes", dsTypes);
        query.setParameter("dsProfile", "pro");
        List<TeamDsDto> resultList = query.getResultList();

        List<Object> collect = resultList.stream().map(ds -> {
            DatasourceDto datasourceDto = new DatasourceDto();
            datasourceDto.setId(ds.getModoTeamDs().getId());
//            datasourceDto.setName(String.format(datasourceNameFormat, ds.getLabel(), ProfileEnum.parse(ds.getModoTeamDs().getDsProfile()).getValue()));
            datasourceDto.setName(ds.getLabel());
            String dsConf = ds.getModoTeamDs().getDsConf();
            datasourceDto.setSchemas(new ArrayList<>());
            if (StringUtils.isNotBlank(dsConf)) {
                JSONObject jsonObject = null;
                try {
                    jsonObject = JSONObject.parseObject(dsConf);
                } catch (Exception e) {
                    log.error("", e);
                    return datasourceDto;
                }
                String dsSchema = jsonObject.getString("dsSchema");
                if (StringUtils.isNotBlank(dsSchema)) {
                    String[] split = dsSchema.split(",");
                    List<String> list = Arrays.asList(split);
                    datasourceDto.setSchemas(list);
                }
            }
            return datasourceDto;
        }).collect(Collectors.toList());
        return collect;
    }

    public TeamDsDto getTeamDs(String id) {
        String sql = "select new com.asiainfo.dto.TeamDsDto(p, d.label, d.dsType) from ModoTeamDs p left join ModoDatasource d on p.dsName = d.name "
                + " where p.id = :id";
        TypedQuery<TeamDsDto> query = entityManager.createQuery(sql, TeamDsDto.class);
        query.setParameter("id", id);
        List<TeamDsDto> resultList = query.getResultList();
        if (resultList.isEmpty()) {
            return null;
        }
        return resultList.get(0);
    }

    public TeamDsDto getTeamDs(String teamName, String dsName, String dsProfile) {
        String sql = "select new com.asiainfo.dto.TeamDsDto(p, d.label, d.dsType) from ModoTeamDs p left join ModoDatasource d on p.dsName = d.name "
                + " where p.teamName = :teamName and p.dsName = :dsName and p.dsProfile = :dsProfile";
        TypedQuery<TeamDsDto> query = entityManager.createQuery(sql, TeamDsDto.class);
        query.setParameter("teamName", teamName);
        query.setParameter("dsName", dsName);
        query.setParameter("dsProfile", dsProfile);
        List<TeamDsDto> resultList = query.getResultList();
        if (resultList.isEmpty()) {
            return null;
        }
        return resultList.get(0);
    }

    public Object tables(String teamName, DatasourceVo datasourceVo) {

        String jpql = "select new com.asiainfo.dto.TeamDsDto(p, d.label, d.dsType) from ModoTeamDs p left join ModoDatasource d on p.dsName = d.name " +
                "where p.id = :id";
        TypedQuery<TeamDsDto> query = entityManager.createQuery(jpql, TeamDsDto.class);
        query.setParameter("id", datasourceVo.getId());
        TeamDsDto modoTeamDs = query.getSingleResult();

        if (modoTeamDs == null || !modoTeamDs.getModoTeamDs().getTeamName().equals(teamName)) {
            throw new RuntimeException("团队/工作空间数据源不存在");
        }


        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        List<Map<String, Object>> result = new ArrayList<>();
        String cookie = dataosFeign.getCookie(requestAttributes.getRequest());
        Response<Map<String, Object>> feignTables = dataosFeign.findTables(teamName,
                modoTeamDs.getModoTeamDs().getDsName(),
                modoTeamDs.getDsType(),
                datasourceVo.getSchema(),
                modoTeamDs.getModoTeamDs().getDsProfile(),
                cookie);
        if (feignTables.isSuccess()) {
            Map<String, Object> data = feignTables.getData();

            List<Map<String, Object>> tableMap = (List<Map<String, Object>>) data.get("datas");
            for (Map<String, Object> map : tableMap) {
                map.put("type", "table");
            }
            result.addAll(tableMap);
        } else {
            throw new RuntimeException("Dataps服务不可用");
        }

        Response<Map<String, Object>> feignViews = dataosFeign.getDsViews(teamName,
                modoTeamDs.getModoTeamDs().getDsName(),
                modoTeamDs.getDsType(),
                datasourceVo.getSchema(),
                modoTeamDs.getModoTeamDs().getDsProfile(),
                cookie);
        if (feignViews.isSuccess()) {
            Map<String, Object> data = feignViews.getData();

            List<Map<String, Object>> viewMap = (List<Map<String, Object>>) data.get("datas");
            for (Map<String, Object> map : viewMap) {
                map.put("type", "view");
            }
            result.addAll(viewMap);
        } else {
            throw new RuntimeException("Dataps服务不可用");
        }

        return result;
    }

    public Object tableInfos(String teamName, DatasourceVo datasourceVo) {

        String jpql = "select new com.asiainfo.dto.TeamDsDto(p, d.label, d.dsType) from ModoTeamDs p left join ModoDatasource d on p.dsName = d.name " +
                "where p.id = :id";
        TypedQuery<TeamDsDto> query = entityManager.createQuery(jpql, TeamDsDto.class);
        query.setParameter("id", datasourceVo.getId());
        TeamDsDto modoTeamDs = query.getSingleResult();

        if (modoTeamDs == null || !modoTeamDs.getModoTeamDs().getTeamName().equals(teamName)) {
            throw new RuntimeException("团队/工作空间数据源不存在");
        }


        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        String cookie = dataosFeign.getCookie(requestAttributes.getRequest());

        if ("view".equals(datasourceVo.getType())) {
            Response<Map<String, Object>> feignTables = dataosFeign.getDsViewColumns(teamName,
                    modoTeamDs.getModoTeamDs().getDsName(),
                    modoTeamDs.getDsType(),
                    datasourceVo.getSchema(),
                    modoTeamDs.getModoTeamDs().getDsProfile(),
                    datasourceVo.getTableName(),
                    cookie);
            if (feignTables.isSuccess()) {
                Map<String, Object> data = feignTables.getData();
                standardType(data);
                return data;
            } else {
                throw new RuntimeException("Dataps服务不可用");
            }
        } else {
            Response<Map<String, Object>> feignTables = dataosFeign.findTableInfo(teamName,
                    modoTeamDs.getModoTeamDs().getDsName(),
                    modoTeamDs.getDsType(),
                    datasourceVo.getSchema(),
                    modoTeamDs.getModoTeamDs().getDsProfile(),
                    datasourceVo.getTableName(),
                    cookie);
            if (feignTables.isSuccess()) {
                Map<String, Object> data = feignTables.getData();
                standardType(data);
                return data;
            } else {
                throw new RuntimeException("Dataps服务不可用");
            }
        }

    }

    public void standardType(Map<String, Object> data) {
        Map<String, Object> columns = (Map<String, Object>) data.get("columns");
        List<Map<String, Object>> datas = (List<Map<String, Object>>) columns.get("datas");

        // 将datas转为JSONArray
        for (Map<String, Object> column : datas) {

            String dataType = MapUtils.getString(column, "DATA_TYPE");
            column.put("DATA_TYPE", parseDbType(dataType));
        }
    }

    public static String parseDbType(String dbType) {
//        if (dbType == null) {
//            return "string"; // 默认类型
//        }
//        // 转成小写并去除空白
//        String type = dbType.trim().toLowerCase();
//
//        // String 类型
//        if (type.contains("char") || type.contains("text") || type.equals("uuid") || type.equals("xml")) {
//            return "string";
//        }
//
//        // Int 类型
//        if (type.contains("int") || type.equals("smallint") || type.equals("integer") ||
//                type.equals("tinyint") || type.equals("mediumint") || type.equals("bigint")) {
//            return "int";
//        }
//
//        // Decimal/Float/Double 类型
//        if (type.contains("dec") || type.contains("numeric") || type.contains("number") ||
//                type.contains("float") || type.contains("real") || type.contains("double")) {
//            return "decimal";
//        }
//
//        // Date/Time类型
//        if (type.contains("date") || type.contains("time") || type.equals("datetime") ||
//                type.equals("timestamp") || type.equals("year")) {
//            return "date";
//        }
//
//        // Boolean类型
//        if (type.contains("bool") || type.equals("boolean")) {
//            return "bool";
//        }
//
//        // 默认
//        return "string";
        return dbType;
    }

    /**
     * 执行SQL语句获取查询结果
     *
     * @param dsId     团队数据源ID
     * @param dsSchema 数据源schema
     * @param sql      需要执行的SQL语句
     * @return 查询结果
     */
    public Response<List<Map<String, Object>>> executeSql(String dsId, String dsSchema, String sql, int limit) {
        DataAccessParam param = new DataAccessParam();

        String reqKey = StringUtil.genShortUuid();
        TeamDsDto teamDs = getTeamDs(dsId);
        if (teamDs == null) {
            throw new RuntimeException("数据源为空");
        }
        param.setDsType(teamDs.getDsType());
        param.setRunSql(sql);
        param.setDsName(teamDs.getModoTeamDs().getDsName());
        param.setTeamName(teamDs.getModoTeamDs().getTeamName());
        param.setDsSchema(dsSchema);
        param.setDsProfile(teamDs.getModoTeamDs().getDsProfile());
        param.setLimit(limit);
        param.setReqKey(reqKey);
        param.setWindowId(reqKey);
        param.setIsExplain(false);

        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String cookie = dataosFeign.getCookie(requestAttributes.getRequest());
        lock.lock();
        try {
            log.info("执行SQL: {}", sql);
            return dataosFeign.executeSql(param, cookie);
        } finally {
            lock.unlock();
        }
    }
}

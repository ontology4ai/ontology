package com.asiainfo.serivce;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.DsTypeEnum;
import com.asiainfo.common.FieldTypeEnum;
import com.asiainfo.common.OperStatusEnum;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.dto.OntologyObjectCustomAttributeDto;
import com.asiainfo.dto.OntologyObjectTypeAttributeDto;
import com.asiainfo.dto.OntologyObjectTypeExploreDto;
import com.asiainfo.dto.ParseSqlResultDto;
import com.asiainfo.po.OntologyObjectTypeAttributePo;
import com.asiainfo.po.OntologyObjectTypeHisPo;
import com.asiainfo.po.OntologyObjectTypePo;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.repo.OntologyObjectTypeAttributeRepository;
import com.asiainfo.repo.OntologyObjectTypeHisRepository;
import com.asiainfo.repo.OntologyObjectTypeRepository;
import com.asiainfo.repo.OntologyRepository;
import com.asiainfo.vo.datasource.DatasourceVo;
import com.asiainfo.vo.search.ObjectTypeExploreVo;
import com.asiainfo.vo.search.ObjectTypeSearchVo;
import io.github.suanchou.utils.SpringJdbcUtil;
import io.github.suanchou.web.Response;
import com.alibaba.druid.sql.ast.SQLExpr;
import com.alibaba.druid.sql.ast.SQLStatement;
import com.alibaba.druid.sql.ast.expr.SQLAllColumnExpr;
import com.alibaba.druid.sql.ast.expr.SQLIdentifierExpr;
import com.alibaba.druid.sql.ast.expr.SQLMethodInvokeExpr;
import com.alibaba.druid.sql.ast.expr.SQLPropertyExpr;
import com.alibaba.druid.sql.ast.statement.SQLExprTableSource;
import com.alibaba.druid.sql.ast.statement.SQLSelectItem;
import com.alibaba.druid.sql.ast.statement.SQLSelectQuery;
import com.alibaba.druid.sql.ast.statement.SQLSelectQueryBlock;
import com.alibaba.druid.sql.ast.statement.SQLSelectStatement;
import com.alibaba.druid.sql.dialect.mysql.parser.MySqlStatementParser;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.persistence.TypedQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 本体探索业务Service
 *
 * @author hulin
 * @since 2025-09-15
 */
@Service
public class ObjectTypeExploreService {
    @Autowired
    private OntologyRepository ontologyRepository;
    @Autowired
    private OntologyObjectTypeRepository objectTypeRepository;
    @Autowired
    private OntologyObjectTypeHisRepository objectTypeHisRepository;
    @Autowired
    private OntologyObjectTypeAttributeRepository objectTypeAttributeRepository;
    @Autowired
    private DatasourceService datasourceService;

    /**
     * 查询已发布的所有对象类型
     * @param searchVo 请求参数
     * @return 本体探索对象类型列表
     */
    public Page<OntologyObjectTypeExploreDto> explorePage(ObjectTypeSearchVo searchVo) {
        Sort sort = Sort.by(
                Sort.Order.desc("lastUpdate"),
                Sort.Order.asc("objectTypeId")
        );
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 20, sort);

        Page<OntologyObjectTypeHisPo> objectTypeHisPoPage = objectTypeHisRepository.findAll((Specification<OntologyObjectTypeHisPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Subquery<OntologyPo> subquery = query.subquery(OntologyPo.class);
            Root<OntologyPo> ontologyRoot = subquery.from(OntologyPo.class);

            subquery.select(ontologyRoot)
                    .where(
                            cb.equal(ontologyRoot.get("id"), root.get("ontologyId")),
                            cb.equal(ontologyRoot.get("latestVersion"), root.get("latestVersion")),
                            cb.equal(ontologyRoot.get("status").as(Integer.class), 1),
                            cb.lt(ontologyRoot.get("operStatus").as(Integer.class), OperStatusEnum.DELETED.getCode()),
                            cb.equal(ontologyRoot.get("workspaceId"), searchVo.getWorkspaceId())
                    );
            predicates.add(cb.exists(subquery));

            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("objectTypeName").as(String.class)), "%" + keyword + "%");
                Predicate labelLike = cb.like(root.get("objectTypeLabel").as(String.class), "%" + keyword + "%");

                Subquery<OntologyObjectTypeAttributePo> subAttributeQuery = query.subquery(OntologyObjectTypeAttributePo.class);
                Root<OntologyObjectTypeAttributePo> objectTypeAttributeRoot = subAttributeQuery.from(OntologyObjectTypeAttributePo.class);
                subAttributeQuery.select(objectTypeAttributeRoot)
                        .where(
                                cb.equal(objectTypeAttributeRoot.get("objectTypeId"), root.get("objectTypeId")),
                                cb.like(cb.lower(objectTypeAttributeRoot.get("attributeName").as(String.class)), "%" + keyword + "%")
                        );

                predicates.add(cb.or(nameLike, labelLike, cb.exists(subAttributeQuery)));
            }

            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        Map<String, OntologyDto> ontologyDtoMap = new HashMap<>();
        for (OntologyPo ontologyPo : ontologyRepository.findAll()) {
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            ontologyDtoMap.put(ontologyPo.getId(), ontologyDto);
        }

        final List<OntologyObjectTypeExploreDto> collect = objectTypeHisPoPage.getContent().stream().map(objectTypeHisPo -> {
            OntologyObjectTypeExploreDto typeExploreDto = new OntologyObjectTypeExploreDto();
            BeanUtils.copyProperties(objectTypeHisPo, typeExploreDto);
            typeExploreDto.setId(objectTypeHisPo.getObjectTypeId());
            typeExploreDto.setOntology(ontologyDtoMap.get(objectTypeHisPo.getOntologyId()));
            // 每个对象类型还需要获取实例数
            typeExploreDto.setInstanceNum(20L);
            return typeExploreDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, objectTypeHisPoPage.getPageable(), objectTypeHisPoPage.getTotalElements());
    }

    public Object exploreDetail(String objectTypeId) {
        // 对象类型详情
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(objectTypeId).orElseThrow(() -> new RuntimeException("对象类型不存在"));
        OntologyObjectTypeExploreDto exploreDto = new OntologyObjectTypeExploreDto();
        BeanUtils.copyProperties(objectTypePo, exploreDto);

        // 本体详情
        exploreDto.setOntology(findOntologyById(objectTypePo.getOntologyId()));
        // 对象类型属性
        exploreDto.setAttributes(findAttributeByObjectTypeId(objectTypeId));
        // 关联对象类型
        exploreDto.setLinkObjectTypes(findLinkObjectTypes(objectTypeId));

        return exploreDto;
    }

    public Object summary(ObjectTypeExploreVo exploreVo) {
        String attributeId = exploreVo.getAttributeId();
        if (StringUtils.isBlank(attributeId)) {
            throw new RuntimeException("属性ID不能为空");
        }
        String objectTypeId = exploreVo.getObjectTypeId();
        JSONArray queryArray = JSON.parseArray(exploreVo.getQuery());
        OntologyObjectTypeAttributePo attributePo = objectTypeAttributeRepository.findById(attributeId).orElseThrow(() -> new RuntimeException("对象类型属性不存在"));
        String fieldName = attributePo.getFieldName();

        // 如果没有传对象类型ID，根据属性ID查询
        if (StringUtils.isBlank(objectTypeId)) {
            objectTypeId = attributePo.getObjectTypeId();
        }
        // 根据ID查询对象类型
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(objectTypeId).orElseThrow(() -> new RuntimeException("对象类型不存在"));
        String tableName = objectTypePo.getTableName();
        String dsId = objectTypePo.getDsId();
        String dsSchema = objectTypePo.getDsSchema();
        String sql;
        if (DsTypeEnum.CUSTOM.getValue() == objectTypePo.getDsType()) {
            // 自定义SQL语句模式
            tableName = "(" + objectTypePo.getCustomSql() + ") as tmp";
        }
        int limit = exploreVo.getLimit();
        if (exploreVo.isTitle()) {
            limit = 20;
            sql = String.format("select %s from %s", fieldName, tableName);
        } else {
            if (queryArray != null && !queryArray.isEmpty()) {
                List<String> condition = new ArrayList<>();
                for (int i = 0; i < queryArray.size(); i++) {
                    JSONObject jsonObject = queryArray.getJSONObject(i);
                    String attirbuteId = jsonObject.getString("attributeId");
                    String keyword = jsonObject.getString("keyword");
                    OntologyObjectTypeAttributePo po = objectTypeAttributeRepository.findById(attirbuteId).orElse(null);
                    if (po != null) {
                        String fieldType = po.getFieldType();
                        // 根据属性类型决定查询条件：int和decimal使用等号，其他类型使用like
                        if (FieldTypeEnum.INT.getType().equals(fieldType) || FieldTypeEnum.DECIMAL.getType().equals(fieldType)) {
                            condition.add(po.getFieldName() + " = " + keyword);
                        } else {
                            condition.add(po.getFieldName() + " like '%" + keyword + "%'");
                        }
                    }
                }
                if (!condition.isEmpty()) {
                    sql = String.format("select %s, count(*) as cnt from %s where %s group by %s order by cnt desc, %s asc", fieldName, tableName, String.join(" and ", condition), fieldName, fieldName);
                } else {
                    sql = String.format("select %s, count(*) as cnt from %s group by %s order by cnt desc, %s asc", fieldName, tableName, fieldName, fieldName);
                }
            } else {
                sql = String.format("select %s, count(*) as cnt from %s group by %s order by cnt desc, %s asc", fieldName, tableName, fieldName, fieldName);
            }
        }

        // 组装好查询 SQL 语句，调用 dataps 应用数据查询接口获取
        Response<List<Map<String, Object>>> result = datasourceService.executeSql(dsId, dsSchema, sql, limit);
        List<Map<String, Object>> summaryList = new ArrayList<>();
        if (result.isSuccess()) {
            List<Map<String, Object>> resultList = result.getData();
            if (!resultList.isEmpty()) {
                Map<String, Object> resultMap = resultList.get(0);
                List<Map<String, Object>> datas = (List<Map<String, Object>>) resultMap.get("datas");
                if (datas == null) {
                    return summaryList;
                }
                summaryList = datas.stream().map(originMap -> originMap.entrySet()
                        .stream()
                        .collect(Collectors.toMap(
                                entry -> {
                                    if ("cnt".equalsIgnoreCase(entry.getKey())) {
                                        return "cnt";
                                    } else {
                                        return "value";
                                    }
                                },
                                entry -> {
                                    if (entry.getValue() == null) {
                                        return "<null>";
                                    } else {
                                        return entry.getValue();
                                    }
                                })
                        )).collect(Collectors.toList());
            }
        } else {
            throw new RuntimeException(result.getMessage());
        }
        return summaryList;
    }

    public Object preview(ObjectTypeExploreVo explorevo) {
        String objectTypeId = explorevo.getObjectTypeId();
        if (StringUtils.isBlank(objectTypeId)) {
            throw new RuntimeException("对象类型ID不能为空");
        }
        OntologyObjectTypePo objectTypePo = objectTypeRepository.findById(objectTypeId).orElseThrow(() -> new RuntimeException("对象类型不存在"));
        String sql = null;
        if (DsTypeEnum.NORMAL.equals(objectTypePo.getDsType().intValue())) {
            List<OntologyObjectTypeAttributePo> attributePoList = objectTypeAttributeRepository.findAvaliableByTypeId(objectTypeId);
            if (attributePoList.isEmpty()) {
                throw new RuntimeException("对象类型属性为空");
            }
            List<String> fieldNameList = attributePoList.stream()
                    .map(OntologyObjectTypeAttributePo::getFieldName)
                    .filter(StringUtils::isNotBlank)
                    .collect(Collectors.toList());
            if (fieldNameList.isEmpty()) {
                throw new RuntimeException("对象类型属性未关联字段");
            }

            String tableName = objectTypePo.getTableName();
            sql = String.format("select %s from %s ", String.join(",", fieldNameList), tableName);
        } else {
            sql = objectTypePo.getCustomSql();
        }

        String dsId = objectTypePo.getDsId();
        String dsSchema = objectTypePo.getDsSchema();
        Response<List<Map<String, Object>>> result = datasourceService.executeSql(dsId, dsSchema, sql, 1000);
        if (result.isSuccess()) {
            List<Map<String, Object>> resultList = result.getData();
            if (!resultList.isEmpty()) {
                return resultList.get(0);
            }
        } else {
            throw new RuntimeException(result.getMessage());
        }
        return null;
    }

    private Map<String, Object> validateSql(ObjectTypeExploreVo exploreVo) throws Exception {
        Response<List<Map<String, Object>>> result = datasourceService.executeSql(exploreVo.getDsId(),
                exploreVo.getDsSchema(),
                exploreVo.getCustomSql(),
                1000);
        if (result.isSuccess()) {
            List<Map<String, Object>> resultList = result.getData();
            if (!resultList.isEmpty()) {
                return resultList.get(0);
            }
        } else {
            throw new Exception(result.getMessage());
        }

        throw new Exception("sql执行响应为空");
    }

    public ParseSqlResultDto parseCustomSql(ObjectTypeExploreVo exploreVo) {
        ParseSqlResultDto parseSqlResult = new ParseSqlResultDto();
        try {
            parseSqlResult.setCustomSql(exploreVo.getCustomSql());
            MySqlStatementParser parser = new MySqlStatementParser(exploreVo.getCustomSql());
            List<SQLStatement> statementList = parser.parseStatementList();
            if (statementList.size() > 1) {
                throw new Exception("只支持单个select查询");
            }

            SQLStatement sqlStatement = statementList.get(0);

            if (!(sqlStatement instanceof SQLSelectStatement)) {
                throw new Exception("只支持简单的select查询");
            }

            SQLSelectStatement selectStatement = (SQLSelectStatement) sqlStatement;
            SQLSelectQuery query = selectStatement.getSelect().getQuery();
            if (query instanceof SQLSelectQueryBlock) {
                SQLSelectQueryBlock select = (SQLSelectQueryBlock) query;
                List<SQLSelectItem> selectItemList = select.getSelectList();

                if (select.getFrom() instanceof SQLExprTableSource) {
                    SQLExprTableSource tableSource = (SQLExprTableSource)select.getFrom();
                    if (null == tableSource.getSchema()) {
                        String replacedSql = StringUtils.replaceOnce(
                                StringUtils.reverse(exploreVo.getCustomSql()),
                                StringUtils.reverse(tableSource.getTableName()),
                                StringUtils.reverse(String.format("%s.%s", exploreVo.getDsSchema(), tableSource.getTableName()))
                        );

                        parseSqlResult.setCustomSql(StringUtils.reverse(replacedSql));
                    }
                    parseSqlResult.setTableName(tableSource.getTableName());
                    Map<String, OntologyObjectCustomAttributeDto> metaInfoMap = getMetaInfo(exploreVo.getWorkspaceId(),
                            exploreVo.getDsId(),
                            exploreVo.getDsSchema(),
                            tableSource.getTableName());

                    List<OntologyObjectCustomAttributeDto> attributeList = new ArrayList<>();
                    for (SQLSelectItem item : selectItemList) {
                        OntologyObjectCustomAttributeDto customAttribute = new OntologyObjectCustomAttributeDto();
                        SQLExpr expr = item.getExpr();
                        if (expr instanceof SQLIdentifierExpr) {
                            SQLIdentifierExpr identifierExpr = (SQLIdentifierExpr)expr;
                            String aliasColumn = (null == item.getAlias()) ? identifierExpr.getName() : item.getAlias();
                            customAttribute = metaInfoMap.get(identifierExpr.getName());
                            if (null == customAttribute) {
                                throw new Exception(String.format("字段%s不存在", identifierExpr.getName()));
                            }
                            customAttribute.setAttributeName(aliasColumn);
                        } else if(expr instanceof SQLPropertyExpr) {
                            SQLPropertyExpr propertyExpr = (SQLPropertyExpr)expr;
                            String aliasColumn = (null == item.getAlias()) ? propertyExpr.getName() : item.getAlias();
                            customAttribute = metaInfoMap.get(propertyExpr.getName());
                            if (null == customAttribute) {
                                throw new Exception(String.format("字段%s不存在", propertyExpr.getName()));
                            }
                            customAttribute.setAttributeName(aliasColumn);
                        } else if (expr instanceof SQLAllColumnExpr) {
                            attributeList.addAll(metaInfoMap.values());
                            continue;
                        } else if(expr instanceof SQLMethodInvokeExpr) {
                            if (null == item.getAlias()) {
                                throw new Exception("函数表达式字段需要提供别名");
                            }

                            customAttribute.setAttributeName(item.getAlias());
                        } else {
                            throw new Exception("不支持表达式" + expr.toString());
                        }

                        attributeList.add(customAttribute);
                    }

                    // 验证自定义sql是否可执行
                    if(exploreVo.isCheck()) {
                        Map<String, Object> resultMap = validateSql(exploreVo);
                        if (!Boolean.valueOf(resultMap.get("success").toString())) {
                            throw new Exception(resultMap.get("msg").toString());
                        }
                    }

                    parseSqlResult.setAttributeList(attributeList);
                    parseSqlResult.setStatus(true);
                } else {
                    // SQLSubqueryTableSource
                    // SQLJoinTableSource
                    throw new Exception("不支持join或嵌套之类的复杂查询");
                }
            } else {
                // SQLUnionQuery
                throw new Exception("不支持union之类的复杂查询");
            }
        } catch (Exception e) {
            parseSqlResult.setStatus(false);
            parseSqlResult.setMessage(e.getMessage());
        }

        return parseSqlResult;
    }

    private Map<String, OntologyObjectCustomAttributeDto> getMetaInfo(String teamName, String dsId, String dsSchema, String tableName) {
        DatasourceVo datasourceVo = new DatasourceVo();
        datasourceVo.setId(dsId);
        datasourceVo.setSchema(dsSchema);
        datasourceVo.setTableName(tableName);
        Map<String, Object> metaInfoMap = (Map<String, Object>)datasourceService.tableInfos(teamName, datasourceVo);
        Map<String, Object> columnsMap = (Map<String, Object>)metaInfoMap.get("columns");
        List<Map<String, String>> columnList = (List<Map<String, String>>)columnsMap.get("datas");

        Map<String, OntologyObjectCustomAttributeDto> resultMap = new HashMap<>();
        for(Map<String, String> colMap : columnList) {
            OntologyObjectCustomAttributeDto attributeDto = new OntologyObjectCustomAttributeDto();
            attributeDto.setAttributeName(colMap.get("COLUMN_NAME"));
            attributeDto.setAttributeType(colMap.get("DATA_TYPE"));
            attributeDto.setAttributeLabel(colMap.get("COMMENTS"));
            attributeDto.setAttributeDesc(colMap.get("COMMENTS"));

            resultMap.put(attributeDto.getAttributeName(), attributeDto);
        }

        return resultMap;
    }

    private OntologyDto findOntologyById(String ontologyId) {
        OntologyPo ontologyPo = ontologyRepository.findById(ontologyId).orElse(null);
        if (ontologyPo != null) {
            OntologyDto ontologyDto = new OntologyDto();
            BeanUtils.copyProperties(ontologyPo, ontologyDto);
            return ontologyDto;
        }
        return null;
    }

    private List<OntologyObjectTypeAttributeDto> findAttributeByObjectTypeId(String objectTypeId) {
        List<OntologyObjectTypeAttributePo> attributePoList = objectTypeAttributeRepository.findAvaliableByTypeId(objectTypeId);
        return attributePoList.stream()
                .map(po -> {
                    OntologyObjectTypeAttributeDto dto = new OntologyObjectTypeAttributeDto();
                    BeanUtils.copyProperties(po, dto);
                    return dto;
                }).collect(Collectors.toList());
    }

    private List<OntologyObjectTypeExploreDto> findLinkObjectTypes(String objectTypeId) {
        String sql = "select p from OntologyObjectTypePo p left join OntologyLinkTypePo lt on lt.targetObjectTypeId = p.id where lt.sourceObjectTypeId = :objectTypeId ";
        String sql2 = " select p from OntologyObjectTypePo p left join OntologyLinkTypePo lt on lt.sourceObjectTypeId = p.id where lt.targetObjectTypeId = :objectTypeId ";
        TypedQuery<OntologyObjectTypePo> query = SpringJdbcUtil.getEntityManager().createQuery(sql, OntologyObjectTypePo.class);
        TypedQuery<OntologyObjectTypePo> query2 = SpringJdbcUtil.getEntityManager().createQuery(sql2, OntologyObjectTypePo.class);
        query.setParameter("objectTypeId", objectTypeId);
        query2.setParameter("objectTypeId", objectTypeId);
        List<OntologyObjectTypePo> resultList = query.getResultList();
        List<OntologyObjectTypePo> resultList2 = query2.getResultList();

        List<OntologyObjectTypeExploreDto> result = new ArrayList<>();
        for (OntologyObjectTypePo po : resultList) {
            OntologyObjectTypeExploreDto dto = new OntologyObjectTypeExploreDto();
            BeanUtils.copyProperties(po, dto);
            result.add(dto);
        }
        for (OntologyObjectTypePo po : resultList2) {
            OntologyObjectTypeExploreDto dto = new OntologyObjectTypeExploreDto();
            BeanUtils.copyProperties(po, dto);
            result.add(dto);
        }
        return result;
    }
}

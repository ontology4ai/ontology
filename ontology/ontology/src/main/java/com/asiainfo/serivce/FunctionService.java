package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.ResponseCodeEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.CodeRepoDto;
import com.asiainfo.dto.FunctionDto;
import com.asiainfo.dto.FunctionViewDto;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.response.CommonResponse;
import com.asiainfo.modo.app.usersystem.user.ModoUser;
import com.asiainfo.po.OntologyCodeRepoPo;
import com.asiainfo.po.OntologyFunctionPo;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.repo.OntologyObjectTypeFunctionRepository;
import com.asiainfo.repo.OntologyRepository;
import com.asiainfo.vo.search.CodeRepoSearchVo;
import com.asiainfo.vo.search.FunctionSearchVo;
import io.github.suanchou.utils.JsonUtil;
import io.github.suanchou.utils.StringUtil;
import io.github.suanchou.web.Response;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @Author luchao
 * @Date 2025/9/18
 * @Description
 */

@Service
@Slf4j
public class FunctionService {
    @Autowired
    private DataosFeign dataosFeign;
    @Autowired
    private OntologyObjectTypeFunctionRepository functionRepository;
    @Autowired
    private OntologyRepository ontologyRepository;

    @Autowired
    EntityManager entityManager;
    public Object findAll(FunctionSearchVo searchVo) {

        String jpql = "select new com.asiainfo.dto.FunctionDto(f.name, o.ontologyName) from OntologyFunctionPo f join OntologyPo o on f.ontologyId = o.id " +
                "where f.syncStatus <=3 and f.status = 1 and o.syncStatus <= 3 and o.status = 1";
        TypedQuery<FunctionDto> query = entityManager.createQuery(jpql, FunctionDto.class);

        List<FunctionDto> resultList = query.getResultList();

        return resultList;
    }

    @Transactional
    public boolean publish(String ontologyId, String userId) {
        OntologyPo ontologyPo = ontologyRepository.findById(ontologyId).orElseThrow(() -> new RuntimeException("本体不存在"));
        CommonResponse response = dataosFeign.registerFunction(ontologyPo.getOntologyName());
        if (ResponseCodeEnum.FAILURE.getCode().equals(response.getCode())) {
            throw new RuntimeException(response.getMessage());
        }
        Map<String, Object> data = response.getData();
        if (MapUtils.isEmpty(data)) {
            log.warn("同步函数接口返回数据为空");
            return true;
        }
        List<Map<String, Object>> resultList = (List<Map<String, Object>>) data.get("registered");
        if (resultList != null && resultList.size() > 0) {
            for (Map<String, Object> map : resultList) {
                String name = MapUtils.getString(map, "name");
                List<OntologyFunctionPo> functionPoList = functionRepository.findByNameAndOntologyId(name, ontologyId);
                if (functionPoList != null && functionPoList.size() > 0) {
                    for (OntologyFunctionPo functionPo : functionPoList) {
                        functionPo.setSyncStatus(ChangeStatusEnum.DELETED.getCode());
                        functionRepository.save(functionPo);
                    }
                }

                OntologyFunctionPo functionPo = new OntologyFunctionPo();
                functionPo.setId(StringUtil.genUuid(32));
                functionPo.setName(MapUtils.getString(map, "name"));
                functionPo.setFunctionDesc(MapUtils.getString(map, "desc"));
                functionPo.setInputParam(JsonUtil.getInstance().write(map.get("signature")));
                functionPo.setOntologyId(ontologyId);
                functionPo.setStatus(StatusEnum.ENABLED.getCode());
                functionPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());
                functionPo.setOwnerId(userId);
                functionRepository.save(functionPo);
            }
        }

        return true;
    }

    public Object list(FunctionSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyFunctionPo> functionPoList = functionRepository.findAll((Specification<OntologyFunctionPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getOntologyId())) {
                predicates.add(cb.equal(root.get("ontologyId"), searchVo.getOntologyId()));
            }
            if(StringUtils.isNotBlank(searchVo.getOwnerId())) {
                predicates.add(cb.equal(root.get("ownerId").as(String.class), searchVo.getOwnerId()));
            }
            if(searchVo.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            predicates.add(cb.lt(root.get("syncStatus").as(Integer.class), ChangeStatusEnum.DELETED.getCode()));
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));
            return query.getRestriction();

        }, request);

        final List<FunctionViewDto> collect = functionPoList.getContent().stream().map(functionPo -> {
            FunctionViewDto functionDto = new FunctionViewDto();
            BeanUtils.copyProperties(functionPo, functionDto);
            return functionDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, functionPoList.getPageable(), functionPoList.getTotalElements());
    }

    public FunctionViewDto view(String id) {
        OntologyFunctionPo functionPo = functionRepository.findById(id).orElseThrow(() -> new RuntimeException("函数不存在"));
        FunctionViewDto functionViewDto = new FunctionViewDto();
        BeanUtils.copyProperties(functionPo, functionViewDto);
        return functionViewDto;
    }
}

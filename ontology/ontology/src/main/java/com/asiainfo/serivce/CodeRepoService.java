package com.asiainfo.serivce;

import com.asiainfo.common.ChangeStatusEnum;
import com.asiainfo.common.StatusEnum;
import com.asiainfo.dto.CodeRepoDto;
import com.asiainfo.dto.OntologyDto;
import com.asiainfo.dto.OntologyObjectTypeGroupDto;
import com.asiainfo.dto.OntologyObjectTypeListDto;
import com.asiainfo.modo.app.usersystem.user.ModoUser;
import com.asiainfo.modo.app.usersystem.user.ModoUserRepo;
import com.asiainfo.po.OntologyCodeRepoPo;
import com.asiainfo.po.OntologyObjectTypeGroupPo;
import com.asiainfo.po.OntologyPo;
import com.asiainfo.repo.OntologyCodeRepoRepository;
import com.asiainfo.repo.OntologyRepository;
import com.asiainfo.vo.operation.CodeRepoVo;
import com.asiainfo.vo.search.CodeRepoSearchVo;
import io.github.suanchou.utils.StringUtil;
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

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 *
 *
 * @author hulin
 * @since 2025-09-18
 */
@Service
public class CodeRepoService {
    @Autowired
    private OntologyCodeRepoRepository codeRepoRepository;
    @Autowired
    private ModoUserRepo modoUserRepo;
    @Autowired
    private OntologyRepository ontologyRepository;

    public Object list(CodeRepoSearchVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "lastUpdate");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyCodeRepoPo> codeRepoPoList = codeRepoRepository.findAll((Specification<OntologyCodeRepoPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.isNotBlank(searchVo.getKeyword())) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate nameLike = cb.like(cb.lower(root.get("repoName").as(String.class)), "%" + keyword + "%");
                predicates.add(nameLike);
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

        List<ModoUser> all = modoUserRepo.findAll();
        Map<String, String> userMap = new HashMap<>();
        for (ModoUser modoUser : all) {
            userMap.put(modoUser.getUserId(), modoUser.getUserName());
        }

        List<OntologyPo> ontologyPoList = ontologyRepository.findAll();
        Map<String, OntologyPo> ontologyMap = new HashMap<>();
        for (OntologyPo ontologyPo : ontologyPoList) {
            ontologyMap.put(ontologyPo.getId(), ontologyPo);
        }

        final List<CodeRepoDto> collect = codeRepoPoList.getContent().stream().map(codeRepoPo -> {
            CodeRepoDto codeRepoDto = new CodeRepoDto();
            BeanUtils.copyProperties(codeRepoPo, codeRepoDto);
            codeRepoDto.setOwner(userMap.get(codeRepoPo.getOwnerId()));
            OntologyPo ontologyPo = ontologyMap.get(codeRepoPo.getOntologyId());
            if (ontologyPo != null) {
                codeRepoDto.setOntologyId(ontologyPo.getId());
                codeRepoDto.setOntologyName(ontologyPo.getOntologyName());
                codeRepoDto.setOntologyLabel(ontologyPo.getOntologyLabel());
                codeRepoDto.setCodeUrl("/?folder=/home/coder/code_gen/core/ontology/" + ontologyPo.getOntologyName());
            }
            return codeRepoDto;
        }).collect(Collectors.toList());
        return new PageImpl<>(collect, codeRepoPoList.getPageable(), codeRepoPoList.getTotalElements());
    }

    @Transactional
    public boolean save(CodeRepoVo codeRepoVo) {
        OntologyCodeRepoPo codeRepoPo = new OntologyCodeRepoPo();
        BeanUtils.copyProperties(codeRepoVo, codeRepoPo);
        codeRepoPo.setId(StringUtil.genUuid(32));
        codeRepoPo.setStatus(StatusEnum.ENABLED.getCode());
        codeRepoPo.setSyncStatus(ChangeStatusEnum.CREATED.getCode());

        codeRepoRepository.save(codeRepoPo);

        return true;
    }
}

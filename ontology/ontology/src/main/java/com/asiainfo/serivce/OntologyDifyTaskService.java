package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.DifyTaskStatusEnum;
import com.asiainfo.common.DifyTaskTypeEnum;
import com.asiainfo.common.PromptTypeEnum;
import com.asiainfo.dto.GroupDifyTaskDto;
import com.asiainfo.dto.OntologyDifyTaskDto;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.DifyConversationRequest;
import com.asiainfo.po.OntologyDifyTaskPo;
import com.asiainfo.po.OntologyUseCasePo;
import com.asiainfo.repo.OntologyDifyTaskRepository;
import com.asiainfo.repo.OntologyPromptRepository;
import com.asiainfo.repo.OntologyUseCaseRepository;
import com.asiainfo.dto.DifyBatchTaskStatusDto;
import com.asiainfo.vo.operation.DifyChatTaskVo;
import com.asiainfo.vo.operation.DifyBatchTaskVo;
import io.github.suanchou.crypto.cipher.AesCipher;
import io.github.suanchou.utils.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OntologyDifyTaskService {
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final static String DEFAULT_SUMMARY = "未测试";

    @Autowired
    OntologyDifyTaskRepository difyTaskRepository;

    @Autowired
    OntologyUseCaseRepository useCaseRepository;

    @Autowired
    OntologyPromptRepository promptRepository;

    @Autowired
    OntologyService ontologyService;

    @Autowired
    DataosFeign dataosFeign;

    @Value("${spring.datasource.main.jdbcUrl}")
    private String url;

    @Value("${spring.datasource.main.username}")
    private String username;

    @Value("${spring.datasource.main.password}")
    private String password;

    public List<OntologyDifyTaskPo> save(DifyBatchTaskVo difyBatchTaskVo) throws Exception {
        String batchNum = StringUtil.genUuid(32);
        LocalDateTime createTime = LocalDateTime.now();
        AtomicInteger atomicInt = new AtomicInteger(0);

        List<OntologyDifyTaskPo> difyTaskPoList = difyBatchTaskVo.getCaseIdList().stream().map(caseId -> {
            OntologyDifyTaskPo difyTaskPo = new OntologyDifyTaskPo();
            difyTaskPo.setId(StringUtil.genUuid(32));
            difyTaskPo.setType(DifyTaskTypeEnum.BATCH.getValue());
            difyTaskPo.setStatus(DifyTaskStatusEnum.QUEUE.getValue());
            difyTaskPo.setExecUser(difyBatchTaskVo.getExecUser());
            difyTaskPo.setCreateTime(createTime);
            difyTaskPo.setBatchNum(batchNum);
            difyTaskPo.setBatchIndex(atomicInt.incrementAndGet());
            difyTaskPo.setCaseId(caseId);
            difyTaskPo.setExpectedResult(useCaseRepository.findExpectedById(difyTaskPo.getCaseId()));
            difyTaskPo.setQuestion(useCaseRepository.findQuestionById(caseId));
            difyTaskPo.setSummary(DEFAULT_SUMMARY);
            difyTaskPo.setPromptType(difyBatchTaskVo.getPromptType());

            return difyTaskPo;
        }).collect(Collectors.toList());

        String sql = "INSERT INTO ontology_dify_task " +
                "(id, type, batch_num, batch_idx, case_id, question, exec_user, status, create_time, prompt_type, expected_result) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(url, username, AesCipher.decrypt(password));
             PreparedStatement ps = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);  // 关闭自动提交
            for (OntologyDifyTaskPo task : difyTaskPoList) {
                ps.setString(1, task.getId());
                ps.setInt(2, task.getType());
                ps.setString(3, task.getBatchNum());
                ps.setInt(4, task.getBatchIndex());
                ps.setString(5, task.getCaseId());
                ps.setString(6, task.getQuestion());
                ps.setString(7, task.getExecUser());
                ps.setInt(8, task.getStatus());
                ps.setTimestamp(9, Timestamp.valueOf(task.getCreateTime()));
                ps.setInt(10, task.getPromptType());
                ps.setString(11, task.getExpectedResult());
                ps.addBatch();
            }
            ps.executeBatch();
            conn.commit();
        }

        return difyTaskPoList;
    }

    @Transactional
    public boolean update(DifyBatchTaskVo taskStatusVo) {
        Optional<OntologyDifyTaskPo> difyTaskOpt = difyTaskRepository.findById(taskStatusVo.getId());
        if (difyTaskOpt.isPresent()) {
            OntologyDifyTaskPo difyTaskPo = difyTaskOpt.get();
            if (StringUtils.isNotEmpty(taskStatusVo.getConversationId())) {
                difyTaskPo.setConversationId(taskStatusVo.getConversationId());
            }
            if (StringUtils.isNotEmpty(taskStatusVo.getTaskId())) {
                difyTaskPo.setTaskId(taskStatusVo.getTaskId());
            }
            if(null != taskStatusVo.getStatus()) {
                difyTaskPo.setStatus(taskStatusVo.getStatus());
            }
            if(StringUtils.isNotEmpty(taskStatusVo.getSummary())) {
                difyTaskPo.setSummary(taskStatusVo.getSummary());
            }
            if(StringUtils.isNotEmpty(taskStatusVo.getLastExecTime())) {
                difyTaskPo.setLastExecTime(toLocalDateTime(taskStatusVo.getLastExecTime()));
            }
            if(StringUtils.isNotEmpty(taskStatusVo.getLastExecResult())) {
                difyTaskPo.setLastExecResult(taskStatusVo.getLastExecResult());
            }
            if(StringUtils.isNotEmpty(taskStatusVo.getLastExecDetail())) {
                difyTaskPo.setLastExecDetail(taskStatusVo.getLastExecDetail());
            }

            difyTaskRepository.save(difyTaskPo);
        }

        return true;
    }

    private LocalDateTime toLocalDateTime(String time) {
        try {
            return LocalDateTime.parse(time, formatter);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    @Transactional
    public OntologyDifyTaskPo save(DifyChatTaskVo difyChatTaskVo) {
        OntologyDifyTaskPo difyTaskPo = new OntologyDifyTaskPo();
        BeanUtils.copyProperties(difyChatTaskVo, difyTaskPo);
        difyTaskPo.setId(StringUtil.genUuid(32));
        difyTaskPo.setBatchNum(difyTaskPo.getId());
        difyTaskPo.setBatchIndex(1);
        difyTaskPo.setType(DifyTaskTypeEnum.CHAT.getValue());
        difyTaskPo.setStatus(DifyTaskStatusEnum.RUNNING.getValue());
        difyTaskPo.setCreateTime(LocalDateTime.now());
        difyTaskPo.setLastExecTime(difyTaskPo.getCreateTime());

        return difyTaskRepository.save(difyTaskPo);
    }

    public DifyBatchTaskStatusDto status(String batchNum) {
        List<OntologyDifyTaskPo> difyTaskPoList = difyTaskRepository.findByBatchNum(batchNum);
        DifyBatchTaskStatusDto batchTaskStatusDto = new DifyBatchTaskStatusDto();
        batchTaskStatusDto.setBatchNum(batchNum);
        batchTaskStatusDto.setTotal(difyTaskPoList.size());
        batchTaskStatusDto.setFinished(0);
        int count = 0;
        int finished = 0;
        for (OntologyDifyTaskPo difyTaskPo : difyTaskPoList) {
            if (difyTaskPo.getStatus().equals(DifyTaskStatusEnum.FINISHED.getValue()) ||
                    difyTaskPo.getStatus().equals(DifyTaskStatusEnum.ERROE.getValue()) ) {
                finished++;
                count++;
            }

            if (difyTaskPo.getStatus().equals(DifyTaskStatusEnum.ABORTED.getValue())) {
                count++;
            }
        }

        batchTaskStatusDto.setFinished(finished);
        boolean isFinished = batchTaskStatusDto.getTotal().equals(count);
        batchTaskStatusDto.setIsFinished(isFinished);

        return batchTaskStatusDto;
    }

    public Page<GroupDifyTaskDto> exploreHisTask(DifyBatchTaskVo searchVo) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);
        // 需要根据提示词模式进行区分
        Page<GroupDifyTaskDto> difyTaskPage = difyTaskRepository.findBatchNumByUser(searchVo.getExecUser(), searchVo.getPromptType(), request);

        final List<GroupDifyTaskDto> collect = difyTaskPage.getContent().stream().map(difyTaskDto -> {
            Optional<OntologyDifyTaskPo> difyTaskOpt = difyTaskRepository.findTopByBatchNum(difyTaskDto.getBatchNum());
            if (difyTaskOpt.isPresent()) {
                BeanUtils.copyProperties(difyTaskOpt.get(), difyTaskDto);
            }

            difyTaskDto.setCaseTotal(difyTaskRepository.findCaseTotalByBatchNum(difyTaskDto.getBatchNum()));

            return difyTaskDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, difyTaskPage.getPageable(), difyTaskPage.getTotalElements());
    }

    public boolean deleteHisTask(DifyBatchTaskVo searchVo) {
        for(String batchNum : searchVo.getBatchNumList()) {
            List<OntologyDifyTaskPo> difyTaskPoList = difyTaskRepository.findByBatchNum(batchNum);
            for (OntologyDifyTaskPo difyTaskPo : difyTaskPoList) {
                if (null != difyTaskPo.getConversationId()) {
                    CompletableFuture.runAsync(() -> {
                        try {
                            // 删除minio会话提示词
                            ontologyService.deleteFromMinio(difyTaskPo.getConversationId());
                            // 删除历史记录
                            DifyConversationRequest conversationRequest = new DifyConversationRequest();
                            conversationRequest.setUser(searchVo.getExecUser());
                            conversationRequest.setConversation_id(difyTaskPo.getConversationId());
                            conversationRequest.setAgent_mode(searchVo.getPromptType());
                            dataosFeign.deleteConversationById(conversationRequest);
                        } catch (Exception e) {
                            log.error(e.getMessage());
                        }
                    });
                }

                difyTaskRepository.deleteById(difyTaskPo.getId());
            }
        }

        return true;
    }

    public Page<OntologyDifyTaskDto> exploreBatchTask(DifyBatchTaskVo searchVo) {
        Sort sort = Sort.by(Sort.Order.asc("batchIndex"));
        // 排序字段必须是OntologyDifyTaskPo原始表字段
        if (null != searchVo.getSortColumn()) {
            if ("ASC".equalsIgnoreCase(searchVo.getSortOrder())) {
                sort = Sort.by(Sort.Order.asc(searchVo.getSortColumn()));
            } else {
                sort = Sort.by(Sort.Order.desc(searchVo.getSortColumn()));
            }
        }
        PageRequest request = PageRequest.of(Math.max(searchVo.getPage() - 1, 0), searchVo.getLimit() > 0 ? searchVo.getLimit() : 10, sort);

        Page<OntologyDifyTaskPo> difyTaskPage = difyTaskRepository.findAll((Specification<OntologyDifyTaskPo>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("batchNum").as(String.class), searchVo.getBatchNum()));
            if (null != searchVo.getSummaryList() && !searchVo.getSummaryList().isEmpty()) {
                predicates.add(root.get("summary").in(searchVo.getSummaryList()));
            }
            if(null != searchVo.getSummary()) {
                predicates.add(cb.equal(root.get("summary").as(String.class), searchVo.getSummary()));
            }
            if(null != searchVo.getStatus()) {
                predicates.add(cb.equal(root.get("status").as(Integer.class), searchVo.getStatus()));
            }
            if (null != searchVo.getKeyword()) {
                String keyword = searchVo.getKeyword().toLowerCase();
                Predicate idLike = cb.like(cb.lower(root.get("id").as(String.class)), "%" + keyword + "%");
                Predicate questionLike = cb.like(cb.lower(root.get("question").as(String.class)), "%" + keyword + "%");
                Predicate expectedLike = cb.like(cb.lower(root.get("expectedResult").as(String.class)), "%" + keyword + "%");
                predicates.add(cb.or(idLike, questionLike, expectedLike));
            }
            Predicate[] p = new Predicate[predicates.size()];
            query.where(cb.and(predicates.toArray(p)));

            return query.getRestriction();
        }, request);

        final List<OntologyDifyTaskDto> collect = difyTaskPage.getContent().stream().map(difyTaskPo -> {
            OntologyDifyTaskDto difyTaskDto = new OntologyDifyTaskDto();
            BeanUtils.copyProperties(difyTaskPo, difyTaskDto, "createTime", "lastExecTime");
            if (null != difyTaskPo.getCreateTime()) {
                difyTaskDto.setCreateTime(difyTaskPo.getCreateTime().format(formatter));
            }
            if (null != difyTaskPo.getLastExecTime()) {
                difyTaskDto.setLastExecTime(difyTaskPo.getLastExecTime().format(formatter));
            }

            // 设置对应的上次任务的信息
            OntologyDifyTaskPo lastTaskPo = findLastById(difyTaskPo);
            OntologyDifyTaskDto lastTaskDto = new OntologyDifyTaskDto();
            BeanUtils.copyProperties(lastTaskPo, lastTaskDto,"createTime", "lastExecTime");
            if (null != lastTaskPo.getCreateTime()) {
                lastTaskDto.setCreateTime(lastTaskPo.getCreateTime().format(formatter));
            }
            if (null != lastTaskPo.getLastExecTime()) {
                lastTaskDto.setLastExecTime(lastTaskPo.getLastExecTime().format(formatter));
            }
            difyTaskDto.setLastTask(lastTaskDto);

            OntologyUseCasePo useCasePo = useCaseRepository.findById(difyTaskPo.getCaseId()).orElse(null);
            if (null != useCasePo) {
                String promptName;
                if (PromptTypeEnum.NORMAL.equals(difyTaskPo.getPromptType().intValue())) {
                    promptName = promptRepository.findNameById(useCasePo.getNormalPromptId());
                } else {
                    promptName = promptRepository.findNameById(useCasePo.getOagPromptId());
                }
                difyTaskDto.setPromptName(promptName);
            }

            return difyTaskDto;
        }).collect(Collectors.toList());

        return new PageImpl<>(collect, difyTaskPage.getPageable(), difyTaskPage.getTotalElements());
    }

    public OntologyDifyTaskPo findTopByCaseId(String caseId) {
        Optional<OntologyDifyTaskPo> difyTaskOpt = difyTaskRepository.findTopByCaseId(caseId);
        if (difyTaskOpt.isPresent()) {
            return difyTaskOpt.get();
        }

        return new OntologyDifyTaskPo();
    }

    public OntologyDifyTaskDto findLastTask(String caseId, int promptType) {
        OntologyDifyTaskPo difyTaskPo = difyTaskRepository.findLastTask(caseId, promptType).orElse(null);
        if (null == difyTaskPo) {
            return new OntologyDifyTaskDto();
        }

        OntologyDifyTaskDto difyTaskDto = new OntologyDifyTaskDto();
        BeanUtils.copyProperties(difyTaskPo, difyTaskDto, "createTime", "lastExecTime");
        if (null != difyTaskPo.getCreateTime()) {
            difyTaskDto.setCreateTime(difyTaskPo.getCreateTime().format(formatter));
        }
        if (null != difyTaskPo.getLastExecTime()) {
            difyTaskDto.setLastExecTime(difyTaskPo.getLastExecTime().format(formatter));
        }

        return difyTaskDto;
    }

    public OntologyDifyTaskPo findLastById(OntologyDifyTaskPo difyTaskPo) {
        Optional<OntologyDifyTaskPo> difyTaskOpt = difyTaskRepository.findLastByCaseId(difyTaskPo.getCaseId(),
                difyTaskPo.getPromptType(),
                difyTaskPo.getCreateTime().format(formatter));
        if (difyTaskOpt.isPresent()) {
            return difyTaskOpt.get();
        }

        return new OntologyDifyTaskPo();
    }

    public Object getDetailById(String id) {
        String result = difyTaskRepository.findDetailById(id);
        JSONObject object = new JSONObject();
        object.put("lastExecDetail", result);
        return object;
    }
}

package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.common.DifyTaskStatusEnum;
import com.asiainfo.feign.DataosFeign;
import com.asiainfo.feign.request.DifyBatchRequest;
import com.asiainfo.feign.response.CommonDifyResponse;
import com.asiainfo.po.OntologyDifyTaskPo;
import com.asiainfo.repo.OntologyDifyTaskRepository;
import com.asiainfo.vo.operation.DifyBatchTaskVo;
import io.github.suanchou.crypto.cipher.AesCipher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class OntologyDifyBatchService {
    private final static String DEFAULT_SUMMARY = "未测试";

    @Autowired
    OntologyDifyTaskRepository difyTaskRepository;

    @Autowired
    OntologyDifyTaskService difyTaskService;

    @Autowired
    DataosFeign dataosFeign;

    @Value("${spring.datasource.main.jdbcUrl}")
    private String url;

    @Value("${spring.datasource.main.username}")
    private String username;

    @Value("${spring.datasource.main.password}")
    private String password;

    public Object saveAndStart(DifyBatchTaskVo difyBatchTaskVo) throws Exception {
        List<OntologyDifyTaskPo> result = difyTaskService.save(difyBatchTaskVo);

        // 为保证数据已入库,直接查询任务id(强制刷新)
        List<String> idList = new ArrayList<>();
        try (Connection conn = DriverManager.getConnection(url, username, AesCipher.decrypt(password));
             PreparedStatement ps = conn.prepareStatement("SELECT id FROM ontology_dify_task where batch_num = ?")) {
            ps.setString(1, result.get(0).getBatchNum());
            ResultSet resultSet = ps.executeQuery();
            while (resultSet.next()) {
                idList.add(resultSet.getString("id"));
            }
        }

        CommonDifyResponse response = runBatchTask(idList, false);
        if ("failed".equals(response.getStatus()) || "500".equals(response.getCode())) {
            for (OntologyDifyTaskPo difyTaskPo : result) {
                difyTaskPo.setStatus(DifyTaskStatusEnum.ERROE.getValue());
                difyTaskPo.setLastExecResult(response.getMessage());
            }
            difyTaskRepository.saveAllAndFlush(result);
        }

        JSONObject object = new JSONObject();
        object.put("batchNum", result.get(0).getBatchNum());
        object.put("apiResponse", response);

        return object;
    }

    public CommonDifyResponse runBatchTask(List<String> idList, boolean isRestart) {
        log.debug("idList " + String.join(",", idList));
        if (isRestart) {
            resetBatchTask(idList);
        }

        DifyBatchRequest batchRequest = new DifyBatchRequest();
        batchRequest.setTask_ids(idList);
        return dataosFeign.startBatchWithDify(batchRequest);
    }

    public CommonDifyResponse stop(DifyBatchTaskVo difyBatchTaskVo) {
        List<String> idsList = difyTaskRepository.findIdsByBatchNum(difyBatchTaskVo.getBatchNum());
        DifyBatchRequest batchRequest = new DifyBatchRequest();
        batchRequest.setTask_ids(idsList);
        return dataosFeign.stopBatchWithDify(batchRequest);
    }

    private void resetBatchTask(List<String> idList) {
        List<OntologyDifyTaskPo> list = new ArrayList<>();
        for(String id : idList) {
            Optional<OntologyDifyTaskPo> difyTaskOpt = difyTaskRepository.findById(id);
            if (difyTaskOpt.isPresent()) {
                OntologyDifyTaskPo difyTaskPo = difyTaskOpt.get();
                difyTaskPo.setConversationId(null);
                difyTaskPo.setTaskId(null);
                difyTaskPo.setLastExecResult(null);
                difyTaskPo.setLastExecDetail(null);
                difyTaskPo.setStatus(DifyTaskStatusEnum.QUEUE.getValue());
                difyTaskPo.setSummary(DEFAULT_SUMMARY);
                list.add(difyTaskPo);
            }
        }

        if (!list.isEmpty()) {
            difyTaskRepository.saveAllAndFlush(list);
        }
    }
}

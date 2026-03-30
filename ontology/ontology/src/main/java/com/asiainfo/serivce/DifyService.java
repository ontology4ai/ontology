package com.asiainfo.serivce;

import com.alibaba.fastjson.JSONObject;
import com.asiainfo.dto.DifyGraphDto;
import com.asiainfo.po.*;
import com.asiainfo.repo.DifyGraphRepository;
import com.asiainfo.vo.operation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DifyService {
    @Autowired
    DifyGraphRepository difyGraphRepository;

    @Transactional
    public boolean save(DifyGraphVo difyGraphVo) throws Exception {

        DifyGraphPo difyGraphPo = new DifyGraphPo();
        difyGraphPo.setId(difyGraphVo.getTaskId());
        difyGraphPo.setConversationId(difyGraphVo.getConversationId());
        ObjectMapper objectMapper = new ObjectMapper();
        difyGraphPo.setGraph(objectMapper.writeValueAsString(difyGraphVo.getData()));
        difyGraphRepository.save(difyGraphPo);
        return true;
    }

    public List<DifyGraphDto> findByConversationId(String conversationId) {
        List<DifyGraphPo> difyGraphPo = difyGraphRepository.findByConversationId(conversationId);

        return difyGraphPo.stream().map(graphPo -> {
            DifyGraphDto graphDto = new DifyGraphDto();
            graphDto.setTaskId(graphPo.getId());
            graphDto.setConversationId(graphPo.getConversationId());
            graphDto.setGraph(JSONObject.parseObject(graphPo.getGraph()));
            return graphDto;
        }).collect(Collectors.toList());
    }
}

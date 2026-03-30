package com.asiainfo.feign.request;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class DifyBatchRequest implements Serializable {
    private List<String> task_ids;
}
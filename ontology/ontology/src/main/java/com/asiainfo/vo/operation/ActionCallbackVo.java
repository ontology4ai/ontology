package com.asiainfo.vo.operation;
import com.alibaba.fastjson.JSONObject;
import lombok.Data;

@Data
public class ActionCallbackVo {
    private String task_id;

    private String status;

    private String message;

    private JSONObject data;

    private JSONObject result_json;
}

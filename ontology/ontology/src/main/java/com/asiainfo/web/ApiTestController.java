package com.asiainfo.web;

import com.asiainfo.vo.search.CustomApiRequestVo;
import com.asiainfo.vo.search.CustomApiResponseVo;
import io.github.suanchou.web.Response;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/_api/ontology/test/api")
@Slf4j
public class ApiTestController {

    @GetMapping({"/get"})
    public Response doGetApi(HttpServletRequest request, CustomApiRequestVo requestVo) {
        List<CustomApiResponse> list = new ArrayList<>();
        list.add(new CustomApiResponse("attrName", "英文名称", "String", "参数描述"));
        list.add(new CustomApiResponse("attrLabel", "中文名称", "String", "参数描述"));
        list.add(new CustomApiResponse("attrType", "字段类型", "String", "参数描述"));
        list.add(new CustomApiResponse("attrDesc", "字段描述", "String", "参数描述"));
        try {
            return Response.ok(list);
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询api异常", e.getMessage());
        }
    }

    @PostMapping({"/post"})
    public Response doPostApi(HttpServletRequest request, @RequestBody CustomApiRequestVo requestVo) {
        try {
            List<CustomApiResponseVo> list = new ArrayList<>();
            list.add(new CustomApiResponseVo("attrName", "英文名称", "String", "参数描述"));
            list.add(new CustomApiResponseVo("attrLabel", "中文名称", "String", "参数描述"));
            list.add(new CustomApiResponseVo("attrType", "字段类型", "String", "参数描述"));
            list.add(new CustomApiResponseVo("attrDesc", "字段描述", "String", "参数描述"));

            return Response.ok(list);
        } catch (Exception e) {
            log.error("",e);
            return Response.error("查询api异常", e.getMessage());
        }

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    class CustomApiResponse {
        private String columnNameInvalid;

        private String columnLabelInvalid;

        private String columnTypeInvalid;

        private String columnDescInvalid;
    }

}

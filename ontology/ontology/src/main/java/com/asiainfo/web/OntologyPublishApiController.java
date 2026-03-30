package com.asiainfo.web;

import com.asiainfo.dto.OntologyPublishApiDto;
import com.asiainfo.serivce.OntologyPublishApiService;
import com.asiainfo.vo.search.OntologyPublishApiSearchVo;
import io.github.suanchou.web.Response;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@Api(tags = "OntologyPublishApi管理")
@RestController
@RequestMapping("/_api/publishApi")
public class OntologyPublishApiController {

    @Autowired
    private OntologyPublishApiService ontologyPublishApiService;


    @ApiOperation("根据ID查询")
    @GetMapping("/list")
    public Object list(HttpServletRequest request, OntologyPublishApiSearchVo searchVo) {
        return ontologyPublishApiService.list(request, searchVo);
    }

    @ApiOperation("获取mcp服务地址")
    @GetMapping("/getMcpServer")
    public Object getMcpServer(HttpServletRequest request) {
        return Response.ok(ontologyPublishApiService.getMcpServer(request));
    }

}
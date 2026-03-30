package com.asiainfo.util;

import com.asiainfo.common.ApiMethodEnum;
import com.asiainfo.common.ApiTypeEnum;
import com.asiainfo.common.ParamMethodEnum;
import com.asiainfo.common.ParamModeEnum;
import com.asiainfo.common.ParamTypeEnum;
import com.asiainfo.vo.operation.ApiParamVo;
import com.asiainfo.vo.operation.ApiVo;

import java.util.List;

/**
 * API参数校验工具类，便于扩展和维护
 */
public class ApiValidatorUtils {

    public static void validateApi(ApiVo apiVo) throws Exception {
        if (!ApiMethodEnum.isValid(apiVo.getApiMethod())) {
            throw new Exception("请求方式只能取GET/POST/PUT");
        }
        if (!ApiTypeEnum.isValid(apiVo.getApiType())) {
            throw new Exception("API类型只能取object/logic/action");
        }
        List<ApiParamVo> params = apiVo.getParams();
        if (params != null && !params.isEmpty()) {
            validateApiParams(params);
        }
    }

    public static void validateApiParams(List<ApiParamVo> params) throws Exception {
        for (ApiParamVo param : params) {
            if (!ParamTypeEnum.isValid(param.getParamType())) {
                throw new Exception("参数类型只能取string/integer/number/boolean/array/object");
            }
            if (!ParamModeEnum.isValid(param.getParamMode())) {
                throw new Exception("类别只能取request/response");
            }
            // 如果是request，还需校验paramMethod
            if (ParamModeEnum.REQUEST.getMode().equalsIgnoreCase(param.getParamMode())
                    && !ParamMethodEnum.isValid(param.getParamMethod())) {
                throw new Exception("传入方式只能取path/query/body/header/cookie");
            }
        }
    }
}

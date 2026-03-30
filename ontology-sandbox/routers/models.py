from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel

class FunParamSpec(BaseModel):
    """Parameter spec for function generation (new schema)"""
    type: Optional[str] = None
    is_required: Optional[bool] = None
    desc: Optional[str] = ""

    class Config:
        extra = "allow"
        
class ApiParamModel(BaseModel):
    """API parameter definition model"""
    param_name: str
    param_type: str  # string/integer/number
    param_method: str  # path/query/body/header/cookie
    param_desc: Optional[str] = None
    is_required: bool = False
    default_value: Optional[str] = None
    is_builtin: bool = False  # 如果为 True，参数不会出现在函数签名中，而是直接内置在代码中
    value_source: Optional[str] = "static"  # static | util_function - 参数值来源：静态值或工具函数
    util_function_name: Optional[str] = None  # 当 value_source = util_function 时，指定工具函数名称
    util_function_params: Optional[Dict[str, Any]] = None  # 工具函数的参数映射（可选）
                                                            # 格式应与 signature_detail 一致：{param_name: {type, is_required, desc}}
                                                            # 所有参数都作为变量引用，引用前面定义的同名内置参数

class ApiInfoModel(BaseModel):
    """API information model based on ontology_api and ontology_api_param tables"""
    api_name: str
    api_desc: Optional[str] = None
    api_method: str  # GET/POST/PUT/DELETE/PATCH, etc.
    url: str
    request_params: Optional[List[ApiParamModel]] = None
    # response_params: Optional[List[ApiParamModel]] = None
    timeout: Optional[int] = 30  # Timeout in seconds for API requests (default: 30)
class GenerateFunctionRequest(BaseModel):
    """Request model for generating ontology function files"""
    ontology_name: Optional[str] = None
    used_objects: Optional[List[str]] = None
    function_name: str
    fun_params: Optional[Dict[str, Union[str, FunParamSpec]]] = None
    outputs: Optional[Dict[str, str]] = None
    fun_desc: Optional[str] = None
    file_name: Optional[str] = None
    function_label: str
    code: Optional[str] = None
    function_type: Optional[str] = "function"  # 'function' or 'api'
    api_info: Optional[ApiInfoModel] = None  # Required when function_type is 'api'
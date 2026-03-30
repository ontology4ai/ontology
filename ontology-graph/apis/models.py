from typing import List, Optional, Literal, Any, Union, Dict

from pydantic import BaseModel, Field, ConfigDict, model_validator


class ApiResponse(BaseModel):
    """Unified API response model with at least a status field."""

    model_config = ConfigDict(extra="allow")

    status: Literal["success", "failed"]
    message: Optional[str] = None
    data: Optional[Any] = None
    code: Optional[str] = None


class ExportTTLRequest(BaseModel):
    ontology_id: str = Field(..., description="本体ID（字符串）")
    object_type_id: Optional[List[str]] = Field(default=None, description="对象id")
    format: Literal["owl", "compact"] = Field(default="owl", description="导出格式: owl=标准OWL/Turtle格式, compact=超简化Markdown格式（适合大模型）")
    is_public: bool = False

class ImportOwlFromURLRequest(BaseModel):
    ontology_id: str = Field(..., description="本体ID（字符串）")
    owner_id: str = Field(..., description="拥有者ID（字符串）")
    owl_url: str = Field(..., description="OWL 文件的 URL（服务端下载后解析）")

class GetGraphDataRequest(BaseModel):
    ontology_id: str = Field(..., description="本体ID（字符串）")
    nodes_amount: int = Field(..., description="节点数量")
    node_names: Optional[List[str]] = Field(default=None, description="节点名称")
    pub_version: bool = Field(default=False, description="是否发布版本")


class MigrateOutRequest(BaseModel):
    """迁出请求模型：仅需要 ontology_id。始终按“新导出”处理，不覆盖已有目录。

    若同名目录存在，将在目录与 tar 名称后追加时间戳后缀。
    """
    ontology_id: str = Field(..., description="本体ID (ontology_manage.id)")


class MigrateInRequest(BaseModel):
    """迁入请求模型：tar 包 URL + 本体元数据覆盖参数
    
    必填参数用于区分迁入内容的归属，选填参数用于覆盖原有元数据。
    """
    tar_url: str = Field(..., description="tar 包的 URL 地址或本地路径 (http/https 或 文件路径)")
    owner_id: str = Field(..., description="所有者 ID（必填）")
    workspace_id: str = Field(..., description="工作空间 名称（必填）")
    ontology_name: Optional[str] = Field(None, description="本体名称（选填，覆盖原名称）")
    ontology_label: Optional[str] = Field(None, description="本体标签（选填，覆盖原标签）")
    ontology_desc: Optional[str] = Field(None, description="本体描述（选填，覆盖原描述）")


# ========== 新增：异步任务相关模型 ==========

class ImportTaskType(str):
    """导入任务类型常量"""
    OWL_IMPORT = "owl_import"
    CSV_IMPORT = "csv_import"


class UnifiedImportRequest(BaseModel):
    """统一的导入请求模型，支持多种导入方式"""
    
    # 允许上游（如 Java 后端）传入未定义字段：直接忽略，避免因“多余参数”触发 422
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")
    
    task_id: str = Field(..., description="任务ID（客户端传入）")
    task_type: Literal["owl_import", "csv_import"] = Field(
        ..., 
        description="导入任务类型: owl_import(OWL文件导入), csv_import(CSV/XLSX文件导入)"
    )
    ontology_id: str = Field(..., description="本体ID")
    owner_id: str = Field(..., description="拥有者ID")
    callback_url: str = Field(..., description="任务状态回调接口URL（必填）")
    
    # OWL导入相关参数
    owl_url: Optional[str] = Field(None, description="OWL文件URL（task_type=owl_import时必填）")
    
    # CSV/XLSX导入相关参数
    data_url: Optional[Union[str, Dict[str, str]]] = Field(
        None, 
        description="数据文件URL（task_type=csv_import时必填）。支持两种格式：1) 单个XLSX文件URL（字符串），文件内包含'对象信息'和'对象关系信息'两个sheet；2) 两个CSV文件的URL（JSON对象），格式：{'对象信息': 'url1', '对象关系信息': 'url2'}"
    )
    
    # 通用配置
    enable_write: bool = Field(True, description="是否写入数据库（默认True）")
    extra_params: Optional[Dict[str, Any]] = Field(None, description="额外参数（JSON格式）")
    
    @model_validator(mode="after")
    def validate_task_specific_params(self):
        """验证不同任务类型的必填参数"""
        if self.task_type == "owl_import":
            if not self.owl_url:
                raise ValueError("owl_import 任务必须提供 owl_url 参数")
        elif self.task_type == "csv_import":
            if not self.data_url:
                raise ValueError("csv_import 任务必须提供 data_url 参数")
            # 验证 data_url 格式
            if isinstance(self.data_url, dict):
                # JSON 格式：必须包含 '对象信息' 和 '对象关系信息' 两个键
                if "对象信息" not in self.data_url or "对象关系信息" not in self.data_url:
                    raise ValueError("data_url 为 JSON 格式时，必须包含 '对象信息' 和 '对象关系信息' 两个键")
            elif not isinstance(self.data_url, str):
                raise ValueError("data_url 必须是字符串（XLSX URL）或字典（两个CSV URL）")
        return self


class TaskSubmitResponse(BaseModel):
    """任务提交响应模型"""
    
    model_config = ConfigDict(extra="allow")
    
    status: Literal["success", "failed"]
    task_id: Optional[str] = Field(None, description="任务ID，用于追踪和取消任务")
    message: Optional[str] = None
    queue_position: Optional[int] = Field(None, description="队列位置（1表示正在执行，>1表示等待中）")
    tasks_ahead: Optional[int] = Field(None, description="排在前面的任务数量")
    code: Optional[str] = None


class CancelTaskRequest(BaseModel):
    """取消任务请求模型"""
    
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    
    task_id: str = Field(..., description="要取消的任务ID")
    force: bool = Field(False, description="是否强制取消（包括正在运行的任务）")


class GetTaskStatusRequest(BaseModel):
    """查询任务状态请求模型（备用，用户说不需要但保留以防万一）"""
    
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    
    task_id: str = Field(..., description="任务ID")



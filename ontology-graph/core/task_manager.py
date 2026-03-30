"""
异步任务管理器
用于管理导入任务的队列、并发控制和状态通知
"""
import asyncio
import os
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass, field
import httpx
from public.public_variable import logger


class TaskType(str, Enum):
    """任务类型"""
    OWL_IMPORT = "owl_import"


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"  # 等待中
    RUNNING = "running"  # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败
    CANCELLED = "cancelled"  # 已取消


@dataclass
class TaskInfo:
    """任务信息"""
    task_id: str
    task_type: TaskType
    status: TaskStatus
    ontology_id: str
    owner_id: str
    payload: Dict[str, Any]
    callback_url: str  # 每个任务独立的回调URL
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Any] = None
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


class ImportTaskManager:
    """导入任务管理器 - 单例模式"""
    
    _instance = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.tasks: Dict[str, TaskInfo] = {}
            self.task_queue: asyncio.Queue = asyncio.Queue()
            self.current_task: Optional[TaskInfo] = None
            self.worker_task: Optional[asyncio.Task] = None
            self.max_concurrent = 1  # 最大并发数
            self._shutdown_flag = False  # 关闭标志
            
            # 从环境变量读取回调URL，如果没有设置则使用默认值
            default_callback_url = "http://localhost:5050/api/v1/ontology/task/mock_callback"
            self.callback_url: str = os.getenv("TASK_MANAGER_CALLBACK_URL", default_callback_url)
            logger.info(f"Task manager callback URL: {self.callback_url}")
            
            self.task_handlers: Dict[TaskType, Callable] = {}
            self.initialized = True
    
    def register_handler(self, task_type: TaskType, handler: Callable):
        """注册任务处理器"""
        self.task_handlers[task_type] = handler
    
    def set_callback_url(self, url: str):
        """设置回调URL"""
        self.callback_url = url
        logger.info(f"Task callback URL set to: {url}")
    
    async def start_worker(self):
        """启动后台工作线程"""
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Task worker started")
    
    async def shutdown(self):
        """
        关闭任务管理器，清理所有资源
        这个方法应该在应用关闭时调用，以避免资源泄漏
        """
        logger.info("Shutting down task manager...")
        
        # 设置关闭标志，让工作循环退出
        self._shutdown_flag = True
        
        # 取消所有待处理的任务
        for task_id, task_info in self.tasks.items():
            if task_info.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
                task_info.cancel_event.set()
                logger.debug(f"Cancelling task {task_id}")
        
        # 等待工作线程结束（最多等待5秒）
        if self.worker_task and not self.worker_task.done():
            try:
                await asyncio.wait_for(self.worker_task, timeout=5.0)
                logger.info("Worker task finished gracefully")
            except asyncio.TimeoutError:
                logger.warning("Worker task timeout, forcing cancellation")
                self.worker_task.cancel()
                try:
                    await self.worker_task
                except asyncio.CancelledError:
                    logger.info("Worker task cancelled")
        
        # 清空队列
        queue_size = self.task_queue.qsize()
        if queue_size > 0:
            logger.info(f"Clearing {queue_size} pending tasks from queue")
            while not self.task_queue.empty():
                try:
                    self.task_queue.get_nowait()
                    self.task_queue.task_done()
                except asyncio.QueueEmpty:
                    break
        
        logger.info("Task manager shutdown complete")
    
    async def _worker_loop(self):
        """工作线程主循环"""
        logger.info("Task worker loop started")
        while not self._shutdown_flag:
            try:
                # 从队列取任务（带超时，以便检查关闭标志）
                try:
                    task_info: TaskInfo = await asyncio.wait_for(
                        self.task_queue.get(),
                        timeout=1.0  # 1秒超时，让循环可以检查 _shutdown_flag
                    )
                except asyncio.TimeoutError:
                    # 超时后继续循环，检查是否需要关闭
                    continue
                
                # 更新为运行状态
                await self._update_task_status(
                    task_info.task_id, 
                    TaskStatus.RUNNING,
                    started_at=datetime.now()
                )
                self.current_task = task_info
                
                # 通知后端任务开始执行
                await self._notify_callback(
                    task_info.task_id,
                    TaskStatus.RUNNING,
                    message="任务开始执行"
                )
                
                try:
                    # 检查任务是否已被取消
                    if task_info.cancel_event.is_set():
                        raise asyncio.CancelledError("Task was cancelled")
                    
                    # 执行任务
                    handler = self.task_handlers.get(task_info.task_type)
                    if handler is None:
                        raise ValueError(f"No handler registered for task type: {task_info.task_type}")
                    
                    # 执行处理器（传入取消事件以支持取消）
                    result = await handler(task_info)
                    
                    # 任务成功完成
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.COMPLETED,
                        finished_at=datetime.now(),
                        result=result
                    )
                    
                    # 通知后端任务完成
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.COMPLETED,
                        message="任务执行成功",
                        result=result
                    )
                    
                except asyncio.CancelledError:
                    # 任务被取消
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.CANCELLED,
                        finished_at=datetime.now(),
                        error_message="任务已被取消"
                    )
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.CANCELLED,
                        message="任务已被取消"
                    )
                    
                except Exception as e:
                    # 任务执行失败
                    error_msg = str(e)
                    logger.error(f"Task {task_info.task_id} failed: {error_msg}")
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.FAILED,
                        finished_at=datetime.now(),
                        error_message=error_msg
                    )
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.FAILED,
                        message=f"任务执行失败: {error_msg}"
                    )
                
                finally:
                    self.current_task = None
                    self.task_queue.task_done()
                    
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                await asyncio.sleep(1)  # 避免错误循环
        
        logger.info("Task worker loop stopped")
    
    async def submit_task(
        self,
        task_type: TaskType,
        ontology_id: str,
        owner_id: str,
        payload: Dict[str, Any],
        callback_url: str
    ) -> str:
        """
        提交新任务
        
        Args:
            task_type: 任务类型
            ontology_id: 本体ID
            owner_id: 拥有者ID
            payload: 任务数据
            callback_url: 回调接口URL
            
        Returns:
            任务ID
        """
        # 生成任务ID
        task_id = str(uuid.uuid4())
        
        # 创建任务信息
        task_info = TaskInfo(
            task_id=task_id,
            task_type=task_type,
            status=TaskStatus.PENDING,
            ontology_id=ontology_id,
            owner_id=owner_id,
            payload=payload,
            callback_url=callback_url
        )
        
        # 保存任务信息
        self.tasks[task_id] = task_info
        
        # 加入队列
        await self.task_queue.put(task_info)
        
        # 获取队列位置（包含当前执行的任务）
        queue_position = self.task_queue.qsize()
        if self.current_task is not None:
            queue_position += 1
        
        logger.info(
            f"Task {task_id} submitted. Type: {task_type}, "
            f"Queue position: {queue_position}"
        )
        
        # 通知后端任务进入等待队列（异步执行，不阻塞返回）
        asyncio.create_task(
            self._notify_callback(
                task_id,
                TaskStatus.PENDING,
                message=f"任务已提交，排队位置: {queue_position}",
                queue_position=queue_position
            )
        )
        
        return task_id
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        取消任务
        返回是否成功取消
        """
        task_info = self.tasks.get(task_id)
        if task_info is None:
            logger.warning(f"Task {task_id} not found")
            return False
        
        if task_info.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            logger.warning(f"Task {task_id} already finished with status: {task_info.status}")
            return False
        
        # 设置取消标志
        task_info.cancel_event.set()
        
        # 如果任务还在队列中（未执行），直接标记为取消
        if task_info.status == TaskStatus.PENDING:
            await self._update_task_status(
                task_id,
                TaskStatus.CANCELLED,
                finished_at=datetime.now(),
                error_message="任务已被取消"
            )
            # 通知回调接口（异步执行，不阻塞返回）
            asyncio.create_task(
                self._notify_callback(
                    task_id,
                    TaskStatus.CANCELLED,
                    message="任务已被取消"
                )
            )
        
        logger.info(f"Task {task_id} cancellation requested")
        return True
    
    def get_task_info(self, task_id: str) -> Optional[TaskInfo]:
        """获取任务信息"""
        return self.tasks.get(task_id)
    
    def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        return {
            "queue_size": self.task_queue.qsize(),
            "current_task": self.current_task.task_id if self.current_task else None,
            "total_tasks": len(self.tasks),
            "pending_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.PENDING]),
            "running_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.RUNNING]),
            "completed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED]),
            "cancelled_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.CANCELLED]),
        }
    
    async def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
        result: Optional[Any] = None
    ):
        """更新任务状态"""
        task_info = self.tasks.get(task_id)
        if task_info:
            task_info.status = status
            if started_at:
                task_info.started_at = started_at
            if finished_at:
                task_info.finished_at = finished_at
            if error_message:
                task_info.error_message = error_message
            if result is not None:
                task_info.result = result
            logger.info(f"Task {task_id} status updated to: {status}")
    
    async def _notify_callback(
        self,
        task_id: str,
        status: TaskStatus,
        message: str = "",
        result: Optional[Any] = None,
        queue_position: Optional[int] = None
    ):
        """通知回调接口"""
        task_info = self.tasks.get(task_id)
        if not task_info:
            logger.warning(f"Task {task_id} not found for callback")
            return
        
        callback_url = task_info.callback_url
        if not callback_url:
            logger.warning(f"Task {task_id} has no callback URL, skipping notification")
            return
        
        payload = {
            "task_id": task_id,
            "task_type": task_info.task_type,
            "status": status,
            "message": message,
            "ontology_id": task_info.ontology_id,
            "owner_id": task_info.owner_id,
            "created_at": task_info.created_at.isoformat() if task_info.created_at else None,
            "started_at": task_info.started_at.isoformat() if task_info.started_at else None,
            "finished_at": task_info.finished_at.isoformat() if task_info.finished_at else None,
        }
        
        if queue_position is not None:
            payload["queue_position"] = queue_position
        # if result is not None:
        #     payload["result"] = result
        if result is not None and isinstance(result, dict):
            error_list = result.get("error_list") or []
            stats = result.get("import_stats") or {}
            parse_stats = result.get("parse_stats") or {}
            
            # Basic data structure (all import types)
            data = {
                "import_stats": stats,  # Database write statistics (inserted/updated/skipped counts)
            }
            
            # CSV-specific statistics (only present for CSV/XLSX imports)
            if error_list or parse_stats:
                data["csv_import_stats"] = {
                    "error_list": error_list,
                    "parse_stats": {
                        "success_object_count": int(parse_stats.get("success_object_count", 0)),
                        "success_attribute_count": int(parse_stats.get("success_attribute_count", 0)),
                        "failed_object_count": int(parse_stats.get("failed_object_count", 0)),
                        "failed_attribute_count": int(parse_stats.get("failed_attribute_count", 0)),
                        "success_relation_count": int(parse_stats.get("success_relation_count", 0)),
                        "failed_relation_count": int(parse_stats.get("failed_relation_count", 0)),
                    }
                }
            
            payload["data"] = data
        
        if task_info.error_message:
            payload["error_message"] = task_info.error_message
        
        try:
            # 从环境变量读取Cookie
            cookie_value = os.getenv("TASK_CALLBACK_COOKIE")
            headers = {}
            if cookie_value:
                headers["Cookie"] = cookie_value
                logger.debug(f"Adding Cookie header to callback request")
            
            # 注意：httpx 默认不跟随重定向（follow_redirects=False），而 requests 默认会跟随 301/302/...
            # 这里如果回调接口返回 302，raise_for_status() 会直接抛异常导致通知失败。
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.post(callback_url, json=payload, headers=headers)
                if response.history:
                    try:
                        redirect_chain = " -> ".join(str(r.status_code) for r in response.history)
                    except Exception:
                        redirect_chain = "<unavailable>"
                    logger.info(
                        f"Callback notification followed redirects: {redirect_chain} -> {response.status_code}; "
                        f"final_url={response.url}"
                    )
                response.raise_for_status()
                logger.info(f"Callback notification sent for task {task_id} to {callback_url}, status: {status}")
                logger.info(f"Callback response: {response.text}")
        except Exception as e:
            logger.error(f"Failed to send callback notification for task {task_id} to {callback_url}: {e}")


# 全局任务管理器实例
task_manager = ImportTaskManager()

"""
异步任务管理器
用于管理导入任务的队列、并发控制和状态通知
"""
import asyncio
import os
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass, field
import httpx
from public.public_variable import logger


class TaskType(str, Enum):
    """任务类型"""
    OWL_IMPORT = "owl_import"
    CSV_IMPORT = "csv_import"


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"  # 等待中
    RUNNING = "running"  # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败
    CANCELLED = "cancelled"  # 已取消


@dataclass
class TaskInfo:
    """任务信息"""
    task_id: str
    task_type: TaskType
    status: TaskStatus
    ontology_id: str
    owner_id: str
    payload: Dict[str, Any]
    callback_url: str  # 每个任务独立的回调URL
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Any] = None
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


class ImportTaskManager:
    """导入任务管理器 - 单例模式"""
    
    _instance = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.tasks: Dict[str, TaskInfo] = {}
            self.task_queue: asyncio.Queue = asyncio.Queue()
            self.current_task: Optional[TaskInfo] = None
            self.worker_task: Optional[asyncio.Task] = None
            self.max_concurrent = 1  # 最大并发数
            self._shutdown_flag = False  # 关闭标志
            
            # 从环境变量读取回调URL，如果没有设置则使用默认值
            default_callback_url = "http://localhost:5050/api/v1/ontology/task/mock_callback"
            self.callback_url: str = os.getenv("TASK_MANAGER_CALLBACK_URL", default_callback_url)
            logger.info(f"Task manager callback URL: {self.callback_url}")
            
            self.task_handlers: Dict[TaskType, Callable] = {}
            self.initialized = True
    
    def register_handler(self, task_type: TaskType, handler: Callable):
        """注册任务处理器"""
        self.task_handlers[task_type] = handler
    
    def set_callback_url(self, url: str):
        """设置回调URL"""
        self.callback_url = url
        logger.info(f"Task callback URL set to: {url}")
    
    async def start_worker(self):
        """启动后台工作线程"""
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Task worker started")
    
    async def shutdown(self):
        """
        关闭任务管理器，清理所有资源
        这个方法应该在应用关闭时调用，以避免资源泄漏
        """
        logger.info("Shutting down task manager...")
        
        # 设置关闭标志，让工作循环退出
        self._shutdown_flag = True
        
        # 取消所有待处理的任务
        for task_id, task_info in self.tasks.items():
            if task_info.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
                task_info.cancel_event.set()
                logger.debug(f"Cancelling task {task_id}")
        
        # 等待工作线程结束（最多等待5秒）
        if self.worker_task and not self.worker_task.done():
            try:
                await asyncio.wait_for(self.worker_task, timeout=5.0)
                logger.info("Worker task finished gracefully")
            except asyncio.TimeoutError:
                logger.warning("Worker task timeout, forcing cancellation")
                self.worker_task.cancel()
                try:
                    await self.worker_task
                except asyncio.CancelledError:
                    logger.info("Worker task cancelled")
        
        # 清空队列
        queue_size = self.task_queue.qsize()
        if queue_size > 0:
            logger.info(f"Clearing {queue_size} pending tasks from queue")
            while not self.task_queue.empty():
                try:
                    self.task_queue.get_nowait()
                    self.task_queue.task_done()
                except asyncio.QueueEmpty:
                    break
        
        logger.info("Task manager shutdown complete")
    
    async def _worker_loop(self):
        """工作线程主循环"""
        logger.info("Task worker loop started")
        while not self._shutdown_flag:
            try:
                # 从队列取任务（带超时，以便检查关闭标志）
                try:
                    task_info: TaskInfo = await asyncio.wait_for(
                        self.task_queue.get(),
                        timeout=1.0  # 1秒超时，让循环可以检查 _shutdown_flag
                    )
                except asyncio.TimeoutError:
                    # 超时后继续循环，检查是否需要关闭
                    continue
                
                # 更新为运行状态
                await self._update_task_status(
                    task_info.task_id, 
                    TaskStatus.RUNNING,
                    started_at=datetime.now()
                )
                self.current_task = task_info
                
                # 通知后端任务开始执行
                await self._notify_callback(
                    task_info.task_id,
                    TaskStatus.RUNNING,
                    message="任务开始执行"
                )
                
                try:
                    # 检查任务是否已被取消
                    if task_info.cancel_event.is_set():
                        raise asyncio.CancelledError("Task was cancelled")
                    
                    # 执行任务
                    handler = self.task_handlers.get(task_info.task_type)
                    if handler is None:
                        raise ValueError(f"No handler registered for task type: {task_info.task_type}")
                    
                    # 执行处理器（传入取消事件以支持取消）
                    result = await handler(task_info)
                    
                    # 任务成功完成
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.COMPLETED,
                        finished_at=datetime.now(),
                        result=result
                    )
                    
                    # 通知后端任务完成
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.COMPLETED,
                        message="任务执行成功",
                        result=result
                    )
                    
                except asyncio.CancelledError:
                    # 任务被取消
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.CANCELLED,
                        finished_at=datetime.now(),
                        error_message="任务已被取消"
                    )
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.CANCELLED,
                        message="任务已被取消"
                    )
                    
                except Exception as e:
                    # 任务执行失败
                    error_msg = str(e)
                    logger.error(f"Task {task_info.task_id} failed: {error_msg}")
                    await self._update_task_status(
                        task_info.task_id,
                        TaskStatus.FAILED,
                        finished_at=datetime.now(),
                        error_message=error_msg
                    )
                    await self._notify_callback(
                        task_info.task_id,
                        TaskStatus.FAILED,
                        message=f"任务执行失败: {error_msg}"
                    )
                
                finally:
                    self.current_task = None
                    self.task_queue.task_done()
                    
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                await asyncio.sleep(1)  # 避免错误循环
        
        logger.info("Task worker loop stopped")
    
    async def submit_task(
        self,
        task_type: TaskType,
        ontology_id: str,
        owner_id: str,
        payload: Dict[str, Any],
        callback_url: str
    ) -> str:
        """
        提交新任务
        
        Args:
            task_type: 任务类型
            ontology_id: 本体ID
            owner_id: 拥有者ID
            payload: 任务数据
            callback_url: 回调接口URL
            
        Returns:
            任务ID
        """
        # 生成任务ID
        task_id = str(uuid.uuid4())
        
        # 创建任务信息
        task_info = TaskInfo(
            task_id=task_id,
            task_type=task_type,
            status=TaskStatus.PENDING,
            ontology_id=ontology_id,
            owner_id=owner_id,
            payload=payload,
            callback_url=callback_url
        )
        
        # 保存任务信息
        self.tasks[task_id] = task_info
        
        # 加入队列
        await self.task_queue.put(task_info)
        
        # 获取队列位置（包含当前执行的任务）
        queue_position = self.task_queue.qsize()
        if self.current_task is not None:
            queue_position += 1
        
        logger.info(
            f"Task {task_id} submitted. Type: {task_type}, "
            f"Queue position: {queue_position}"
        )
        
        # 通知后端任务进入等待队列
        await self._notify_callback(
            task_id,
            TaskStatus.PENDING,
            message=f"任务已提交，排队位置: {queue_position}",
            queue_position=queue_position
        )
        
        return task_id
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        取消任务
        返回是否成功取消
        """
        task_info = self.tasks.get(task_id)
        if task_info is None:
            logger.warning(f"Task {task_id} not found")
            return False
        
        if task_info.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            logger.warning(f"Task {task_id} already finished with status: {task_info.status}")
            return False
        
        # 设置取消标志
        task_info.cancel_event.set()
        
        # 如果任务还在队列中（未执行），直接标记为取消
        if task_info.status == TaskStatus.PENDING:
            await self._update_task_status(
                task_id,
                TaskStatus.CANCELLED,
                finished_at=datetime.now(),
                error_message="任务已被取消"
            )
            await self._notify_callback(
                task_id,
                TaskStatus.CANCELLED,
                message="任务已被取消"
            )
        
        logger.info(f"Task {task_id} cancellation requested")
        return True
    
    def get_task_info(self, task_id: str) -> Optional[TaskInfo]:
        """获取任务信息"""
        return self.tasks.get(task_id)
    
    def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        return {
            "queue_size": self.task_queue.qsize(),
            "current_task": self.current_task.task_id if self.current_task else None,
            "total_tasks": len(self.tasks),
            "pending_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.PENDING]),
            "running_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.RUNNING]),
            "completed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED]),
            "cancelled_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.CANCELLED]),
        }
    
    async def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
        result: Optional[Any] = None
    ):
        """更新任务状态"""
        task_info = self.tasks.get(task_id)
        if task_info:
            task_info.status = status
            if started_at:
                task_info.started_at = started_at
            if finished_at:
                task_info.finished_at = finished_at
            if error_message:
                task_info.error_message = error_message
            if result is not None:
                task_info.result = result
            logger.info(f"Task {task_id} status updated to: {status}")
    
    async def _notify_callback(
        self,
        task_id: str,
        status: TaskStatus,
        message: str = "",
        result: Optional[Any] = None,
        queue_position: Optional[int] = None
    ):
        """通知回调接口"""
        task_info = self.tasks.get(task_id)
        if not task_info:
            logger.warning(f"Task {task_id} not found for callback")
            return
        
        callback_url = task_info.callback_url
        if not callback_url:
            logger.warning(f"Task {task_id} has no callback URL, skipping notification")
            return
        
        payload = {
            "task_id": task_id,
            "task_type": task_info.task_type,
            "status": status,
            "message": message,
            "ontology_id": task_info.ontology_id,
            "owner_id": task_info.owner_id,
            "created_at": task_info.created_at.isoformat() if task_info.created_at else None,
            "started_at": task_info.started_at.isoformat() if task_info.started_at else None,
            "finished_at": task_info.finished_at.isoformat() if task_info.finished_at else None,
        }
        
        if queue_position is not None:
            payload["queue_position"] = queue_position
        
        # if result is not None:
        #     payload["result"] = result
        if result is not None and isinstance(result, dict):
            error_list = result.get("error_list") or []
            stats = result.get("import_stats") or {}
            parse_stats = result.get("parse_stats") or {}
            
            # Basic data structure (all import types)
            data = {
                "import_stats": stats,  # Database write statistics (inserted/updated/skipped counts)
            }
            
            # CSV-specific statistics (only present for CSV/XLSX imports)
            if error_list or parse_stats:
                data["csv_import_stats"] = {
                    "error_list": error_list,
                    "parse_stats": {
                        "success_object_count": int(parse_stats.get("success_object_count", 0)),
                        "success_attribute_count": int(parse_stats.get("success_attribute_count", 0)),
                        "failed_object_count": int(parse_stats.get("failed_object_count", 0)),
                        "failed_attribute_count": int(parse_stats.get("failed_attribute_count", 0)),
                        "success_relation_count": int(parse_stats.get("success_relation_count", 0)),
                        "failed_relation_count": int(parse_stats.get("failed_relation_count", 0)),
                    }
                }
            
            payload["data"] = data
        
        if task_info.error_message:
            payload["error_message"] = task_info.error_message
        
        try:
            cookie_value = os.getenv("TASK_CALLBACK_COOKIE")
            headers = {}
            if cookie_value:
                headers["Cookie"] = cookie_value
            # 注意：httpx 默认不跟随重定向（follow_redirects=False），而 requests 默认会跟随 301/302/...
            # 这里如果回调接口返回 302，raise_for_status() 会直接抛异常导致通知失败。
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.post(callback_url, json=payload, headers=headers)
                if response.history:
                    try:
                        redirect_chain = " -> ".join(str(r.status_code) for r in response.history)
                    except Exception:
                        redirect_chain = "<unavailable>"
                    logger.info(
                        f"Callback notification followed redirects: {redirect_chain} -> {response.status_code}; "
                        f"final_url={response.url}"
                    )
                response.raise_for_status()
                logger.info(f"Callback notification sent for task {task_id} to {callback_url}, status: {status}")
        except Exception as e:
            logger.error(f"Failed to send callback notification for task {task_id} to {callback_url}: {e}")


# 全局任务管理器实例
task_manager = ImportTaskManager()

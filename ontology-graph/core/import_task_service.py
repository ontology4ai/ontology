"""
Import Task Service

This module provides import task execution service with Redis-based queue management.
It handles:
- Queue management for import tasks (OWL, DOC, CSV, CODE)
- Serial execution (max 1 concurrent task at a time)
- Task status tracking and callback notifications
- Support for multiple workers sharing the same queue
"""

import asyncio
import json
import os
import tempfile
import traceback
from datetime import datetime
from typing import Optional, Dict, Any
from public.public_variable import logger
from core.import_exceptions import OwlValidationError

# Constants
IMPORT_TASK_QUEUE = "import_task:queue"  # Redis queue name
IMPORT_TASK_RUNNING = "import_task:running"  # Redis set for running tasks
IMPORT_TASK_METADATA = "import_task:metadata"  # Redis hash for task metadata (start time, etc.)
MAX_CONCURRENT_TASKS = 1  # Maximum concurrent import tasks (serial execution)
TASK_TIMEOUT_SECONDS = 3600  # Task timeout: 1 hour (adjust as needed)
ORPHAN_CHECK_INTERVAL = 60  # Check for orphaned/timeout tasks every 60 seconds

# Task status constants
STATUS_QUEUED = "pending"
STATUS_RUNNING = "running"
STATUS_COMPLETED = "completed"
STATUS_ERROR = "failed"
STATUS_CANCELLED = "cancelled"


class ImportTaskService:
    """
    Service for managing import task execution with queue and concurrency control.
    Supports graceful degradation: starts even if dependencies are not ready.
    """
    
    def __init__(self):
        self._mysql_service = None
        self._redis_service = None
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown = False
        self._dependencies_ready = False
        
        # Import task handlers
        self._task_handlers: Dict[str, Any] = {}
    
    async def _get_mysql_service(self):
        """Get MySQL service instance (async)"""
        if self._mysql_service is None:
            from utils.databases.service_factory import create_mysql_service
            self._mysql_service = await create_mysql_service()
        return self._mysql_service
    
    def _get_redis_service(self):
        """Get Redis service instance"""
        if self._redis_service is None:
            from utils.databases.redis import get_redis_service
            self._redis_service = get_redis_service()
        return self._redis_service
    
    def register_handler(self, task_type: str, handler):
        """Register task handler for a specific task type"""
        self._task_handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    async def check_dependencies(self) -> Dict[str, Any]:
        """
        Check if all dependencies (MySQL, Redis) are available.
        
        Returns:
            Dict with status and details of each dependency
        """
        result = {
            "all_ready": True,
            "mysql": {"ready": False, "error": None},
            "redis": {"ready": False, "error": None},
        }
        
        # Check MySQL
        try:
            mysql = await self._get_mysql_service()
            # Try a simple query to verify connection
            await mysql.afetch_one("SELECT 1 as test")
            result["mysql"]["ready"] = True
        except Exception as e:
            result["mysql"]["error"] = str(e)
            result["all_ready"] = False
            logger.debug(f"MySQL not ready: {e}")
        
        # Check Redis
        try:
            redis = self._get_redis_service()
            # Try a simple operation to verify connection
            await redis.queue_length(IMPORT_TASK_QUEUE)
            result["redis"]["ready"] = True
        except Exception as e:
            result["redis"]["error"] = str(e)
            result["all_ready"] = False
            logger.debug(f"Redis not ready: {e}")
        
        self._dependencies_ready = result["all_ready"]
        return result
    
    async def submit_import_task(
        self,
        task_id: str,
        task_type: str,
        ontology_id: str,
        owner_id: str,
        payload: Dict[str, Any],
        callback_url: str
    ) -> Dict[str, Any]:
        """
        Submit an import task request.
        
        Args:
            task_id: Task ID (provided by client)
            task_type: Type of import task (owl_import, csv_import)
            ontology_id: Ontology ID
            owner_id: Owner ID
            payload: Task-specific payload
            callback_url: URL for task status callbacks
            
        Returns:
            Dict with submitted task info including queue position
        """
        # Check dependencies before accepting tasks
        deps = await self.check_dependencies()
        if not deps["all_ready"]:
            error_details = []
            for dep_name, dep_info in deps.items():
                if dep_name != "all_ready" and not dep_info["ready"]:
                    error_details.append(f"{dep_name}: {dep_info['error']}")
            error_msg = "Import task service dependencies not ready: " + "; ".join(error_details)
            logger.error(error_msg)
            return {
                "status": "failed",
                "message": error_msg,
                "dependencies": deps
            }
        
        redis = self._get_redis_service()
        
        logger.info(
            f"[ImportTask] Submitting task: task_id={task_id}, "
            f"type={task_type}, ontology_id={ontology_id}"
        )
        
        # Create queue item
        queue_item = {
            "task_id": task_id,
            "task_type": task_type,
            "ontology_id": ontology_id,
            "owner_id": owner_id,
            "payload": payload,
            "callback_url": callback_url,
            "status": STATUS_QUEUED,
            "created_at": datetime.now().isoformat(),
        }
        
        # Push to Redis queue
        await redis.queue_push(IMPORT_TASK_QUEUE, queue_item)
        
        # Get queue position
        queue_length = await redis.queue_length(IMPORT_TASK_QUEUE)
        running_count = await redis.set_count(IMPORT_TASK_RUNNING)
        
        # Queue position = running tasks + tasks ahead in queue
        queue_position = running_count + queue_length
        tasks_ahead = queue_position - 1  # -1 because we just added this task
        
        logger.info(
            f"[ImportTask] Task {task_id} submitted to queue. "
            f"Position: {queue_position}, Tasks ahead: {tasks_ahead}"
        )
        
        # Note: No longer sending pending status callback here
        # Client will initialize pending status on their side
        
        # Ensure worker is running
        self._ensure_worker_running()
        
        return {
            "status": "success",
            "task_id": task_id,
            "queue_position": queue_position,
            "tasks_ahead": tasks_ahead,
        }
    
    async def cancel_import_task(self, task_id: str, force: bool = False) -> Dict[str, Any]:
        """
        Cancel a queued or running import task.
        
        Args:
            task_id: Task ID to cancel
            force: If True, forcefully cancel even running tasks
            
        Returns:
            Dict with cancellation result
        """
        redis = self._get_redis_service()
        
        # Check if task is in running set
        running_tasks = await redis.set_members(IMPORT_TASK_RUNNING)
        if task_id in running_tasks:
            if not force:
                logger.warning(f"[ImportTask] Task {task_id} is running, cancellation not yet implemented")
                return {
                    "status": "failed",
                    "message": "Cannot cancel running task (not yet implemented). Use force=True to forcefully stop."
                }
            else:
                # Force cancel: remove from running set directly
                await redis.set_remove(IMPORT_TASK_RUNNING, task_id)
                logger.warning(f"[ImportTask] Task {task_id} forcefully removed from running set")
                
                # Note: The actual task execution will continue, but it will be cleaned up
                # when it finishes. This is a best-effort cancellation.
                return {
                    "status": "success",
                    "message": "Task forcefully cancelled (task execution may still complete in background)"
                }
        
        # Check if task is in queue and remove it
        queue_items = await redis.queue_peek(IMPORT_TASK_QUEUE, 0, -1)
        removed = False
        
        for item_str in queue_items:
            try:
                item = json.loads(item_str)
                if item.get("task_id") == task_id:
                    # Remove from queue
                    await redis.queue_remove(IMPORT_TASK_QUEUE, item_str, count=1)
                    removed = True
                    logger.info(f"[ImportTask] Task {task_id} removed from queue")
                    
                    # Send cancellation callback
                    await self._send_callback(
                        callback_url=item.get("callback_url", ""),
                        task_id=task_id,
                        task_type=item.get("task_type", ""),
                        status=STATUS_CANCELLED,
                        message="任务已被取消",
                        ontology_id=item.get("ontology_id", ""),
                        owner_id=item.get("owner_id", ""),
                    )
                    break
            except json.JSONDecodeError:
                continue
        
        if removed:
            return {
                "status": "success",
                "message": "Task cancelled successfully"
            }
        else:
            return {
                "status": "failed",
                "message": "Task not found in queue"
            }
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """
        Get current queue status with task details.
        
        Returns:
            Dict with queue statistics and task details
        """
        redis = self._get_redis_service()
        
        # Get basic statistics
        queue_length = await redis.queue_length(IMPORT_TASK_QUEUE)
        running_count = await redis.set_count(IMPORT_TASK_RUNNING)
        
        # Get queued task details
        queued_tasks = []
        queue_items = await redis.queue_peek(IMPORT_TASK_QUEUE, 0, -1)
        for idx, item_str in enumerate(queue_items):
            try:
                task = json.loads(item_str)
                queued_tasks.append({
                    "position": idx + 1,
                    "task_id": task.get("task_id"),
                    "task_type": task.get("task_type"),
                    "ontology_id": task.get("ontology_id"),
                    "owner_id": task.get("owner_id"),
                    "status": task.get("status"),
                    "created_at": task.get("created_at"),
                })
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse queue item: {item_str}")
                continue
        
        # Get running task IDs with metadata
        running_task_ids = await redis.set_members(IMPORT_TASK_RUNNING)
        running_tasks = []
        now = datetime.now()
        
        for task_id in running_task_ids:
            task_info = {"task_id": task_id, "status": "running"}
            
            # Try to get metadata
            metadata_str = await redis.hash_get(IMPORT_TASK_METADATA, task_id)
            if metadata_str:
                try:
                    metadata = json.loads(metadata_str)
                    task_info["task_type"] = metadata.get("task_type")
                    task_info["ontology_id"] = metadata.get("ontology_id")
                    task_info["started_at"] = metadata.get("started_at")
                    
                    # Calculate duration
                    if metadata.get("started_at"):
                        started_at = datetime.fromisoformat(metadata["started_at"])
                        duration = (now - started_at).total_seconds()
                        task_info["duration_seconds"] = int(duration)
                        task_info["timeout_in_seconds"] = max(0, TASK_TIMEOUT_SECONDS - int(duration))
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Failed to parse metadata for task {task_id}: {e}")
            
            running_tasks.append(task_info)
        
        return {
            "queue_length": queue_length,
            "running_count": running_count,
            "total_in_system": queue_length + running_count,
            "queued_tasks": queued_tasks,
            "running_tasks": running_tasks,
            "timeout_limit_seconds": TASK_TIMEOUT_SECONDS,
        }
    
    async def cleanup_orphaned_tasks(self):
        """
        Clean up orphaned or timeout tasks at startup.
        This handles tasks that were running when service was stopped.
        """
        try:
            redis = self._get_redis_service()
            
            # Get all running task IDs
            running_task_ids = await redis.set_members(IMPORT_TASK_RUNNING)
            
            if not running_task_ids:
                logger.info("[ImportTask] No orphaned tasks found")
                return
            
            logger.warning(f"[ImportTask] Found {len(running_task_ids)} potentially orphaned tasks, cleaning up...")
            
            for task_id in running_task_ids:
                # Remove from running set
                await redis.set_remove(IMPORT_TASK_RUNNING, task_id)
                
                # Remove metadata
                await redis.hash_delete(IMPORT_TASK_METADATA, task_id)
                
                logger.warning(f"[ImportTask] Cleaned up orphaned task: {task_id}")
            
            logger.info("[ImportTask] Orphaned tasks cleanup completed")
            
        except Exception as e:
            logger.error(f"[ImportTask] Failed to cleanup orphaned tasks: {e}")
            logger.error(traceback.format_exc())
    
    def start_worker(self):
        """
        Start the background worker (called at application startup).
        Worker will start even if dependencies are not ready, and will wait for them.
        """
        if self._worker_task is None or self._worker_task.done():
            self._shutdown = False
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Import task worker started (will wait for dependencies if needed)")
    
    def _ensure_worker_running(self):
        """Ensure the background worker is running"""
        self.start_worker()
    
    def get_worker_status(self) -> Dict[str, Any]:
        """
        Get the current status of the worker.
        
        Returns:
            Dict with worker status information
        """
        is_running = self._worker_task is not None and not self._worker_task.done()
        return {
            "worker_running": is_running,
            "dependencies_ready": self._dependencies_ready,
            "shutdown": self._shutdown
        }
    
    async def _worker_loop(self):
        """
        Background worker loop that processes the queue.
        Ensures only ONE task runs at a time (serial execution).
        """
        last_dep_check_time = datetime.now()
        dep_check_interval_seconds = 30  # Check dependencies every 30 seconds
        last_orphan_check_time = datetime.now()
        
        logger.info("Import task worker loop started")
        
        # Initial cleanup of orphaned tasks from previous runs
        await self.cleanup_orphaned_tasks()
        
        while not self._shutdown:
            try:
                # Periodic dependency check
                now = datetime.now()
                if (now - last_dep_check_time).total_seconds() > dep_check_interval_seconds:
                    deps = await self.check_dependencies()
                    last_dep_check_time = now
                    
                    if not deps["all_ready"]:
                        if not self._dependencies_ready:
                            logger.debug("Import task worker waiting for dependencies...")
                        else:
                            logger.warning("Import task worker dependencies became unavailable")
                            error_details = []
                            for dep_name, dep_info in deps.items():
                                if dep_name != "all_ready" and not dep_info["ready"]:
                                    error_details.append(f"{dep_name}: {dep_info['error']}")
                            logger.warning(f"Missing dependencies: {'; '.join(error_details)}")
                        
                        # Wait before next check
                        await asyncio.sleep(5)
                        continue
                    else:
                        if not self._dependencies_ready:
                            logger.info("Import task worker dependencies are now ready, starting to process queue")
                
                # Dependencies are ready, proceed with normal processing
                redis = self._get_redis_service()
                
                # Periodic orphan/timeout task check
                now = datetime.now()
                if (now - last_orphan_check_time).total_seconds() > ORPHAN_CHECK_INTERVAL:
                    await self._check_timeout_tasks()
                    last_orphan_check_time = now
                
                # Check current running count (should be 0 or 1)
                running_count = await redis.set_count(IMPORT_TASK_RUNNING)
                
                if running_count >= MAX_CONCURRENT_TASKS:
                    # Wait a bit before checking again (serial execution)
                    await asyncio.sleep(2)
                    continue
                
                # Check queue length
                queue_len = await redis.queue_length(IMPORT_TASK_QUEUE)
                if queue_len == 0:
                    # No tasks in queue, wait and check again
                    await asyncio.sleep(2)
                    continue
                
                # Pop task from queue (non-blocking)
                item_str = await redis.queue_pop(IMPORT_TASK_QUEUE)
                if not item_str:
                    await asyncio.sleep(1)
                    continue
                
                # Parse queue item
                try:
                    queue_item = json.loads(item_str)
                except json.JSONDecodeError:
                    logger.error(f"Invalid queue item: {item_str}")
                    continue
                
                task_id = queue_item.get("task_id")
                
                # Add to running set and record start time
                await redis.set_add(IMPORT_TASK_RUNNING, task_id)
                task_metadata = {
                    "task_id": task_id,
                    "started_at": datetime.now().isoformat(),
                    "task_type": queue_item.get("task_type", ""),
                    "ontology_id": queue_item.get("ontology_id", ""),
                    "owner_id": queue_item.get("owner_id", ""),
                    "callback_url": queue_item.get("callback_url", ""),
                }
                await redis.hash_set(IMPORT_TASK_METADATA, task_id, json.dumps(task_metadata))
                
                # Execute task in background (fire and forget with cleanup)
                asyncio.create_task(self._execute_task_with_cleanup(queue_item))
                
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(1)
        
        logger.info("Import task worker loop stopped")
    
    async def _check_timeout_tasks(self):
        """
        Check for timeout tasks and clean them up.
        Tasks running longer than TASK_TIMEOUT_SECONDS are considered timeout.
        """
        try:
            redis = self._get_redis_service()
            
            # Get all running task IDs
            running_task_ids = await redis.set_members(IMPORT_TASK_RUNNING)
            
            if not running_task_ids:
                return
            
            now = datetime.now()
            timeout_tasks = []
            
            for task_id in running_task_ids:
                # Get task metadata
                metadata_str = await redis.hash_get(IMPORT_TASK_METADATA, task_id)
                
                if not metadata_str:
                    # No metadata found, treat as orphaned task
                    logger.warning(f"[ImportTask] Task {task_id} has no metadata, treating as orphaned")
                    timeout_tasks.append((task_id, None, "No metadata found"))
                    continue
                
                try:
                    metadata = json.loads(metadata_str)
                    started_at_str = metadata.get("started_at")
                    
                    if not started_at_str:
                        logger.warning(f"[ImportTask] Task {task_id} has no start time, treating as orphaned")
                        timeout_tasks.append((task_id, metadata, "No start time"))
                        continue
                    
                    # Parse start time
                    started_at = datetime.fromisoformat(started_at_str)
                    duration = (now - started_at).total_seconds()
                    
                    if duration > TASK_TIMEOUT_SECONDS:
                        logger.warning(
                            f"[ImportTask] Task {task_id} timeout detected: "
                            f"running for {duration:.0f}s (limit: {TASK_TIMEOUT_SECONDS}s)"
                        )
                        timeout_tasks.append((task_id, metadata, f"Timeout after {duration:.0f}s"))
                    
                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"[ImportTask] Failed to parse metadata for task {task_id}: {e}")
                    timeout_tasks.append((task_id, None, f"Metadata parse error: {e}"))
            
            # Clean up timeout tasks
            for task_id, metadata, reason in timeout_tasks:
                logger.warning(f"[ImportTask] Cleaning up timeout/orphaned task {task_id}: {reason}")
                
                # Remove from running set
                await redis.set_remove(IMPORT_TASK_RUNNING, task_id)
                
                # Remove metadata
                await redis.hash_delete(IMPORT_TASK_METADATA, task_id)
                
                # Optionally send timeout callback if we have metadata
                if metadata:
                    callback_url = metadata.get("callback_url", "")
                    if callback_url:
                        await self._send_callback(
                            callback_url=callback_url,
                            task_id=task_id,
                            task_type=metadata.get("task_type", ""),
                            status=STATUS_ERROR,
                            message=f"任务超时被清理: {reason}",
                            ontology_id=metadata.get("ontology_id", ""),
                            owner_id=metadata.get("owner_id", ""),
                            error_message=reason,
                        )
                
                logger.info(f"[ImportTask] Timeout task {task_id} cleaned up")
        
        except Exception as e:
            logger.error(f"[ImportTask] Failed to check timeout tasks: {e}")
            logger.error(traceback.format_exc())
    
    async def _execute_task_with_cleanup(self, queue_item: Dict[str, Any]):
        """
        Execute a task and ensure cleanup (remove from running set).
        
        Args:
            queue_item: Queue item with task details
        """
        redis = self._get_redis_service()
        task_id = queue_item.get("task_id")
        task_type = queue_item.get("task_type")
        ontology_id = queue_item.get("ontology_id")
        owner_id = queue_item.get("owner_id")
        payload = queue_item.get("payload", {})
        callback_url = queue_item.get("callback_url", "")

        try:
            logger.info(f"[ImportTask] Task picked up: task_id={task_id}, type={task_type}")
            
            # Delay 1.5 seconds before starting execution to ensure API response has been sent
            await asyncio.sleep(1.5)
            
            logger.info(f"[ImportTask] Starting execution after delay: task_id={task_id}")
            
            # Send running status callback
            await self._send_callback(
                callback_url=callback_url,
                task_id=task_id,
                task_type=task_type,
                status=STATUS_RUNNING,
                message="任务开始执行",
                ontology_id=ontology_id,
                owner_id=owner_id,
            )
            
            # Get task handler
            handler = self._task_handlers.get(task_type)
            if handler is None:
                raise ValueError(f"No handler registered for task type: {task_type}")
            
            # Create TaskInfo object for handler (compatible with old API)
            from core.task_manager import TaskInfo, TaskType, TaskStatus
            
            task_info = TaskInfo(
                task_id=task_id,
                task_type=TaskType(task_type),
                status=TaskStatus.RUNNING,
                ontology_id=ontology_id,
                owner_id=owner_id,
                payload=payload,
                callback_url=callback_url,
                cancel_event=asyncio.Event(),  # TODO: Implement cancellation
            )
            
            # Execute handler
            result = await handler(task_info)
            
            # Task completed successfully
            logger.info(f"[ImportTask] Task {task_id} completed successfully")
            
            # Send completion callback
            await self._send_callback(
                callback_url=callback_url,
                task_id=task_id,
                task_type=task_type,
                status=STATUS_COMPLETED,
                message="任务执行成功",
                ontology_id=ontology_id,
                owner_id=owner_id,
                result=result,
            )
            
        except Exception as e:
            error_msg = str(e)
            error_result: Optional[Dict[str, Any]] = None
            if isinstance(e, OwlValidationError):
                try:
                    error_result = e.result_json
                except Exception:
                    error_result = None

            logger.error(f"[ImportTask] Task {task_id} failed: {error_msg}")
            logger.error(traceback.format_exc())

            # Send error callback
            await self._send_callback(
                callback_url=callback_url,
                task_id=task_id,
                task_type=task_type,
                status=STATUS_ERROR,
                message=f"任务执行失败: {error_msg}",
                ontology_id=ontology_id,
                owner_id=owner_id,
                error_message=error_msg,
                result=error_result,
            )
        
        finally:
            # Always remove from running set and metadata
            await redis.set_remove(IMPORT_TASK_RUNNING, task_id)
            await redis.hash_delete(IMPORT_TASK_METADATA, task_id)
            logger.info(f"[ImportTask] Task {task_id} removed from running set and metadata cleaned")
    
    async def _send_callback(
        self,
        callback_url: str,
        task_id: str,
        task_type: str,
        status: str,
        message: str,
        ontology_id: str,
        owner_id: str,
        queue_position: Optional[int] = None,
        tasks_ahead: Optional[int] = None,
        result: Optional[Any] = None,
        error_message: Optional[str] = None,
    ):
        """
        Send callback notification to the specified URL.
        
        Args:
            callback_url: URL to send callback to
            task_id: Task ID
            task_type: Task type
            status: Task status
            message: Status message
            ontology_id: Ontology ID
            owner_id: Owner ID
            queue_position: Queue position (for pending status)
            tasks_ahead: Number of tasks ahead (for pending status)
            result: Task result (for completed status)
            error_message: Error message (for error status)
        """
        if not callback_url:
            logger.warning(f"[ImportTask] No callback URL for task {task_id}, skipping notification")
            return
        
        payload = {
            "task_id": task_id,
            "task_type": task_type,
            "status": status,
            "message": message,
            "ontology_id": ontology_id,
            "owner_id": owner_id,
            "created_at": datetime.now().isoformat(),
            "code": "500" if status == "failed" else "200",
        }
        
        if queue_position is not None:
            payload["queue_position"] = queue_position
        if tasks_ahead is not None:
            payload["tasks_ahead"] = tasks_ahead
        if error_message is not None:
            payload["error_message"] = error_message
        
        # Extract result data and include complete JSON
        if result is not None and isinstance(result, dict):
            error_list = result.get("error_list") or []
            stats = result.get("import_stats") or {}
            parse_stats = result.get("parse_stats") or {}
            
            # Basic data structure (all import types)
            if stats:
                stats["inserted_interfaces"] = 0
                stats["skipped_interfaces"] = 0
            data = {
                "import_stats": stats,  # Database write statistics (inserted/updated/skipped counts)
            }

            # OWL validation failures: preserve structured errors (typically in result['data'])
            if result.get("status") == "failed":
                validation_errors = result.get("data")
                if isinstance(validation_errors, list):
                    data["owl_validation_errors"] = validation_errors
            
            # CSV-specific statistics (only present for CSV/XLSX imports)
            # parse_stats and error_list are only generated during CSV parsing
            if error_list or parse_stats:
                data["csv_import_stats"] = {
                    "error_list": error_list,  # Parsing errors with line numbers
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
            
            # Complete JSON result (includes object/tag/link/action/logic with new/exist classification)
            # Only include result_json for successful tasks to avoid redundancy with error fields
            if status != "failed":
                payload["result_json"] = result
            logger.debug(f"[ImportTask] Result payload:\n {payload}")
        try:
            # Get cookie from environment (for authentication)
            cookie_value = os.getenv("TASK_CALLBACK_COOKIE")
            headers = {}
            if cookie_value:
                headers["Cookie"] = cookie_value
            
            import httpx
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.post(callback_url, json=payload, headers=headers)
                if response.history:
                    redirect_chain = " -> ".join(str(r.status_code) for r in response.history)
                    logger.info(
                        f"[ImportTask] Callback followed redirects: {redirect_chain} -> {response.status_code}"
                    )
                response.raise_for_status()
                logger.info(f"[ImportTask] Callback sent for task {task_id}, status: {status}")
                logger.debug(f"[ImportTask] Callback response: {response.text}")
        except Exception as e:
            logger.error(f"[ImportTask] Failed to send callback for task {task_id} to {callback_url}: {e}")
    
    async def stop_worker(self):
        """Stop the background worker and wait for it to finish"""
        self._shutdown = True
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            logger.info("Import task worker stopped")
        else:
            logger.info("Import task worker already stopped")


# Global service instance
_import_task_service: Optional[ImportTaskService] = None


def get_import_task_service() -> ImportTaskService:
    """Get or create the global import task service instance"""
    global _import_task_service
    if _import_task_service is None:
        _import_task_service = ImportTaskService()
    return _import_task_service

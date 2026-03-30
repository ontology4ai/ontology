"""
Batch Test Service

This module provides batch test execution service with Redis-based queue management.
It handles:
- Queue management for test cases
- Concurrent execution control (max 5 concurrent test cases)
- Dify API integration for test execution
- Result collection and storage
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from public.public_variable import logger, DifyAgentMode

# Constants
BATCH_TEST_QUEUE = "batch_test:queue"  # Redis queue name
BATCH_TEST_RUNNING = "batch_test:running"  # Redis set for running tasks
MAX_CONCURRENT_CASES = 5  # Maximum concurrent test cases

# Task status constants
STATUS_QUEUED = 0
STATUS_RUNNING = 1
STATUS_COMPLETED = 2
STATUS_ERROR = 3
STATUS_STOPPED = 4  # Manually stopped/terminated


class BatchTestService:
    """
    Service for managing batch test execution with queue and concurrency control.
    Supports graceful degradation: starts even if dependencies are not ready.
    """
    
    def __init__(self):
        self._mysql_service = None
        self._redis_service = None
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown = False
        self._dependencies_ready = False
    
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
    
    async def check_dependencies(self) -> Dict[str, Any]:
        """
        Check if all dependencies (MySQL, Redis, Dify config) are available.
        
        Returns:
            Dict with status and details of each dependency
        """
        result = {
            "all_ready": True,
            "mysql": {"ready": False, "error": None},
            "redis": {"ready": False, "error": None},
            "dify_config": {"ready": False, "error": None}
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
            await redis.queue_length(BATCH_TEST_QUEUE)
            result["redis"]["ready"] = True
        except Exception as e:
            result["redis"]["error"] = str(e)
            result["all_ready"] = False
            logger.debug(f"Redis not ready: {e}")
        
        # Check Dify config
        try:
            from config import get_dify_config_sync
            dify_config = get_dify_config_sync(DifyAgentMode.COMMON.value)
            if dify_config and dify_config.get("base_url") and dify_config.get("api_key"):
                result["dify_config"]["ready"] = True
            else:
                result["dify_config"]["error"] = "Dify configuration incomplete"
                result["all_ready"] = False
        except Exception as e:
            result["dify_config"]["error"] = str(e)
            result["all_ready"] = False
            logger.debug(f"Dify config not ready: {e}")
        
        self._dependencies_ready = result["all_ready"]
        return result
    
    async def submit_batch_test(self, task_ids: List[str]) -> Dict[str, Any]:
        """
        Submit a batch test request.
        
        All required information is queried from database tables.
        
        Args:
            task_ids: List of task IDs from ontology_dify_task table
            
        Returns:
            Dict with submitted task info
        """
        # Check dependencies before accepting tasks
        deps = await self.check_dependencies()
        if not deps["all_ready"]:
            error_details = []
            for dep_name, dep_info in deps.items():
                if dep_name != "all_ready" and not dep_info["ready"]:
                    error_details.append(f"{dep_name}: {dep_info['error']}")
            error_msg = "Batch test service dependencies not ready: " + "; ".join(error_details)
            logger.error(error_msg)
            return {
                "status": "failed", 
                "message": error_msg,
                "dependencies": deps
            }
        
        mysql = await self._get_mysql_service()
        redis = self._get_redis_service()
        
        if not task_ids:
            logger.warning("[BatchTest] No task IDs provided in request")
            return {"status": "failed", "message": "No task IDs provided"}
        
        logger.info(f"[BatchTest] Starting to query tasks from database, task_ids: {task_ids}, count: {len(task_ids)}")
        
        # 清理可能存在的旧事务，确保读取到最新已提交的数据
        # 这解决了连接池中连接可能处于旧事务中，导致 REPEATABLE-READ 隔离级别
        # 使用旧快照而读不到客户端刚提交的数据的问题
        try:
            await mysql.aexecute("COMMIT")
            logger.debug("[BatchTest] Committed any pending transaction before query")
        except Exception as commit_error:
            logger.warning(f"[BatchTest] Failed to commit before query (this is usually safe to ignore): {commit_error}")
        
        # Query task details from ontology_dify_task table (including exec_user and prompt_type from client)
        placeholders = ",".join(["%s"] * len(task_ids))
        query_sql = f"SELECT id, case_id, batch_num, exec_user, prompt_type FROM ontology_dify_task WHERE id IN ({placeholders})"
        query_params = tuple(task_ids)
        
        logger.info(f"[BatchTest] Executing SQL query: {query_sql}")
        logger.info(f"[BatchTest] Query parameters: {query_params}")
        
        tasks = await mysql.afetch_all(query_sql, query_params)
        
        logger.info(f"[BatchTest] Query completed, found {len(tasks) if tasks else 0} tasks")
        
        # 如果第一次查询失败，可能是客户端事务刚提交，做一次重试
        if not tasks:
            logger.warning(f"[BatchTest] First query found 0 tasks, retrying after 100ms...")
            await asyncio.sleep(0.1)  # 等待100ms
            
            # 再次清理事务并重查
            try:
                await mysql.aexecute("COMMIT")
            except:
                pass
            
            tasks = await mysql.afetch_all(query_sql, query_params)
            logger.info(f"[BatchTest] Retry query completed, found {len(tasks) if tasks else 0} tasks")
            
            if tasks:
                logger.info(f"[BatchTest] ✓ Retry succeeded! This confirms the issue was transaction commit timing.")
        
        if tasks:
            found_task_ids = [t.get('id') for t in tasks]
            logger.info(f"[BatchTest] Found task IDs from database: {found_task_ids}")
            # Check which task IDs were not found
            missing_task_ids = [tid for tid in task_ids if tid not in found_task_ids]
            if missing_task_ids:
                logger.warning(f"[BatchTest] Some task IDs were not found in database: {missing_task_ids}")
        else:
            logger.error(f"[BatchTest] No tasks found in database for any of the provided IDs: {task_ids}")
            logger.error(f"[BatchTest] This means either: 1) Tasks don't exist in DB, or 2) Client's transaction still not committed after 100ms")
        
        if not tasks:
            return {"status": "failed", "message": f"No tasks found for the given IDs: {task_ids}"}
        
        # Get unique case_ids
        case_ids = list(set(t["case_id"] for t in tasks if t.get("case_id")))
        logger.info(f"[BatchTest] Extracted unique case_ids from tasks: {case_ids}, count: {len(case_ids)}")
        
        # Query use case details
        use_cases = {}
        if case_ids:
            case_placeholders = ",".join(["%s"] * len(case_ids))
            case_query_sql = f"SELECT id, question, expected_result, normal_prompt, oag_prompt, ontology_name, workspace_id, owner_id FROM ontology_use_case WHERE id IN ({case_placeholders})"
            case_query_params = tuple(case_ids)
            
            logger.info(f"[BatchTest] Querying use cases with SQL: {case_query_sql}")
            logger.info(f"[BatchTest] Use case query parameters: {case_query_params}")
            
            cases = await mysql.afetch_all(case_query_sql, case_query_params)
            logger.info(f"[BatchTest] Found {len(cases) if cases else 0} use cases from database")
            
            if cases:
                found_case_ids = [c.get('id') for c in cases]
                logger.info(f"[BatchTest] Found case IDs: {found_case_ids}")
                missing_case_ids = [cid for cid in case_ids if cid not in found_case_ids]
                if missing_case_ids:
                    logger.warning(f"[BatchTest] Some case IDs were not found in database: {missing_case_ids}")
            
            use_cases = {c["id"]: c for c in cases}
        else:
            logger.warning("[BatchTest] No valid case_ids extracted from tasks")
        
        submitted_tasks = []
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        logger.info(f"[BatchTest] Starting to process {len(tasks)} tasks for queue submission")
        
        # Update tasks and add to queue
        for idx, task in enumerate(tasks):
            task_id = task["id"]
            case_id = task.get("case_id")
            batch_num = task.get("batch_num")
            exec_user = task.get("exec_user", "")  # Get exec_user from client-inserted value
            prompt_type = task.get("prompt_type", 0)  # Get prompt_type: 0-普通提示词, 1-OAG提示词
            
            logger.info(f"[BatchTest] Processing task {idx+1}/{len(tasks)}: task_id={task_id}, case_id={case_id}, batch_num={batch_num}, exec_user={exec_user}, prompt_type={prompt_type}")
            
            if not case_id:
                logger.warning(f"[BatchTest] Task {task_id} has no case_id, skipping")
                continue
            
            if case_id not in use_cases:
                logger.warning(f"[BatchTest] Task {task_id} has case_id={case_id} but this case was not found in use_cases table, skipping")
                continue
            
            use_case = use_cases[case_id]
            
            # Get all required fields from use case
            question = use_case.get("question")
            # Select prompt based on prompt_type: 1-OAG, 0-Normal
            if prompt_type == 1:
                task_sys_prompt = use_case.get("oag_prompt")
            else:
                task_sys_prompt = use_case.get("normal_prompt")
            ontology_name = use_case.get("ontology_name", "")
            workspace_id = use_case.get("workspace_id", "")
            
            logger.debug(f"[BatchTest] Task {task_id} use case details: ontology_name={ontology_name}, workspace_id={workspace_id}, has_question={bool(question)}, has_sys_prompt={bool(task_sys_prompt)}, prompt_type={prompt_type}")
            
            if not question:
                logger.warning(f"[BatchTest] Task {task_id} has no question in use case {case_id}, skipping")
                continue
            
            if not exec_user:
                logger.warning(f"[BatchTest] Task {task_id} has no exec_user, skipping")
                continue
            
            if not workspace_id:
                logger.warning(f"[BatchTest] Task {task_id} has no workspace_id in use case {case_id}, skipping")
                continue
            
            # Update task status to queued, set question, clear fields that will be filled during execution
            await mysql.aexecute(
                """UPDATE ontology_dify_task 
                   SET status = %s, question = %s, last_exec_time = %s,
                       conversation_id = NULL, task_id = NULL, last_exec_result = NULL
                   WHERE id = %s""",
                (STATUS_QUEUED, question, now, task_id)
            )
            
            # Create queue item
            queue_item = {
                "task_id": task_id,
                "case_id": case_id,
                "batch_num": batch_num,
                "question": question,
                "exec_user": exec_user,
                "workspace_id": workspace_id,
                "ontology_name": ontology_name,
                "sys_prompt": task_sys_prompt,
                "expected_result": use_case.get("expected_result", ""),
                "prompt_type": prompt_type,  # 0-普通提示词, 1-OAG提示词
            }
            
            # Push to Redis queue
            await redis.queue_push(BATCH_TEST_QUEUE, queue_item)
            submitted_tasks.append(task_id)
            logger.info(f"[BatchTest] Task {task_id} successfully submitted to queue")
        
        # Log queue status after submission
        queue_length = await redis.queue_length(BATCH_TEST_QUEUE)
        running_count = await redis.set_count(BATCH_TEST_RUNNING)
        logger.info(f"[BatchTest] Queue status: {queue_length} tasks waiting, {running_count} tasks running")
        
        # Log summary
        logger.info(f"[BatchTest] Batch submission summary: requested={len(task_ids)}, found_in_db={len(tasks)}, successfully_submitted={len(submitted_tasks)}, skipped={len(tasks)-len(submitted_tasks)}")
        if len(submitted_tasks) < len(task_ids):
            skipped_ids = [tid for tid in task_ids if tid not in submitted_tasks]
            logger.warning(f"[BatchTest] Some tasks were not submitted: {skipped_ids}")
        
        # Start worker if not running
        self._ensure_worker_running()
        
        return {
            "status": "success",
            "submitted_count": len(submitted_tasks),
            "submitted_tasks": submitted_tasks,
        }
    
    def start_worker(self):
        """
        Start the background worker (called at application startup).
        Worker will start even if dependencies are not ready, and will wait for them.
        """
        if self._worker_task is None or self._worker_task.done():
            self._shutdown = False
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Batch test worker started (will wait for dependencies if needed)")
    
    def _ensure_worker_running(self):
        """Ensure the background worker is running (legacy, use start_worker instead)"""
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
    
    async def _cleanup_stale_tasks(self, timeout_minutes: int = 30):
        """
        Clean up stale tasks that are stuck in running state.
        
        This handles cases where a worker crashes while executing a task,
        leaving it in the running set indefinitely.
        
        Args:
            timeout_minutes: Tasks running longer than this are considered stale
        """
        redis = self._get_redis_service()
        mysql = await self._get_mysql_service()
        
        # Commit any pending transaction to ensure we can read the latest data
        try:
            await mysql.aexecute("COMMIT", ())
        except Exception:
            pass  # Ignore commit errors
        
        try:
            running_tasks = await redis.set_members(BATCH_TEST_RUNNING)
            if not running_tasks:
                return
            
            now = datetime.now()
            cleaned_count = 0
            
            for task_id in running_tasks:
                # Check task status and time in database
                task = await mysql.afetch_one(
                    "SELECT status, last_exec_time FROM ontology_dify_task WHERE id = %s",
                    (task_id,)
                )
                
                if not task:
                    # Task not found in DB, remove from running set
                    await redis.set_remove(BATCH_TEST_RUNNING, task_id)
                    cleaned_count += 1
                    logger.warning(f"Removed non-existent task {task_id} from running set")
                    continue
                
                # Check if task is marked as running
                if task['status'] == STATUS_RUNNING:
                    last_time = task['last_exec_time']
                    if last_time:
                        elapsed_seconds = (now - last_time).total_seconds()
                        if elapsed_seconds > timeout_minutes * 60:
                            # Task timed out, mark as error and remove from running set
                            await redis.set_remove(BATCH_TEST_RUNNING, task_id)
                            await mysql.aexecute(
                                """UPDATE ontology_dify_task 
                                   SET status = %s, last_exec_result = %s
                                   WHERE id = %s""",
                                (STATUS_ERROR, f"Task timeout after {timeout_minutes} minutes", task_id)
                            )
                            cleaned_count += 1
                            logger.warning(f"Task {task_id} timed out after {elapsed_seconds:.0f}s, marked as error")
                
                # If task is completed, error, or stopped in DB but still in running set, clean it up
                elif task['status'] in [STATUS_COMPLETED, STATUS_ERROR, STATUS_STOPPED]:
                    await redis.set_remove(BATCH_TEST_RUNNING, task_id)
                    cleaned_count += 1
                    logger.info(f"Cleaned up completed task {task_id} from running set")
            
            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} stale tasks from running set")
                
        except Exception as e:
            logger.error(f"Error cleaning up stale tasks: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    async def _worker_loop(self):
        """
        Background worker loop that processes the queue.
        Supports graceful degradation: waits for dependencies to be ready.
        """
        # Track last cleanup time and last dependency check time
        last_cleanup_time = datetime.now()
        last_dep_check_time = datetime.now()
        cleanup_interval_seconds = 60  # Clean up every 60 seconds
        dep_check_interval_seconds = 30  # Check dependencies every 30 seconds
        
        logger.info("Batch test worker loop started")
        
        while not self._shutdown:
            try:
                # Periodic dependency check
                now = datetime.now()
                if (now - last_dep_check_time).total_seconds() > dep_check_interval_seconds:
                    deps = await self.check_dependencies()
                    last_dep_check_time = now
                    
                    if not deps["all_ready"]:
                        if not self._dependencies_ready:
                            # Still waiting for dependencies
                            logger.debug("Batch test worker waiting for dependencies...")
                        else:
                            # Dependencies were ready but now failed
                            logger.warning("Batch test worker dependencies became unavailable")
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
                            logger.info("Batch test worker dependencies are now ready, starting to process queue")
                
                # Dependencies are ready, proceed with normal processing
                redis = self._get_redis_service()
                
                # Periodic cleanup of stale tasks
                if (now - last_cleanup_time).total_seconds() > cleanup_interval_seconds:
                    await self._cleanup_stale_tasks(timeout_minutes=30)
                    last_cleanup_time = now
                
                # Check current running count
                running_count = await redis.set_count(BATCH_TEST_RUNNING)
                
                if running_count >= MAX_CONCURRENT_CASES:
                    # Wait a bit before checking again
                    await asyncio.sleep(1)
                    continue
                
                # Check queue length
                queue_len = await redis.queue_length(BATCH_TEST_QUEUE)
                if queue_len == 0:
                    # No tasks in queue, wait and check again
                    await asyncio.sleep(2)
                    continue
                
                # Pop task from queue (non-blocking)
                item_str = await redis.queue_pop(BATCH_TEST_QUEUE)
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
                
                # Add to running set
                await redis.set_add(BATCH_TEST_RUNNING, task_id)
                
                # Execute task in background (fire and forget with cleanup)
                asyncio.create_task(self._execute_task_with_cleanup(queue_item))
                
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                await asyncio.sleep(2)
    
    async def _execute_task_with_cleanup(self, queue_item: Dict[str, Any]):
        """Execute a task and clean up from running set when done"""
        task_id = queue_item.get("task_id")
        redis = self._get_redis_service()
        
        try:
            await self._execute_single_task(queue_item)
        finally:
            # Remove from running set
            await redis.set_remove(BATCH_TEST_RUNNING, task_id)
    
    async def _execute_single_task(self, queue_item: Dict[str, Any]):
        """
        Execute a single test task by calling Dify API.
        
        Args:
            queue_item: Queue item containing task details
        """
        import httpx
        from config import get_dify_config_sync
        
        mysql = await self._get_mysql_service()
        
        task_id = queue_item.get("task_id")
        question = queue_item.get("question")
        exec_user = queue_item.get("exec_user")
        workspace_id = queue_item.get("workspace_id")
        ontology_name = queue_item.get("ontology_name")
        sys_prompt = queue_item.get("sys_prompt")
        expected_result = queue_item.get("expected_result", "")
        prompt_type = queue_item.get("prompt_type", 0)  # 0-普通提示词, 1-OAG提示词
        
        logger.info(f"Executing task {task_id}, question: {question[:50]}..., prompt_type: {prompt_type}")
        
        # Update status to running
        await mysql.aexecute(
            "UPDATE ontology_dify_task SET status = %s WHERE id = %s",
            (STATUS_RUNNING, task_id)
        )
        
        try:
            # Read Dify configuration - select agent based on prompt_type
            # prompt_type: 0-普通提示词(dev agent), 1-OAG提示词(oag agent)
            agent_mode = DifyAgentMode.OAG if prompt_type == 1 else DifyAgentMode.COMMON
            dify_config = get_dify_config_sync(agent_mode.value)
            
            if not dify_config:
                logger.error(f"Dify configuration ({agent_mode.value} agent) not found in settings")
                raise Exception(f"Dify configuration ({agent_mode.value} agent) not found in settings")
            
            base_url = dify_config.get("base_url")
            api_key = dify_config.get("api_key")
            
            logger.debug(f"Dify base_url: {base_url}, api_key: {'***' if api_key else None}")
            
            if not base_url or not api_key:
                logger.error(f"Dify base_url or api_key not configured. base_url={base_url}, api_key exists={bool(api_key)}")
                raise Exception("Dify base_url or api_key not configured")
            
            # Prepare Dify request
            dify_url = f"{base_url.rstrip('/')}/v1/chat-messages"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            inputs = {}
            if sys_prompt:
                # 获取当前北京时间（UTC+8）
                beijing_time = datetime.now(timezone.utc) + timedelta(hours=8)
                beijing_time_str = beijing_time.strftime("%Y-%m-%d %H:%M")
                # 在 sys_prompt 后拼接北京时间
                inputs["sys_prompt"] = sys_prompt + f"\n # 当前北京时间\n{beijing_time_str}"
            
            request_body = {
                "inputs": inputs,
                "query": question,
                "response_mode": "streaming",
                "conversation_id": "",
                "user": exec_user,
                "auto_generate_name": False
            }
            
            # Process streaming response
            conversation_id = None
            dify_task_id = None
            all_graphs = []  # Collect all graph details
            node_sequence = []  # Track node IDs in order of MCP calls
            last_agent_thought = None  # Store the last agent_thought event
            final_answer = ""
            chunk_count = 0  # Track number of chunks processed
            
            async with httpx.AsyncClient(timeout=300.0, verify=False) as client:
                async with client.stream("POST", dify_url, headers=headers, json=request_body) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise Exception(f"Dify API error: {response.status_code}, {error_text}")
                    
                    async for line in response.aiter_lines():
                        # Check if task was stopped every 10 chunks
                        chunk_count += 1
                        if chunk_count % 10 == 0:
                            redis = self._get_redis_service()
                            
                            is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
                            if not is_running:
                                logger.info(f"Task {task_id} was stopped during streaming, exiting early")
                                return
                        
                        if not line or not line.startswith("data:"):
                            continue
                        
                        data_str = line[5:].strip()
                        if not data_str:
                            continue
                        
                        try:
                            data_obj = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        
                        event_type = data_obj.get("event")
                        # print(data_obj)
                        # Extract task_id from first chunk
                        if dify_task_id is None and data_obj.get("task_id"):
                            dify_task_id = data_obj.get("task_id")
                            # Update task_id in database
                            await mysql.aexecute(
                                "UPDATE ontology_dify_task SET task_id = %s WHERE id = %s",
                                (dify_task_id, task_id)
                            )
                        
                        # Extract conversation_id
                        if conversation_id is None and data_obj.get("conversation_id"):
                            conversation_id = data_obj.get("conversation_id")
                        
                        # Process agent_thought events - save the last one
                        if event_type == "agent_thought":
                            last_agent_thought = data_obj
                            # logger.info(f"Last agent thought: {last_agent_thought}")
                            # Try to get graph details
                            graph_detail = await self._get_graph_for_thought(
                                data_obj, workspace_id, ontology_name
                            )
                            # logger.info(f"Graph detail: {graph_detail}")
                            if graph_detail and (graph_detail.get("nodes") or graph_detail.get("edges")):
                                all_graphs.append(graph_detail)
                                # Track the first node ID for order edges
                                nodes = graph_detail.get("nodes", [])
                                if nodes:
                                    first_node_id = nodes[0].get("id")
                                    if first_node_id:
                                        node_sequence.append(first_node_id)
                        
                        # Handle message_end
                        elif event_type == "message_end":
                            if data_obj.get("conversation_id"):
                                conversation_id = data_obj.get("conversation_id")
            
            # Build final answer from the last agent_thought's thought field
            if last_agent_thought:
                final_answer = last_agent_thought.get("thought", "")
            # logger.info(f"Final answer from last agent_thought: {final_answer}")
            # Merge all graphs and add order edges
            merged_graph = self._merge_graphs(all_graphs, node_sequence)
            
            # Save graph to ontology_dify_graph
            if merged_graph and (merged_graph.get("nodes") or merged_graph.get("edges")):
                graph_id = uuid.uuid4().hex
                await mysql.aexecute(
                    """INSERT INTO ontology_dify_graph (id, conversation_id, graph) 
                       VALUES (%s, %s, %s) AS new_values
                       ON DUPLICATE KEY UPDATE graph = new_values.graph""",
                    (graph_id, conversation_id, json.dumps(merged_graph, ensure_ascii=False))
                )
                logger.info(f"Graph saved for conversation {conversation_id}")
            
            # Check if task was stopped before verify (use Redis for faster check)
            redis = self._get_redis_service()
            is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
            if not is_running:
                logger.info(f"Task {task_id} was stopped (not in running set), skipping verification and completion")
                return
            
            # Step 2: Verify the test result using verify agent
            verify_result = ""
            verify_reason = ""
            try:
                verify_result, verify_reason = await self._verify_test_result(
                    task_id=task_id,
                    question=question,
                    expected_result=expected_result,
                    actual_result=final_answer,
                    exec_user=exec_user
                )
                logger.info(f"Task {task_id} verification completed: result={verify_result}")
            except Exception as ve:
                logger.warning(f"Task {task_id} verification failed: {ve}, continuing without verification")
            
            # Check again if task was stopped before final update (use Redis for faster check)
            redis = self._get_redis_service()
            is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
            if not is_running:
                logger.info(f"Task {task_id} was stopped (not in running set), not updating to completed")
                return
            
            # Update task as completed
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            await mysql.aexecute(
                """UPDATE ontology_dify_task 
                   SET status = %s, conversation_id = %s, last_exec_result = %s, last_exec_time = %s,
                       summary = %s, last_exec_detail = %s
                   WHERE id = %s""",
                (STATUS_COMPLETED, conversation_id, final_answer, now, verify_result, verify_reason, task_id)
            )
            
            logger.info(f"Task {task_id} completed successfully, conversation_id: {conversation_id}")
            
        except Exception as e:
            logger.error(f"Task {task_id} execution failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Update task as error
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            await mysql.aexecute(
                """UPDATE ontology_dify_task 
                   SET status = %s, last_exec_result = %s, last_exec_time = %s
                   WHERE id = %s""",
                (STATUS_ERROR, str(e), now, task_id)
            )
    
    async def _verify_test_result(
        self,
        task_id: str,
        question: str,
        expected_result: str,
        actual_result: str,
        exec_user: str
    ) -> tuple:
        """
        Verify the test result using the verify agent.
        
        Args:
            task_id: The task ID (for checking if stopped)
            question: The original test case question
            expected_result: The expected result from use case
            actual_result: The actual result from test execution
            exec_user: The execution user
            
        Returns:
            tuple: (result, reason) from verification
        """
        import httpx
        from config import get_dify_config_sync
        from utils.component.prompt_templates.prompts import PromptTemplates
        from public.public_function import extract_json
        
        # Check if task was stopped before starting verification
        redis = self._get_redis_service()
        is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
        if not is_running:
            logger.info(f"Task {task_id} was stopped before verification, skipping verify")
            return ("", "")
        
        logger.info(f"Verifying test result for question: {question[:50]}..., expected_result: {expected_result[:50]}..., actual_result: {actual_result[:50]}...")
        # Get verify agent configuration
        verify_config = get_dify_config_sync(DifyAgentMode.VERIFY.value)
        
        if not verify_config:
            logger.warning("Verify agent configuration not found, skipping verification")
            return ("", "")
        
        base_url = verify_config.get("base_url")
        api_key = verify_config.get("api_key")
        
        if not base_url or not api_key:
            logger.warning("Verify agent base_url or api_key not configured, skipping verification")
            return ("", "")
        
        # Build verification query using the prompt template
        verify_query = PromptTemplates.RESULT_VERIFICATION_PROMPT.value.format(
            use_case=question,
            expected_result=expected_result,
            actual_result=actual_result
        )
        
        # Prepare Dify request - no sys_prompt, only query
        dify_url = f"{base_url.rstrip('/')}/v1/chat-messages"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        request_body = {
            "inputs": {},
            "query": verify_query,
            "response_mode": "streaming",
            "conversation_id": "",
            "user": exec_user,
            "auto_generate_name": False
        }
        
        # Process streaming response - only agent_message events
        agent_messages = []
        chunk_count = 0  # Track number of chunks for periodic stop check
        
        async with httpx.AsyncClient(timeout=300.0, verify=False) as client:
            async with client.stream("POST", dify_url, headers=headers, json=request_body) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise Exception(f"Verify Dify API error: {response.status_code}, {error_text}")
                
                async for line in response.aiter_lines():
                    # Check if task was stopped every 5 chunks (more frequent than main task)
                    chunk_count += 1
                    if chunk_count % 5 == 0:
                        is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
                        if not is_running:
                            logger.info(f"Task {task_id} was stopped during verification streaming, exiting early")
                            return ("", "")
                    
                    if not line or not line.startswith("data:"):
                        continue
                    
                    data_str = line[5:].strip()
                    if not data_str:
                        continue
                    
                    try:
                        data_obj = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    
                    event_type = data_obj.get("event")
                    
                    # Only collect agent_message events
                    if event_type == "agent_message":
                        answer = data_obj.get("answer", "")
                        if answer:
                            agent_messages.append(answer)
                    
                    # End of message
                    elif event_type == "message_end":
                        break
        
        # Check if task was stopped after streaming completes
        is_running = await redis.set_is_member(BATCH_TEST_RUNNING, task_id)
        if not is_running:
            logger.info(f"Task {task_id} was stopped after verification streaming, skipping result processing")
            return ("", "")
        
        # Build final text and extract JSON
        final_text = "".join(agent_messages)
        logger.info(f"Verification full response text: {final_text}")
        
        # Extract JSON result
        json_results = extract_json(final_text)
        logger.info(f"Extracted JSON results: {json_results}, count: {len(json_results) if json_results else 0}")
        
        if json_results and len(json_results) > 0:
            result_obj = json_results[0]
            # Check if result_obj is a dictionary
            if isinstance(result_obj, dict):
                result = result_obj.get("result", "")
                reason = result_obj.get("reason", "")
                return (result, reason)
            else:
                logger.warning(f"Extracted result is not a dict, got type: {type(result_obj)}, value: {result_obj}")
                return ("", str(result_obj))
        else:
            logger.warning(f"Failed to extract JSON from verification response: {final_text[:200]}...")
            return ("", final_text[:500])
    
    async def _get_graph_for_thought(
        self,
        event_data: Dict[str, Any],
        workspace_id: str,
        ontology_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get graph details for an agent_thought event.
        Similar to _transform_agent_thought but only returns graph data.
        """
        tool = event_data.get("tool", "")
        tool_input = event_data.get("tool_input", "")
        observation = event_data.get("observation", "")
        
        # Only process start events (tool set, no observation yet)
        if not tool or observation:
            return None
        
        # Parse tool input to determine type
        from utils.ontology_helpers import parse_mcp_tool_input
        mcp_details = parse_mcp_tool_input(tool, tool_input)
        running_type = mcp_details.get("running_type")
        running_detail = mcp_details.get("running_detail", {})
        
        if not running_type or running_type == "unknown":
            return None
        
        try:
            if running_type == "object":
                object_name = running_detail.get("object_name")
                if object_name:
                    from core.ontology.api_services import get_related_graph_data_by_name
                    result = await get_related_graph_data_by_name(
                        ontology_name=ontology_name,
                        object_type_name=object_name,
                        workspace_id=workspace_id,
                        pub_version=False
                    )
                    if result.status == "success" and result.data:
                        return result.data
            
            elif running_type == "action":
                action_name = running_detail.get("action_name")
                if action_name:
                    from core.ontology.api_services import get_objects_by_action_name
                    result = await get_objects_by_action_name(
                        ontology_name=ontology_name,
                        action_name=action_name,
                        workspace_id=workspace_id,
                        pub_version=False
                    )
                    if result.status == "success" and result.data:
                        from utils.ontology_helpers import convert_action_data_to_graph_detail
                        return convert_action_data_to_graph_detail(result.data)
            
            elif running_type == "logic":
                logic_name = running_detail.get("logic_name")
                if logic_name:
                    from core.ontology.api_services import get_objects_by_logic_name
                    result = await get_objects_by_logic_name(
                        ontology_name=ontology_name,
                        logic_name=logic_name,
                        workspace_id=workspace_id,
                        pub_version=False
                    )
                    if result.status == "success" and result.data:
                        from utils.ontology_helpers import convert_logic_data_to_graph_detail
                        return convert_logic_data_to_graph_detail(result.data)
                        
        except Exception as e:
            logger.error(f"Failed to get graph for {running_type}: {e}")
        
        return None
    
    def _merge_graphs(self, graphs: List[Dict[str, Any]], node_sequence: List[str] = None) -> Dict[str, Any]:
        """
        Merge multiple graph details into one, filtering to keep only base nodes.
        
        Similar to client-side logic:
        - Only keeps nodes that are in node_sequence (base nodes from MCP calls)
        - Only keeps relation edges where both source and target are base nodes
        - Adds order edges based on MCP call sequence
        
        Args:
            graphs: List of graph details from agent_thought events
            node_sequence: List of node IDs in the order they were called (base nodes)
        """
        if not graphs:
            return {"nodes": [], "edges": []}
        
        # Convert node_sequence to a set for faster lookup
        base_node_ids = set(node_sequence) if node_sequence else set()
        
        # First, collect all nodes and edges
        all_nodes = {}
        all_edges = {}
        
        for graph in graphs:
            nodes = graph.get("nodes", [])
            edges = graph.get("edges", [])
            
            for node in nodes:
                node_id = node.get("id")
                if node_id and node_id not in all_nodes:
                    all_nodes[node_id] = node
            
            for edge in edges:
                source = edge.get("source")
                target = edge.get("target")
                if source and target:
                    edge_key = (source, target)
                    if edge_key not in all_edges:
                        all_edges[edge_key] = edge
        
        # Filter nodes: only keep base nodes (those in node_sequence)
        filtered_nodes = {}
        if base_node_ids:
            for node_id in base_node_ids:
                if node_id in all_nodes:
                    filtered_nodes[node_id] = all_nodes[node_id]
        else:
            # If no node_sequence provided, keep all nodes (backward compatibility)
            filtered_nodes = all_nodes
        
        # Filter relation edges: only keep edges where both source and target are base nodes
        filtered_edges = []
        for edge_key, edge in all_edges.items():
            source, target = edge_key
            if source in filtered_nodes and target in filtered_nodes:
                filtered_edges.append(edge)
        
        # Create order edges based on node_sequence
        order_edges = []
        if node_sequence and len(node_sequence) > 1:
            for i in range(len(node_sequence) - 1):
                source_id = node_sequence[i]
                target_id = node_sequence[i + 1]
                # Only create order edge if both nodes exist in filtered_nodes
                if source_id in filtered_nodes and target_id in filtered_nodes:
                    order_edge = {
                        "source": source_id,
                        "target": target_id,
                        "label": str(i + 1),
                        "linkType": "order",
                        "id": f"{source_id}-{target_id}-{i + 1}-order"
                    }
                    order_edges.append(order_edge)
        
        # Combine relation edges and order edges
        all_edges_final = filtered_edges + order_edges
        
        return {
            "nodes": list(filtered_nodes.values()),
            "edges": all_edges_final
        }
    
    async def stop_tasks(self, task_ids: List[str]) -> Dict[str, Any]:
        """
        Stop running or queued test tasks.
        
        Args:
            task_ids: List of task IDs (business IDs from ontology_dify_task table)
        
        Returns:
            Dict with stop results for each task
        """
        import httpx
        from config import get_dify_config_sync
        
        redis = self._get_redis_service()
        mysql = await self._get_mysql_service()
        
        logger.info(f"[BatchTest] Received stop request for task_ids: {task_ids}, count: {len(task_ids)}")
        
        # Commit any pending transaction to ensure we can read the latest data
        try:
            await mysql.aexecute("COMMIT", ())
            logger.debug("[BatchTest] Committed any pending transaction before stop query")
        except Exception as commit_error:
            logger.warning(f"[BatchTest] Failed to commit before stop query (this is usually safe to ignore): {commit_error}")
        
        results = []
        stopped_count = 0
        failed_count = 0
        skipped_count = 0
        
        # Query task information from database
        for task_id in task_ids:
            logger.info(f"[BatchTest] Processing stop request for task_id: {task_id}")
            result = {
                "task_id": task_id,
                "dify_task_id": None,
                "status": "unknown",
                "message": ""
            }
            
            try:
                # Query task details from database (including prompt_type)
                logger.debug(f"[BatchTest] Querying task {task_id} from database for stop operation")
                task_row = await mysql.afetch_one(
                    "SELECT task_id, exec_user, status, prompt_type FROM ontology_dify_task WHERE id = %s",
                    (task_id,)
                )
                
                if not task_row:
                    result["status"] = "not_found"
                    result["message"] = "Task not found in database"
                    logger.warning(f"[BatchTest] Task {task_id} not found in database during stop operation")
                    failed_count += 1
                    results.append(result)
                    continue
                
                logger.debug(f"[BatchTest] Task {task_id} found in database: dify_task_id={task_row.get('task_id')}, status={task_row.get('status')}, prompt_type={task_row.get('prompt_type')}")
                
                dify_task_id = task_row.get("task_id")  # Dify task ID
                exec_user = task_row.get("exec_user", "system")
                task_status = task_row.get("status")
                prompt_type = task_row.get("prompt_type", 0)  # 0-普通提示词, 1-OAG提示词
                
                # Get Dify configuration based on prompt_type
                agent_mode = DifyAgentMode.OAG if prompt_type == 1 else DifyAgentMode.COMMON
                dify_config = get_dify_config_sync(agent_mode.value)
                if not dify_config:
                    logger.error(f"[BatchTest] Dify configuration ({agent_mode.value}) not found for task {task_id}")
                    result["status"] = "failed"
                    result["message"] = f"Dify configuration ({agent_mode.value}) not found"
                    failed_count += 1
                    results.append(result)
                    continue
                
                base_url = dify_config.get("base_url")
                api_key = dify_config.get("api_key")
                
                result["dify_task_id"] = dify_task_id
                
                # Check if task is already completed, in error state, or already stopped
                if task_status in [STATUS_COMPLETED, STATUS_ERROR, STATUS_STOPPED]:
                    result["status"] = "skipped"
                    result["message"] = f"Task already completed (status={task_status})"
                    logger.info(f"Task {task_id} already completed with status {task_status}, skipping")
                    skipped_count += 1
                    results.append(result)
                    continue
                
                # Check if task is in running set
                running_tasks = await redis.set_members(BATCH_TEST_RUNNING)
                is_running = task_id in running_tasks
                
                # Check if task is in queue
                queue_items = await redis.queue_peek(BATCH_TEST_QUEUE)
                is_queued = False
                queue_item_to_remove = None
                
                for item_str in queue_items:
                    try:
                        item = json.loads(item_str)
                        if item.get("task_id") == task_id:
                            is_queued = True
                            queue_item_to_remove = item_str
                            break
                    except json.JSONDecodeError:
                        continue
                
                # Handle running task
                if is_running:
                    # Call Dify stop API if dify_task_id is available
                    if dify_task_id:
                        try:
                            dify_url = f"{base_url.rstrip('/')}/v1/chat-messages/{dify_task_id}/stop"
                            headers = {
                                "Authorization": f"Bearer {api_key}",
                                "Content-Type": "application/json"
                            }
                            request_body = {"user": exec_user}
                            
                            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                                response = await client.post(dify_url, headers=headers, json=request_body)
                                
                                if response.status_code == 200:
                                    logger.info(f"Successfully stopped Dify task {dify_task_id}")
                                    result["message"] = "Stopped running task"
                                else:
                                    logger.warning(f"Failed to stop Dify task {dify_task_id}: {response.status_code}")
                                    result["message"] = f"Failed to stop Dify task: {response.status_code}"
                        except Exception as e:
                            logger.error(f"Error stopping Dify task {dify_task_id}: {e}")
                            result["message"] = f"Error calling Dify stop API: {str(e)}"
                    else:
                        # No dify_task_id yet (task just started, not yet assigned)
                        result["message"] = "Stopped running task (dify_task_id not yet assigned)"
                        logger.info(f"Stopping task {task_id} without dify_task_id (not yet assigned)")
                    
                    # Remove from running set
                    await redis.set_remove(BATCH_TEST_RUNNING, task_id)
                    
                    # Update database status to stopped (status 4)
                    await mysql.aexecute(
                        "UPDATE ontology_dify_task SET status = %s WHERE id = %s",
                        (STATUS_STOPPED, task_id)
                    )
                    
                    result["status"] = "stopped"
                    stopped_count += 1
                
                # Handle queued task
                elif is_queued and queue_item_to_remove:
                    # Remove from queue
                    removed = await redis.queue_remove(BATCH_TEST_QUEUE, queue_item_to_remove, count=0)
                    
                    if removed > 0:
                        # Update database status to stopped (status 4)
                        await mysql.aexecute(
                            "UPDATE ontology_dify_task SET status = %s WHERE id = %s",
                            (STATUS_STOPPED, task_id)
                        )
                        
                        result["status"] = "removed"
                        result["message"] = "Removed from queue"
                        stopped_count += 1
                        logger.info(f"Removed task {task_id} from queue")
                    else:
                        result["status"] = "failed"
                        result["message"] = "Failed to remove from queue"
                        failed_count += 1
                
                # Task not found in queue or running set
                else:
                    result["status"] = "not_found"
                    result["message"] = "Task not in queue or running set"
                    logger.warning(f"Task {task_id} not found in queue or running set")
            
            except Exception as e:
                logger.error(f"Error stopping task {task_id}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                result["status"] = "error"
                result["message"] = str(e)
                failed_count += 1
            
            results.append(result)
        
        return {
            "status": "success",
            "stopped_count": stopped_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "results": results
        }
    
    async def stop_worker(self):
        """Stop the background worker and wait for it to finish"""
        self._shutdown = True
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            logger.info("Batch test worker stopped")
        else:
            logger.info("Batch test worker already stopped")


# Global service instance
_batch_test_service: Optional[BatchTestService] = None


def get_batch_test_service() -> BatchTestService:
    """Get or create the global batch test service instance"""
    global _batch_test_service
    if _batch_test_service is None:
        _batch_test_service = BatchTestService()
    return _batch_test_service


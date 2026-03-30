"""本体导出/导入模块 (仅 MySQL，简化结构)

本模块提供本体数据的导出和导入功能：
- 从 MySQL 导出本体结构为 tar 包
- 从 tar 包导入本体结构到 MySQL
- 支持批量操作和事务保护

导出结构：
<export_root>/<ontology_name>/
    ontology.json                 # 本体元数据（附统计）
    objects/                      # 对象类型及其属性
    relations/                    # 关系类型及标签
    actions/                      # 动作及参数
    logic/                        # 逻辑类型

符合 PEP 8 风格指南和面向对象设计原则（SOLID）。
"""

from __future__ import annotations

from pathlib import Path
import asyncio
import json
import tarfile
import shutil
from datetime import datetime
from typing import Any, Dict, List, Iterable, Tuple, Optional
import uuid
import logging
from urllib.parse import urlparse
import httpx
from minio import Minio
from minio.error import S3Error
from config import get_minio_config_sync
from utils.databases import create_mysql_service
from utils.databases.mysql.mysql_service import MySQLService
from core.ontology.rdf_services import (
	_resolve_net_gate,
	_resolve_sandbox_server,
	_resolve_sandbox_env,
	_tick,
	_tock,
)
import tempfile
import zipfile
import os

logger = logging.getLogger(__name__)


# ===================== 文件系统辅助函数 =====================

def _safe_dir_name(name: str) -> str:
	"""转换为安全的文件系统目录名
	
	保留中文字符，替换非法字符为下划线。
	"""
	invalid = set('<>\\/:"|?*')
	return ''.join('_' if c in invalid else c for c in name).strip() or 'ontology'


def _new_id() -> str:
	"""生成新的 UUID（32位十六进制字符串）"""
	return uuid.uuid4().hex


# ===================== 数据处理辅助函数 =====================

def _ensure_jsonable(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
	"""将数据行转换为 JSON 可序列化格式（处理 datetime 等类型）"""
	processed = []
	for r in rows:
		nd = {}
		for k, v in r.items():
			if hasattr(v, 'isoformat'):
				nd[k] = v.isoformat()
			else:
				nd[k] = v
		processed.append(nd)
	return processed


# ===================== SQL 数据库辅助函数 =====================


class OntologyExporter:
	"""本体导出器
	
	负责从 MySQL 导出本体数据并打包为 tar 文件。
	遵循单一职责原则（SRP）：仅处理导出逻辑。
	"""
	
	def __init__(self, mysql_service=None):
		"""初始化导出器
		
		参数:
			mysql_service: MySQL 服务实例（必须传入，因为 create_mysql_service 是异步函数）
		
		注意:
			由于 create_mysql_service() 是异步函数，不能在 __init__ 中调用
			必须先异步创建 MySQL 服务实例，然后传入此构造函数
		"""
		if mysql_service is None:
			raise RuntimeError("MySQL 服务实例是必需的。请先使用 await create_mysql_service() 创建实例")
		self.mysql: MySQLService = mysql_service
		self._minio_client: Optional[Minio] = None
		self._minio_bucket: Optional[str] = None
		self._minio_base_url: Optional[str] = None
		self._minio_prefix: str = "ontology-exports"
		self._minio_secure: bool = False
		self._minio_bucket_ready: bool = False
		self._minio_region: Optional[str] = None
		self._configure_minio()

	def _configure_minio(self) -> None:
		"""根据配置初始化 MinIO 客户端 (配置延迟获取)"""
		try:
			config = get_minio_config_sync()
		except Exception as exc:
			logger.error(f"[minio] 加载配置失败: {exc}")
			return
		if not config:
			logger.info("[minio] 未找到 MinIO 配置，跳过远程上传")
			return

		host = (config.get("host") or "").strip()
		if not host:
			logger.warning("[minio] host 未配置，跳过 MinIO 上传")
			return

		parsed = urlparse(host)
		endpoint = parsed.netloc or parsed.path or host
		secure = config.get("secure") if config.get("secure") is not None else parsed.scheme == "https"
		scheme = parsed.scheme or ("https" if secure else "http")
		base = endpoint.rstrip("/")
		self._minio_secure = bool(secure)
		self._minio_base_url = f"{scheme}://{base}"
		self._minio_bucket = (config.get("bucket") or "").strip()
		self._minio_prefix = (config.get("prefix") or "ontology-exports").strip("/")
		self._minio_region = config.get("region")

		if not self._minio_bucket:
			logger.warning("[minio] bucket 未配置，跳过 MinIO 上传")
			return
		if not config.get("access_key") or not config.get("secret_key"):
			logger.warning("[minio] access_key 或 secret_key 未配置，跳过 MinIO 上传")
			return

		try:
			self._minio_client = Minio(
				base,
				access_key=config.get("access_key"),
				secret_key=config.get("secret_key"),
				secure=self._minio_secure,
				region=config.get("region"),
			)
		except Exception as exc:
			logger.error(f"[minio] 初始化 MinIO 客户端失败: {exc}")
			self._minio_client = None

	def _ensure_minio_bucket(self) -> None:
		"""确保目标 bucket 存在"""
		if not self._minio_client or not self._minio_bucket:
			return
		if self._minio_bucket_ready:
			return
		try:
			if not self._minio_client.bucket_exists(self._minio_bucket):
				if self._minio_region:
					self._minio_client.make_bucket(self._minio_bucket, location=self._minio_region)
				else:
					self._minio_client.make_bucket(self._minio_bucket)
		except S3Error as exc:
			if exc.code == "BucketAlreadyOwnedByYou":
				self._minio_bucket_ready = True
				return
			logger.error(f"[minio] Bucket 校验失败: {exc}")
			return
		self._minio_bucket_ready = True

	async def _upload_tar_to_minio(self, tar_path: Path, ontology_name: str) -> Optional[Dict[str, str]]:
		"""上传 tar 文件到 MinIO 并返回对象信息"""
		if not tar_path.exists():
			logger.warning(f"[minio] 本地 tar 不存在: {tar_path}")
			return None
		if not self._minio_client or not self._minio_bucket or not self._minio_base_url:
			return None

		safe_name = _safe_dir_name(ontology_name)
		ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
		key_parts = [self._minio_prefix, safe_name, f"{safe_name}_{ts}.tar"]
		target_key = "/".join(part for part in key_parts if part)

		def _do_upload() -> Optional[str]:
			try:
				self._ensure_minio_bucket()
				if not self._minio_bucket_ready:
					return None
				if self._minio_client and self._minio_bucket:
					self._minio_client.fput_object(
						self._minio_bucket,
						target_key,
						str(tar_path),
						content_type="application/x-tar",
					)
				return target_key
			except S3Error as exc:
				logger.error(f"[minio] 上传失败: {exc}")
				return None
			except Exception as exc:
				logger.error(f"[minio] 未知上传错误: {exc}")
				return None

		object_key = await asyncio.to_thread(_do_upload)
		if not object_key:
			return None
		url = f"{self._minio_base_url}/{self._minio_bucket}/{object_key}"
		return {
			'url': url,
			'bucket': self._minio_bucket,
			'object_name': object_key,
			'base_url': self._minio_base_url,
		}
	
	async def _download_code_from_sandbox(
		self, 
		ontology_name: str, 
		base_dir: Path,
		net_gate: Optional[str] = None,
		sandbox_server: Optional[str] = None
	) -> None:
		"""从沙箱服务下载代码文件并解压到 base_dir/code 目录
		
		参数:
			ontology_name: 本体名称
			base_dir: 导出的基础目录
			net_gate: 网关地址（可选）
			sandbox_server: 沙箱服务地址（可选）
		"""
		t_start = _tick()
		logger.info(f"[sandbox] 开始从沙箱服务下载代码文件: {ontology_name}")
		
		try:
			# 1. 构建下载 URL
			env = _resolve_sandbox_env(net_gate, sandbox_server)
			download_url = f"{env['base']}/api/v1/ontology/download/{ontology_name}"
			logger.info(f"[sandbox] 下载 URL: {download_url}")
			
			# 2. 请求下载
			async with httpx.AsyncClient(timeout=120.0) as client:
				response = await client.get(download_url)
				
				if response.status_code != 200:
					logger.warning(
						f"[sandbox] 下载失败，状态码: {response.status_code}, "
						f"响应: {response.text[:200]}"
					)
					return
				
				# 3. 保存到临时文件
				temp_dir = tempfile.mkdtemp()
				try:
					zip_path = os.path.join(temp_dir, f"{ontology_name}.zip")
					
					with open(zip_path, 'wb') as f:
						for chunk in response.iter_bytes(chunk_size=8192):
							f.write(chunk)
					
					logger.info(f"[sandbox] 文件已下载到: {zip_path}")
					
					# 4. 解压到临时目录
					extract_dir = os.path.join(temp_dir, "extracted")
					with zipfile.ZipFile(zip_path, 'r') as zip_ref:
						zip_ref.extractall(extract_dir)
					
					logger.info(f"[sandbox] 文件已解压到: {extract_dir}")
					
					# 5. 将 ontology/ 和 ontology_apis/ 复制到 code/ 目录
					code_dir = base_dir / 'code'
					code_dir.mkdir(parents=True, exist_ok=True)
					
					# 复制 ontology 目录
					ontology_src = os.path.join(extract_dir, 'ontology')
					if os.path.exists(ontology_src):
						ontology_dst = code_dir / 'ontology'
						if ontology_dst.exists():
							shutil.rmtree(ontology_dst)
						shutil.copytree(ontology_src, ontology_dst)
						logger.info(f"[sandbox] 已复制 ontology 目录到: {ontology_dst}")
					else:
						logger.warning(f"[sandbox] 未找到 ontology 目录: {ontology_src}")
					
					# 复制 ontology_apis 目录
					ontology_apis_src = os.path.join(extract_dir, 'ontology_apis')
					if os.path.exists(ontology_apis_src):
						ontology_apis_dst = code_dir / 'ontology_apis'
						if ontology_apis_dst.exists():
							shutil.rmtree(ontology_apis_dst)
						shutil.copytree(ontology_apis_src, ontology_apis_dst)
						logger.info(f"[sandbox] 已复制 ontology_apis 目录到: {ontology_apis_dst}")
					else:
						logger.warning(f"[sandbox] 未找到 ontology_apis 目录: {ontology_apis_src}")
					
					elapsed = _tock(t_start, "[sandbox] 代码文件下载完成")
					logger.info(f"[sandbox] 代码文件下载总耗时: {elapsed:.3f}秒")
					
				finally:
					# 清理临时目录
					try:
						shutil.rmtree(temp_dir)
					except Exception as e:
						logger.warning(f"[sandbox] 清理临时目录失败: {e}")
		
		except httpx.HTTPError as e:
			logger.error(f"[sandbox] HTTP 请求失败: {e}")
		except zipfile.BadZipFile as e:
			logger.error(f"[sandbox] ZIP 文件损坏: {e}")
		except Exception as e:
			logger.error(f"[sandbox] 下载代码文件失败: {e}")
			# 不抛出异常，允许导出流程继续（没有代码文件也可以完成基本导出）
	
	async def _fetch_mysql_rows(self, ontology_id: str) -> Dict[str, Any]:
		"""从 MySQL 获取本体相关的所有数据（并发查询优化）
		
		性能优化：将 9 个表的查询拆分并使用 asyncio.gather() 并发执行，
		去掉 JSON_OBJECT 序列化开销，直接返回原生列数据。
		
		参数:
			ontology_id: 本体 ID
		
		返回:
			字典包含：ontology、object_types、object_type_attributes、
			link_types、link_type_tags、tags、logic_types、actions、
			action_params 等完整数据集。
		"""
		t_start = _tick()
		logger.info(f"[db_perf] 开始并发导出查询: ontology_id={ontology_id}")
		
		# 定义所有查询（去掉 JSON_OBJECT，直接查询原生列）
		async def query_ontology():
			sql = f"""
				SELECT *
				FROM ontology_manage 
				WHERE id = '{ontology_id}'
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_object_types():
			sql = f"""
				SELECT *
				FROM ontology_object_type 
				WHERE ontology_id = '{ontology_id}' 
				AND (sync_status IS NULL OR sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_attributes():
			sql = f"""
				SELECT a.*
				FROM ontology_object_type_attribute a
				INNER JOIN ontology_object_type o ON a.object_type_id = o.id
				WHERE o.ontology_id = '{ontology_id}'
				AND (o.sync_status IS NULL OR o.sync_status <> 3)
				AND (a.sync_status IS NULL OR a.sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_link_types():
			sql = f"""
				SELECT *
				FROM ontology_link_type 
				WHERE ontology_id = '{ontology_id}' 
				AND (sync_status IS NULL OR sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_link_type_tags():
			sql = f"""
				SELECT ltt.*
				FROM ontology_link_type_tag ltt
				INNER JOIN ontology_link_type lt ON ltt.link_type_id = lt.id
				WHERE lt.ontology_id = '{ontology_id}'
				AND (lt.sync_status IS NULL OR lt.sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_tags():
			sql = f"""
				SELECT *
				FROM ontology_tag
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_logic_types():
			sql = f"""
				SELECT *
				FROM ontology_logic_type 
				WHERE ontology_id = '{ontology_id}' 
				AND (sync_status IS NULL OR sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_actions():
			sql = f"""
				SELECT *
				FROM ontology_object_type_action 
				WHERE ontology_id = '{ontology_id}' 
				AND (sync_status IS NULL OR sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_action_params():
			sql = f"""
				SELECT ap.*
				FROM ontology_object_type_action_param ap
				INNER JOIN ontology_object_type_action a ON ap.action_id = a.id
				WHERE a.ontology_id = '{ontology_id}'
				AND (a.sync_status IS NULL OR a.sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_apis():
			sql = f"""
				SELECT a.*
				FROM ontology_api a
				INNER JOIN ontology_manage om ON om.id = '{ontology_id}'
				WHERE a.workspace_id = om.workspace_id
				  AND (a.sync_status IS NULL OR a.sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_api_params():
			sql = f"""
				SELECT ap.*
				FROM ontology_api_param ap
				INNER JOIN ontology_api a ON ap.api_id = a.id
				INNER JOIN ontology_manage om ON om.id = '{ontology_id}'
				WHERE a.workspace_id = om.workspace_id
				  AND (a.sync_status IS NULL OR a.sync_status <> 3)
			"""
			return await self.mysql.afetch_all(sql)
		
		async def query_prompts():
			sql = f"""
				SELECT * 
				FROM ontology_prompt 
				WHERE ontology_id = '{ontology_id}' 
				AND default_type = 0 
				AND sync_status < 3
			"""
			return await self.mysql.afetch_all(sql)
		
		# 并发执行所有查询
		t_query = _tick()
		results = await asyncio.gather(
			query_ontology(),
			query_object_types(),
			query_attributes(),
			query_link_types(),
			query_link_type_tags(),
			query_tags(),
			query_logic_types(),
			query_actions(),
			query_action_params(),
			query_apis(),
			query_api_params(),
			query_prompts()
		)
		elapsed_query = _tock(t_query, "[db_perf] 并发查询完成")
		
		# 组装数据（无需 JSON 反序列化）
		t_assemble = _tick()
		data = {
			'ontology': results[0][0] if results[0] else None,
			'object_types': results[1] or [],
			'object_type_attributes': results[2] or [],
			'link_types': results[3] or [],
			'link_type_tags': results[4] or [],
			'tags': results[5] or [],
			'logic_types': results[6] or [],
			'actions': results[7] or [],
			'action_params': results[8] or [],
			'apis': results[9] or [],
			'api_params': results[10] or [],
			'prompts': results[11] or []
		}
		elapsed_assemble = _tock(t_assemble, "[db_perf] 数据组装完成")
		
		# 验证本体存在
		if not data['ontology']:
			raise ValueError(f"本体 ID {ontology_id} 不存在")
		
		total_elapsed = _tock(t_start, "[db_perf] 导出查询总耗时")
		
		# 统计信息
		total_rows = sum([
			len(data['object_types']),
			len(data['object_type_attributes']),
			len(data['link_types']),
			len(data['link_type_tags']),
			len(data['tags']),
			len(data['logic_types']),
			len(data['actions']),
			len(data['action_params']),
			len(data['prompts']),
			1  # ontology
		])
		
		logger.info(f"[db_perf] 并发查询完成: 总计 {total_rows} 行数据")
		logger.info(f"[db_perf] - 查询耗时: {elapsed_query:.3f}秒")
		logger.info(f"[db_perf] - 组装耗时: {elapsed_assemble:.3f}秒")
		logger.info(f"[db_perf] - 总耗时: {total_elapsed:.3f}秒")
		logger.info(f"[db_perf] 数据明细: {len(data['object_types'])} 对象, "
		           f"{len(data['object_type_attributes'])} 属性, "
		           f"{len(data['link_types'])} 关系, "
		           f"{len(data['actions'])} 动作, "
		           f"{len(data['logic_types'])} 逻辑")
		
		return data
	
	async def export(
		self,
		ontology_id: str, 
		*, 
		keep_dir: bool = False
	) -> Dict[str, Any]:
		"""导出本体数据并打包为 tar 文件
		
		从 MySQL 导出指定本体的完整结构（对象、关系、动作、逻辑），
		生成标准目录结构后打包为 tar 文件。
		
		参数:
			ontology_id: 本体 ID
			keep_dir: 是否保留临时目录（默认 False 自动删除）
		
		返回:
			包含以下键的字典：
			- tar_path: tar 文件绝对路径
			- root_dir: 临时目录路径（keep_dir=True 时）
			- ontology_name: 本体名称
			- counts: 导出统计信息
			- files: 文件清单
		"""
		data = await self._fetch_mysql_rows(ontology_id)
		onto_row = data['ontology']
		ontology_name_raw = (onto_row.get('ontology_name') or 
		                     onto_row.get('ontology_label') or 'ontology')
		ontology_name = _safe_dir_name(str(ontology_name_raw))

		base_dir = Path('examples') / '导出案例' / ontology_name
		if base_dir.exists():
			ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
			base_dir = base_dir.parent / f"{ontology_name}_{ts}"
		base_dir.mkdir(parents=True, exist_ok=True)

		objects_dir = base_dir / 'objects'
		relations_dir = base_dir / 'relations'
		actions_dir = base_dir / 'actions'
		logic_dir = base_dir / 'logic'
		apis_dir = base_dir / 'apis'
		prompt_dir = base_dir / 'prompt'
		for d in (objects_dir, relations_dir, actions_dir, logic_dir, apis_dir, prompt_dir):
			d.mkdir(parents=True, exist_ok=True)

		# -------- ontology.json --------
		onto_json = _ensure_jsonable([onto_row])[0]
		onto_json['original_id'] = onto_row.get('id')
		onto_json['export_time'] = datetime.utcnow().isoformat() + 'Z'

		# -------- objects --------
		attr_by_object: Dict[str, List[Dict[str, Any]]] = {}
		for attr in data['object_type_attributes']:
			oid = attr.get('object_type_id')
			attr_by_object.setdefault(oid, []).append(attr)
		for obj in data['object_types']:
			obj_id = str(obj['id'])
			base_name = _safe_dir_name(obj.get('object_type_name') or obj_id)
			id_suffix = (_safe_dir_name(obj_id) or obj_id)[:8]
			file_name = f"{base_name or 'object'}__{id_suffix}"
			attrs = attr_by_object.get(obj_id, [])
			obj_payload = dict(obj)
			obj_payload['original_id'] = obj_id
			attr_payloads = []
			for a in attrs:
				ap = dict(a)
				ap['original_id'] = a.get('id')
				ap['object_type_original_id'] = obj_id
				attr_payloads.append(ap)
			payload = {
				'object_type': _ensure_jsonable([obj_payload])[0],
				'attributes': _ensure_jsonable(attr_payloads)
			}
			(objects_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)

		# -------- relations (link_type + tags) --------
		tags_map = {t['id']: t for t in data['tags']}
		ltt_by_link: Dict[str, List[Dict[str, Any]]] = {}
		for ltt in data['link_type_tags']:
			lid = ltt.get('link_type_id')
			ltt_by_link.setdefault(lid, []).append(ltt)

		# 构建 object_type_id -> object_type_name 映射
		object_type_name_map = {
			obj['id']: obj.get('object_type_name') 
			for obj in data['object_types']
		}

		relation_name_counter: Dict[str, int] = {}
		for link in data['link_types']:
			# 优先从 source_name/target_name 获取，如果为空则通过 object_type_id 查询
			source_name = (
				link.get('source_name') 
				or object_type_name_map.get(link.get('source_object_type_id'))
				or 'source'
			)
			target_name = (
				link.get('target_name')
				or object_type_name_map.get(link.get('target_object_type_id'))
				or 'target'
			)
			
			# 同时填充到 link 对象中，供导入时使用
			link['source_name'] = source_name
			link['target_name'] = target_name
			
			base_name = (
				_safe_dir_name(f"{source_name}-{target_name}") or 'relation'
			)
			# 处理重名
			final_name = base_name
			if final_name in relation_name_counter:
				relation_name_counter[final_name] += 1
				suffix = relation_name_counter[final_name]
				# 使用 id 前 6 位避免冲突过多
				final_name = f"{base_name}_{str(link.get('id'))[:6]}_{suffix}"
			else:
				relation_name_counter[final_name] = 0

			# 收集标签
			tag_refs = []
			for ref in ltt_by_link.get(link['id'], []):
				tag_id = ref.get('tag_id')
				tag_row = tags_map.get(tag_id)
				if tag_row:
					merged = dict(tag_row)
					# 保留 link_type_tag 关联信息
					merged['link_direct'] = ref.get('link_direct')
					merged['link_type_tag_id'] = ref.get('id')
					tag_refs.append(_ensure_jsonable([merged])[0])

			link_payload = dict(link)
			link_payload['original_id'] = link.get('id')
			link_payload['source_object_type_original_id'] = (
				link.get('source_object_type_id')
			)
			link_payload['target_object_type_original_id'] = (
				link.get('target_object_type_id')
			)
			relation_payload = {
				'link_type': _ensure_jsonable([link_payload])[0],
				'tags': tag_refs
			}
			(relations_dir / f"{final_name}.json").write_text(
				json.dumps(relation_payload, ensure_ascii=False, indent=2),
				'utf-8'
			)

		# -------- actions (仅导出 build_type='function') --------
		function_actions = [
			action for action in data['actions']
			if (action.get('build_type') or 'function').lower() == 'function'
		]
		params_by_action: Dict[str, List[Dict[str, Any]]] = {}
		for p in data['action_params']:
			aid = p.get('action_id')
			params_by_action.setdefault(aid, []).append(p)
		# 创建 object_type_original_id -> name 映射
		obj_id_to_name = {
			o['id']: o.get('object_type_name') 
			for o in data['object_types']
		}
		for action in function_actions:
			action_id = str(action.get('id'))
			action_name = action.get('action_name') or action_id
			base_name = _safe_dir_name(str(action_name)) or 'action'
			id_suffix = (_safe_dir_name(action_id) or action_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			action_payload = dict(action)
			action_payload['original_id'] = action.get('id')
			action_payload['object_type_original_id'] = (
				action.get('object_type_id')
			)
			action_payload['object_type_name'] = (
				obj_id_to_name.get(action.get('object_type_id'))
			)
			param_rows = []
			for p in params_by_action.get(action['id'], []):
				pp = dict(p)
				pp['original_id'] = p.get('id')
				pp['action_original_id'] = action.get('id')
				param_rows.append(pp)
			payload = {
				'action': _ensure_jsonable([action_payload])[0],
				'params': _ensure_jsonable(param_rows)
			}
			(actions_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)

		# -------- logic (仅导出 build_type='function') --------
		function_logics = [
			logic for logic in data['logic_types']
			if (logic.get('build_type') or 'function').lower() == 'function'
		]
		for logic in function_logics:
			logic_id = str(logic.get('id'))
			logic_name = logic.get('logic_type_name') or logic_id
			base_name = _safe_dir_name(str(logic_name)) or 'logic'
			id_suffix = (_safe_dir_name(logic_id) or logic_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			logic_payload = dict(logic)
			logic_payload['original_id'] = logic.get('id')
			payload = {'logic': _ensure_jsonable([logic_payload])[0]}
			(logic_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)

		# -------- prompt (仅导出 default_type= 0) --------
		function_prompt = [
			prompt for prompt in data['prompts']
			if (prompt.get('default_type') == 0)
		]
		for prompt in function_prompt:
			prompt_id = str(prompt.get('id'))
			prompt_name = prompt.get('prompt_name') or prompt_id
			base_name = _safe_dir_name(str(prompt_name)) or 'prompt'
			id_suffix = (_safe_dir_name(prompt_id) or prompt_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			prompt_payload = dict(prompt)
			prompt_payload['original_id'] = prompt.get('id')
			payload = {'prompt': _ensure_jsonable([prompt_payload])[0]}
			(prompt_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)
		
		# -------- apis --------
		params_by_api: Dict[str, List[Dict[str, Any]]] = {}
		for param in data['api_params']:
			api_id = param.get('api_id')
			params_by_api.setdefault(api_id, []).append(param)
		
		for api in data['apis']:
			api_id = str(api['id'])
			api_name = api.get('api_name') or api_id
			base_name = _safe_dir_name(str(api_name)) or 'api'
			id_suffix = (_safe_dir_name(api_id) or api_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			
			# 构建API基本信息
			api_payload = dict(api)
			api_payload['original_id'] = api_id
			
			# 构建参数列表
			param_payloads = []
			for param in params_by_api.get(api_id, []):
				param_payload = dict(param)
				param_payload['original_id'] = param.get('id')
				param_payload['api_original_id'] = api_id
				param_payloads.append(param_payload)
			
			# 组装完整数据
			payload = {
				'api': _ensure_jsonable([api_payload])[0],
				'params': _ensure_jsonable(param_payloads)
			}
			
			# 写入文件
			(apis_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)

		# -------- interface（接口定义、属性、约束） --------
		# 第一步：通过 object_type 的 interface_id 收集需要导出的 interface
		interface_ids = set()
		for obj in data['object_types']:
			interface_id = obj.get('interface_id')
			if interface_id:
				interface_ids.add(interface_id)
		
		interface_rows = []
		interface_attribute_rows = []
		interface_constraint_rows = []
		
		if interface_ids:
			# 查询 ontology_interface
			interface_ids_str = ','.join([f"'{iid}'" for iid in interface_ids])
			interface_sql = f"""
				SELECT *
				FROM ontology_interface
				WHERE id IN ({interface_ids_str})
				AND (sync_status IS NULL OR sync_status < 3)
			"""
			interface_rows = await self.mysql.afetch_all(interface_sql)
			
			# 查询 ontology_interface_attribute
			if interface_rows:
				attr_sql = f"""
					SELECT *
					FROM ontology_interface_attribute
					WHERE interface_id IN ({interface_ids_str})
					AND (sync_status IS NULL OR sync_status < 3)
				"""
				interface_attribute_rows = await self.mysql.afetch_all(attr_sql)
				
				# 查询 ontology_interface_constraint
				constraint_sql = f"""
					SELECT *
					FROM ontology_interface_constraint
					WHERE interface_id IN ({interface_ids_str})
					AND (sync_status IS NULL OR sync_status < 3)
				"""
				interface_constraint_rows = await self.mysql.afetch_all(constraint_sql)
		
		# 创建 interface 目录结构
		interface_dir = base_dir / 'interface'
		interface_objects_dir = interface_dir / 'interface_objects'
		interface_constraints_dir = interface_dir / 'interface_constraints'
		for d in (interface_objects_dir, interface_constraints_dir):
			d.mkdir(parents=True, exist_ok=True)
		
		# 按 interface_id 分组 attributes
		attrs_by_interface: Dict[str, List[Dict[str, Any]]] = {}
		for attr in interface_attribute_rows:
			iid = attr.get('interface_id')
			if iid:
				attrs_by_interface.setdefault(iid, []).append(attr)
		
		# 按 interface_id 分组 constraints
		constraints_by_interface: Dict[str, List[Dict[str, Any]]] = {}
		for constraint in interface_constraint_rows:
			iid = constraint.get('interface_id')
			if iid:
				constraints_by_interface.setdefault(iid, []).append(constraint)
		
		# 生成 interface_objects 文件
		for interface in interface_rows:
			interface_id = str(interface['id'])
			interface_name = interface.get('interface_name') or interface_id
			base_name = _safe_dir_name(str(interface_name)) or 'interface'
			id_suffix = (_safe_dir_name(interface_id) or interface_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			
			# 构建 interface 基本信息
			interface_payload = dict(interface)
			interface_payload['original_id'] = interface_id
			
			# 构建 attributes 列表
			attr_payloads = []
			for attr in attrs_by_interface.get(interface_id, []):
				attr_payload = dict(attr)
				attr_payload['original_id'] = attr.get('id')
				attr_payload['interface_original_id'] = interface_id
				attr_payloads.append(attr_payload)
			
			# 组装数据
			payload = {
				'interface': _ensure_jsonable([interface_payload])[0],
				'attributes': _ensure_jsonable(attr_payloads)
			}
			
			# 写入文件
			(interface_objects_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)
		
		# 生成 interface_constraints 文件
		for interface in interface_rows:
			interface_id = str(interface['id'])
			interface_name = interface.get('interface_name') or interface_id
			base_name = _safe_dir_name(str(interface_name)) or 'interface'
			id_suffix = (_safe_dir_name(interface_id) or interface_id)[:8]
			file_name = f"{base_name}__{id_suffix}"
			
			# 构建 constraints 列表
			constraint_payloads = []
			for constraint in constraints_by_interface.get(interface_id, []):
				constraint_payload = dict(constraint)
				constraint_payload['original_id'] = constraint.get('id')
				constraint_payload['interface_original_id'] = interface_id
				constraint_payloads.append(constraint_payload)
			
			# 组装数据
			payload = {
				'interface_id': interface_id,
				'constraints': _ensure_jsonable(constraint_payloads)
			}
			
			# 写入文件
			(interface_constraints_dir / f"{file_name}.json").write_text(
				json.dumps(payload, ensure_ascii=False, indent=2), 'utf-8'
			)

		# 汇总统计（仅统计实际导出的 function 类型）
		counts = {
			'objects': len(data['object_types']),
			'attributes': len(data['object_type_attributes']),
			'relations': len(data['link_types']),
			'relation_tags': len(data['link_type_tags']),
			'actions': len(function_actions),
			'action_params': sum(len(params_by_action.get(a['id'], [])) for a in function_actions),
			'logic': len(function_logics),
			'apis': len(data['apis']),
			'api_params': len(data['api_params']),
			'prompt': len(data['prompts']),
			'interfaces': len(interface_rows),
			'interface_attributes': len(interface_attribute_rows),
			'interface_constraints': len(interface_constraint_rows)
		}
		onto_json['stats'] = counts
		(base_dir / 'ontology.json').write_text(
			json.dumps(onto_json, ensure_ascii=False, indent=2), 'utf-8'
		)

		# -------- 从沙箱服务下载代码文件 --------
		await self._download_code_from_sandbox(ontology_name_raw, base_dir)

		# 打包
		tar_path = base_dir.with_suffix('.tar')
		with tarfile.open(tar_path, 'w') as tar:
			tar.add(base_dir, arcname=ontology_name)

		file_list = [
			str(p.relative_to(base_dir)) 
			for p in base_dir.rglob('*') if p.is_file()
		]

		minio_info = await self._upload_tar_to_minio(tar_path, ontology_name)

		# 默认删除临时目录，仅保留 tar 文件
		root_dir_ret: str | None = str(base_dir)
		if not keep_dir:
			try:
				shutil.rmtree(base_dir)
				root_dir_ret = None
			except Exception as e:
				# 失败不影响主流程，记录日志
				print(f"[export] 删除临时目录失败: {e}")

		# 根据上传情况返回信息（默认仅保留必要字段）
		tar_path_str = str(tar_path.resolve())
		result: Dict[str, Any] = {
			'ontology_name': ontology_name,
			'stats': counts,  # 始终返回统计信息
		}
		if minio_info:
			result['tar_url'] = minio_info['url']
			result['storage'] = {
				'provider': 'minio',
				'bucket': minio_info['bucket'],
				'object_name': minio_info['object_name'],
				'base_url': minio_info['base_url'],
			}
			try:
				tar_path.unlink(missing_ok=True)
			except Exception as exc:
				logger.warning(f"[export] 删除本地 tar 失败: {exc}")
		else:
			result.update({
				'tar_path': tar_path_str,
				'root_dir': root_dir_ret,
				'files': file_list,
			})
		return result


# ===================== 导入功能分割线 =====================


class OntologyImporter:
	"""本体导入器
	
	负责从 tar 文件导入本体数据到 MySQL。
	遵循单一职责原则（SRP）：仅处理导入逻辑。
	"""
	
	def __init__(self, mysql_service=None):
		"""初始化导入器
		
		参数:
			mysql_service: MySQL 服务实例（必须传入，因为 create_mysql_service 是异步函数）
		
		注意:
			由于 create_mysql_service() 是异步函数，不能在 __init__ 中调用
			必须先异步创建 MySQL 服务实例，然后传入此构造函数
		"""
		if mysql_service is None:
			raise RuntimeError("MySQL 服务实例是必需的。请先使用 await create_mysql_service() 创建实例")
		self.mysql: MySQLService = mysql_service
		self._col_cache: Dict[str, List[str]] = {}  # 表结构缓存（延迟加载）
	
	def _preload_table_schemas_fast(self, conn):
		"""快速预加载表结构（单次批量查询 information_schema）
		
		使用 information_schema.COLUMNS 一次性获取所有表的列信息，
		比逐个 SHOW COLUMNS 快 10+ 倍
		"""
		tables = [
			'ontology_manage', 'ontology_tag', 'ontology_object_type',
			'ontology_object_type_attribute', 'ontology_link_type', 
			'ontology_link_type_tag', 'ontology_object_type_action',
			'ontology_object_type_action_param', 'ontology_logic_type',
			'ontology_api', 'ontology_api_param', 'ontology_prompt',
		]
		
		t_preload = _tick()
		cursor = conn.cursor()
		
		try:
			# 单次查询获取所有表的列信息（避免 9 次 SHOW COLUMNS）
			placeholders = ','.join(['%s'] * len(tables))
			query = f"""
				SELECT TABLE_NAME, COLUMN_NAME 
				FROM information_schema.COLUMNS 
				WHERE TABLE_SCHEMA = DATABASE() 
				  AND TABLE_NAME IN ({placeholders})
				ORDER BY TABLE_NAME, ORDINAL_POSITION
			"""
			cursor.execute(query, tables)
			rows = cursor.fetchall()
			
			# 按表名分组
			for table_name, col_name in rows:
				if table_name not in self._col_cache:
					self._col_cache[table_name] = []
				self._col_cache[table_name].append(col_name)
				
		except Exception as e:
			logger.warning(f"批量加载表结构失败: {e}，回退到逐表查询")
			# 回退方案：逐表查询
			for table in tables:
				if table not in self._col_cache:
					try:
						cursor.execute(f"SHOW COLUMNS FROM {table}")
						rows = cursor.fetchall()
						self._col_cache[table] = [r[0] for r in rows if r]
					except Exception as ex:
						logger.warning(f"加载表结构失败 {table}: {ex}")
		
		elapsed = _tock(t_preload, "[db_perf] 表结构预加载完成")
		logger.info(f"[db_perf] 预加载 {len(tables)} 个表结构，耗时 {elapsed:.3f}秒")
	
	def _get_cols(self, table: str) -> List[str]:
		"""获取表的列名（带缓存）"""
		if not hasattr(self, '_col_cache'):
			self._col_cache: Dict[str, List[str]] = {}
		if table not in self._col_cache:
			rows = self.mysql.fetch_all(f"SHOW COLUMNS FROM {table}") or []
			self._col_cache[table] = [r['Field'] for r in rows if 'Field' in r]
		return self._col_cache[table]
	
	async def _check_existing_apis(
		self, 
		api_rows: List[Dict[str, Any]], 
		workspace_id: str
	) -> Tuple[List[Dict[str, Any]], List[str]]:
		"""检查数据库中是否存在同名 API
		
		参数:
			api_rows: 待检测的 API 列表
			workspace_id: 工作空间 ID
		
		返回:
			- filtered_api_rows: 过滤后的 API 列表（不包含重名）
			- skipped_api_names: 被跳过的 API 名称列表
		"""
		if not api_rows:
			return [], []
		
		# 提取所有待导入的 api_name
		api_names = [api.get('api_name') for api in api_rows if api.get('api_name')]
		
		if not api_names:
			return api_rows, []
		
		# 构建查询语句（使用 IN 批量查询）
		placeholders = ','.join(['%s'] * len(api_names))
		sql = f"""
			SELECT api_name 
			FROM ontology_api 
			WHERE workspace_id = %s 
			  AND api_name IN ({placeholders})
			  AND (sync_status IS NULL OR sync_status <> 3)
		"""
		
		params = [workspace_id] + api_names
		existing_apis = await self.mysql.afetch_all(sql, params)
		existing_api_names = {row['api_name'] for row in existing_apis}
		
		# 过滤掉重名的 API
		filtered_rows = []
		skipped_names = []
		
		for api in api_rows:
			api_name = api.get('api_name')
			if api_name in existing_api_names:
				skipped_names.append(api_name)
				logger.warning(f"[import] 跳过重名 API: {api_name} (workspace_id={workspace_id})")
			else:
				filtered_rows.append(api)
		
		if skipped_names:
			logger.info(f"[import] 检测到 {len(skipped_names)} 个重名 API，已跳过")
		
		return filtered_rows, skipped_names
	
	def _bulk_insert(
		self, 
		table: str, 
		rows: List[Dict[str, Any]], 
		chunk: int = 5000,
		conn=None
	) -> int:
		"""同步批量插入（分批，使用 executemany 优化）
		
		性能优化：
		- chunk 从 1000 增大到 5000，减少网络往返次数
		- 添加性能计时和日志记录
		- 使用 INSERT ... VALUES 批量语法（MySQL 最佳实践）
		- 预缓存表结构，避免重复查询 SHOW COLUMNS
		- 优化字符串拼接，减少内存分配
		- 支持传入连接对象，避免重复创建连接
		
		参数:
			table: 表名
			rows: 待插入的数据行列表
			chunk: 批量大小（默认 5000，根据 MySQL max_allowed_packet 调整）
			conn: 可选的数据库连接对象（用于事务内复用）
		
		返回:
			影响的行数
		"""
		if not rows:
			return 0
		
		t_start = _tick()
		
		# 优化：提前获取列结构（使用缓存）
		table_cols = set(self._get_cols(table))
		
		# 优化：只遍历一次数据，同时构建列名和值矩阵
		cols: List[str] = []
		cols_set = set()
		matrix: List[List[Any]] = []
		
		for r in rows:
			# 首次遍历：收集所有列名（保持顺序）
			if not cols:
				for k in r.keys():
					if k in table_cols and k not in cols_set:
						cols.append(k)
						cols_set.add(k)
			# 构建值列表
			matrix.append([r.get(k) for k in cols])
		
		# 预构建 SQL 模板（避免重复字符串拼接）
		placeholder_row = f"({','.join(['%s'] * len(cols))})"
		col_names = ','.join(cols)
		
		affected_total = 0
		batch_count = 0
		
		for i in range(0, len(matrix), chunk):
			batch = matrix[i:i+chunk]
			batch_count += 1
			
			# 使用 INSERT ... VALUES 批量语法
			placeholders = ','.join([placeholder_row] * len(batch))
			sql = f"INSERT INTO {table} ({col_names}) VALUES {placeholders}"
			
			# 展平参数列表（使用列表推导式优化）
			flat = [val for row_vals in batch for val in row_vals]
			
			# 如果提供了连接对象，使用它；否则使用默认execute
			if conn:
				cursor = conn.cursor()
				cursor.execute(sql, flat)
				affected_total += cursor.rowcount
			else:
				affected_total += self.mysql.execute(sql, flat)
		
		elapsed = _tock(t_start, f"[db_perf] _bulk_insert {table}")
		logger.info(f"[db_perf] {table} 插入: {len(rows)}行 / {batch_count}批 / {elapsed:.3f}秒")
		
		return affected_total
	
	async def import_from_tar(
		self,
		tar_path: str,
		*,
		owner_id: str = 'system',
		workspace_id: Optional[str] = None,
		ontology_name: Optional[str] = None,
		ontology_label: Optional[str] = None,
		ontology_desc: Optional[str] = None,
		preserve_original_ids: bool = False,
		return_mapping: bool = False,
	) -> Dict[str, Any]:
		"""从 tar 文件导入本体数据到 MySQL
		
		采用高性能批量导入策略：
		- 事务包裹确保原子性（全部成功或全部回滚）
		- 批量 INSERT 减少数据库往返
		- 自动生成新 ID 并维护映射关系
		
		参数:
			tar_path: tar 文件路径
			owner_id: 所有者 ID（必填，用于区分迁入内容归属）
			workspace_id: 工作空间 ID（选填，覆盖原工作空间）
			ontology_name: 本体名称（选填，覆盖原名称）
			ontology_label: 本体标签（选填，覆盖原标签）
			ontology_desc: 本体描述（选填，覆盖原描述）
			preserve_original_ids: 是否保留原始 ID
			return_mapping: 是否返回 ID 映射表
		
		返回:
			包含导入统计信息和新本体 ID 的字典
		"""
		p = Path(tar_path)
		if not p.exists():
			raise FileNotFoundError(f"tar 文件不存在: {tar_path}")
		extract_root = p.parent / f"_import_tmp_{p.stem}_bulk"
		if extract_root.exists():
			shutil.rmtree(extract_root)
		extract_root.mkdir(parents=True, exist_ok=True)
		with tarfile.open(p, 'r') as tar:
			tar.extractall(path=extract_root)

		def _cleanup_extract_root():
			if extract_root.exists():
				try:
					shutil.rmtree(extract_root)
				except Exception as cleanup_err:
					logger.warning(f"[import] 删除临时目录失败: {cleanup_err}")

		onto_file = next(extract_root.rglob('ontology.json'), None)
		if not onto_file:
			raise RuntimeError('ontology.json 未找到')
		ontology_meta = json.loads(onto_file.read_text(encoding='utf-8'))

		original_onto_id = (
			ontology_meta.get('id') or ontology_meta.get('ontology_id')
		)
		# 始终生成新 ontology_id（除非显式要求保留）
		new_onto_id = (
			original_onto_id 
			if preserve_original_ids and original_onto_id 
			else _new_id()
		)
		now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

		# 映射容器（original_id -> new_id）方便后续外键替换与调试
		object_type_map: Dict[str, str] = {}
		attribute_map: Dict[str, str] = {}  
		link_type_map: Dict[str, str] = {}
		tag_map: Dict[str, str] = {}
		action_map: Dict[str, str] = {}
		logic_map: Dict[str, str] = {}
		prompt_map: Dict[str, str] = {}
		interface_map: Dict[str, str] = {}  # interface ID 映射
		interface_attribute_map: Dict[str, str] = {}  # interface_attribute ID 映射

		# -------- 构造所有待插入行数据 --------
		onto_row = dict(ontology_meta)
		for k in ['stats', 'export_time']:
			onto_row.pop(k, None)
		
		# 应用覆盖参数（选填字段优先使用传入值，否则保留原值）
		update_dict = {
			'id': new_onto_id,
			'ontology_id': new_onto_id,
			'owner_id': owner_id,  # 必填，强制覆盖
			'create_time': onto_row.get('create_time') or now,
			'last_update': now,  # 更新为当前时间
		}
		
		# 工作空间 ID：必填时覆盖，否则保留原值
		if workspace_id:
			update_dict['workspace_id'] = workspace_id
		
		# 本体名称：有传入值则覆盖，否则保留原值
		if ontology_name:
			update_dict['ontology_name'] = ontology_name
		
		# 本体标签：有传入值则覆盖，否则保留原值
		if ontology_label:
			update_dict['ontology_label'] = ontology_label
		
		# 本体描述：有传入值则覆盖，否则保留原值
		if ontology_desc:
			update_dict['ontology_desc'] = ontology_desc
		
		onto_row.update(update_dict)
		ontology_rows = [onto_row]

		# Interfaces 解析 - Objects (优先解析以供 Objects 引用)
		t_parse_interfaces_objs = _tick()
		interface_dir = next(extract_root.rglob('interface'), None)
		interface_rows: List[Dict[str, Any]] = []
		interface_attribute_rows: List[Dict[str, Any]] = []
		interface_constraint_rows: List[Dict[str, Any]] = []
		
		if interface_dir and interface_dir.is_dir():
			interface_objects_dir = interface_dir / 'interface_objects'
			
			async def parse_interface_object_file(interface_file):
				"""异步解析单个 interface_objects 文件"""
				payload = json.loads(await asyncio.to_thread(interface_file.read_text, 'utf-8'))
				interface_row = payload['interface']
				original_interface_id = interface_row.get('original_id') or interface_row.get('id')
				new_interface_id = original_interface_id if preserve_original_ids and original_interface_id else _new_id()
				
				ir = {
					**interface_row,
					'id': new_interface_id,
					'ontology_id': new_onto_id,
					'owner_id': owner_id,
				}
				ir.pop('original_id', None)
				if 'create_time' not in ir or not ir['create_time']:
					ir['create_time'] = now
				if 'last_update' not in ir or not ir['last_update']:
					ir['last_update'] = now
				
				# 处理属性
				attrs = []
				for attr in payload.get('attributes', []):
					original_attr_id = attr.get('original_id') or attr.get('id')
					new_attr_id = _new_id()

					# 填充 interface_attribute_map
					if original_attr_id:
						interface_attribute_map[original_attr_id] = new_attr_id

					ar = {
						**attr,
						'id': new_attr_id,
						'interface_id': new_interface_id,
						'owner_id': owner_id,
					}
					ar.pop('original_id', None)
					ar.pop('interface_original_id', None)
					if 'create_time' not in ar or not ar['create_time']:
						ar['create_time'] = now
					if 'last_update' not in ar or not ar['last_update']:
						ar['last_update'] = now
					attrs.append(ar)
				
				return {
					'interface_row': ir,
					'attribute_rows': attrs,
					'interface_id_mapping': {original_interface_id: new_interface_id} if original_interface_id else {}
				}

			# 并发解析 interface_objects 文件
			if interface_objects_dir.exists():
				interface_object_files = sorted(interface_objects_dir.glob('*.json'))
				if interface_object_files:
					interface_results = await asyncio.gather(*[parse_interface_object_file(f) for f in interface_object_files])
					
					for result in interface_results:
						interface_rows.append(result['interface_row'])
						interface_attribute_rows.extend(result['attribute_rows'])
						interface_map.update(result['interface_id_mapping'])
			
			elapsed_parse_interfaces_objs = _tock(t_parse_interfaces_objs, "[db_perf] Interface Objects 解析完成")
			logger.info(f"[db_perf] 解析 {len(interface_rows)} 个 interface，{len(interface_attribute_rows)} 个属性，耗时 {elapsed_parse_interfaces_objs:.3f}秒")
		else:
			logger.info("[import] 未找到 interface/ 目录，跳过 interface 导入 (或者目录为空)")

		# 对象与属性（并发读取优化）
		t_parse_start = _tick()
		objects_dir = next(extract_root.rglob('objects'))
		object_type_rows: List[Dict[str, Any]] = []
		attribute_rows: List[Dict[str, Any]] = []
		
		# 并发读取所有对象文件
		async def parse_object_file(obj_file):
			"""异步解析单个对象文件"""
			payload = json.loads(await asyncio.to_thread(obj_file.read_text, 'utf-8'))
			ot = payload['object_type']
			name = ot.get('object_type_name')
			original_id = ot.get('original_id') or ot.get('id') or name
			
			# 为对象类型生成新 id
			new_obj_id = original_id if preserve_original_ids and original_id else _new_id()
			
			# 构建对象行
			row = {**ot, 'id': new_obj_id, 'ontology_id': new_onto_id, 'owner_id': owner_id}
			row.pop('original_id', None)
			
			# 映射 interface_id（如果存在）
			if 'interface_id' in row and row['interface_id']:
				original_interface_id = row['interface_id']
				new_interface_id = interface_map.get(original_interface_id)
				if new_interface_id:
					row['interface_id'] = new_interface_id
				else:
					# 如果映射不存在，清空 interface_id 避免外键错误
					row['interface_id'] = None
			
			if 'create_time' not in row or not row['create_time']:
				row['create_time'] = now
			if 'last_update' not in row or not row['last_update']:
				row['last_update'] = now
			
			# 构建属性行
			attrs = []
			attr_mappings = {}
			for attr in payload.get('attributes', []):
				original_attr_id = attr.get('original_id') or attr.get('id')
				new_attr_id = _new_id()
				if original_attr_id:
					attr_mappings[original_attr_id] = new_attr_id
				
				# 映射 interface_attr_id
				if attr.get('interface_attr_id'):
					original_interface_attr_id = attr['interface_attr_id']
					new_interface_attr_id = interface_attribute_map.get(original_interface_attr_id)
					if new_interface_attr_id:
						attr['interface_attr_id'] = new_interface_attr_id
				
				ar = {**attr, 'id': new_attr_id, 'object_type_id': new_obj_id, 'owner_id': owner_id}
				ar.pop('original_id', None)
				ar.pop('object_type_original_id', None)
				if 'create_time' not in ar or not ar['create_time']:
					ar['create_time'] = now
				if 'last_update' not in ar or not ar['last_update']:
					ar['last_update'] = now
				attrs.append(ar)
			
			return {
				'object_row': row,
				'attribute_rows': attrs,
				'object_id_mapping': {original_id: new_obj_id, name: new_obj_id},
				'attribute_id_mapping': attr_mappings
			}
		
		# 并发解析所有对象文件
		obj_files = sorted(objects_dir.glob('*.json'))
		parse_results = await asyncio.gather(*[parse_object_file(f) for f in obj_files])
		
		# 合并结果
		for result in parse_results:
			object_type_rows.append(result['object_row'])
			attribute_rows.extend(result['attribute_rows'])
			object_type_map.update(result['object_id_mapping'])
			attribute_map.update(result['attribute_id_mapping'])
		
		elapsed_parse_objects = _tock(t_parse_start, "[db_perf] 对象文件解析完成")
		logger.info(f"[db_perf] 解析 {len(obj_files)} 个对象文件，耗时 {elapsed_parse_objects:.3f}秒")

		# 关系与标签（并发读取优化）
		t_parse_relations = _tick()
		relations_dir = next(extract_root.rglob('relations'))
		link_type_rows: List[Dict[str, Any]] = []
		tag_rows: List[Dict[str, Any]] = []
		link_type_tag_rows: List[Dict[str, Any]] = []
		
		async def parse_relation_file(rel_file):
			"""异步解析单个关系文件"""
			rel_payload = json.loads(await asyncio.to_thread(rel_file.read_text, 'utf-8'))
			link = rel_payload['link_type']
			source_name = link.get('source_name')
			target_name = link.get('target_name')
			original_link_id = link.get('original_id') or link.get('id')
			new_link_id = original_link_id if preserve_original_ids and original_link_id else _new_id()
			
			# 映射 source 和 target 的 object_type_id
			source_obj_id = object_type_map.get(source_name) if source_name else None
			target_obj_id = object_type_map.get(target_name) if target_name else None
			
			# 映射 source_attribute_id 和 target_attribute_id
			source_attr_id = link.get('source_attribute_id')
			if source_attr_id:
				source_attr_id = attribute_map.get(source_attr_id, source_attr_id)
			
			target_attr_id = link.get('target_attribute_id')
			if target_attr_id:
				target_attr_id = attribute_map.get(target_attr_id, target_attr_id)
			
			lr = {
				**link,
				'id': new_link_id,
				'ontology_id': new_onto_id,
				'owner_id': owner_id,
				'source_object_type_id': source_obj_id,
				'target_object_type_id': target_obj_id,
				'source_attribute_id': source_attr_id,
				'target_attribute_id': target_attr_id,
				'source_name': source_name,
				'target_name': target_name,
			}
			lr.pop('original_id', None)
			lr.pop('source_object_type_original_id', None)
			lr.pop('target_object_type_original_id', None)
			
			if 'create_time' not in lr or not lr['create_time']:
				lr['create_time'] = now
			if 'last_update' not in lr or not lr['last_update']:
				lr['last_update'] = now
			
			# 处理标签
			tags = []
			tag_mappings = {}
			ltt_rows = []
			for tag in rel_payload.get('tags', []):
				original_tag_id = tag.get('original_id') or tag.get('id')
				new_tag_id = original_tag_id if preserve_original_ids and original_tag_id else _new_id()
				if original_tag_id:
					tag_mappings[original_tag_id] = new_tag_id
				
				tr = {
					**tag,
					'id': new_tag_id,
					'ontology_id': new_onto_id,
					'owner_id': owner_id,
				}
				tr.pop('link_type_tag_id', None)
				if 'create_time' not in tr or not tr['create_time']:
					tr['create_time'] = now
				if 'last_update' not in tr or not tr['last_update']:
					tr['last_update'] = now
				tags.append(tr)
				
				ltt_rows.append({
					'id': _new_id(),
					'link_type_id': new_link_id,
					'tag_id': new_tag_id,
					'link_direct': tag.get('link_direct'),
				})
			
			return {
				'link_row': lr,
				'tag_rows': tags,
				'link_type_tag_rows': ltt_rows,
				'link_id_mapping': {original_link_id: new_link_id},
				'tag_id_mapping': tag_mappings
			}
		
		# 并发解析所有关系文件
		rel_files = sorted(relations_dir.glob('*.json'))
		rel_results = await asyncio.gather(*[parse_relation_file(f) for f in rel_files])
		
		# 合并结果
		for result in rel_results:
			link_type_rows.append(result['link_row'])
			tag_rows.extend(result['tag_rows'])
			link_type_tag_rows.extend(result['link_type_tag_rows'])
			link_type_map.update(result['link_id_mapping'])
			tag_map.update(result['tag_id_mapping'])
		
		elapsed_parse_relations = _tock(t_parse_relations, "[db_perf] 关系文件解析完成")
		logger.info(f"[db_perf] 解析 {len(rel_files)} 个关系文件，耗时 {elapsed_parse_relations:.3f}秒")

		# 动作、逻辑（并发读取优化）
		t_parse_actions_logic = _tick()
		actions_dir = next(extract_root.rglob('actions'))
		logic_dir = next(extract_root.rglob('logic'))
		action_rows: List[Dict[str, Any]] = []
		action_param_rows: List[Dict[str, Any]] = []
		logic_rows: List[Dict[str, Any]] = []
		
		async def parse_action_file(act_file):
			"""异步解析单个动作文件"""
			act_payload = json.loads(await asyncio.to_thread(act_file.read_text, 'utf-8'))
			action_row = act_payload['action']
			original_action_id = action_row.get('original_id') or action_row.get('id')
			new_action_id = original_action_id if preserve_original_ids and original_action_id else _new_id()
			
			ar = {
				**action_row,
				'id': new_action_id,
				'ontology_id': new_onto_id,
				'owner_id': owner_id,
				'object_type_id': object_type_map.get(action_row.get('object_type_name')),
			}
			ar.pop('original_id', None)
			ar.pop('object_type_original_id', None)
			if 'create_time' not in ar or not ar['create_time']:
				ar['create_time'] = now
			if 'last_update' not in ar or not ar['last_update']:
				ar['last_update'] = now
			
			# 处理参数
			params = []
			for param in act_payload.get('params', []):
				original_attribute_id = param.get('attribute_id')
				new_attribute_id = attribute_map.get(original_attribute_id) if original_attribute_id else None
				
				pr = {**param, 'id': _new_id(), 'action_id': new_action_id, 'owner_id': owner_id}
				pr.pop('original_id', None)
				pr.pop('action_original_id', None)
				if new_attribute_id:
					pr['attribute_id'] = new_attribute_id
				params.append(pr)
			
			return {
				'action_row': ar,
				'param_rows': params,
				'action_id_mapping': {original_action_id: new_action_id}
			}
		
		async def parse_logic_file(logic_file):
			"""异步解析单个逻辑文件"""
			logic_payload = json.loads(await asyncio.to_thread(logic_file.read_text, 'utf-8'))
			logic_row = logic_payload['logic']
			orig_logic_id = logic_row.get('original_id') or logic_row.get('id')
			new_logic_id = orig_logic_id if preserve_original_ids and orig_logic_id else _new_id()
			
			lr = {
				**logic_row,
				'id': new_logic_id,
				'ontology_id': new_onto_id,
				'owner_id': owner_id,
			}
			lr.pop('original_id', None)
			if 'create_time' not in lr or not lr['create_time']:
				lr['create_time'] = now
			if 'last_update' not in lr or not lr['last_update']:
				lr['last_update'] = now
			
			return {
				'logic_row': lr,
				'logic_id_mapping': {orig_logic_id: new_logic_id} if orig_logic_id else {}
			}
		
		# 并发解析动作和逻辑文件
		act_files = sorted(actions_dir.glob('*.json'))
		logic_files = sorted(logic_dir.glob('*.json'))
		
		act_results, logic_results = await asyncio.gather(
			asyncio.gather(*[parse_action_file(f) for f in act_files]),
			asyncio.gather(*[parse_logic_file(f) for f in logic_files])
		)
		
		# 合并结果
		for result in act_results:
			action_rows.append(result['action_row'])
			action_param_rows.extend(result['param_rows'])
			action_map.update(result['action_id_mapping'])
		
		for result in logic_results:
			logic_rows.append(result['logic_row'])
			logic_map.update(result['logic_id_mapping'])
		
		elapsed_parse_actions_logic = _tock(t_parse_actions_logic, "[db_perf] 动作和逻辑文件解析完成")
		logger.info(f"[db_perf] 解析 {len(act_files)} 个动作文件 + {len(logic_files)} 个逻辑文件，耗时 {elapsed_parse_actions_logic:.3f}秒")

		# Prompts 解析（并发读取优化）
		t_parse_prompts = _tick()
		prompt_dir = next(extract_root.rglob('prompt'), None)
		prompt_rows: List[Dict[str, Any]] = []

		async def parse_prompt_file(prompt_file):
			"""异步解析单个 Prompt 文件（风格与 parse_logic_file 一致）"""
			prompt_payload = json.loads(await asyncio.to_thread(prompt_file.read_text, 'utf-8'))
			prompt_row = prompt_payload['prompt']
			orig_prompt_id = prompt_row.get('original_id') or prompt_row.get('id')
			new_prompt_id = orig_prompt_id if preserve_original_ids and orig_prompt_id else _new_id()

			pr = {
				**prompt_row,
				'id': new_prompt_id,
				'ontology_id': new_onto_id,
				'owner_id': owner_id,
			}
			pr.pop('original_id', None)

			if 'create_time' not in pr or not pr['create_time']:
				pr['create_time'] = now
			if 'last_update' not in pr or not pr['last_update']:
				pr['last_update'] = now

			return {
				'prompt_row': pr,
				'prompt_id_mapping': {orig_prompt_id: new_prompt_id} if orig_prompt_id else {}
			}
		
		# 并发解析动作和逻辑文件
		if prompt_dir and prompt_dir.exists():
			prompt_files = sorted(prompt_dir.glob('*.json'))
		else:
			prompt_files = []
		prompt_results = await asyncio.gather(*[parse_prompt_file(f) for f in prompt_files])
		
		# 合并结果
		for result in prompt_results:
			prompt_rows.append(result['prompt_row'])
			prompt_map.update(result['prompt_id_mapping'])
		
		elapsed_parse_actions_logic = _tock(t_parse_prompts, "[db_perf] 提示词文件解析完成")
		logger.info(f"[db_perf] 解析 {len(prompt_files)} 个提示词文件，耗时 {elapsed_parse_actions_logic:.3f}秒")

		# Interfaces 解析 - Constraints (依赖 Objects 解析后的 attribute_map)
		if interface_dir and interface_dir.is_dir():
			interface_constraints_dir = interface_dir / 'interface_constraints'
			t_parse_interfaces_constraints = _tick()

			async def parse_interface_constraint_file(constraint_file):
				"""异步解析单个 interface_constraints 文件"""
				payload = json.loads(await asyncio.to_thread(constraint_file.read_text, 'utf-8'))
				original_interface_id = payload.get('interface_id')
				new_interface_id = interface_map.get(original_interface_id)
				
				constraints = []
				for constraint in payload.get('constraints', []):
					# 映射 attribute_id
					if constraint.get('attribute_id'):
						orig_attr_id = constraint['attribute_id']
						new_attr_id = attribute_map.get(orig_attr_id)
						if new_attr_id:
							constraint['attribute_id'] = new_attr_id
					
					cr = {
						**constraint,
						'id': _new_id(),
						'interface_id': new_interface_id,
						'owner_id': owner_id,
					}
					cr.pop('original_id', None)
					cr.pop('interface_original_id', None)
					if 'create_time' not in cr or not cr['create_time']:
						cr['create_time'] = now
					if 'last_update' not in cr or not cr['last_update']:
						cr['last_update'] = now
					constraints.append(cr)
				
				return {'constraint_rows': constraints}

			# 并发解析 interface_constraints 文件
			if interface_constraints_dir.exists():
				constraint_files = sorted(interface_constraints_dir.glob('*.json'))
				if constraint_files:
					constraint_results = await asyncio.gather(*[parse_interface_constraint_file(f) for f in constraint_files])
					
					for result in constraint_results:
						interface_constraint_rows.extend(result['constraint_rows'])

			elapsed_parse_interfaces_constraints = _tock(t_parse_interfaces_constraints, "[db_perf] Interface Constraints 解析完成")
			logger.info(f"[db_perf] 解析 {len(interface_constraint_rows)} 个约束，耗时 {elapsed_parse_interfaces_constraints:.3f}秒")

		# APIs 解析（并发读取优化）
		t_parse_apis = _tick()
		apis_dir = next(extract_root.rglob('apis'), None)
		api_rows: List[Dict[str, Any]] = []
		api_param_rows: List[Dict[str, Any]] = []
		skipped_api_names: List[str] = []
		
		if apis_dir and apis_dir.is_dir():
			async def parse_api_file(api_file):
				"""异步解析单个 API 文件"""
				payload = json.loads(await asyncio.to_thread(api_file.read_text, 'utf-8'))
				api_row = payload['api']
				original_api_id = api_row.get('original_id') or api_row.get('id')
				new_api_id = _new_id()
				
				# 获取最终 workspace_id（确保为字符串，避免 None）
				final_workspace_id = str(workspace_id or onto_row.get('workspace_id') or '')
				
				ar = {
					**api_row,
					'id': new_api_id,
					'workspace_id': final_workspace_id,
					'create_time': api_row.get('create_time') or now,
					'last_update': now,
					'create_user': owner_id,
					'update_user': owner_id,
				}
				ar.pop('original_id', None)
				
				param_rows = []
				for param in payload.get('params', []):
					pr = {
						**param,
						'id': _new_id(),
						'api_id': new_api_id,
						'create_user': owner_id,
						'update_user': owner_id,
					}
					pr.pop('original_id', None)
					pr.pop('api_original_id', None)
					param_rows.append(pr)
				
				return {
					'api_row': ar,
					'param_rows': param_rows,
				}
			
			api_files = sorted(apis_dir.glob('*.json'))
			if api_files:
				parsed_api_results = await asyncio.gather(*[parse_api_file(f) for f in api_files])
				
				temp_api_rows = []
				temp_param_rows = []
				for result in parsed_api_results:
					temp_api_rows.append(result['api_row'])
					temp_param_rows.extend(result['param_rows'])
				
				# 重名检测和过滤（确保 workspace_id 非空）
				final_workspace_id = str(workspace_id or onto_row.get('workspace_id') or '')
				if not final_workspace_id:
					logger.warning("[import] workspace_id 为空，跳过 API 导入")
					api_rows = []
					skipped_api_names = []
					api_param_rows = []
				else:
					api_rows, skipped_api_names = await self._check_existing_apis(
						temp_api_rows, 
						final_workspace_id
					)
				
				# 过滤掉被跳过 API 的参数
				if skipped_api_names:
					valid_api_ids = {api['id'] for api in api_rows}
					api_param_rows = [
						param for param in temp_param_rows 
						if param.get('api_id') in valid_api_ids
					]
					logger.info(f"[import] 实际导入 {len(api_rows)} 个 API，跳过 {len(skipped_api_names)} 个重名 API")
				else:
					api_param_rows = temp_param_rows
				
				elapsed_parse_apis = _tock(t_parse_apis, "[db_perf] API 文件解析完成")
				logger.info(f"[db_perf] 解析 {len(api_files)} 个 API 文件，耗时 {elapsed_parse_apis:.3f}秒")
		else:
			logger.info("[import] 未找到 apis/ 目录，跳过 API 导入")

		# -------- 并发执行：API 调用 + 数据库写入 --------
		# 策略：两者同时启动以提高性能，但任一失败则全部回滚
		t_concurrent_start = _tick()
		
		api_results: Dict[str, Any] = {
			'code_upload': None,
			'api_errors': [],
			'object_sync': None
		}
		
		# 获取新本体名称（用于API调用）
		final_ontology_name = (
			ontology_name or ontology_meta.get('ontology_name')
		)
		
		async def call_external_apis():
			"""异步调用所有外部 API（对象类型同步 + 代码文件上传）"""
			t_api_start = _tick()
			import httpx
			async with httpx.AsyncClient(timeout=120.0) as client:
				# 0. 同步对象类型到代码生成服务（生成 Python 类文件）
				if object_type_rows:
					ontology_json = []
					for obj_row in object_type_rows:
						# 构造对象类型定义
						obj_def = {
							"ontology_name": final_ontology_name,
							"name": obj_row.get('object_type_name'),
							"table_name": obj_row.get('table_name') or f"ontology_{obj_row.get('object_type_name', 'unknown').lower()}",
							"doc": obj_row.get('object_type_desc') or obj_row.get('object_type_label') or '',
							"fields": [],
							"status": 1
						}
						
						# 获取该对象的所有属性
						obj_id = obj_row['id']
						obj_attrs = [ar for ar in attribute_rows if ar.get('object_type_id') == obj_id]
						
						for attr in obj_attrs:
							field_def = {
								"name": attr.get('attribute_name'),
								"type": attr.get('attribute_type') or 'str',
								"primary_key": bool(attr.get('is_primary_key')),
								"property": attr.get('attribute_name_en') or attr.get('attribute_name')
							}
							obj_def['fields'].append(field_def)
						
						ontology_json.append(obj_def)
					
					# 调用对象更新接口
					url = _compose_external_api_url()
					obj_response = await _call_external_api_with_client(
						client, url, ontology_json
					)
					
					if not obj_response.get('ok'):
						raise RuntimeError(
							f"对象类型同步失败: {obj_response.get('error', 'Unknown')}"
						)
					
					api_results['object_sync'] = {
						'status': 'success',
						'api': obj_response,
						'object_count': len(ontology_json)
					}
				
				# 1. 上传代码文件到沙箱服务
				code_dir = next(extract_root.rglob('code'), None)
				if code_dir and code_dir.is_dir():
					logger.info(f"[upload] 发现 code 目录，准备上传到沙箱服务: {code_dir}")
					
					# 创建临时目录用于处理代码文件
					upload_temp_dir = tempfile.mkdtemp(prefix="code_upload_")
					try:
						# 获取原始 ontology_name（从 ontology.json）
						original_ontology_name = ontology_meta.get('ontology_name')
						
						# 如果指定了新的 ontology_name 且与原名称不同，需要重命名目录
						if final_ontology_name and original_ontology_name and final_ontology_name != original_ontology_name:
							logger.info(f"[upload] 检测到 ontology_name 变更: {original_ontology_name} -> {final_ontology_name}")
							
							# 创建临时 code 目录副本用于重命名
							temp_code_dir = os.path.join(upload_temp_dir, "code_temp")
							shutil.copytree(code_dir, temp_code_dir)
							
							# 重命名 ontology/{old_name} -> ontology/{new_name}
							old_ontology_path = os.path.join(temp_code_dir, "ontology", original_ontology_name)
							new_ontology_path = os.path.join(temp_code_dir, "ontology", final_ontology_name)
							if os.path.exists(old_ontology_path):
								os.makedirs(os.path.dirname(new_ontology_path), exist_ok=True)
								shutil.move(old_ontology_path, new_ontology_path)
								logger.info(f"[upload] 已重命名: ontology/{original_ontology_name} -> ontology/{final_ontology_name}")
							
							# 重命名 ontology_apis/{old_name} -> ontology_apis/{new_name}
							old_apis_path = os.path.join(temp_code_dir, "ontology_apis", original_ontology_name)
							new_apis_path = os.path.join(temp_code_dir, "ontology_apis", final_ontology_name)
							if os.path.exists(old_apis_path):
								os.makedirs(os.path.dirname(new_apis_path), exist_ok=True)
								shutil.move(old_apis_path, new_apis_path)
								logger.info(f"[upload] 已重命名: ontology_apis/{original_ontology_name} -> ontology_apis/{final_ontology_name}")
							
							# 使用重命名后的目录
							code_dir_to_zip = temp_code_dir
						else:
							# 不需要重命名，直接使用原 code 目录
							code_dir_to_zip = code_dir
						
						# 将 code 目录打包成 zip
						zip_path = os.path.join(upload_temp_dir, f"{final_ontology_name}_code.zip")
						logger.info(f"[upload] 打包 code 目录到: {zip_path}")
						with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
							for root, dirs, files in os.walk(code_dir_to_zip):
								for file in files:
									file_path = os.path.join(root, file)
									# 计算相对于 code 目录的路径
									arcname = os.path.relpath(file_path, code_dir_to_zip)
									zipf.write(file_path, arcname)
						
						# 上传到沙箱服务
						env = _resolve_sandbox_env()
						upload_url = f"{env['base']}/api/v1/ontology/upload/{final_ontology_name}"
						logger.info(f"[upload] 上传代码文件到: {upload_url}")
						
						with open(zip_path, 'rb') as f:
							files = {
								'file': (f"{final_ontology_name}_code.zip", f, 'application/zip')
							}
							response = await client.post(upload_url, files=files)
						
						if response.status_code == 200:
							try:
								upload_result = response.json()
								if upload_result.get('status') == 'success':
									api_results['code_upload'] = {
										'status': 'success',
										'message': '代码文件上传成功',
										'details': upload_result.get('data')
									}
									logger.info(f"[upload] 代码文件上传成功: {upload_result}")
								else:
									raise RuntimeError(
										f"代码文件上传失败: {upload_result.get('message', 'Unknown')}"
									)
							except json.JSONDecodeError:
								raise RuntimeError(
									f"代码文件上传响应解析失败: {response.text[:200]}"
								)
						else:
							raise RuntimeError(
								f"代码文件上传失败，状态码: {response.status_code}, "
								f"响应: {response.text[:200]}"
							)
					
					finally:
						# 清理临时 zip 文件
						try:
							shutil.rmtree(upload_temp_dir)
							logger.info(f"[upload] 已清理临时目录: {upload_temp_dir}")
						except Exception as e:
							logger.warning(f"[upload] 清理临时目录失败: {e}")
				
				else:
					logger.warning(f"[upload] 未找到 code 目录，跳过代码文件上传")
					api_results['code_upload'] = {
						'status': 'skipped',
						'message': '未找到 code 目录'
					}
			
			elapsed_api = _tock(t_api_start, "[并发] ✅ API 调用完成")
			logger.info(f"[并发] API 总耗时: {elapsed_api:.3f}秒")
		
		def write_to_database(conn):
			"""同步执行数据库批量写入（事务保护 + 连接复用优化）
			
			性能优化说明：
			- 复用单一数据库连接，避免重复创建连接（每次 ~400-500ms）
			- 事务内批量预加载表结构（避免多次连接创建）
			- 优化插入顺序，按依赖关系分层
			- 使用批量 INSERT VALUES 语法（MySQL 最佳实践）
			
			注意：MySQL 连接对象不是线程安全的，无法在多线程中并发使用同一连接
			因此采用单连接串行插入策略，已通过预加载和连接复用优化到最佳
			"""
			t_db_start = _tick()
			
			# 关键优化：在事务内预加载所有表结构（复用连接）
			self._preload_table_schemas_fast(conn)
			
			# 按依赖关系分层插入，复用同一连接
			# Layer 1: 独立表（无外键依赖）
			t1 = _tick()
			self._bulk_insert('ontology_manage', ontology_rows, conn=conn)
			self._bulk_insert('ontology_tag', tag_rows, conn=conn)
			_tock(t1, "[db_perf] Layer 1 完成")
			
			# Layer 2: 依赖 ontology_manage 的表（interface 在 object_type 之前）
			t2 = _tick()
			self._bulk_insert('ontology_interface', interface_rows, conn=conn)
			self._bulk_insert('ontology_logic_type', logic_rows, conn=conn)
			self._bulk_insert('ontology_prompt', prompt_rows, conn=conn)
			self._bulk_insert('ontology_api', api_rows, conn=conn)
			_tock(t2, "[db_perf] Layer 2 完成")
			
			# Layer 3: 依赖 interface 和 ontology_manage 的表
			t3 = _tick()
			self._bulk_insert('ontology_interface_attribute', interface_attribute_rows, conn=conn)
			self._bulk_insert('ontology_object_type', object_type_rows, conn=conn)
			_tock(t3, "[db_perf] Layer 3 完成")
			
			# Layer 4: 依赖 object_type 的表
			t4 = _tick()
			self._bulk_insert('ontology_object_type_attribute', attribute_rows, conn=conn)
			self._bulk_insert('ontology_link_type', link_type_rows, conn=conn)
			self._bulk_insert('ontology_object_type_action', action_rows, conn=conn)
			_tock(t4, "[db_perf] Layer 4 完成")
			
			# Layer 5: 依赖多个表的表
			t5 = _tick()
			self._bulk_insert('ontology_interface_constraint', interface_constraint_rows, conn=conn)
			self._bulk_insert('ontology_link_type_tag', link_type_tag_rows, conn=conn)
			self._bulk_insert('ontology_object_type_action_param', action_param_rows, conn=conn)
			self._bulk_insert('ontology_api_param', api_param_rows, conn=conn)
			_tock(t5, "[db_perf] Layer 5 完成")
			
			elapsed_db = _tock(t_db_start, "[并发] ✅ 数据库写入完成")
			logger.info(f"[并发] 数据库总耗时: {elapsed_db:.3f}秒")
		
		try:
			# 使用单一事务，确保任一任务失败都会触发回滚
			with self.mysql.transaction() as conn:
				await asyncio.gather(
					call_external_apis(),  # 异步 API 调用
					asyncio.to_thread(write_to_database, conn)  # 同步数据库操作转异步
				)
			elapsed_concurrent = _tock(t_concurrent_start, "[性能] 并发执行完成")
			
		except Exception as e:
			# 任何一方失败都会触发此处
			logger.error(f"❌ 导入失败，事务已回滚: {e}")
			api_results['api_errors'].append({
				'type': 'import_failed',
				'error': str(e)
			})
			_cleanup_extract_root()
			# 重新抛出异常，让调用方知道导入失败
			raise RuntimeError(f"导入失败: {e}") from e

		result = {
			'new_ontology_id': new_onto_id,
			'ontology_name': ontology_meta.get('ontology_name'),
			'counts': {
				'object_types': len(object_type_rows),
				'attributes': len(attribute_rows),
				'relations': len(link_type_rows),
				'relation_tags': len(link_type_tag_rows),
				'tags': len(tag_rows),
				'actions': len(action_rows),
				'action_params': len(action_param_rows),
				'logic': len(logic_rows),
				'prompt': len(prompt_rows),
				'apis': len(api_rows),
				'api_params': len(api_param_rows),
				'apis_skipped': len(skipped_api_names),
				'interfaces': len(interface_rows),
				'interface_attributes': len(interface_attribute_rows),
				'interface_constraints': len(interface_constraint_rows),
			},
			'skipped_apis': skipped_api_names if skipped_api_names else [],
			'message': '批量导入完成 (事务写入)',
			'api_results': api_results,  # 外部 API 调用结果
		}
		if return_mapping:
			result['id_mapping'] = {
				'ontology': {'original': original_onto_id, 'new': new_onto_id},
				'object_types': object_type_map,
				'link_types': link_type_map,
				'tags': tag_map,
				'actions': action_map,
				'logic_types': logic_map,
				'prompt': prompt_map
			}

		_cleanup_extract_root()

		return result



# ===================== HTTP 外部API辅助函数 =====================

__all__ = [
	'OntologyExporter',
	'OntologyImporter',
]


# 外部 API 调用辅助函数

def _compose_external_api_url(
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> str:
    resolved_gate = _resolve_net_gate(net_gate)
    resolved_server = _resolve_sandbox_server(sandbox_server)
    base = _build_sandbox_base(resolved_gate, resolved_server)
    return f"{base}/api/v1/ontology/object/update"


def _build_sandbox_base(net_gate: str, sandbox_server: str) -> str:
    base = net_gate.rstrip("/")
    box = sandbox_server.strip("/")
    return f"{base}/{box}" if box else base


async def _call_external_api_with_client(
    client: httpx.AsyncClient,
    url: str,
    ontology_json: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """调用外部对象更新接口
    
    使用共享 HTTP 客户端避免连接池耗尽。
    """
    await asyncio.sleep(0)
    t_api = _tick()
    payload = {"ontology_json": ontology_json}
    result = await _post_json_api_with_client(client, url, payload)
    _tock(t_api, f"[db_perf] 对象同步 API 调用")
    return result


async def _post_json_api_with_client(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, Any]
) -> dict[str, Any]:
    """发送 POST JSON 请求
    
    复用共享客户端避免连接池限制。
    
    返回:
        包含 ok、status_code、body 或 error 的字典
    """
    try:
        resp = await client.post(url, json=payload)
        status_code = resp.status_code
        text = resp.text
        try:
            body = resp.json()
        except Exception:
            body = text
        ok = status_code == 200
        biz_ok = ok and isinstance(
            body, dict) and body.get("status") == "success"
        return {"ok": ok and biz_ok, "status_code": status_code, "body": body}
    except httpx.HTTPError as he:
        return {"ok": False, "error": f"HTTPError: {he}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}



def _normalize_fun_params(
	fun_params: dict[str, Any] | None
) -> dict[str, Any]:
	"""规范化函数参数格式

	将多种入参风格统一为标准格式：
	{param_name: {type: str, is_required: bool}}
	"""
	if not fun_params:
		return {}
	# 兼容字符串（JSON）或列表格式
	if isinstance(fun_params, str):
		try:
			parsed = json.loads(fun_params)
			fun_params = parsed if isinstance(parsed, dict) else {}
		except json.JSONDecodeError:
			return {}
	if isinstance(fun_params, list):
		temp: dict[str, Any] = {}
		for idx, item in enumerate(fun_params):
			if isinstance(item, dict):
				key = item.get("name") or str(idx)
				temp[key] = item
		fun_params = temp
	if not isinstance(fun_params, dict):
		return {}
	result: dict[str, Any] = {}
	for k, v in fun_params.items():
		if isinstance(v, dict):
			p_type = v.get("type") or v.get("param_type") or "str"
			required = bool(v.get("is_required") or v.get("required"))
		else:
			p_type = str(v)
			required = False
		result[k] = {"type": p_type, "is_required": required}
	return result


async def create_logic_function_with_client(
    client: httpx.AsyncClient,
    ontology_name: str,
    function_name: str,
    file_name: str,
    function_label: str,
    fun_params: dict[str, Any] | None = None,
    fun_desc: str | None = None,
    code: str | None = None,
    function_type: str | None = None,
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> dict[str, Any]:
    """创建逻辑函数（调用沙箱接口）
    
    复用共享 HTTP 客户端提高性能。
    """
    await asyncio.sleep(0)

    if not ontology_name:
        raise ValueError("ontology_name 不能为空")
    if not function_name:
        raise ValueError("function_name 不能为空")
    if not file_name and (function_type or "function") :
        raise ValueError("file_name 不能为空")
    if not function_label:
        raise ValueError("function_label 不能为空")

    env = _resolve_sandbox_env(net_gate, sandbox_server)
    url = f"{env['base']}/functions/create"
    payload = {
        "ontology_name": ontology_name,
        "function_name": function_name,
        "file_name": file_name,
        "function_label": function_label,
        "fun_desc": fun_desc or "",
        "fun_params": _normalize_fun_params(fun_params),
    }
    if code is not None:
        payload["code"] = code
    if function_type:
        payload["function_type"] = function_type
    api_res = await _post_json_api_with_client(client, url, payload)
    return {
        "status": "success" if api_res.get("ok") else "failed",
        "api": api_res,
        "payload": payload,
    }


async def create_action_function_with_client(
    client: httpx.AsyncClient,
    ontology_name: str,
    used_objects: list[str],
    function_name: str,
    file_name: str,
    function_label: str,
    fun_params: dict[str, Any] | None = None,
    fun_desc: str | None = None,
    code: str | None = None,
    net_gate: Optional[str] = None,
    sandbox_server: Optional[str] = None,
) -> dict[str, Any]:
    """创建动作函数（调用沙箱接口）
    
    复用共享 HTTP 客户端提高性能。
    """
    await asyncio.sleep(0)

    if not ontology_name:
        raise ValueError("ontology_name 不能为空")
    if not used_objects:
        raise ValueError("used_objects 不能为空")
    if not function_name:
        raise ValueError("function_name 不能为空")
    if not file_name:
        raise ValueError("file_name 不能为空")
    if not function_label:
        raise ValueError("function_label 不能为空")

    env = _resolve_sandbox_env(net_gate, sandbox_server)
    url = f"{env['base']}/actions/create_fun"
    payload = {
        "ontology_name": ontology_name,
        "used_objects": used_objects,
        "function_name": function_name,
        "fun_params": _normalize_fun_params(fun_params),
        "fun_desc": fun_desc,
        "file_name": file_name,
        "function_label": function_label,
    }
    if code is not None:
        payload["code"] = code
    api_res = await _post_json_api_with_client(client, url, payload)
    return {
        "status": "success" if api_res.get("ok") else "failed",
        "api": api_res,
        "payload": payload,
    }

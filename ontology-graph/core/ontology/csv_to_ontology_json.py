"""
CSV to Ontology JSON Converter
从对象信息.csv和对象关系信息.csv文件中解析对象、属性和关系,
转换为标准的本体JSON格式(与rdf_services.py的import_owl_with_classification完全一致)

字段映射说明：
- 对象: objectTypeName, objectTypeLabel, objectTypeDesc
- 属性: attributeName, fieldName, isPrimaryKey, isTitle, attributeDesc
- 关系: sourcename, sourcelabel, targetname, targetlabel, 
        op_name_source, op_label_source, op_name_target, op_label_target
"""

import csv
import json
from public.public_variable import logger
import re
from datetime import datetime
from json import JSONDecodeError
from itertools import zip_longest
from typing import Dict, List, Any, Optional
from pathlib import Path
from uuid import uuid4

# 和 rdf_services.py 一样的数据库连接方式
from utils.databases.service_factory import create_mysql_service


async def _bulk_insert(
    conn,
    table: str,
    cols: List[str],
    rows: List[tuple],
    chunk: int = 2000
) -> None:
    if not rows:
        return

    for i in range(0, len(rows), chunk):
        batch = rows[i:i + chunk]
        placeholders = ", ".join(
            [f"({', '.join(['%s'] * len(cols))})" for _ in batch]
        )
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES {placeholders}"
        flat_data = []
        for row in batch:
            flat_data.extend(row)
        async with conn.cursor() as cursor:
            await cursor.execute(sql, flat_data)


def _normalize_and_validate_csv(result: Dict[str, Any]) -> Dict[str, Any]:
    """CSV 数据规范化和校验（适配 is_exist 字段）"""
    validated = {
        "tags_new": [],
        "tags_exist": [],
        "objects_new": [],
        "objects_exist": [],
        "links_new": [],
        "links_exist": [],
        "logic_new": [],
        "logic_exist": [],
        "actions_new": [],
        "actions_exist": [],
    }

    # 处理标签（根据 is_exist 字段分类）
    for tag in result.get("tag", []):
        tag_data = {
            "tag_name": tag.get("tagName"),
            "tag_label": tag.get("tagLabel"),
            "tag_desc": tag.get("tagDesc"),
        }
        if tag.get("is_exist"):
            tag_data["id"] = tag["id"]
            tag_data["tag_label"] = tag_data["tag_label"] or tag_data["tag_name"]
            tag_data["tag_desc"] = tag_data["tag_desc"] or ""
            validated["tags_exist"].append(tag_data)
        else:
            tag_data["id"] = uuid4().hex
            validated["tags_new"].append(tag_data)

    # 处理对象（根据 is_exist 字段分类）
    for obj in result.get("object", []):
        if obj.get("is_exist"):
            # 已存在对象
            if not obj.get("id") or not obj.get("objectTypeName"):
                continue
            # 获取已存在的属性和第一个属性ID
            attributes = obj.get("attributes", [])
            exist_attrs = [attr for attr in attributes if attr.get("is_exist")]
            first_attr_id = exist_attrs[0].get("id") if exist_attrs else None
            normalized_attrs = []
            for attr in exist_attrs:
                normalized_attrs.append({
                    "id": attr.get("id"),
                    "attribute_name": attr.get("attributeName"),
                    "attribute_en_name": attr.get("fieldName"),
                })
            validated["objects_exist"].append({
                "id": obj["id"],
                "object_type_name": obj["objectTypeName"],
                "first_attribute_id": first_attr_id,
                "attributes": normalized_attrs,
            })
        else:
            # 新增对象
            normalized_obj = {
                "id": uuid4().hex,
                "object_type_name": obj.get("objectTypeName"),
                "object_type_label": obj.get("objectTypeLabel"),
                "object_type_desc": obj.get("objectTypeDesc"),
                "status": obj.get("objectTypeStatus"),
                "attributes": [],
            }
            # 处理新增属性
            for attr in obj.get("attributes", []):
                if not attr.get("is_exist"):
                    normalized_obj["attributes"].append({
                        "id": uuid4().hex,
                        "attribute_name": attr.get("attributeName"),
                        "attribute_en_name": attr.get("fieldName"),
                        "attribute_desc": attr.get("attributeDesc"),
                        "is_primary_key": attr.get("isPrimaryKey"),
                        "is_title": attr.get("isTitle"),
                        "field_type": attr.get("fieldType"),
                    })
            validated["objects_new"].append(normalized_obj)

    # 处理关系（根据 is_exist 字段分类）
    for link in result.get("link", []):
        link_data = {
            "source_name": link.get("sourcename"),
            "source_label": link.get("sourcelabel"),
            "target_name": link.get("targetname"),
            "target_label": link.get("targetlabel"),
            "op_name_source": link.get("op_name_source"),
            "op_name_target": link.get("op_name_target"),
            "source_attribute_name": link.get("source_attribute_name"),
            "target_attribute_name": link.get("target_attribute_name"),
            "source_attribute_id": link.get("source_attribute_id"),
            "target_attribute_id": link.get("target_attribute_id"),
            "link_type": link.get("link_type", 1),
            "link_method": link.get("link_method", 1),
            "middle_ds_id": link.get("middle_ds_id"),
            "middle_ds_schema": link.get("middle_ds_schema"),
            "middle_table_name": link.get("middle_table_name"),
            "middle_source_field": link.get("middle_source_field"),
            "middle_target_field": link.get("middle_target_field"),
        }
        
        if link.get("is_exist"):
            if not link.get("id") or not link.get("sourcename") or not link.get("targetname"):
                continue
            link_data["id"] = link["id"]
            link_data["source_label"] = link_data.get("source_label") or link["sourcename"]
            link_data["target_label"] = link_data.get("target_label") or link["targetname"]
            validated["links_exist"].append(link_data)
        else:
            link_data["id"] = uuid4().hex
            validated["links_new"].append(link_data)

    return validated


async def _write_all_data_pure_csv(
    conn,
    ontology_id: str,
    owner_id: str,
    validated_data: Dict[str, Any],
) -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    stats = {
        "inserted_tags": 0,
        "skipped_tags": 0,
        "inserted_objects": 0,
        "skipped_objects": 0,
        "inserted_attrs": 0,
        "inserted_links": 0,
        "skipped_links": 0,
        "links_new_len": 0,
        "links_exist_len": 0,
        "inserted_logic": 0,
        "skipped_logic": 0,
        "inserted_actions": 0,
        "skipped_actions": 0,
    }

    tags_new = validated_data.get("tags_new", [])
    if tags_new:
        tag_rows = [
            (tag["id"], now_str, now_str, 1, tag["tag_name"],
             tag["tag_label"], tag["tag_desc"], 0)
            for tag in tags_new
        ]
        await _bulk_insert(
            conn=conn,
            table="ontology_tag",
            cols=["id", "create_time", "last_update", "sync_status",
                  "tag_name", "tag_label", "tag_desc", "oper_status"],
            rows=tag_rows,
        )
        stats["inserted_tags"] = len(tag_rows)

    tags_exist = validated_data.get("tags_exist", [])
    if tags_exist:
        stats["skipped_tags"] = len(tags_exist)

    objects_new = validated_data.get("objects_new", [])
    if objects_new:
        obj_rows = [
            (obj["id"], now_str, now_str, obj["object_type_desc"],
             obj["object_type_label"], obj["object_type_name"],
             str(ontology_id), str(owner_id), "IconDockerHubColor-primary", obj.get("status", 0), 1, 0)
            for obj in objects_new
        ]
        await _bulk_insert(
            conn=conn,
            table="ontology_object_type",
            cols=["id", "create_time", "last_update", "object_type_desc", "object_type_label",
                  "object_type_name", "ontology_id", "owner_id", "icon", "status", "sync_status", "oper_status"],
            rows=obj_rows,
        )
        stats["inserted_objects"] = len(obj_rows)

        all_attr_rows = []
        for obj in objects_new:
            for attr in obj.get("attributes", []):
                all_attr_rows.append((
                    attr["id"], now_str, now_str, attr["attribute_name"],
                    attr["attribute_en_name"], attr["is_primary_key"], attr["is_title"],
                    obj["id"], None, attr["field_type"], 1, 1, attr.get("attribute_desc"), 0
                ))
        if all_attr_rows:
            await _bulk_insert(
                conn=conn,
                table="ontology_object_type_attribute",
                cols=["id", "create_time", "last_update", "attribute_name", "attribute_label",
                      "is_primary_key", "is_title", "object_type_id", "shared_attribute_id",
                      "field_type", "status", "sync_status", "attribute_desc", "oper_status"],
                rows=all_attr_rows,
            )
            stats["inserted_attrs"] = len(all_attr_rows)

    objects_exist = validated_data.get("objects_exist", [])
    if objects_exist:
        stats["skipped_objects"] = len(objects_exist)

    obj_name_to_id: Dict[str, str] = {}
    obj_name_to_first_attr_id: Dict[str, str] = {}
    obj_name_to_attr_id_map: Dict[str, Dict[str, str]] = {}

    for obj in validated_data.get("objects_new", []):
        obj_name = obj["object_type_name"]
        obj_name_to_id[obj_name] = obj["id"]
        attrs = obj.get("attributes", [])
        if attrs:
            obj_name_to_first_attr_id[obj_name] = attrs[0]["id"]
        attr_map: Dict[str, str] = {}
        for attr in attrs:
            attr_id = attr.get("id")
            attr_name = attr.get("attribute_name")
            attr_en = attr.get("attribute_en_name")
            if attr_id and attr_name:
                attr_map[attr_name] = attr_id
            if attr_id and attr_en:
                attr_map[attr_en] = attr_id
        if attr_map:
            obj_name_to_attr_id_map[obj_name] = attr_map

    for obj in validated_data.get("objects_exist", []):
        obj_name = obj["object_type_name"]
        obj_name_to_id[obj_name] = obj["id"]
        first_attr_id = obj.get("first_attribute_id")
        if first_attr_id:
            obj_name_to_first_attr_id[obj_name] = first_attr_id
        attr_map: Dict[str, str] = {}
        for attr in obj.get("attributes", []) or []:
            attr_id = attr.get("id")
            attr_name = attr.get("attribute_name")
            attr_en = attr.get("attribute_en_name")
            if attr_id and attr_name:
                attr_map[attr_name] = attr_id
            if attr_id and attr_en:
                attr_map[attr_en] = attr_id
        if attr_map:
            obj_name_to_attr_id_map[obj_name] = attr_map

    links_new = validated_data.get("links_new", [])
    stats["links_new_len"] = len(links_new)
    if links_new:
        link_rows = []
        for link in links_new:
            source_name = link["source_name"]
            target_name = link["target_name"]
            source_obj_id = obj_name_to_id.get(source_name)
            target_obj_id = obj_name_to_id.get(target_name)

            source_attr_id = link.get("source_attribute_id")
            target_attr_id = link.get("target_attribute_id")
            if not source_attr_id:
                src_attr_name = link.get("source_attribute_name")
                if src_attr_name:
                    source_attr_id = obj_name_to_attr_id_map.get(source_name, {}).get(src_attr_name)
            if not target_attr_id:
                tgt_attr_name = link.get("target_attribute_name")
                if tgt_attr_name:
                    target_attr_id = obj_name_to_attr_id_map.get(target_name, {}).get(tgt_attr_name)
            if not source_attr_id:
                source_attr_id = obj_name_to_first_attr_id.get(source_name)
            if not target_attr_id:
                target_attr_id = obj_name_to_first_attr_id.get(target_name)

            link_rows.append((
                link["id"], now_str, now_str, source_name,
                link["source_label"], target_name, link["target_label"],
                str(ontology_id), str(owner_id),
                source_obj_id, target_obj_id,
                source_attr_id, target_attr_id,
                link.get("middle_ds_id"),
                link.get("middle_ds_schema"),
                link.get("middle_table_name"),
                link.get("middle_source_field"),
                link.get("middle_target_field"),
                int(link.get("link_method") or 1),
                int(link.get("link_type") or 1),
                1, 1, 0,
            ))
        await _bulk_insert(
            conn=conn,
            table="ontology_link_type",
            cols=["id", "create_time", "last_update", "source_name", "source_label",
                  "target_name", "target_label", "ontology_id", "owner_id",
                  "source_object_type_id", "target_object_type_id",
                  "source_attribute_id", "target_attribute_id",
                  "middle_ds_id", "middle_ds_schema", "middle_table_name",
                  "middle_source_field", "middle_target_field",
                  "link_method", "link_type",
                  "status", "sync_status", "oper_status"],
            rows=link_rows,
        )
        stats["inserted_links"] = len(link_rows)

    # 跳过已存在关系（幂等性，与 OWL/DOC 导入保持一致）
    links_exist = validated_data.get("links_exist", [])
    stats["links_exist_len"] = len(links_exist)
    if links_exist:
        stats["skipped_links"] = len(links_exist)
        logger.info(f"跳过 {len(links_exist)} 个已存在的关系（幂等模式）")

    # 6. 写入关系-标签关联（仅处理新增关系，已存在关系跳过，保持幂等性）
    tag_name_to_id: Dict[str, str] = {}
    for t in (validated_data.get("tags_new") or []):
        name = t.get("tag_name")
        tid = t.get("id")
        if name and tid:
            tag_name_to_id[name] = tid
    for t in (validated_data.get("tags_exist") or []):
        name = t.get("tag_name")
        tid = t.get("id")
        if name and tid:
            tag_name_to_id[name] = tid

    link_tag_rows: List[tuple] = []
    for link in links_new:  # 只处理新增关系
        link_id = link["id"]
        op_src = link.get("op_name_source")
        op_tgt = link.get("op_name_target")
        if op_src and op_src in tag_name_to_id:
            link_tag_rows.append((uuid4().hex, link_id, tag_name_to_id[op_src], "source"))
        if op_tgt and op_tgt in tag_name_to_id:
            link_tag_rows.append((uuid4().hex, link_id, tag_name_to_id[op_tgt], "target"))

    if link_tag_rows:
        await _bulk_insert(
            conn=conn,
            table="ontology_link_type_tag",
            cols=["id", "link_type_id", "tag_id", "link_direct"],
            rows=link_tag_rows,
        )

    return stats


# 与 rdf_services.py 的命名限制保持一致：
# - 仅数据属性（DatatypeProperty）允许中文
# - 其它类别（对象/关系/标签/函数等）必须为英文/数字/下划线
_RE_NORMAL_LOCAL = re.compile(r"^[A-Za-z0-9_]+$")
_RE_ATTR_LABEL = re.compile(r"^[A-Za-z0-9_\u4E00-\u9FFF]+$")


def _is_valid_normal_local_name(name: str) -> bool:
    return bool(name) and _RE_NORMAL_LOCAL.match(name) is not None


def _is_valid_attr_label(name: str) -> bool:
    return bool(name) and _RE_ATTR_LABEL.match(name) is not None


class CSVOntologyConverter:
    """CSV本体转换器"""
    
    def __init__(self, object_csv_path: str, relation_csv_path: str):
        self.object_csv_path = Path(object_csv_path)
        self.relation_csv_path = Path(relation_csv_path)
        
    def parse_objects_from_csv(self) -> List[Dict[str, Any]]:
        """从CSV文件解析对象和属性（对象sheet：一行一个属性）"""
        objects_dict: Dict[str, Dict[str, Any]] = {}
        errors: List[Dict[str, Any]] = []
        object_name_map: Dict[str, str] = {}
        invalid_objects: set[str] = set()
        failed_objects: set[str] = set()
        failed_attr_count = 0
        last_obj_en: Optional[str] = None

        with open(self.object_csv_path, 'r', encoding='utf-8-sig') as f:
            raw_reader = csv.reader(f)
            header = None
            header_row_num = 0
            for row_num, row in enumerate(raw_reader, start=1):
                if not row:
                    continue
                if '对象英文名称' in row and '属性英文名' in row:
                    header = [c.strip() for c in row]
                    header_row_num = row_num
                    break

            if not header:
                errors.append({
                    "type": "missing_header",
                    "line": 0,
                    "row": {},
                    "message": "未找到对象sheet表头（对象英文名称/属性英文名）",
                })
                self.object_errors = errors
                return []

            for row_num, row in enumerate(raw_reader, start=header_row_num + 1):
                row = {k: (v or "") for k, v in zip_longest(header, row, fillvalue="")}
                obj_name_en = (row.get('对象英文名称') or '').strip()
                obj_name_cn = (row.get('对象中文名称') or '').strip()
                obj_desc = (row.get('对象描述') or '').strip()
                status_raw = (row.get('状态') or '').strip()
                obj_status = 1 if status_raw == '启用' else 0
                attr_en = (row.get('属性英文名') or '').strip()
                attr_cn = (row.get('属性中文名') or '').strip()
                attr_type = (row.get('属性类型') or '').strip()
                attr_desc = (row.get('属性描述') or '').strip()
                is_primary_key = (row.get('是否主键') or '').strip() == '是'
                is_title = (row.get('是否标题') or '').strip() == '是'
                has_attr_data = bool(attr_en or attr_cn or attr_type or attr_desc)

                if not any((v or '').strip() for v in row.values()):
                    continue

                if not obj_name_en:
                    errors.append({
                        "type": "missing_object_en",
                        "line": row_num,
                        "row": row,
                        "message": "对象英文名称缺失",
                    })
                    if has_attr_data:
                        failed_attr_count += 1
                    continue

                is_new_object = obj_name_en != last_obj_en
                if is_new_object:
                    if obj_name_cn:
                        object_name_map[obj_name_en] = obj_name_cn
                    elif obj_name_en in object_name_map:
                        obj_name_cn = object_name_map[obj_name_en]
                    else:
                        errors.append({
                            "type": "missing_object_cn",
                            "line": row_num,
                            "row": row,
                            "message": f"对象英文名'{obj_name_en}'缺少中文名称，已跳过该对象及其属性",
                        })
                        invalid_objects.add(obj_name_en)
                        failed_objects.add(obj_name_en)
                        if obj_name_en in objects_dict:
                            del objects_dict[obj_name_en]
                        if has_attr_data:
                            failed_attr_count += 1
                elif obj_name_cn:
                    object_name_map[obj_name_en] = obj_name_cn

                if obj_name_en in invalid_objects:
                    last_obj_en = obj_name_en
                    if has_attr_data:
                        failed_attr_count += 1
                    continue

                if not obj_name_cn and obj_name_en in object_name_map:
                    obj_name_cn = object_name_map[obj_name_en]

                if obj_name_cn and not _is_valid_attr_label(obj_name_cn):
                    errors.append({
                        "type": "invalid_object_cn",
                        "line": row_num,
                        "row": row,
                        "message": f"对象中文名'{obj_name_cn}'非法（仅允许中文/英文/数字/下划线）",
                    })
                    invalid_objects.add(obj_name_en)
                    failed_objects.add(obj_name_en)
                    if obj_name_en in objects_dict:
                        del objects_dict[obj_name_en]
                    if has_attr_data:
                        failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                if not _is_valid_normal_local_name(obj_name_en):
                    errors.append({
                        "type": "invalid_object_en",
                        "line": row_num,
                        "row": row,
                        "message": f"对象英文名'{obj_name_en}'非法（仅允许英文/数字/下划线）",
                    })
                    invalid_objects.add(obj_name_en)
                    failed_objects.add(obj_name_en)
                    if obj_name_en in objects_dict:
                        del objects_dict[obj_name_en]
                    if has_attr_data:
                        failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                if obj_name_en not in objects_dict:
                    objects_dict[obj_name_en] = {
                        "objectTypeName": obj_name_en,
                        "objectTypeLabel": obj_name_cn,
                        "objectTypeDesc": obj_desc or None,
                        "objectTypeStatus": obj_status,
                        "attributes": [],
                    }
                else:
                    if obj_name_cn and not objects_dict[obj_name_en].get("objectTypeLabel"):
                        objects_dict[obj_name_en]["objectTypeLabel"] = obj_name_cn
                    if obj_desc and not objects_dict[obj_name_en].get("objectTypeDesc"):
                        objects_dict[obj_name_en]["objectTypeDesc"] = obj_desc
                    if "objectTypeStatus" not in objects_dict[obj_name_en]:
                        objects_dict[obj_name_en]["objectTypeStatus"] = obj_status

                if not attr_cn and has_attr_data:
                    errors.append({
                        "type": "missing_attribute_cn",
                        "line": row_num,
                        "row": row,
                        "message": f"对象'{obj_name_en}'属性缺少中文名称",
                    })
                    failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                if not attr_cn:
                    continue

                if not attr_en and has_attr_data:
                    errors.append({
                        "type": "missing_attribute_en",
                        "line": row_num,
                        "row": row,
                        "message": f"对象'{obj_name_en}'属性缺少英文名称",
                    })
                    failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                if not _is_valid_attr_label(attr_cn):
                    errors.append({
                        "type": "invalid_attribute_cn",
                        "line": row_num,
                        "row": row,
                        "message": f"对象'{obj_name_en}'属性中文名'{attr_cn}'非法（仅允许中文/英文/数字/下划线）",
                    })
                    failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                if attr_en and not _is_valid_normal_local_name(attr_en):
                    errors.append({
                        "type": "invalid_attribute_en",
                        "line": row_num,
                        "row": row,
                        "message": f"对象'{obj_name_en}'属性英文名'{attr_en}'非法（仅允许英文/数字/下划线）",
                    })
                    failed_attr_count += 1
                    last_obj_en = obj_name_en
                    continue

                field_name_value = attr_en or None
                attribute = {
                    "attributeName": attr_cn,
                    "fieldName": field_name_value,
                    "isPrimaryKey": is_primary_key,
                    "isTitle": is_title,
                    "attributeDesc": attr_desc or None,
                    "fieldType": attr_type or "str",
                }

                existing_fields = {a['fieldName'] for a in objects_dict[obj_name_en]['attributes']}
                if field_name_value not in existing_fields:
                    objects_dict[obj_name_en]['attributes'].append(attribute)

                last_obj_en = obj_name_en

        self.object_errors = errors
        self.object_stats = {
            "success_object_count": len(objects_dict),
            "success_attribute_count": sum(
                len(obj.get("attributes", [])) for obj in objects_dict.values()
            ),
            "failed_object_count": len(failed_objects),
            "failed_attribute_count": failed_attr_count,
        }
        return list(objects_dict.values())
    
    def parse_relations_from_csv(self) -> List[Dict[str, Any]]:
        """从CSV文件解析关系"""
        # 无向去重：同一对对象（A/B不分方向）视为同一条关系，保留最后出现的那条
        # 说明：这里仅按 (min(source,target), max(source,target)) 去重；不把 op_name_* 纳入 key。
        relations_by_key: Dict[tuple[str, str], Dict[str, Any]] = {}
        errors = []  # 收集所有错误
        success_relation_count = 0
        failed_relation_count = 0

        def _undirected_key(
            sourcename: str,
            targetname: str,
            source_attr: Optional[str],
            target_attr: Optional[str],
        ) -> tuple[str, str, Optional[str], Optional[str]]:
            if sourcename <= targetname:
                return (sourcename, targetname, source_attr, target_attr)
            return (targetname, sourcename, target_attr, source_attr)
        
        with open(self.relation_csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            header = None
            header_row_num = 0
            for row_num, row in enumerate(reader, start=1):
                if not row:
                    continue
                if "关系类型" in row and "对象" in row and "被关联对象" in row:
                    header = [c.strip() for c in row]
                    header_row_num = row_num
                    break

            if not header:
                raise ValueError("未找到关系sheet表头（关系类型/对象/被关联对象）")

            for row_num, row in enumerate(reader, start=header_row_num + 1):
                row = {k: (v or "").strip() for k, v in zip_longest(header, row, fillvalue="")}
                relation_type = (row.get("关系类型") or "").strip()
                obj1_en = (row.get("对象") or "").strip()
                obj2_en = (row.get("被关联对象") or "").strip()
                obj1_attr = (row.get("对象属性") or "").strip()
                obj2_attr = (row.get("被关联对象属性") or "").strip()
                middle_raw = (row.get("中间数据集") or "").strip()
                tag1 = (row.get("关系标签1") or "").strip()
                tag2 = (row.get("关系标签2") or "").strip()
                card = (row.get("基数设置") or "").strip()

                if not any((v or "").strip() for v in row.values()):
                    continue

                if relation_type == "语义关联":
                    continue

                if relation_type not in ("外键关联", "中间数据集关联"):
                    errors.append(f"第{row_num}行：关系类型'{relation_type}'不支持")
                    failed_relation_count += 1
                    continue

                if not obj1_en or not obj2_en:
                    errors.append(f"第{row_num}行：对象或被关联对象缺失")
                    failed_relation_count += 1
                    continue

                if not _is_valid_normal_local_name(obj1_en):
                    errors.append(
                        f"第{row_num}行：对象名'{obj1_en}'非法（仅允许英文/数字/下划线）"
                    )
                    failed_relation_count += 1
                    continue
                if not _is_valid_normal_local_name(obj2_en):
                    errors.append(
                        f"第{row_num}行：被关联对象名'{obj2_en}'非法（仅允许英文/数字/下划线）"
                    )
                    failed_relation_count += 1
                    continue

                link_type = 1
                link_method = 1
                if relation_type == "外键关联":
                    if card not in ("一对一", "一对多", "多对一"):
                        errors.append(f"第{row_num}行：外键关联基数设置'{card}'非法")
                        failed_relation_count += 1
                        continue
                    if card == "一对一":
                        link_method = 1
                    elif card == "一对多":
                        link_method = 2
                    else:
                        obj1_en, obj2_en = obj2_en, obj1_en
                        obj1_attr, obj2_attr = obj2_attr, obj1_attr
                        tag1, tag2 = tag2, tag1
                        link_method = 2
                else:
                    link_type = 2
                    link_method = 1

                relation = {
                    "sourcename": obj1_en,
                    "sourcelabel": obj1_en,
                    "targetname": obj2_en,
                    "targetlabel": obj2_en,
                    "op_name_source": tag1 or None,
                    "op_name_target": tag2 or None,
                    "source_attribute_name": obj1_attr or None,
                    "target_attribute_name": obj2_attr or None,
                    "link_type": link_type,
                    "link_method": link_method,
                    "middle_dataset_raw": middle_raw or None,
                    "middle_source_field": obj1_attr or None,
                    "middle_target_field": obj2_attr or None,
                    "_row_num": row_num,
                }
                relation["_op_label_source"] = tag1 or None
                relation["_op_label_target"] = tag2 or None
                k = _undirected_key(
                    sourcename=obj1_en,
                    targetname=obj2_en,
                    source_attr=obj1_attr or None,
                    target_attr=obj2_attr or None,
                )
                if k in relations_by_key:
                    del relations_by_key[k]
                else:
                    success_relation_count += 1
                relations_by_key[k] = relation
        
        # 如果有错误，抛出异常
        if errors:
            error_msg = "CSV对象关系信息验证失败，发现以下错误：\n" + "\n".join(errors)
            raise ValueError(error_msg)

        self.relation_stats = {
            "success_relation_count": success_relation_count,
            "failed_relation_count": failed_relation_count,
        }
        
        return list(relations_by_key.values())

    @staticmethod
    def _build_tags_from_relations(relations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """从 link 的 op_name_source/op_name_target 派生 tag 列表。

        rdf_services.py 的写库逻辑会用 tagName 去建立 ontology_link_type_tag 绑定，
        所以 CSV 转换时必须保证：link 里出现的 op_name_* 在 tag.new/exist 中也出现。
        """
        tags_by_name: Dict[str, Dict[str, Any]] = {}

        def upsert(name: Optional[str], label: Optional[str]):
            if not name:
                return
            if name not in tags_by_name:
                tags_by_name[name] = {
                    "tagName": name,
                    "tagLabel": label or "",
                    "tagDesc": None,
                }
            else:
                # label 以非空优先（避免后续行覆盖掉已有中文）
                if label and not tags_by_name[name].get("tagLabel"):
                    tags_by_name[name]["tagLabel"] = label

        for rel in relations:
            upsert(rel.get("op_name_source"), rel.get("_op_label_source"))
            upsert(rel.get("op_name_target"), rel.get("_op_label_target"))

        return list(tags_by_name.values())
    
    async def convert_to_standard_json_with_classify(
        self,
        ontology_id: str,
        ontology_name: str = "CSV_Ontology"
    ) -> Dict[str, Any]:
        """转换为标准JSON格式并查询数据库进行new/exist分类（与rdf_services.py完全一致）
        
        Args:
            ontology_id: 本体ID，用于查询数据库中的现有数据
            ontology_name: 本体名称
            
        Returns:
            带 new/exist 分类且 exist 项包含数据库 id 的标准 JSON
        """
        # 1. 解析 CSV 得到原始数据
        objects = self.parse_objects_from_csv()
        relations = self.parse_relations_from_csv()
        relation_stats = getattr(self, "relation_stats", {
            "success_relation_count": len(relations),
            "failed_relation_count": 0,
        })
        obj_name_set = {o.get("objectTypeName") for o in objects if o.get("objectTypeName")}
        filtered_relations = []
        skipped_relations = 0
        if obj_name_set:
            for rel in relations:
                sname = rel.get("sourcename")
                tname = rel.get("targetname")
                if sname in obj_name_set and tname in obj_name_set:
                    filtered_relations.append(rel)
                else:
                    skipped_relations += 1
        else:
            skipped_relations = len(relations)
        if skipped_relations:
            relation_stats["success_relation_count"] = max(
                0, relation_stats.get("success_relation_count", 0) - skipped_relations
            )
            relation_stats["failed_relation_count"] = (
                relation_stats.get("failed_relation_count", 0) + skipped_relations
            )
        relations = filtered_relations

        middle_errors: List[Dict[str, Any]] = []
        middle_ds_raws = {
            rel.get("middle_dataset_raw")
            for rel in relations
            if rel.get("link_type") == 2 and rel.get("middle_dataset_raw")
        }
        raw_to_rows: Dict[str, List[int]] = {}
        for rel in relations:
            if rel.get("link_type") != 2:
                continue
            raw_val = rel.get("middle_dataset_raw")
            if not raw_val:
                continue
            raw_to_rows.setdefault(raw_val, []).append(rel.get("_row_num"))
        middle_lookup: Dict[str, Optional[Dict[str, Any]]] = {}

        def _parse_middle_dataset(raw: str) -> Optional[Dict[str, str]]:
            parts = [p.strip() for p in raw.split("/") if p.strip()]
            if len(parts) != 3:
                return None
            return {"ds_name": parts[0], "ds_schema": parts[1], "table_name": parts[2]}

        def _normalize_ds_schema(value: Any) -> List[str]:
            if value is None:
                return []
            if isinstance(value, (list, tuple, set)):
                return [str(v).strip() for v in value if str(v).strip()]
            raw = str(value).strip()
            if not raw:
                return []
            if raw.startswith("[") and raw.endswith("]"):
                try:
                    loaded = json.loads(raw)
                    if isinstance(loaded, list):
                        return [str(v).strip() for v in loaded if str(v).strip()]
                except JSONDecodeError:
                    pass
            if "," in raw:
                return [s.strip() for s in raw.split(",") if s.strip()]
            return [raw]

        if middle_ds_raws:
            mysql = await create_mysql_service()
            parsed_by_raw: Dict[str, Dict[str, str]] = {}
            ds_names: set[str] = set()
            for raw in middle_ds_raws:
                parsed = _parse_middle_dataset(raw)
                if not parsed:
                    for row_num in raw_to_rows.get(raw, []):
                        middle_errors.append({
                            "type": "middle_dataset",
                            "line": row_num,
                            "middle_dataset": raw,
                            "message": f"中间数据集格式非法: {raw}",
                        })
                    continue
                parsed_by_raw[raw] = parsed
                ds_names.add(parsed["ds_name"])

            ds_rows: List[Dict[str, Any]] = []
            if ds_names:
                placeholders = ",".join(["%s"] * len(ds_names))
                sql = (
                    "SELECT rela_id, ds_name, ds_schema, ds_profile "
                    "FROM modo_team_ds "
                    f"WHERE ds_profile=%s AND ds_name IN ({placeholders})"
                )
                params = ["dev"] + list(ds_names)
                ds_rows = await mysql.afetch_all(sql, params)

            rows_by_name: Dict[str, List[Dict[str, Any]]] = {}
            for row in ds_rows:
                rows_by_name.setdefault(row.get("ds_name"), []).append(row)

            for raw, parsed in parsed_by_raw.items():
                candidates = rows_by_name.get(parsed["ds_name"], [])
                matched = []
                for row in candidates:
                    schemas = _normalize_ds_schema(row.get("ds_schema"))
                    if parsed["ds_schema"] in schemas:
                        matched.append(row)
                if len(matched) == 1:
                    middle_lookup[raw] = {
                        "middle_ds_id": matched[0].get("rela_id"),
                        "middle_ds_schema": parsed["ds_schema"],
                        "middle_table_name": parsed["table_name"],
                    }
                elif not matched:
                    for row_num in raw_to_rows.get(raw, []):
                        middle_errors.append({
                            "type": "middle_dataset",
                            "line": row_num,
                            "middle_dataset": raw,
                            "message": (
                                "中间数据集匹配失败: "
                                f"{raw} (ds_name={parsed['ds_name']}, ds_schema={parsed['ds_schema']})"
                            ),
                        })
                else:
                    for row_num in raw_to_rows.get(raw, []):
                        middle_errors.append({
                            "type": "middle_dataset",
                            "line": row_num,
                            "middle_dataset": raw,
                            "message": (
                                "中间数据集匹配不唯一: "
                                f"{raw} (ds_name={parsed['ds_name']}, ds_schema={parsed['ds_schema']})"
                            ),
                        })

            for rel in relations:
                if rel.get("link_type") != 2:
                    continue
                raw = rel.get("middle_dataset_raw")
                if not raw:
                    middle_errors.append({
                        "type": "middle_dataset",
                        "line": rel.get("_row_num"),
                        "middle_dataset": raw,
                        "message": "中间数据集关联缺少中间数据集字段",
                    })
                    continue
                lookup = middle_lookup.get(raw)
                if not lookup:
                    continue
                rel["middle_ds_id"] = lookup.get("middle_ds_id")
                rel["middle_ds_schema"] = lookup.get("middle_ds_schema")
                rel["middle_table_name"] = lookup.get("middle_table_name")

        if middle_errors:
            self.relation_errors = middle_errors

        # 中间数据集关联匹配失败则不写库
        filtered_relations = []
        skipped_middle = 0
        for rel in relations:
            if rel.get("link_type") == 2:
                raw = rel.get("middle_dataset_raw")
                if not raw or not rel.get("middle_ds_id"):
                    skipped_middle += 1
                    continue
            filtered_relations.append(rel)
        if skipped_middle:
            relation_stats["success_relation_count"] = max(
                0, relation_stats.get("success_relation_count", 0) - skipped_middle
            )
            relation_stats["failed_relation_count"] = (
                relation_stats.get("failed_relation_count", 0) + skipped_middle
            )
        relations = filtered_relations

        # 关系字段合法性与存在性校验（不规范/不存在 => error_list + 跳过）
        attr_name_map: Dict[str, set[str]] = {}
        for obj in objects:
            oname = obj.get("objectTypeName")
            if not oname:
                continue
            names = set()
            for attr in obj.get("attributes", []) or []:
                cn = attr.get("attributeName")
                en = attr.get("fieldName")
                if cn:
                    names.add(cn)
                if en:
                    names.add(en)
            attr_name_map[oname] = names

        rel_field_errors: List[Dict[str, Any]] = []
        filtered_relations = []
        skipped_rel = 0
        for rel in relations:
            sname = rel.get("sourcename")
            tname = rel.get("targetname")
            sattr = rel.get("source_attribute_name")
            tattr = rel.get("target_attribute_name")

            invalid_field = False
            if sname and not _is_valid_normal_local_name(sname):
                invalid_field = True
            if tname and not _is_valid_normal_local_name(tname):
                invalid_field = True
            if sattr and not _is_valid_attr_label(sattr):
                invalid_field = True
            if tattr and not _is_valid_attr_label(tattr):
                invalid_field = True

            if invalid_field:
                skipped_rel += 1
                rel_field_errors.append({
                    "type": "relation_invalid_field",
                    "line": rel.get("_row_num"),
                    "sourcename": sname,
                    "targetname": tname,
                    "source_attribute_name": sattr,
                    "target_attribute_name": tattr,
                    "message": "关系字段包含非法字符，已跳过该关系",
                })
                continue

            if sname and sname not in obj_name_set:
                skipped_rel += 1
                rel_field_errors.append({
                    "type": "relation_missing_object",
                    "line": rel.get("_row_num"),
                    "sourcename": sname,
                    "targetname": tname,
                    "message": "关系对象不存在，已跳过该关系",
                })
                continue
            if tname and tname not in obj_name_set:
                skipped_rel += 1
                rel_field_errors.append({
                    "type": "relation_missing_object",
                    "line": rel.get("_row_num"),
                    "sourcename": sname,
                    "targetname": tname,
                    "message": "关系对象不存在，已跳过该关系",
                })
                continue

            if sattr and sattr not in attr_name_map.get(sname, set()):
                skipped_rel += 1
                rel_field_errors.append({
                    "type": "relation_missing_attribute",
                    "line": rel.get("_row_num"),
                    "sourcename": sname,
                    "targetname": tname,
                    "source_attribute_name": sattr,
                    "message": "关系对象属性不存在，已跳过该关系",
                })
                continue
            if tattr and tattr not in attr_name_map.get(tname, set()):
                skipped_rel += 1
                rel_field_errors.append({
                    "type": "relation_missing_attribute",
                    "line": rel.get("_row_num"),
                    "sourcename": sname,
                    "targetname": tname,
                    "target_attribute_name": tattr,
                    "message": "关系对象属性不存在，已跳过该关系",
                })
                continue

            filtered_relations.append(rel)

        if skipped_rel:
            relation_stats["success_relation_count"] = max(
                0, relation_stats.get("success_relation_count", 0) - skipped_rel
            )
            relation_stats["failed_relation_count"] = (
                relation_stats.get("failed_relation_count", 0) + skipped_rel
            )
        relations = filtered_relations

        if rel_field_errors:
            if getattr(self, "relation_errors", None):
                self.relation_errors.extend(rel_field_errors)
            else:
                self.relation_errors = rel_field_errors
        tags = self._build_tags_from_relations(relations)
        
        # 清理关系内部元数据
        for rel in relations:
            rel.pop("_op_label_source", None)
            rel.pop("_op_label_target", None)
        
        # 2. 构建 simple_json（所有数据未分类，属性暂时保持列表形式）
        simple_json = {
            "ontology_name": ontology_name,
            "object": [{"objectTypeName": o["objectTypeName"],
                        "objectTypeLabel": o["objectTypeLabel"],
                        "objectTypeDesc": o["objectTypeDesc"],
                        "objectTypeStatus": o.get("objectTypeStatus"),
                        "attributes": o["attributes"]} for o in objects],
            "tag": tags,
            "link": relations,
            "action": [],
            "logic": []
        }
        
        # 3. 查询数据库获取现有数据映射（SQL 与 rdf_services.py 完全一致）
        mysql = await create_mysql_service()
        
        # 3.1 查询现有对象
        exist_objs = await mysql.afetch_all(
            "SELECT id, object_type_name, object_type_label FROM ontology_object_type WHERE ontology_id=%s AND sync_status < 3",
            (str(ontology_id),)
        )
        exist_obj_map = {row["object_type_name"]: row for row in exist_objs}
        
        # 3.2 查询现有属性
        exist_attrs = await mysql.afetch_all(
            """
            SELECT oota.id, oota.attribute_name, oota.field_name, oot.object_type_name
            FROM ontology_object_type_attribute oota
            JOIN ontology_object_type oot ON oota.object_type_id = oot.id
            WHERE oot.ontology_id = %s AND oota.sync_status < 3
            """,
            (str(ontology_id),)
        )
        exist_attr_map: Dict[tuple[str, str], Dict[str, Any]] = {}
        for row in exist_attrs:
            k1 = (row["object_type_name"], row.get("attribute_name")) if row.get("attribute_name") else None
            k2 = (row["object_type_name"], row.get("field_name")) if row.get("field_name") else None
            if k1:
                exist_attr_map[k1] = row
            if k2:
                exist_attr_map[k2] = row
        
        # 3.3 查询现有关系（sync_status=3 视为不存在）
        exist_links = await mysql.afetch_all(
            "SELECT id, source_name, target_name, sync_status FROM ontology_link_type WHERE ontology_id=%s",
            (str(ontology_id),)
        )
        exist_link_map = {}
        for row in exist_links:
            if row.get("sync_status", 0) is None:
                sync_status = 0
            else:
                sync_status = int(row.get("sync_status", 0))
            if sync_status >= 3:
                continue
            exist_link_map[(row["source_name"], row["target_name"])] = row
        
        # 3.4 查询现有标签（tag 是全局的，不按 ontology_id 过滤）
        exist_tags = await mysql.afetch_all(
            "SELECT id, tag_name, tag_label FROM ontology_tag WHERE sync_status < 3",
        )
        exist_tag_map = {row["tag_name"]: row for row in exist_tags}
        
        # 3.5 查询现有 action
        exist_actions = await mysql.afetch_all(
            """
            SELECT oota.id, oota.action_name, oot.object_type_name
            FROM ontology_object_type_action oota
            JOIN ontology_object_type oot ON oota.object_type_id = oot.id
            WHERE oota.ontology_id = %s AND oota.sync_status < 3
            """,
            (str(ontology_id),)
        )
        exist_action_map = {(row["object_type_name"], row["action_name"]): row for row in exist_actions}
        
        # 3.6 查询现有 logic
        exist_funcs = await mysql.afetch_all(
            "SELECT id, logic_type_name FROM ontology_logic_type WHERE ontology_id=%s AND sync_status < 3",
            (str(ontology_id),)
        )
        exist_logic_map = {row["logic_type_name"]: row for row in exist_funcs}
        
        # 4. 资源分类（使用 is_exist 字段标识）
        objects_list: List[Dict[str, Any]] = []
        for o in (simple_json.get("object") or []):
            name = o.get("objectTypeName")
            if not name:
                continue
            attrs = o.get("attributes") or []
            attrs_list = []
            for a in attrs:
                attr_cn = a.get("attributeName")
                field = a.get("fieldName") or attr_cn
                k1 = (name, attr_cn) if attr_cn else None
                k2 = (name, field) if field else None
                # 检查属性是否已存在，并获取其ID
                existing_attr = None
                if k1 and k1 in exist_attr_map:
                    existing_attr = exist_attr_map[k1]
                elif k2 and k2 in exist_attr_map:
                    existing_attr = exist_attr_map[k2]
                
                attr_item = {
                    "attributeName": attr_cn or field,
                    "fieldName": field,
                    "isPrimaryKey": bool(a.get("isPrimaryKey") or False),
                    "isTitle": bool(a.get("isTitle") or False),
                    "attributeDesc": a.get("attributeDesc"),
                    "fieldType": a.get("fieldType"),
                    "is_exist": existing_attr is not None,
                }
                # 如果属性已存在，添加其ID
                if existing_attr:
                    attr_item["id"] = existing_attr["id"]
                attrs_list.append(attr_item)
            
            is_exist = name in exist_obj_map
            item = {
                "objectTypeName": name,
                "objectTypeLabel": o.get("objectTypeLabel"),
                "objectTypeDesc": o.get("objectTypeDesc"),
                "objectTypeStatus": o.get("objectTypeStatus"),
                "attributes": attrs_list,
                "is_exist": is_exist,
            }
            if is_exist:
                item["id"] = exist_obj_map[name]["id"]
            objects_list.append(item)
        
        tags_list = []
        for t in (simple_json.get("tag") or []):
            tname = t.get("tagName")
            if not tname:
                continue
            is_exist = tname in exist_tag_map
            item = {
                "tagName": tname, 
                "tagLabel": t.get("tagLabel"), 
                "tagDesc": t.get("tagDesc"),
                "is_exist": is_exist,
            }
            if is_exist:
                item["id"] = exist_tag_map[tname]["id"]
            tags_list.append(item)
        
        def _resolve_exist_attr_id(obj_name: Optional[str], attr_name: Optional[str]) -> Optional[str]:
            if not obj_name or not attr_name:
                return None
            row = exist_attr_map.get((obj_name, attr_name))
            if row:
                return row.get("id")
            return None

        links_list = []
        for l in (simple_json.get("link") or []):
            sname, tname = l.get("sourcename"), l.get("targetname")
            if not sname or not tname:
                continue
            source_attr_name = l.get("source_attribute_name")
            target_attr_name = l.get("target_attribute_name")
            source_attr_id = _resolve_exist_attr_id(sname, source_attr_name)
            target_attr_id = _resolve_exist_attr_id(tname, target_attr_name)
            is_exist = (sname, tname) in exist_link_map
            item = {
                "op_name_source": l.get("op_name_source"),
                "op_name_target": l.get("op_name_target"),
                "sourcename": sname,
                "sourcelabel": l.get("sourcelabel") or sname,
                "targetname": tname,
                "targetlabel": l.get("targetlabel") or tname,
                "source_attribute_name": source_attr_name,
                "target_attribute_name": target_attr_name,
                "source_attribute_id": source_attr_id,
                "target_attribute_id": target_attr_id,
                "link_type": l.get("link_type", 1),
                "link_method": l.get("link_method", 1),
                "row_num": l.get("_row_num"),
                "middle_dataset": l.get("middle_dataset_raw"),
                "middle_ds_id": l.get("middle_ds_id"),
                "middle_ds_schema": l.get("middle_ds_schema"),
                "middle_table_name": l.get("middle_table_name"),
                "middle_source_field": l.get("middle_source_field"),
                "middle_target_field": l.get("middle_target_field"),
                "is_exist": is_exist,
            }
            if is_exist:
                item["id"] = exist_link_map[(sname, tname)]["id"]
            links_list.append(item)
        
        actions_list = []
        for a in (simple_json.get("action") or []):
            oname, aname = a.get("object_name"), a.get("action_name")
            if not oname or not aname:
                continue
            is_exist = (oname, aname) in exist_action_map
            item = {
                "object_name": oname,
                "action_name": aname,
                "action_label": a.get("action_label"),
                "action_desc": a.get("action_desc"),
                "build_type": a.get("build_type", "function"),
                "file_name": "import_action",
                "fun_params": json.dumps(a.get("fun_params") or {}, ensure_ascii=False),
                "is_exist": is_exist,
            }
            if is_exist:
                item["id"] = exist_action_map[(oname, aname)]["id"]
            actions_list.append(item)
        
        logic_list = []
        for f in (simple_json.get("logic") or []):
            fname = f.get("function_name")
            if not fname:
                continue
            is_exist = fname in exist_logic_map
            item = {
                "ontology_name": f.get("ontology_name"),
                "used_objects": f.get("used_objects"),
                "function_name": fname,
                "fun_desc": f.get("fun_desc"),
                "function_label": f.get("function_label"),
                "build_type": f.get("build_type", "function"),
                "file_name": f.get("file_name", "import_logic"),
                "fun_params": json.dumps(f.get("fun_params") or {}, ensure_ascii=False),
                "is_exist": is_exist,
            }
            if is_exist:
                item["id"] = exist_logic_map[fname]["id"]
            logic_list.append(item)
        
        # 5. 返回分类结果（使用 is_exist 字段）
        result = {
            "ontology_name": simple_json.get("ontology_name"),
            "object": objects_list,
            "tag": tags_list,
            "link": links_list,
            "action": actions_list,
            "logic": logic_list,
        }

        error_list = []
        if getattr(self, "object_errors", None):
            error_list.extend(self.object_errors)
        if getattr(self, "relation_errors", None):
            error_list.extend(self.relation_errors)
        if error_list:
            result["error_list"] = error_list
        if getattr(self, "object_stats", None):
            stats = dict(self.object_stats)
            if relation_stats:
                stats.update(relation_stats)
            result["parse_stats"] = stats
        elif relation_stats:
            result["parse_stats"] = relation_stats
        
        return result

    async def write_to_database(
        self,
        ontology_id: str,
        owner_id: str,
        result_json: Dict[str, Any],
    ) -> Dict[str, Any]:
        validated_data = _normalize_and_validate_csv(result_json)
        mysql = await create_mysql_service()
        async with mysql.atransaction() as conn:
            return await _write_all_data_pure_csv(
                conn=conn,
                ontology_id=ontology_id,
                owner_id=owner_id,
                validated_data=validated_data,
            )
    
    async def save_to_file(
        self, 
        output_path: str, 
        ontology_id: str,
        ontology_name: str = "CSV_Ontology"
    ):
        """转换并保存到JSON文件（与 rdf_services.py 一致：默认查询数据库进行 new/exist 分类）
        
        Args:
            output_path: 输出文件路径
            ontology_id: 本体ID，用于查询数据库
            ontology_name: 本体名称
        """
        result = await self.convert_to_standard_json_with_classify(ontology_id, ontology_name)
        
        with open(output_path, 'w', encoding='utf-8-sig') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 统计新增和已存在的资源（使用 is_exist 字段）
        obj_new = len([o for o in result['object'] if not o.get('is_exist')])
        obj_exist = len([o for o in result['object'] if o.get('is_exist')])
        link_new = len([l for l in result['link'] if not l.get('is_exist')])
        link_exist = len([l for l in result['link'] if l.get('is_exist')])
        tag_new = len([t for t in result['tag'] if not t.get('is_exist')])
        tag_exist = len([t for t in result['tag'] if t.get('is_exist')])
        
        print(f"转换完成（已查询数据库分类）:")
        print(f"  对象: {obj_new} 新增, {obj_exist} 已存在")
        print(f"  关系: {link_new} 新增, {link_exist} 已存在")
        print(f"  标签: {tag_new} 新增, {tag_exist} 已存在")
        print(f"  -> {output_path}")
        
        return result

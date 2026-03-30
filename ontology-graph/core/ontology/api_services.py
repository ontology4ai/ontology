from typing import Optional, Dict, Any, List
from utils.databases.service_factory import create_mysql_service
from apis.models import ApiResponse
from public.public_variable import logger


def _fmt_ts(val: Any) -> Optional[str]:
    if not val:
        return None
    try:
        return val.strftime("%Y-%m-%d %H:%M")  # type: ignore[attr-defined]
    except Exception:
        return str(val)


async def get_graph_data(ontology_id: str, nodes_amount: int, node_names: Optional[List[str]], pub_version: bool = False) -> ApiResponse:
    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service is not configured")
    logger.info(f"nodes_amount: {nodes_amount}")
    # 查询对象类型数据（支持 node_names 模糊查询；否则随机抽样）；pub_version 则查询 _his 表并按版本过滤
    if pub_version:
        ov = await mysql.afetch_one(
            """
            SELECT latest_version FROM ontology_manage WHERE id = %(id)s
            """,
            {"id": ontology_id},
        )
        if not ov or not ov.get("latest_version"):
            raise RuntimeError(f"No published latest_version for ontology_id={ontology_id}")
        latest_version = ov.get("latest_version")

        if node_names:
            collected: Dict[str, Dict[str, Any]] = {}
            for kw in node_names:
                if not kw:
                    continue
                rows = await mysql.afetch_all(
                    """
                    SELECT id, create_time, last_update, sync_status, object_type_desc,
                           object_type_label, object_type_name, ontology_id, owner_id,
                           status, ds_id, ds_schema, table_name, icon, object_type_id,
                           interface_id, interface_icon
                    FROM ontology_object_type_his
                    WHERE ontology_id = %(ontology_id)s
                      AND latest_version = %(ver)s
                      AND sync_status <= 2
                      AND link_type_id IS NULL
                      AND (object_type_label LIKE %(kw)s OR object_type_name LIKE %(kw)s)
                    ORDER BY last_update DESC, create_time DESC
                    LIMIT %(limit)s
                    """,
                    {"ontology_id": ontology_id, "ver": latest_version, "kw": f"%{kw}%", "limit": int(nodes_amount)},
                )
                for r in rows:
                    rid = r.get("object_type_id")
                    if rid and rid not in collected:
                        collected[rid] = r
                    if len(collected) >= int(nodes_amount):
                        break
                if len(collected) >= int(nodes_amount):
                    break
            object_types = list(collected.values())
        else:
            object_types = await mysql.afetch_all(
                """
          SELECT id, create_time, last_update, sync_status, object_type_desc,
              object_type_label, object_type_name, ontology_id, owner_id,
                       status, ds_id, ds_schema, table_name, icon, object_type_id,
                       interface_id, interface_icon
          FROM ontology_object_type_his
                WHERE ontology_id = %(ontology_id)s
                  AND latest_version = %(ver)s
                  AND sync_status <= 2
                  AND link_type_id IS NULL
                ORDER BY RAND()
                LIMIT %(nodes_amount)s
                """,
                {"ontology_id": ontology_id, "ver": latest_version, "nodes_amount": int(nodes_amount)},
            )
    else:
        if node_names:
            # 逐个关键词模糊查，去重并截断到 nodes_amount（未发布）
            collected: Dict[str, Dict[str, Any]] = {}
            for kw in node_names:
                if not kw:
                    continue
                rows = await mysql.afetch_all(
                    """
                    SELECT id, create_time, last_update, sync_status, object_type_desc,
                           object_type_label, object_type_name, ontology_id, owner_id,
                           status, ds_id, ds_schema, table_name, icon, interface_id, interface_icon
                    FROM ontology_object_type
                    WHERE ontology_id = %(ontology_id)s
                      AND (object_type_label LIKE %(kw)s OR object_type_name LIKE %(kw)s)
                      AND sync_status <= 2
                      AND link_type_id IS NULL
                    ORDER BY last_update DESC, create_time DESC
                    LIMIT %(limit)s
                    """,
                    {"ontology_id": ontology_id, "kw": f"%{kw}%", "limit": int(nodes_amount)},
                )
                for r in rows:
                    rid = r.get("id")
                    if rid and rid not in collected:
                        collected[rid] = r
                    if len(collected) >= int(nodes_amount):
                        break
                if len(collected) >= int(nodes_amount):
                    break
            object_types = list(collected.values())
        else:
            object_types = await mysql.afetch_all(
                """
          SELECT id, create_time, last_update, sync_status, object_type_desc,
              object_type_label, object_type_name, ontology_id, owner_id,
                       status, ds_id, ds_schema, table_name, icon, interface_id, interface_icon
          FROM ontology_object_type
                WHERE ontology_id = %(ontology_id)s
                  AND sync_status <= 2
                  AND link_type_id IS NULL
                ORDER BY RAND()
                LIMIT %(nodes_amount)s
                """,
                {"ontology_id": ontology_id, "nodes_amount": int(nodes_amount)},
            )
    logger.info(f"got object_types: {len(object_types)}")
    # 查询属性数据
    if pub_version:
        attributes = await mysql.afetch_all(
            """
            SELECT ota.id, ota.attribute_id, ota.create_time, ota.last_update, ota.sync_status,
                   ota.attribute_name, ota.field_name, ota.is_primary_key, ota.is_title,
                   ota.object_type_id, ota.shared_attribute_id, ota.field_type,
                   ota.status, ota.attribute_desc, ota.attribute_inst
            FROM ontology_object_type_attribute_his ota
            INNER JOIN ontology_object_type_his ot ON ota.object_type_id = ot.object_type_id
            WHERE ot.ontology_id = %(ontology_id)s
              AND ota.latest_version = %(ver)s
              AND ot.latest_version = %(ver)s
              AND ota.sync_status <= 2
              AND ot.sync_status <= 2
            """,
            {"ontology_id": ontology_id, "ver": latest_version},
        )
    else:
        attributes = await mysql.afetch_all(
            """
            SELECT ota.id, ota.create_time, ota.last_update, ota.sync_status,
                   ota.attribute_name, ota.field_name, ota.is_primary_key, ota.is_title,
                   ota.object_type_id, ota.shared_attribute_id, ota.field_type,
                   ota.status, ota.attribute_desc, ota.attribute_inst
            FROM ontology_object_type_attribute ota
            INNER JOIN ontology_object_type ot ON ota.object_type_id = ot.id
            WHERE ot.ontology_id = %(ontology_id)s
              AND ota.sync_status <= 2
              AND ot.sync_status <= 2
            """,
            {"ontology_id": ontology_id},
        )

    # 仅保留已选对象集合的属性
    selected_object_ids = {str(o.get("object_type_id")) if pub_version else str(o.get("id")) for o in object_types if (o.get("object_type_id") if pub_version else o.get("id"))}
    attributes = [a for a in attributes if a.get("object_type_id") in selected_object_ids]

    # 查询对象-对象链接类型
    if pub_version:
        link_types = await mysql.afetch_all(
            """
            SELECT id, link_type_id, link_method, link_type, source_object_type_id, target_object_type_id,
                   source_attribute_id, target_attribute_id, middle_table_name, middle_ds_schema,
                   source_label, target_label
            FROM ontology_link_type_his
            WHERE ontology_id = %(ontology_id)s
              AND latest_version = %(ver)s
              AND sync_status <= 2
            """,
            {"ontology_id": ontology_id, "ver": latest_version},
        )
    else:
        link_types = await mysql.afetch_all(
            """
            SELECT id, link_method, link_type, source_object_type_id, target_object_type_id,
                   source_attribute_id, target_attribute_id, middle_table_name, middle_ds_schema,
                   source_label, target_label
            FROM ontology_link_type
            WHERE ontology_id = %(ontology_id)s
              AND sync_status <= 2
            """,
            {"ontology_id": ontology_id},
        )

    # 查询链接类型的标签（区分方向，可能有多个标签）
    if pub_version:
        link_tags_rows = await mysql.afetch_all(
            """
            SELECT l.link_type_id AS link_type_id, ltt.link_direct, t.id AS tag_id, t.tag_label
            FROM ontology_link_type_his l
            LEFT JOIN ontology_link_type_tag ltt ON ltt.link_type_id = l.link_type_id
            LEFT JOIN ontology_tag t ON t.id = ltt.tag_id
            WHERE l.ontology_id = %(ontology_id)s
              AND l.latest_version = %(ver)s
              AND l.sync_status <= 2
              AND (t.sync_status <= 2 OR t.id IS NULL)
            ORDER BY l.link_type_id, ltt.id
            """,
            {"ontology_id": ontology_id, "ver": latest_version},
        )
    else:
        link_tags_rows = await mysql.afetch_all(
            """
            SELECT l.id AS link_type_id, ltt.link_direct, t.id AS tag_id, t.tag_label
            FROM ontology_link_type l
            LEFT JOIN ontology_link_type_tag ltt ON ltt.link_type_id = l.id
            LEFT JOIN ontology_tag t ON t.id = ltt.tag_id
            WHERE l.ontology_id = %(ontology_id)s
              AND l.sync_status <= 2
              AND (t.sync_status <= 2 OR t.id IS NULL)
            ORDER BY l.id, ltt.id
            """,
            {"ontology_id": ontology_id},
        )

    # 构建 link_type -> {source: [...], target: [...]} 映射
    link_id_to_dir_labels: Dict[str, Dict[str, List[str]]] = {}
    link_id_to_dir_items: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for row in link_tags_rows:
        link_id = row.get("link_type_id")
        direction = (row.get("link_direct") or "").lower()
        tag_id = row.get("tag_id")
        label = row.get("tag_label")
        if not link_id or direction not in ("source", "target"):
            continue
        if link_id not in link_id_to_dir_labels:
            link_id_to_dir_labels[link_id] = {"source": [], "target": []}
        if link_id not in link_id_to_dir_items:
            link_id_to_dir_items[link_id] = {"source": [], "target": []}
        if label:
            link_id_to_dir_labels[link_id][direction].append(label)
        if tag_id or label:
            link_id_to_dir_items[link_id][direction].append({"id": tag_id, "label": label})

    # ========== 加载 logic 和 action 节点（不受 nodes_amount 限制） ==========
    if pub_version:
        logic_rows = await mysql.afetch_all(
            """
            SELECT id, logic_type_id, create_time, last_update, sync_status,
                   build_type, function_code, file_name, intput_param,
                   logic_type_desc, logic_type_label, logic_type_name,
                   ontology_id, output_param, owner_id, repo_name, status, oper_status
            FROM ontology_logic_type_his
            WHERE ontology_id = %(oid)s AND latest_version = %(ver)s AND sync_status <= 2
            """,
            {"oid": ontology_id, "ver": latest_version},
        )
        action_rows = await mysql.afetch_all(
            """
            SELECT id, action_id, create_time, last_update, sync_status,
                   object_type_id, action_name, action_label, action_desc, action_type,
                   icon, status, ontology_id, oper_status, build_type
            FROM ontology_object_type_action_his
            WHERE ontology_id = %(oid)s AND latest_version = %(ver)s AND sync_status <= 2
            """,
            {"oid": ontology_id, "ver": latest_version},
        )
    else:
        logic_rows = await mysql.afetch_all(
            """
            SELECT id, create_time, last_update, sync_status,
                   build_type, function_code, file_name, intput_param,
                   logic_type_desc, logic_type_label, logic_type_name,
                   ontology_id, output_param, owner_id, repo_name, status, oper_status
            FROM ontology_logic_type
            WHERE ontology_id = %(oid)s AND sync_status <= 2
            """,
            {"oid": ontology_id},
        )
        action_rows = await mysql.afetch_all(
            """
            SELECT id, create_time, last_update, sync_status,
                   object_type_id, action_name, action_label, action_desc, action_type,
                   icon, status, ontology_id, oper_status, build_type
            FROM ontology_object_type_action
            WHERE ontology_id = %(oid)s AND sync_status <= 2
            """,
            {"oid": ontology_id},
        )

    attrs_by_object: Dict[str, List[Dict[str, Any]]] = {}
    for attr in attributes:
        obj_id = attr.get("object_type_id")
        if not obj_id:
            continue
        attr_item = {
            "id": attr.get("attribute_id") if pub_version else attr.get("id"),
            "create_time": _fmt_ts(attr.get("create_time")),
            "last_update": _fmt_ts(attr.get("last_update")),
            "sync_status": attr.get("sync_status"),
            "attribute_name": attr.get("attribute_name"),
            "field_name": attr.get("field_name"),
            "is_primary_key": attr.get("is_primary_key"),
            "is_title": attr.get("is_title"),
            "object_type_id": attr.get("object_type_id"),
            "shared_attribute_id": attr.get("shared_attribute_id"),
            "field_type": attr.get("field_type"),
            "status": attr.get("status"),
            "attribute_desc": attr.get("attribute_desc"),
            "attribute_inst": attr.get("attribute_inst"),
            "node_type": "attribute"
        }
        attrs_by_object.setdefault(obj_id, []).append(attr_item)
    # 属性 id -> label 映射（兼容 his 的 attribute_id）
    attr_id_to_label: Dict[str, str] = {}
    for a in attributes:
        aname = a.get("attribute_name")
        if a.get("id"):
            attr_id_to_label[str(a.get("id"))] = aname
        if a.get("attribute_id"):
            attr_id_to_label[str(a.get("attribute_id"))] = aname

    # 预载 logic 使用关系，供 logic 节点 used_object_ids 使用
    if pub_version:
        logic_edges_rows_pre = await mysql.afetch_all(
            """
            SELECT i.logic_type_id, i.object_type_id
            FROM ontology_logic_type_object i
            INNER JOIN ontology_logic_type_his l ON l.logic_type_id = i.logic_type_id AND l.sync_status <= 2
            INNER JOIN ontology_object_type_his o ON o.object_type_id = i.object_type_id AND o.sync_status <= 2
            WHERE i.ontology_id = %(oid)s
              AND l.latest_version = %(ver)s
              AND o.latest_version = %(ver)s
            """,
            {"oid": ontology_id, "ver": latest_version},
        )
    else:
        logic_edges_rows_pre = await mysql.afetch_all(
            """
            SELECT i.logic_type_id, i.object_type_id
            FROM ontology_logic_type_object i
            INNER JOIN ontology_logic_type l ON l.id = i.logic_type_id AND l.sync_status <= 2
            INNER JOIN ontology_object_type o ON o.id = i.object_type_id AND o.sync_status <= 2
            WHERE i.ontology_id = %(oid)s
            """,
            {"oid": ontology_id},
        )

    logic_used_map: Dict[str, List[str]] = {}
    for r in logic_edges_rows_pre:
        obj_id = r.get("object_type_id")
        lg_id = r.get("logic_type_id")
        if not obj_id or not lg_id:
            continue
        if obj_id not in selected_object_ids:
            continue
        logic_used_map.setdefault(str(lg_id), []).append(obj_id)

    # ========== 统计信息预计算 ==========
    # 对象属性数量
    object_attr_count: Dict[str, int] = {oid: len(attrs_by_object.get(oid, [])) for oid in selected_object_ids}

    # 对象-对象关系数量（仅统计对象之间的 link_types，按关系条数计数，源/目标各加 1）
    object_rel_count: Dict[str, int] = {oid: 0 for oid in selected_object_ids}
    for lt in link_types:
        sid = lt.get("source_object_type_id")
        tid = lt.get("target_object_type_id")
        if not sid or not tid:
            continue
        if sid in selected_object_ids and tid in selected_object_ids:
            object_rel_count[sid] = object_rel_count.get(sid, 0) + 1
            object_rel_count[tid] = object_rel_count.get(tid, 0) + 1

    # 每个对象被多少个 logic 引用（仅统计已加载 logic，去重计数）
    object_logic_ref_count: Dict[str, int] = {oid: 0 for oid in selected_object_ids}
    tmp_logic_ref_set: Dict[str, set] = {oid: set() for oid in selected_object_ids}
    # 仅统计当前已加载到节点中的 logic（与上方 logic_rows 保持一致）
    present_logic_ids = {
        (str(lg.get("logic_type_id")) if pub_version else str(lg.get("id")))
        for lg in logic_rows
        if (lg.get("logic_type_id") if pub_version else lg.get("id"))
    }
    for r in logic_edges_rows_pre:
        oid_raw = r.get("object_type_id")
        lid_raw = r.get("logic_type_id")
        if not oid_raw or not lid_raw:
            continue
        oid = str(oid_raw)
        lid = str(lid_raw)
        if oid not in selected_object_ids or lid not in present_logic_ids:
            continue
        tmp_logic_ref_set.setdefault(oid, set()).add(lid)
    for oid, s in tmp_logic_ref_set.items():
        object_logic_ref_count[oid] = len(s)

    # 每个对象被多少个 action 执行（一个 action 绑定一个对象）
    object_action_exec_count: Dict[str, int] = {oid: 0 for oid in selected_object_ids}
    for a in action_rows:
        oid = a.get("object_type_id")
        if oid and oid in selected_object_ids:
            object_action_exec_count[oid] = object_action_exec_count.get(oid, 0) + 1

    # 每个 logic 引用了多少个对象
    logic_used_object_count: Dict[str, int] = {}
    for lid, obj_list in logic_used_map.items():
        logic_used_object_count[lid] = len(set(obj_list))

    # 每个 action 执行了多少个对象（当前模型为 0/1）
    action_exec_object_count: Dict[str, int] = {}
    for a in action_rows:
        aid = a.get("action_id") if pub_version else a.get("id")
        oid = a.get("object_type_id")
        if aid is None:
            continue
        action_exec_object_count[str(aid)] = 1 if oid and oid in selected_object_ids else 0

    # 构建节点数组
    nodes = []
    
    # 添加对象类型节点
    for obj_type in object_types:
        node_id_val = obj_type.get("object_type_id") if pub_version else obj_type.get("id")
        node_data = {
            "create_time": _fmt_ts(obj_type.get("create_time")),
            "last_update": _fmt_ts(obj_type.get("last_update")),
            "sync_status": obj_type.get("sync_status"),
            "object_type_desc": obj_type.get("object_type_desc"),
            "object_type_label": obj_type.get("object_type_label"),
            "object_type_name": obj_type.get("object_type_name"),
            "ontology_id": obj_type.get("ontology_id"),
            "owner_id": obj_type.get("owner_id"),
            "status": obj_type.get("status"),
            "ds_id": obj_type.get("ds_id"),
            "ds_schema": obj_type.get("ds_schema"),
            "table_name": obj_type.get("table_name"),
            "icon": obj_type.get("icon"),
            "node_type": "object",
            "attributes": attrs_by_object.get(str(node_id_val), []),
            "has_datasource": True if obj_type.get("ds_id") else False,
            "interface_id": obj_type.get("interface_id"),
            "interface_icon": obj_type.get("interface_icon"),
            "has_interface": True if obj_type.get("interface_id") else False,
            "stats": {
                "attribute_count": object_attr_count.get(str(node_id_val), 0),
                "object_rel_count": object_rel_count.get(str(node_id_val), 0),
                "logic_ref_count": object_logic_ref_count.get(str(node_id_val), 0),
                "action_exec_count": object_action_exec_count.get(str(node_id_val), 0),
            },
        }
        nodes.append({
            "id": node_id_val,
            "type": "circle",
            "data": node_data
        })

    # 添加 logic 节点
    for lg in logic_rows:
        logic_id = lg.get("logic_type_id") if pub_version else lg.get("id")
        if not logic_id:
            continue
        node_data = {
            "create_time": _fmt_ts(lg.get("create_time")),
            "last_update": _fmt_ts(lg.get("last_update")),
            "sync_status": lg.get("sync_status"),
            "build_type": lg.get("build_type"),
            "function_code": lg.get("function_code"),
            "file_name": lg.get("file_name"),
            "intput_param": lg.get("intput_param"),
            "logic_type_desc": lg.get("logic_type_desc"),
            "logic_type_label": lg.get("logic_type_label"),
            "logic_type_name": lg.get("logic_type_name"),
            "ontology_id": lg.get("ontology_id"),
            "output_param": lg.get("output_param"),
            "owner_id": lg.get("owner_id"),
            "repo_name": lg.get("repo_name"),
            "status": lg.get("status"),
            "oper_status": lg.get("oper_status"),
            "node_type": "logic",
            "used_object_ids": sorted(list({*logic_used_map.get(str(logic_id), [])})),
            "stats": {
                "used_object_count": logic_used_object_count.get(str(logic_id), 0),
            },
        }
        nodes.append({"id": logic_id, "type": "circle", "data": node_data})

    # 添加 action 节点
    for act in action_rows:
        action_id = act.get("action_id") if pub_version else act.get("id")
        if not action_id:
            continue
        node_data = {
            "create_time": _fmt_ts(act.get("create_time")),
            "last_update": _fmt_ts(act.get("last_update")),
            "sync_status": act.get("sync_status"),
            "object_type_id": act.get("object_type_id"),
            "action_name": act.get("action_name"),
            "action_label": act.get("action_label"),
            "action_desc": act.get("action_desc"),
            "action_type": act.get("action_type"),
            "icon": act.get("icon"),
            "status": act.get("status"),
            "ontology_id": act.get("ontology_id"),
            "oper_status": act.get("oper_status"),
            "build_type": act.get("build_type"),
            "node_type": "action",
            "stats": {
                "exec_object_count": action_exec_object_count.get(str(action_id), 0),
            },
        }
        nodes.append({"id": action_id, "type": "circle", "data": node_data})

    # 添加 interface 节点与继承边（查询该本体下的所有 interface）
    interface_rows: List[Dict[str, Any]] = []
    if pub_version:
        interface_rows = await mysql.afetch_all(
            """
            SELECT id, origin_id, ontology_id, create_time, last_update, name, label, description,
                   owner_id, status, sync_status, oper_status, icon
            FROM ontology_interface_his
            WHERE ontology_id = %(oid)s
              AND latest_version = %(ver)s
              AND sync_status <= 2
            """,
            {"oid": ontology_id, "ver": latest_version},
        )
    else:
        interface_rows = await mysql.afetch_all(
            """
            SELECT id, ontology_id, create_time, last_update, name, label, description,
                   owner_id, status, sync_status, oper_status, icon
            FROM ontology_interface
            WHERE ontology_id = %(oid)s AND sync_status <= 2
            """,
            {"oid": ontology_id},
        )
    
    # 统计每个 interface 被多少对象继承（限于选中对象集合）
    interface_inherit_count: Dict[str, int] = {}
    for o in object_types:
        iid = o.get("interface_id")
        oid = o.get("object_type_id") if pub_version else o.get("id")
        if iid and oid in selected_object_ids:
            key = str(iid)
            interface_inherit_count[key] = interface_inherit_count.get(key, 0) + 1

    for itf in interface_rows:
        _iid = itf.get("origin_id") if pub_version else itf.get("id")
        nodes.append({
            "id": _iid,
            "type": "circle",
            "data": {
                "create_time": _fmt_ts(itf.get("create_time")),
                "last_update": _fmt_ts(itf.get("last_update")),
                "name": itf.get("name"),
                "label": itf.get("label"),
                "description": itf.get("description"),
                "ontology_id": itf.get("ontology_id"),
                "owner_id": itf.get("owner_id"),
                "status": itf.get("status"),
                "sync_status": itf.get("sync_status"),
                "icon": itf.get("icon"),
                "node_type": "interface",
                "stats": {
                    "inherited_by_object_count": interface_inherit_count.get(str(_iid), 0),
                },
            },
        })

    # 构建边数组
    edges = []

    # 依据 link_method 和 link_type 计算基数
    def _compute_cardinality(method_val: Optional[int], type_val: Optional[int]) -> str:
        if type_val is None and method_val is None:
            return ""
        if type_val == 2:
            return "manytomany"
        if type_val == 1:
            if method_val == 1:
                return "onetoone"
            if method_val == 2:
                return "onetomany"
        return ""

    # 反向基数
    def _reverse_cardinality(card: str) -> str:
        if card == "onetomany":
            return "manytoone"
        if card == "manytoone":
            return "onetomany"
        return card  # onetoone / manytomany / ""

    # 添加对象-对象边（使用标签列表 source_labels/target_labels）
    for lt in link_types:
        map_key_raw = lt.get("link_type_id") if pub_version else lt.get("id")
        map_key = str(map_key_raw) if map_key_raw is not None else ""
        dir_labels = link_id_to_dir_labels.get(map_key, {"source": [], "target": []})

        source_id = lt.get("source_object_type_id")
        target_id = lt.get("target_object_type_id")
        # 仅包含两端都在已选对象集合内的关系
        if source_id not in selected_object_ids or target_id not in selected_object_ids:
            continue
        method_val = lt.get("link_method")
        type_val = lt.get("link_type")
        card = _compute_cardinality(method_val, type_val)
        src_attr_id = lt.get("source_attribute_id")
        tgt_attr_id = lt.get("target_attribute_id")
        src_attr = {"id": src_attr_id, "label": attr_id_to_label.get(str(src_attr_id), "")} if src_attr_id else None
        tgt_attr = {"id": tgt_attr_id, "label": attr_id_to_label.get(str(tgt_attr_id), "")} if tgt_attr_id else None
        middle_dataset = None
        if card == "manytomany":
            middle_dataset = {
                "table_name": lt.get("middle_table_name"),
                "ds_schema": lt.get("middle_ds_schema"),
            }

        # 正向（source -> target）
        edges.append({
            "source": source_id,
            "target": target_id,
            "type": "line",
            "data": {
                "edge_type": "object-object",
                "cardinality": card,
                "source_attribute": src_attr,
                "target_attribute": tgt_attr,
                "middle_dataset": middle_dataset,
                "link_type_id": map_key_raw,
                "link_labels": {"source_labels": dir_labels.get("source", []), "target_labels": dir_labels.get("target", [])},
            },
        })
        # 不再生成反向边；正反向标签通过 link_labels 区分

    # 添加 object -> interface 继承边
    if interface_rows:
        node_ids_set_for_inherit = {n.get("id") for n in nodes}
        for obj in object_types:
            oid = obj.get("object_type_id") if pub_version else obj.get("id")
            iid = obj.get("interface_id")
            if not iid:
                continue
            if oid in node_ids_set_for_inherit and str(iid) in node_ids_set_for_inherit:
                edges.append({
                    "source": oid,
                    "target": str(iid),
                    "type": "line",
                    "data": {"edge_type": "object-interface", "label": "继承"},
                })

    # 添加 logic -> object 边（仅对象在已选集合）
    logic_edges_rows = await mysql.afetch_all(
        """
        SELECT i.logic_type_id, i.object_type_id
        FROM ontology_logic_type_object i
        INNER JOIN ontology_logic_type l ON l.id = i.logic_type_id AND l.sync_status <= 2
        INNER JOIN ontology_object_type o ON o.id = i.object_type_id AND o.sync_status <= 2
        WHERE i.ontology_id = %(oid)s
        """,
        {"oid": ontology_id},
    )
    # logic 使用到的对象集合
    logic_used_map: Dict[str, List[str]] = {}
    for r in logic_edges_rows:
        obj_id = r.get("object_type_id")
        lg_id = r.get("logic_type_id")
        if not obj_id or not lg_id:
            continue
        if obj_id not in selected_object_ids:
            continue
        logic_used_map.setdefault(str(lg_id), []).append(obj_id)
        edges.append({
            "source": lg_id,
            "target": obj_id,
            "type": "line",
            "data": {"edge_type": "logic-object", "label": "引用"},
        })

    # 添加 object -> action 边（仅对象在已选集合）
    if pub_version:
        for a in action_rows:
            obj_id = a.get("object_type_id")
            act_id = a.get("action_id")
            if not obj_id or not act_id:
                continue
            if obj_id not in selected_object_ids:
                continue
            edges.append({
                "source": obj_id,
                "target": act_id,
                "type": "line",
                "data": {"edge_type": "action-object", "label": "执行"},
            })
    else:
        for a in action_rows:
            obj_id = a.get("object_type_id")
            act_id = a.get("id")
            if not obj_id or not act_id:
                continue
            if obj_id not in selected_object_ids:
                continue
            edges.append({
                "source": obj_id,
                "target": act_id,
                "type": "line",
                "data": {"edge_type": "action-object", "label": "执行"},
            })

    # 过滤无效边：确保 source/target 存在于 nodes 中
    node_ids = {n.get("id") for n in nodes}
    filtered_edges: List[Dict[str, Any]] = []
    missing_node_ids: set = set()
    for e in edges:
        s = e.get("source")
        t = e.get("target")
        s_ok = s in node_ids
        t_ok = t in node_ids
        if s_ok and t_ok:
            filtered_edges.append(e)
        else:
            if not s_ok and s is not None:
                missing_node_ids.add(s)
            if not t_ok and t is not None:
                missing_node_ids.add(t)

    if missing_node_ids:
        try:
            logger.warning(f"Edges reference missing node ids (excluded): {sorted(list(missing_node_ids))}")
        except Exception:
            # 安全兜底，避免日志异常影响主流程
            logger.warning(f"Edges reference missing node ids (excluded): {list(missing_node_ids)}")

    edges = filtered_edges

    # 去重：确保 (source, target) 唯一
    deduped_edges: List[Dict[str, Any]] = []
    seen_pairs: set = set()
    for e in edges:
        pair = (e.get("source"), e.get("target"))
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        deduped_edges.append(e)
    edges = deduped_edges
    logger.info(f"got nodes: {len(nodes)}")
    # 构建最终的图数据结构
    graph_data = {
        "nodes": nodes,
        "edges": edges
    }

    return ApiResponse(status="success", data=graph_data)


async def get_related_graph_data(object_type_id: str, pub_version: bool = False) -> ApiResponse:
    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service is not configured")

    # 1) 根对象 + 2) 相关链接 + 3) 标签（支持 pub_version）
    latest_version: Optional[str] = None
    if pub_version:
        # 通过 his 表按 object_type_id 定位 ontology_id
        row = await mysql.afetch_one(
            """
            SELECT ontology_id
            FROM ontology_object_type_his
            WHERE object_type_id = %(oid)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"oid": object_type_id},
        )
        if not row or not row.get("ontology_id"):
            return ApiResponse(status="success", data={"nodes": [], "edges": []})

        ov = await mysql.afetch_one(
            "SELECT latest_version FROM ontology_manage WHERE id = %(oid)s",
            {"oid": row.get("ontology_id")},
        )
        if not ov or not ov.get("latest_version"):
            return ApiResponse(status="success", data={"nodes": [], "edges": []})
        latest_version = ov.get("latest_version")

        # 根对象（his by version）
        root_obj = await mysql.afetch_one(
            """
            SELECT id, object_type_id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon
            FROM ontology_object_type_his
            WHERE object_type_id = %(id)s AND latest_version = %(ver)s AND sync_status <= 2 AND link_type_id IS NULL
            """,
            {"id": object_type_id, "ver": latest_version},
        )
        if not root_obj:
            return ApiResponse(status="success", data={"nodes": [], "edges": []})

        # 相关链接（his by version）
        link_types = await mysql.afetch_all(
            """
            SELECT id, link_type_id, link_method, link_type, source_object_type_id, target_object_type_id,
                   source_attribute_id, target_attribute_id, middle_table_name, middle_ds_schema,
                   source_label, target_label
            FROM ontology_link_type_his
            WHERE (source_object_type_id = %(id)s OR target_object_type_id = %(id)s)
              AND latest_version = %(ver)s
              AND sync_status <= 2
            """,
            {"id": object_type_id, "ver": latest_version},
        )
        # 标签（共用非 his 表）
        link_tags_rows = await mysql.afetch_all(
            """
            SELECT l.link_type_id AS link_type_id, ltt.link_direct, t.id AS tag_id, t.tag_label
            FROM ontology_link_type_his l
            LEFT JOIN ontology_link_type_tag ltt ON ltt.link_type_id = l.link_type_id
            LEFT JOIN ontology_tag t ON t.id = ltt.tag_id
            WHERE (l.source_object_type_id = %(id)s OR l.target_object_type_id = %(id)s)
              AND l.latest_version = %(ver)s
              AND l.sync_status <= 2
              AND (t.sync_status <= 2 OR t.id IS NULL)
            ORDER BY l.link_type_id, ltt.id
            """,
            {"id": object_type_id, "ver": latest_version},
        )
    else:
        root_obj = await mysql.afetch_one(
            """
            SELECT id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon
            FROM ontology_object_type
            WHERE id = %(id)s AND sync_status <= 2 AND link_type_id IS NULL
            """,
            {"id": object_type_id},
        )
        if not root_obj:
            return ApiResponse(status="success", data={"nodes": [], "edges": []})
        logger.debug(f"root_obj: {root_obj}")
        link_types = await mysql.afetch_all(
            """
            SELECT id, link_method, link_type, source_object_type_id, target_object_type_id,
                   source_attribute_id, target_attribute_id, middle_table_name, middle_ds_schema,
                   source_label, target_label
            FROM ontology_link_type
            WHERE (source_object_type_id = %(id)s OR target_object_type_id = %(id)s)
              AND sync_status <= 2
            """,
            {"id": object_type_id},
        )
        link_tags_rows = await mysql.afetch_all(
            """
            SELECT l.id AS link_type_id, ltt.link_direct, t.id AS tag_id, t.tag_label
            FROM ontology_link_type l
            LEFT JOIN ontology_link_type_tag ltt ON ltt.link_type_id = l.id
            LEFT JOIN ontology_tag t ON t.id = ltt.tag_id
            WHERE (l.source_object_type_id = %(id)s OR l.target_object_type_id = %(id)s)
              AND l.sync_status <= 2
              AND (t.sync_status <= 2 OR t.id IS NULL)
            ORDER BY l.id, ltt.id
            """,
            {"id": object_type_id},
        )

    link_id_to_dir_labels: Dict[str, Dict[str, List[str]]] = {}
    link_id_to_dir_items: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for row in link_tags_rows:
        link_id = row.get("link_type_id")
        direction = (row.get("link_direct") or "").lower()
        tag_id = row.get("tag_id")
        label = row.get("tag_label")
        if not link_id or direction not in ("source", "target"):
            continue
        if link_id not in link_id_to_dir_labels:
            link_id_to_dir_labels[link_id] = {"source": [], "target": []}
        if link_id not in link_id_to_dir_items:
            link_id_to_dir_items[link_id] = {"source": [], "target": []}
        if label:
            link_id_to_dir_labels[link_id][direction].append(label)
        if tag_id or label:
            link_id_to_dir_items[link_id][direction].append({"id": tag_id, "label": label})

    # 4) 收集节点 id（根节点 + 邻居）
    node_ids: List[str] = [object_type_id]
    for lt in link_types:
        sid = lt.get("source_object_type_id")
        tid = lt.get("target_object_type_id")
        if sid and sid not in node_ids:
            node_ids.append(sid)
        if tid and tid not in node_ids:
            node_ids.append(tid)

    # 5) 取这些对象的详细信息（his or non-his）
    def _build_in_clause(ids: List[str], key: str):
        params: Dict[str, Any] = {}
        placeholders: List[str] = []
        for idx, vid in enumerate(ids):
            pname = f"{key}{idx}"
            placeholders.append(f"%({pname})s")
            params[pname] = vid
        return ", ".join(placeholders), params

    in_sql, in_params = _build_in_clause(node_ids, "nid")
    if pub_version:
        object_types = await mysql.afetch_all(
            f"""
            SELECT id, object_type_id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon
            FROM ontology_object_type_his
            WHERE object_type_id IN ({in_sql}) AND latest_version = %(ver)s AND sync_status <= 2 AND link_type_id IS NULL
            """,
            {**in_params, "ver": latest_version},
        )
    else:
        object_types = await mysql.afetch_all(
            f"""
            SELECT id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon
            FROM ontology_object_type
            WHERE id IN ({in_sql}) AND sync_status <= 2 AND link_type_id IS NULL
            """,
            in_params,
        )

    selected_object_ids = {str(o.get("object_type_id")) if pub_version else str(o.get("id")) for o in object_types if (o.get("object_type_id") if pub_version else o.get("id"))}

    # 6) 属性（仅上述对象）
    if selected_object_ids:
        in_sql2, in_params2 = _build_in_clause([str(x) for x in list(selected_object_ids)], "oid")
        if pub_version:
            attributes = await mysql.afetch_all(
                f"""
                SELECT ota.id, ota.attribute_id, ota.create_time, ota.last_update, ota.sync_status,
                       ota.attribute_name, ota.field_name, ota.is_primary_key, ota.is_title,
                       ota.object_type_id, ota.shared_attribute_id, ota.field_type,
                       ota.status, ota.attribute_desc, ota.attribute_inst
                FROM ontology_object_type_attribute_his ota
                WHERE ota.object_type_id IN ({in_sql2})
                  AND ota.latest_version = %(ver)s
                  AND ota.sync_status <= 2
                """,
                {**in_params2, "ver": latest_version},
            )
        else:
            attributes = await mysql.afetch_all(
                f"""
                SELECT ota.id, ota.create_time, ota.last_update, ota.sync_status,
                       ota.attribute_name, ota.field_name, ota.is_primary_key, ota.is_title,
                       ota.object_type_id, ota.shared_attribute_id, ota.field_type,
                       ota.status, ota.attribute_desc, ota.attribute_inst
                FROM ontology_object_type_attribute ota
                WHERE ota.object_type_id IN ({in_sql2})
                  AND ota.sync_status <= 2
                """,
                in_params2,
            )
    else:
        attributes = []

    # 7) 构建节点（嵌入 attributes）
    attrs_by_object: Dict[str, List[Dict[str, Any]]] = {}
    for attr in attributes:
        obj_id = attr.get("object_type_id")
        if not obj_id:
            continue
        attr_item = {
            "id": attr.get("attribute_id") if pub_version else attr.get("id"),
            "create_time": _fmt_ts(attr.get("create_time")),
            "last_update": _fmt_ts(attr.get("last_update")),
            "sync_status": attr.get("sync_status"),
            "attribute_name": attr.get("attribute_name"),
            "field_name": attr.get("field_name"),
            "is_primary_key": attr.get("is_primary_key"),
            "is_title": attr.get("is_title"),
            "object_type_id": attr.get("object_type_id"),
            "shared_attribute_id": attr.get("shared_attribute_id"),
            "field_type": attr.get("field_type"),
            "status": attr.get("status"),
            "attribute_desc": attr.get("attribute_desc"),
            "attribute_inst": attr.get("attribute_inst"),
            "node_type": "attribute",
        }
        attrs_by_object.setdefault(obj_id, []).append(attr_item)

    nodes: List[Dict[str, Any]] = []
    for obj in object_types:
        node_data = {
            "create_time": _fmt_ts(obj.get("create_time")),
            "last_update": _fmt_ts(obj.get("last_update")),
            "sync_status": obj.get("sync_status"),
            "object_type_desc": obj.get("object_type_desc"),
            "object_type_label": obj.get("object_type_label"),
            "object_type_name": obj.get("object_type_name"),
            "ontology_id": obj.get("ontology_id"),
            "owner_id": obj.get("owner_id"),
            "status": obj.get("status"),
            "ds_id": obj.get("ds_id"),
            "ds_schema": obj.get("ds_schema"),
            "table_name": obj.get("table_name"),
            "icon": obj.get("icon"),
            "node_type": "object",
            "attributes": attrs_by_object.get(str(obj.get("object_type_id") if pub_version else obj.get("id")), []),
        }
        node_id_val = obj.get("object_type_id") if pub_version else obj.get("id")
        nodes.append({"id": node_id_val, "type": "circle", "data": node_data})

    # 属性 id -> label 映射（兼容 his 的 attribute_id）
    attr_id_to_label: Dict[str, str] = {}
    for a in attributes:
        aname = a.get("attribute_name")
        if a.get("id"):
            attr_id_to_label[str(a.get("id"))] = aname
        if a.get("attribute_id"):
            attr_id_to_label[str(a.get("attribute_id"))] = aname

    # 7.1) 加载与所选对象直接相关的 logic/action 及其关系
    oid_val = root_obj.get("ontology_id") if 'root_obj' in locals() else None
    object_ids_set = {o.get("object_type_id") if pub_version else o.get("id") for o in object_types}
    logic_rows: List[Dict[str, Any]] = []
    action_rows: List[Dict[str, Any]] = []
    logic_links: List[Dict[str, Any]] = []
    if object_ids_set and oid_val:
        # 查询 logic-object 关系（共用表）并筛选到当前对象集合
        in_logic_obj_sql, in_logic_obj_params = _build_in_clause([str(x) for x in list(object_ids_set)], "obj")
        logic_links = await mysql.afetch_all(
            f"""
            SELECT i.logic_type_id, i.object_type_id
            FROM ontology_logic_type_object i
            INNER JOIN ontology_logic_type l ON l.id = i.logic_type_id AND l.sync_status <= 2
            INNER JOIN ontology_object_type o ON o.id = i.object_type_id AND o.sync_status <= 2
            WHERE i.ontology_id = %(oid)s
              AND i.object_type_id IN ({in_logic_obj_sql})
            """,
            {**in_logic_obj_params, "oid": oid_val},
        )
        logic_ids = sorted({str(r.get("logic_type_id")) for r in logic_links if r.get("logic_type_id") is not None})
        if logic_ids:
            in_logic_sql, in_logic_params = _build_in_clause(logic_ids, "lid")
            if pub_version:
                logic_rows = await mysql.afetch_all(
                    f"""
                    SELECT id, logic_type_id, create_time, last_update, sync_status,
                           build_type, function_code, file_name, intput_param,
                           logic_type_desc, logic_type_label, logic_type_name,
                           ontology_id, output_param, owner_id, repo_name, status, oper_status
                    FROM ontology_logic_type_his
                    WHERE ontology_id = %(oid)s AND latest_version = %(ver)s AND sync_status <= 2
                      AND logic_type_id IN ({in_logic_sql})
                    """,
                    {**in_logic_params, "oid": oid_val, "ver": latest_version},
                )
            else:
                logic_rows = await mysql.afetch_all(
                    f"""
                    SELECT id, create_time, last_update, sync_status,
                           build_type, function_code, file_name, intput_param,
                           logic_type_desc, logic_type_label, logic_type_name,
                           ontology_id, output_param, owner_id, repo_name, status, oper_status
                    FROM ontology_logic_type
                    WHERE ontology_id = %(oid)s AND sync_status <= 2
                      AND id IN ({in_logic_sql})
                    """,
                    {**in_logic_params, "oid": oid_val},
                )

            # 查询 action（限定在当前对象集合）
        in_act_sql, in_act_params = _build_in_clause([str(x) for x in list(object_ids_set)], "ao")
        if pub_version:
            action_rows = await mysql.afetch_all(
                f"""
                SELECT id, action_id, create_time, last_update, sync_status,
                        object_type_id, action_name, action_label, action_desc, action_type,
                        icon, status, ontology_id, oper_status, build_type
                FROM ontology_object_type_action_his
                WHERE ontology_id = %(oid)s AND latest_version = %(ver)s AND sync_status <= 2
                    AND object_type_id IN ({in_act_sql})
                """,
                {**in_act_params, "oid": oid_val, "ver": latest_version},
            )
        else:
            action_rows = await mysql.afetch_all(
                f"""
                SELECT id, create_time, last_update, sync_status,
                        object_type_id, action_name, action_label, action_desc, action_type,
                        icon, status, ontology_id, oper_status, build_type
                FROM ontology_object_type_action
                WHERE ontology_id = %(oid)s AND sync_status <= 2
                    AND object_type_id IN ({in_act_sql})
                """,
                {**in_act_params, "oid": oid_val},
            )

    # 7.2) 添加 logic 节点
    for lg in logic_rows:
        logic_id = lg.get("logic_type_id") if pub_version else lg.get("id")
        if not logic_id:
            continue
        node_data = {
            "create_time": _fmt_ts(lg.get("create_time")),
            "last_update": _fmt_ts(lg.get("last_update")),
            "sync_status": lg.get("sync_status"),
            "build_type": lg.get("build_type"),
            "function_code": lg.get("function_code"),
            "file_name": lg.get("file_name"),
            "intput_param": lg.get("intput_param"),
            "logic_type_desc": lg.get("logic_type_desc"),
            "logic_type_label": lg.get("logic_type_label"),
            "logic_type_name": lg.get("logic_type_name"),
            "ontology_id": lg.get("ontology_id"),
            "output_param": lg.get("output_param"),
            "owner_id": lg.get("owner_id"),
            "repo_name": lg.get("repo_name"),
            "status": lg.get("status"),
            "oper_status": lg.get("oper_status"),
            "node_type": "logic",
        }
        nodes.append({"id": logic_id, "type": "circle", "data": node_data})

    # 7.3) 添加 action 节点
    for act in action_rows:
        action_id = act.get("action_id") if pub_version else act.get("id")
        if not action_id:
            continue
        node_data = {
            "create_time": _fmt_ts(act.get("create_time")),
            "last_update": _fmt_ts(act.get("last_update")),
            "sync_status": act.get("sync_status"),
            "object_type_id": act.get("object_type_id"),
            "action_name": act.get("action_name"),
            "action_label": act.get("action_label"),
            "action_desc": act.get("action_desc"),
            "action_type": act.get("action_type"),
            "icon": act.get("icon"),
            "status": act.get("status"),
            "ontology_id": act.get("ontology_id"),
            "oper_status": act.get("oper_status"),
            "build_type": act.get("build_type"),
            "node_type": "action",
        }
        nodes.append({"id": action_id, "type": "circle", "data": node_data})

    # 7.4) 为当前已构建的节点补充统计信息
    # 对象属性数量
    object_attr_count: Dict[str, int] = {str(k): len(v) for k, v in attrs_by_object.items()}

    # 对象-对象关系数量（基于当前对象集合内的 link_types 计数，源/目标各 +1）
    object_rel_count: Dict[str, int] = {str(oid): 0 for oid in list(object_ids_set)}
    for lt in link_types:
        sid = lt.get("source_object_type_id")
        tid = lt.get("target_object_type_id")
        if not sid or not tid:
            continue
        if sid in object_ids_set and tid in object_ids_set:
            object_rel_count[str(sid)] = object_rel_count.get(str(sid), 0) + 1
            object_rel_count[str(tid)] = object_rel_count.get(str(tid), 0) + 1

    # 被 logic 引用数量（去重）
    object_logic_ref_count: Dict[str, int] = {str(oid): 0 for oid in list(object_ids_set)}
    logic_used_object_count: Dict[str, int] = {}
    tmp_logic_to_objs: Dict[str, set] = {}
    tmp_obj_to_logics: Dict[str, set] = {str(oid): set() for oid in list(object_ids_set)}
    for r in logic_links:
        lid = r.get("logic_type_id")
        oid = r.get("object_type_id")
        if lid is None or oid is None:
            continue
        if oid not in object_ids_set:
            continue
        tmp_logic_to_objs.setdefault(str(lid), set()).add(str(oid))
        tmp_obj_to_logics.setdefault(str(oid), set()).add(str(lid))
    for lid, s in tmp_logic_to_objs.items():
        logic_used_object_count[lid] = len(s)
    for oid, s in tmp_obj_to_logics.items():
        object_logic_ref_count[oid] = len(s)

    # 被 action 执行数量，以及每个 action 执行对象数量（当前模型 0/1）
    object_action_exec_count: Dict[str, int] = {str(oid): 0 for oid in list(object_ids_set)}
    action_exec_object_count: Dict[str, int] = {}
    for a in action_rows:
        aid = a.get("action_id") if pub_version else a.get("id")
        oid = a.get("object_type_id")
        if aid is None:
            continue
        if oid in object_ids_set:
            object_action_exec_count[str(oid)] = object_action_exec_count.get(str(oid), 0) + 1
            action_exec_object_count[str(aid)] = 1
        else:
            action_exec_object_count[str(aid)] = 0

    # 写回到节点 data.stats
    for n in nodes:
        nid = str(n.get("id"))
        data = n.get("data") or {}
        ntype = data.get("node_type")
        if ntype == "object":
            data["stats"] = {
                "attribute_count": object_attr_count.get(nid, 0),
                "object_rel_count": object_rel_count.get(nid, 0),
                "logic_ref_count": object_logic_ref_count.get(nid, 0),
                "action_exec_count": object_action_exec_count.get(nid, 0),
            }
        elif ntype == "logic":
            data["stats"] = {
                "used_object_count": logic_used_object_count.get(nid, 0),
            }
        elif ntype == "action":
            data["stats"] = {
                "exec_object_count": action_exec_object_count.get(nid, 0),
            }
        n["data"] = data

    # 8) 基数函数
    def _compute_cardinality(method_val: Optional[int], type_val: Optional[int]) -> str:
        if method_val is None and type_val is None:
            return ""
        if method_val == 2:
            return "manytomany"
        if method_val == 1:
            if type_val == 1:
                return "onetoone"
            if type_val == 2:
                return "onetomany"
        return ""

    def _reverse_cardinality(card: str) -> str:
        if card == "onetomany":
            return "manytoone"
        if card == "manytoone":
            return "onetomany"
        return card

    # 9) 对象-对象边（仅两端都在 nodes 集合；使用标签列表）
    selected_ids = {n.get("id") for n in nodes}
    edges: List[Dict[str, Any]] = []
    for lt in link_types:
        sid = lt.get("source_object_type_id")
        tid = lt.get("target_object_type_id")
        if sid not in selected_ids or tid not in selected_ids:
            continue
        method_val = lt.get("link_method")
        type_val = lt.get("link_type")
        card = _compute_cardinality(method_val, type_val)
        map_key_raw = lt.get("link_type_id") if pub_version else lt.get("id")
        map_key = str(map_key_raw) if map_key_raw is not None else ""
        dir_labels = link_id_to_dir_labels.get(map_key, {"source": [], "target": []})
        src_attr_id = lt.get("source_attribute_id")
        tgt_attr_id = lt.get("target_attribute_id")
        src_attr = {"id": src_attr_id, "label": attr_id_to_label.get(str(src_attr_id), "")} if src_attr_id else None
        tgt_attr = {"id": tgt_attr_id, "label": attr_id_to_label.get(str(tgt_attr_id), "")} if tgt_attr_id else None
        middle_dataset = None
        if card == "manytomany":
            middle_dataset = {
                "table_name": lt.get("middle_table_name"),
                "ds_schema": lt.get("middle_ds_schema"),
            }

        # 正向边
        edges.append({
            "source": sid,
            "target": tid,
            "type": "line",
            "data": {
                "edge_type": "object-object",
                "cardinality": card,
                "source_attribute": src_attr,
                "target_attribute": tgt_attr,
                "middle_dataset": middle_dataset,
                "link_type_id": map_key_raw,
                "link_labels": {"source_labels": dir_labels.get("source", []), "target_labels": dir_labels.get("target", [])},
            },
        })
        # 不再生成反向边；正反向标签通过 link_labels 区分

    # 9.5) logic/object 与 object/action 的边
    for r in logic_links:
        obj_id = r.get("object_type_id")
        lg_id = r.get("logic_type_id")
        if not obj_id or not lg_id:
            continue
        if obj_id not in selected_ids:
            continue
        edges.append({
            "source": lg_id,
            "target": obj_id,
            "type": "line",
            "data": {"edge_type": "logic-object", "label": "引用"},
        })

    if pub_version:
        for a in action_rows:
            obj_id = a.get("object_type_id")
            act_id = a.get("action_id")
            if not obj_id or not act_id or obj_id not in selected_ids:
                continue
            edges.append({
                "source": obj_id,
                "target": act_id,
                "type": "line",
                "data": {"edge_type": "action-object", "label": "执行"},
            })
    else:
        for a in action_rows:
            obj_id = a.get("object_type_id")
            act_id = a.get("id")
            if not obj_id or not act_id or obj_id not in selected_ids:
                continue
            edges.append({
                "source": obj_id,
                "target": act_id,
                "type": "line",
                "data": {"edge_type": "action-object", "label": "执行"},
            })

    # 10) 过滤无效边与去重
    node_ids_set = {n.get("id") for n in nodes}
    filtered_edges: List[Dict[str, Any]] = []
    missing_node_ids: set = set()
    for e in edges:
        s = e.get("source")
        t = e.get("target")
        if s in node_ids_set and t in node_ids_set:
            filtered_edges.append(e)
        else:
            if s not in node_ids_set and s is not None:
                missing_node_ids.add(s)
            if t not in node_ids_set and t is not None:
                missing_node_ids.add(t)
    if missing_node_ids:
        try:
            logger.warning(f"Edges reference missing node ids (excluded): {sorted(list(missing_node_ids))}")
        except Exception:
            logger.warning(f"Edges reference missing node ids (excluded): {list(missing_node_ids)}")

    deduped_edges: List[Dict[str, Any]] = []
    seen_pairs: set = set()
    for e in filtered_edges:
        pair = (e.get("source"), e.get("target"))
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        deduped_edges.append(e)

    return ApiResponse(status="success", data={"nodes": nodes, "edges": deduped_edges})


async def get_related_graph_data_by_name(
    ontology_name: str, 
    object_type_name: str, 
    workspace_id: str, 
    pub_version: bool = False
) -> ApiResponse:
    """
    根据 ontology_name、object_type_name 和 workspace_id 获取与该对象相关的对象、动作和逻辑
    如果对象是中间对象（link_type_id 有值），则返回空数据
    """
    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service is not configured")
    
    # 1) 根据 ontology_name 和 workspace_id 查询 ontology_id
    ontology_row = await mysql.afetch_one(
        """
        SELECT id
        FROM ontology_manage
        WHERE ontology_name = %(ontology_name)s AND workspace_id = %(workspace_id)s
            AND sync_status <= 2
        """,
        {"ontology_name": ontology_name, "workspace_id": workspace_id},
    )
    
    if not ontology_row or not ontology_row.get("id"):
        return ApiResponse(status="success", data={"nodes": [], "edges": []}, message="Ontology not found")
    
    ontology_id = ontology_row.get("id")
    
    # 2) 根据 ontology_id 和 object_type_name 查询 object_type_id 和 link_type_id
    if pub_version:
        # 从历史表查询，需要获取最新版本
        latest_version_row = await mysql.afetch_one(
            "SELECT latest_version FROM ontology_manage WHERE id = %(oid)s",
            {"oid": ontology_id},
        )
        if not latest_version_row or not latest_version_row.get("latest_version"):
            return ApiResponse(status="success", data={"nodes": [], "edges": []}, message="Latest version not found")
        
        latest_version = latest_version_row.get("latest_version")
        
        object_type_row = await mysql.afetch_one(
            """
            SELECT object_type_id, link_type_id
            FROM ontology_object_type_his
            WHERE ontology_id = %(ontology_id)s 
              AND object_type_name = %(object_type_name)s 
              AND latest_version = %(ver)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "object_type_name": object_type_name, "ver": latest_version},
        )
    else:
        object_type_row = await mysql.afetch_one(
            """
            SELECT id, link_type_id
            FROM ontology_object_type
            WHERE ontology_id = %(ontology_id)s 
              AND object_type_name = %(object_type_name)s 
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "object_type_name": object_type_name},
        )
    
    if not object_type_row:
        return ApiResponse(status="success", data={"nodes": [], "edges": []}, message="Object type not found")
    
    # 3) 检查是否为中间对象（link_type_id 有值）
    link_type_id = object_type_row.get("link_type_id")
    if link_type_id is not None:
        return ApiResponse(
            status="success", 
            data={"nodes": [], "edges": []}, 
            message="Object is a middle object (link_type_id is not null), no related data returned"
        )
    
    # 4) 获取 object_type_id 并调用现有函数
    if pub_version:
        object_type_id = object_type_row.get("object_type_id")
    else:
        object_type_id = object_type_row.get("id")
    
    if not object_type_id:
        return ApiResponse(status="success", data={"nodes": [], "edges": []}, message="Object type ID not found")
    
    # 5) 调用现有的 get_related_graph_data 函数
    return await get_related_graph_data(str(object_type_id), pub_version)


async def get_objects_by_action_name(
    ontology_name: str,
    action_name: str,
    workspace_id: str,
    pub_version: bool = False
) -> ApiResponse:
    """
    根据 ontology_name、action_name 和 workspace_id 查询与该 action 相关的对象
    """
    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service is not configured")
    
    # 1) 根据 ontology_name 和 workspace_id 查询 ontology_id
    ontology_row = await mysql.afetch_one(
        """
        SELECT id
        FROM ontology_manage
        WHERE ontology_name = %(ontology_name)s AND workspace_id = %(workspace_id)s
            AND sync_status <= 2
        """,
        {"ontology_name": ontology_name, "workspace_id": workspace_id},
    )
    
    if not ontology_row or not ontology_row.get("id"):
        return ApiResponse(
            status="success", 
            data={"action": None, "objects": []}, 
            message="Ontology not found"
        )
    
    ontology_id = ontology_row.get("id")
    
    # 2) 根据 ontology_id 和 action_name 查询 action
    if pub_version:
        # 从历史表查询，需要获取最新版本
        latest_version_row = await mysql.afetch_one(
            "SELECT latest_version FROM ontology_manage WHERE id = %(oid)s",
            {"oid": ontology_id},
        )
        if not latest_version_row or not latest_version_row.get("latest_version"):
            return ApiResponse(
                status="success", 
                data={"action": None, "objects": []}, 
                message="Latest version not found"
            )
        
        latest_version = latest_version_row.get("latest_version")
        
        action_row = await mysql.afetch_one(
            """
            SELECT id, action_id, create_time, last_update, sync_status,
                   object_type_id, action_name, action_label, action_desc, action_type,
                   icon, status, ontology_id, oper_status, build_type, file_name,
                   function_code, intput_param, output_param, owner_id, repo_name
            FROM ontology_object_type_action_his
            WHERE ontology_id = %(ontology_id)s 
              AND action_name = %(action_name)s
              AND latest_version = %(ver)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "action_name": action_name, "ver": latest_version},
        )
    else:
        action_row = await mysql.afetch_one(
            """
            SELECT id, create_time, last_update, sync_status,
                   object_type_id, action_name, action_label, action_desc, action_type,
                   icon, status, ontology_id, oper_status, build_type, file_name,
                   function_code, intput_param, output_param, owner_id, repo_name
            FROM ontology_object_type_action
            WHERE ontology_id = %(ontology_id)s 
              AND action_name = %(action_name)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "action_name": action_name},
        )
    
    if not action_row:
        return ApiResponse(
            status="success", 
            data={"action": None, "objects": []}, 
            message="Action not found"
        )
    
    # 3) 获取 action 关联的 object_type_id
    object_type_id = action_row.get("object_type_id")
    if not object_type_id:
        return ApiResponse(
            status="success", 
            data={"action": action_row, "objects": []}, 
            message="Action has no associated object"
        )
    
    # 4) 查询对象详细信息
    if pub_version:
        object_row = await mysql.afetch_one(
            """
            SELECT id, object_type_id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon, link_type_id
            FROM ontology_object_type_his
            WHERE object_type_id = %(object_type_id)s
              AND latest_version = %(ver)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"object_type_id": object_type_id, "ver": latest_version},
        )
    else:
        object_row = await mysql.afetch_one(
            """
            SELECT id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon, link_type_id
            FROM ontology_object_type
            WHERE id = %(object_type_id)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"object_type_id": object_type_id},
        )
    
    objects = [object_row] if object_row else []
    
    # 5) 格式化 action 信息
    action_info = {
        "id": action_row.get("action_id") if pub_version else action_row.get("id"),
        "create_time": _fmt_ts(action_row.get("create_time")),
        "last_update": _fmt_ts(action_row.get("last_update")),
        "sync_status": action_row.get("sync_status"),
        "object_type_id": action_row.get("object_type_id"),
        "action_name": action_row.get("action_name"),
        "action_label": action_row.get("action_label"),
        "action_desc": action_row.get("action_desc"),
        "action_type": action_row.get("action_type"),
        "icon": action_row.get("icon"),
        "status": action_row.get("status"),
        "ontology_id": action_row.get("ontology_id"),
        "oper_status": action_row.get("oper_status"),
        "build_type": action_row.get("build_type"),
        "file_name": action_row.get("file_name"),
        "function_code": action_row.get("function_code"),
        "intput_param": action_row.get("intput_param"),
        "output_param": action_row.get("output_param"),
        "owner_id": action_row.get("owner_id"),
        "repo_name": action_row.get("repo_name"),
    }
    
    # 6) 格式化对象信息
    formatted_objects = []
    for obj in objects:
        formatted_objects.append({
            "id": obj.get("object_type_id") if pub_version else obj.get("id"),
            "create_time": _fmt_ts(obj.get("create_time")),
            "last_update": _fmt_ts(obj.get("last_update")),
            "sync_status": obj.get("sync_status"),
            "object_type_desc": obj.get("object_type_desc"),
            "object_type_label": obj.get("object_type_label"),
            "object_type_name": obj.get("object_type_name"),
            "ontology_id": obj.get("ontology_id"),
            "owner_id": obj.get("owner_id"),
            "status": obj.get("status"),
            "ds_id": obj.get("ds_id"),
            "ds_schema": obj.get("ds_schema"),
            "table_name": obj.get("table_name"),
            "icon": obj.get("icon"),
            "link_type_id": obj.get("link_type_id"),
        })
    
    return ApiResponse(
        status="success", 
        data={"action": action_info, "objects": formatted_objects}
    )


async def get_objects_by_logic_name(
    ontology_name: str,
    logic_name: str,
    workspace_id: str,
    pub_version: bool = False
) -> ApiResponse:
    """
    根据 ontology_name、logic_name 和 workspace_id 查询与该 logic 相关的对象
    """
    mysql = await create_mysql_service()
    if mysql is None:
        raise RuntimeError("MySQL service is not configured")
    
    # 1) 根据 ontology_name 和 workspace_id 查询 ontology_id
    ontology_row = await mysql.afetch_one(
        """
        SELECT id
        FROM ontology_manage
        WHERE ontology_name = %(ontology_name)s AND workspace_id = %(workspace_id)s
            AND sync_status <= 2
        """,
        {"ontology_name": ontology_name, "workspace_id": workspace_id},
    )
    
    if not ontology_row or not ontology_row.get("id"):
        return ApiResponse(
            status="success", 
            data={"logic": None, "objects": []}, 
            message="Ontology not found"
        )
    
    ontology_id = ontology_row.get("id")
    
    # 2) 根据 ontology_id 和 logic_name 查询 logic
    if pub_version:
        # 从历史表查询，需要获取最新版本
        latest_version_row = await mysql.afetch_one(
            "SELECT latest_version FROM ontology_manage WHERE id = %(oid)s",
            {"oid": ontology_id},
        )
        if not latest_version_row or not latest_version_row.get("latest_version"):
            return ApiResponse(
                status="success", 
                data={"logic": None, "objects": []}, 
                message="Latest version not found"
            )
        
        latest_version = latest_version_row.get("latest_version")
        
        logic_row = await mysql.afetch_one(
            """
            SELECT id, logic_type_id, create_time, last_update, sync_status,
                   build_type, function_code, file_name, intput_param,
                   logic_type_desc, logic_type_label, logic_type_name,
                   ontology_id, output_param, owner_id, repo_name, status, oper_status
            FROM ontology_logic_type_his
            WHERE ontology_id = %(ontology_id)s 
              AND logic_type_name = %(logic_name)s
              AND latest_version = %(ver)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "logic_name": logic_name, "ver": latest_version},
        )
    else:
        logic_row = await mysql.afetch_one(
            """
            SELECT id, create_time, last_update, sync_status,
                   build_type, function_code, file_name, intput_param,
                   logic_type_desc, logic_type_label, logic_type_name,
                   ontology_id, output_param, owner_id, repo_name, status, oper_status
            FROM ontology_logic_type
            WHERE ontology_id = %(ontology_id)s 
              AND logic_type_name = %(logic_name)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            LIMIT 1
            """,
            {"ontology_id": ontology_id, "logic_name": logic_name},
        )
    
    if not logic_row:
        return ApiResponse(
            status="success", 
            data={"logic": None, "objects": []}, 
            message="Logic not found"
        )
    
    # 3) 获取 logic_type_id
    logic_type_id = logic_row.get("logic_type_id") if pub_version else logic_row.get("id")
    
    # 4) 通过中间表查询关联的对象
    object_links = await mysql.afetch_all(
        """
        SELECT object_type_id
        FROM ontology_logic_type_object
        WHERE logic_type_id = %(logic_type_id)s
          AND ontology_id = %(ontology_id)s
        """,
        {"logic_type_id": logic_type_id, "ontology_id": ontology_id},
    )
    
    if not object_links:
        logic_info = {
            "id": logic_row.get("logic_type_id") if pub_version else logic_row.get("id"),
            "create_time": _fmt_ts(logic_row.get("create_time")),
            "last_update": _fmt_ts(logic_row.get("last_update")),
            "sync_status": logic_row.get("sync_status"),
            "build_type": logic_row.get("build_type"),
            "function_code": logic_row.get("function_code"),
            "file_name": logic_row.get("file_name"),
            "intput_param": logic_row.get("intput_param"),
            "logic_type_desc": logic_row.get("logic_type_desc"),
            "logic_type_label": logic_row.get("logic_type_label"),
            "logic_type_name": logic_row.get("logic_type_name"),
            "ontology_id": logic_row.get("ontology_id"),
            "output_param": logic_row.get("output_param"),
            "owner_id": logic_row.get("owner_id"),
            "repo_name": logic_row.get("repo_name"),
            "status": logic_row.get("status"),
            "oper_status": logic_row.get("oper_status"),
        }
        return ApiResponse(
            status="success", 
            data={"logic": logic_info, "objects": []}, 
            message="No objects associated with this logic"
        )
    
    # 5) 获取对象 ID 列表
    object_type_ids = [link.get("object_type_id") for link in object_links if link.get("object_type_id")]
    
    if not object_type_ids:
        logic_info = {
            "id": logic_row.get("logic_type_id") if pub_version else logic_row.get("id"),
            "create_time": _fmt_ts(logic_row.get("create_time")),
            "last_update": _fmt_ts(logic_row.get("last_update")),
            "sync_status": logic_row.get("sync_status"),
            "build_type": logic_row.get("build_type"),
            "function_code": logic_row.get("function_code"),
            "file_name": logic_row.get("file_name"),
            "intput_param": logic_row.get("intput_param"),
            "logic_type_desc": logic_row.get("logic_type_desc"),
            "logic_type_label": logic_row.get("logic_type_label"),
            "logic_type_name": logic_row.get("logic_type_name"),
            "ontology_id": logic_row.get("ontology_id"),
            "output_param": logic_row.get("output_param"),
            "owner_id": logic_row.get("owner_id"),
            "repo_name": logic_row.get("repo_name"),
            "status": logic_row.get("status"),
            "oper_status": logic_row.get("oper_status"),
        }
        return ApiResponse(
            status="success", 
            data={"logic": logic_info, "objects": []}, 
            message="No valid object IDs found"
        )
    
    # 6) 构建 IN 子句参数
    def _build_in_clause(ids: List[str], key: str):
        params: Dict[str, Any] = {}
        placeholders: List[str] = []
        for idx, vid in enumerate(ids):
            pname = f"{key}{idx}"
            placeholders.append(f"%({pname})s")
            params[pname] = vid
        return ", ".join(placeholders), params
    
    in_sql, in_params = _build_in_clause(object_type_ids, "oid")
    
    # 7) 查询对象详细信息
    if pub_version:
        object_rows = await mysql.afetch_all(
            f"""
            SELECT id, object_type_id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon, link_type_id
            FROM ontology_object_type_his
            WHERE object_type_id IN ({in_sql})
              AND latest_version = %(ver)s
              AND sync_status <= 2
            ORDER BY last_update DESC
            """,
            {**in_params, "ver": latest_version},
        )
    else:
        object_rows = await mysql.afetch_all(
            f"""
            SELECT id, create_time, last_update, sync_status, object_type_desc,
                   object_type_label, object_type_name, ontology_id, owner_id,
                   status, ds_id, ds_schema, table_name, icon, link_type_id
            FROM ontology_object_type
            WHERE id IN ({in_sql})
              AND sync_status <= 2
            ORDER BY last_update DESC
            """,
            in_params,
        )
    
    # 8) 格式化 logic 信息
    logic_info = {
        "id": logic_row.get("logic_type_id") if pub_version else logic_row.get("id"),
        "create_time": _fmt_ts(logic_row.get("create_time")),
        "last_update": _fmt_ts(logic_row.get("last_update")),
        "sync_status": logic_row.get("sync_status"),
        "build_type": logic_row.get("build_type"),
        "function_code": logic_row.get("function_code"),
        "file_name": logic_row.get("file_name"),
        "intput_param": logic_row.get("intput_param"),
        "logic_type_desc": logic_row.get("logic_type_desc"),
        "logic_type_label": logic_row.get("logic_type_label"),
        "logic_type_name": logic_row.get("logic_type_name"),
        "ontology_id": logic_row.get("ontology_id"),
        "output_param": logic_row.get("output_param"),
        "owner_id": logic_row.get("owner_id"),
        "repo_name": logic_row.get("repo_name"),
        "status": logic_row.get("status"),
        "oper_status": logic_row.get("oper_status"),
    }
    
    # 9) 格式化对象信息
    formatted_objects = []
    for obj in object_rows:
        formatted_objects.append({
            "id": obj.get("object_type_id") if pub_version else obj.get("id"),
            "create_time": _fmt_ts(obj.get("create_time")),
            "last_update": _fmt_ts(obj.get("last_update")),
            "sync_status": obj.get("sync_status"),
            "object_type_desc": obj.get("object_type_desc"),
            "object_type_label": obj.get("object_type_label"),
            "object_type_name": obj.get("object_type_name"),
            "ontology_id": obj.get("ontology_id"),
            "owner_id": obj.get("owner_id"),
            "status": obj.get("status"),
            "ds_id": obj.get("ds_id"),
            "ds_schema": obj.get("ds_schema"),
            "table_name": obj.get("table_name"),
            "icon": obj.get("icon"),
            "link_type_id": obj.get("link_type_id"),
        })
    
    return ApiResponse(
        status="success", 
        data={"logic": logic_info, "objects": formatted_objects}
    )

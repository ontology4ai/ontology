"""
Ontology Helper Utilities

This module provides common helper functions for ontology-related operations,
including MCP tool input parsing and graph data transformation.
"""

import json
import re
from typing import Dict, Any, List
from public.public_variable import logger


def get_running_label(running_type: str, running_detail: Dict[str, Any]) -> str:
    """
    Generate a human-readable label for the running type.
    
    Args:
        running_type: Type of running operation ("object", "action", "logic", "oag", "python", "unknown")
        running_detail: Dict containing specific details (e.g., object_name, action_name, logic_name)
    
    Returns:
        Human-readable label string
    """
    if running_type == "object":
        object_name = running_detail.get("object_name", "未知对象")
        return f"查询对象实例数据: {object_name}"
    
    elif running_type == "action":
        action_name = running_detail.get("action_name", "未知动作")
        return f"执行动作: {action_name}"
    
    elif running_type == "logic":
        logic_name = running_detail.get("logic_name", "未知逻辑")
        # Special cases for specific logic functions
        if logic_name == "check_attr_mapping":
            return "获取属性映射"
        elif logic_name == "complex_sql":
            return "执行复杂查询"
        return f"执行逻辑: {logic_name}"
    
    elif running_type == "oag":
        return "OAG优化"
    
    elif running_type == "python":
        python_operation = running_detail.get("python_operation", "")
        # Map operation types to readable labels
        operation_labels = {
            "write": "创建Python文件",
            "update": "更新Python文件",
            "read": "读取Python文件",
            "delete": "删除Python文件",
            "list": "列出Python文件",
            "run": "运行Python文件"
        }
        if python_operation in operation_labels:
            return operation_labels[python_operation]
        return "执行python代码"
    
    else:  # unknown or any other type
        return ""


def parse_mcp_tool_input(tool: str, tool_input_str: str) -> Dict[str, Any]:
    """
    Parse MCP tool input to extract running type and details.
    
    Args:
        tool: The MCP tool name (e.g., "ontology_service_execute")
        tool_input_str: The tool input JSON string
    
    Returns:
        Dict with:
            - running_type: "object", "action", "logic", "oag", "python", or "unknown"
            - running_detail: specific details based on type
            - mcp_info: original mcp tool info
    """
    result = {
        "running_type": "unknown",
        "running_detail": {},
        "mcp_info": {
            "mcp_tool_name": tool,
            "input_params": {}
        }
    }
    
    if not tool_input_str:
        return result
    
    try:
        # Parse tool_input JSON
        tool_input_data = json.loads(tool_input_str) if isinstance(tool_input_str, str) else tool_input_str
        
        # Handle ontology_service_execute tool (most common case)
        if tool == "ontology_service_execute":
            # Extract the actual tool input
            exec_data = tool_input_data.get("ontology_service_execute", {})
            code = exec_data.get("code", "")
            
            result["mcp_info"]["input_params"] = {"code": code}
            
            if not code:
                logger.warning(f"Empty code in ontology_service_execute")
            else:
                # Check for complex_sql pattern first - treat it as a special logic
                if code.strip().startswith("complex_sql("):
                    result["running_type"] = "logic"
                    result["running_detail"] = {
                        "logic_name": "complex_sql"
                    }
                # First, try to match Object.method(...) pattern
                elif re.match(r"(\w+)\.(\w+)\s*\(", code):
                    object_match = re.match(r"(\w+)\.(\w+)\s*\(", code)
                    # This is an object method call
                    object_name = object_match.group(1)
                    method_name = object_match.group(2)
                    
                    # Check if it's a standard query method (find, get, list, etc.)
                    query_methods = ["find", "get", "list", "query", "search"]
                    if method_name.lower() in query_methods:
                        result["running_type"] = "object"
                        result["running_detail"] = {
                            "object_name": object_name,
                            "used_method": method_name
                        }
                    else:
                        # Assume it's an action
                        result["running_type"] = "action"
                        result["running_detail"] = {
                            "object_name": object_name,
                            "action_name": method_name
                        }
                else:
                    # Not an object method, try logic function pattern
                    logic_match = re.match(r"(\w+)\s*\(", code)
                    if logic_match:
                        function_name = logic_match.group(1)
                        result["running_type"] = "logic"
                        result["running_detail"] = {
                            "logic_name": function_name
                        }
                    else:
                        logger.warning(f"Could not parse code pattern: {code}")
        
        # Handle get_ontology_definition tool
        elif tool == "get_ontology_definition":
            result["running_type"] = "oag"
            result["running_detail"] = {}
            oag_data = tool_input_data.get("get_ontology_definition", {})
            result["mcp_info"]["input_params"] = oag_data
        
        # Handle ontology_python_exec tool (legacy)
        elif tool == "ontology_python_exec":
            result["running_type"] = "python"
            result["running_detail"] = {}
            python_data = tool_input_data.get("ontology_python_exec", {})
            result["mcp_info"]["input_params"] = python_data
        
        # Handle new atomic python operations
        elif tool == "write_python_file":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "write"}
            write_data = tool_input_data.get("write_python_file", {})
            result["mcp_info"]["input_params"] = write_data
        
        elif tool == "update_python_file":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "update"}
            update_data = tool_input_data.get("update_python_file", {})
            result["mcp_info"]["input_params"] = update_data
        
        elif tool == "read_python_file":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "read"}
            read_data = tool_input_data.get("read_python_file", {})
            result["mcp_info"]["input_params"] = read_data
        
        elif tool == "delete_python_file":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "delete"}
            delete_data = tool_input_data.get("delete_python_file", {})
            result["mcp_info"]["input_params"] = delete_data
        
        elif tool == "list_python_files":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "list"}
            list_data = tool_input_data.get("list_python_files", {})
            result["mcp_info"]["input_params"] = list_data
        
        elif tool == "run_python_file":
            result["running_type"] = "python"
            result["running_detail"] = {"python_operation": "run"}
            run_data = tool_input_data.get("run_python_file", {})
            result["mcp_info"]["input_params"] = run_data
        
        # Handle ontology_complex_sql_execute tool
        elif tool == "ontology_complex_sql_execute":
            result["running_type"] = "logic"
            result["running_detail"] = {
                "logic_name": "complex_sql"
            }
            complex_sql_data = tool_input_data.get("ontology_complex_sql_execute", {})
            result["mcp_info"]["input_params"] = complex_sql_data
        
        # Fallback: Check for direct field-based operations (legacy format)
        elif "object_name" in tool_input_data:
            result["running_type"] = "object"
            result["running_detail"] = {
                "object_name": tool_input_data.get("object_name"),
                "operation": tool_input_data.get("operation", "find"),
            }
        
        elif "action_name" in tool_input_data:
            result["running_type"] = "action"
            result["running_detail"] = {
                "action_name": tool_input_data.get("action_name"),
            }
        
        elif "logic_name" in tool_input_data or "function_name" in tool_input_data:
            result["running_type"] = "logic"
            result["running_detail"] = {
                "logic_name": tool_input_data.get("logic_name") or tool_input_data.get("function_name"),
            }
        
    except Exception as e:
        logger.warning(f"Failed to parse tool input: {e}, tool_input_str: {tool_input_str[:200]}")
    
    return result


def convert_action_data_to_graph_detail(data: Dict[str, Any]) -> Dict[str, List]:
    """
    Convert action data format to graph_detail format (nodes and edges).
    If no associated objects, return the action node itself.
    Format matches get_related_graph_data output.
    
    Args:
        data: Action data with 'action' and 'objects' fields
        
    Returns:
        Dict with 'nodes' and 'edges' lists
    """
    nodes = []
    edges = []
    
    action_info = data.get("action")
    objects = data.get("objects", [])
    
    if action_info:
        # Add action node itself with full details
        action_node = {
            "id": action_info.get("id"),
            "type": "circle",
            "data": {
                "create_time": action_info.get("create_time"),
                "last_update": action_info.get("last_update"),
                "sync_status": action_info.get("sync_status"),
                "object_type_id": action_info.get("object_type_id"),
                "action_name": action_info.get("action_name"),
                "action_label": action_info.get("action_label"),
                "action_desc": action_info.get("action_desc"),
                "action_type": action_info.get("action_type"),
                "icon": action_info.get("icon"),
                "status": action_info.get("status"),
                "ontology_id": action_info.get("ontology_id"),
                "oper_status": action_info.get("oper_status"),
                "build_type": action_info.get("build_type"),
                "node_type": "action",
                "stats": {
                    "exec_object_count": len(objects)
                }
            }
        }
        nodes.append(action_node)
        
        # Add associated objects as nodes with full details
        for obj in objects:
            obj_node = {
                "id": obj.get("id"),
                "type": "circle",
                "data": {
                    "create_time": obj.get("create_time"),
                    "last_update": obj.get("last_update"),
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
                }
            }
            nodes.append(obj_node)
            
            # Add edge from object to action (matches get_related_graph_data format)
            edge = {
                "source": obj.get("id"),
                "target": action_info.get("id"),
                "type": "line",
                "data": {
                    "edge_type": "action-object",
                    "label": "执行"
                }
            }
            edges.append(edge)
    
    return {"nodes": nodes, "edges": edges}


def convert_logic_data_to_graph_detail(data: Dict[str, Any]) -> Dict[str, List]:
    """
    Convert logic data format to graph_detail format (nodes and edges).
    If no associated objects, return the logic node itself.
    Format matches get_related_graph_data output.
    
    Args:
        data: Logic data with 'logic' and 'objects' fields
        
    Returns:
        Dict with 'nodes' and 'edges' lists
    """
    nodes = []
    edges = []
    
    logic_info = data.get("logic")
    objects = data.get("objects", [])
    
    if logic_info:
        # Add logic node itself with full details
        logic_node = {
            "id": logic_info.get("id"),
            "type": "circle",
            "data": {
                "create_time": logic_info.get("create_time"),
                "last_update": logic_info.get("last_update"),
                "sync_status": logic_info.get("sync_status"),
                "build_type": logic_info.get("build_type"),
                "function_code": logic_info.get("function_code"),
                "file_name": logic_info.get("file_name"),
                "intput_param": logic_info.get("intput_param"),
                "logic_type_desc": logic_info.get("logic_type_desc"),
                "logic_type_label": logic_info.get("logic_type_label"),
                "logic_type_name": logic_info.get("logic_type_name"),
                "ontology_id": logic_info.get("ontology_id"),
                "output_param": logic_info.get("output_param"),
                "owner_id": logic_info.get("owner_id"),
                "repo_name": logic_info.get("repo_name"),
                "status": logic_info.get("status"),
                "oper_status": logic_info.get("oper_status"),
                "node_type": "logic",
                "stats": {
                    "used_object_count": len(objects)
                }
            }
        }
        nodes.append(logic_node)
        
        # Add associated objects as nodes with full details
        for obj in objects:
            obj_node = {
                "id": obj.get("id"),
                "type": "circle",
                "data": {
                    "create_time": obj.get("create_time"),
                    "last_update": obj.get("last_update"),
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
                }
            }
            nodes.append(obj_node)
            
            # Add edge from logic to object (matches get_related_graph_data format)
            edge = {
                "source": logic_info.get("id"),
                "target": obj.get("id"),
                "type": "line",
                "data": {
                    "edge_type": "logic-object",
                    "label": "引用"
                }
            }
            edges.append(edge)
    
    return {"nodes": nodes, "edges": edges}


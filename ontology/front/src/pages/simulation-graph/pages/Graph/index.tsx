import React, { useState, useRef, useEffect, MouseEvent, ChangeEvent, useCallback, forwardRef, useImperativeHandle  } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    addEdge,
    Node,
    ReactFlowInstance,
    Position,
    SnapGrid,
    Background,
    Connection,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import ToolMenu from '@/components/SimulationTools/ToolTop';
import ToolRightMenu from '@/components/SimulationTools/ToolRight';
import ColorSelectorNode from './ColorSelectorNode';
import CustomNode from './components/Node';
import LogicTypeEditModal from '@/pages/function-manager/logic-type-edit-modal';
import ActionModal from '@/pages/action-modal';
import FunctionActionModal from '@/pages/action-manager/function-action-modal';
import axios from 'modo-plugin-common/src/core/src/http';

import dagre from 'dagre';

import {
    Menu,
    Button,
    Popconfirm,
    Message,
    Spin
} from '@arco-design/web-react';

import mockData from './mock/graph';

import {
    initData,
    getInitDataStatus
} from './api';

import "./style/index.less";

require('static/guid.js');

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;



const onNodeDragStop = (_: MouseEvent, node: Node) => {
};
const onNodeClick = (_: MouseEvent, node: Node) => {

};

const initBgColor = 'var(--color-fill-1)';

const connectionLineStyle = { stroke: 'var(--color-text-4)' };
const snapGrid: SnapGrid = [16, 16];

const nodeTypes = {
    selectorNode: ColorSelectorNode,
    node: CustomNode
};

const CustomNodeFlow = forwardRef((props, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [currentNode, setCurrentNode] = useState(null);
    const [selectedNodeIds, setSelectedNodeIds] = useEdgesState([]);

    const [bgColor, setBgColor] = useState<string>(initBgColor);
    const [pos, setPos] = useState({
        top: 10,
        left: 10
    })
    const [contextMenuVisible, setContextMenuVisible] = useState(false)
    const [deletePopupVisible, setDeletePopupVisible] = useState(false)

    const [createLogicModalVisible, setCreateLogicModalVisible] = useState(false)
    const [actionModalVisible, setActionModalVisible] = useState(false)
    const [functionActionModalVisible, setFunctionActionModalVisible] = useState(false)

    const [simulationStatus, setSimulationStatus] = useState(null)

    const contextMenuRef = useRef();
    const reactFlowInstanceRef = useRef();
    const containerRef = useRef();
    const dagreGraphRef = useRef();
    const deletePopconfirmRef = useRef();
    const topMenuRef = useRef();
    const topRightMenuRef = useRef();
    const initDataTaskIdRef = useRef();

    // 状态管理：存储选中的数据
    const [selectData, setSelectData] = useState<any[]>([]);

    // 创建ref对象，用于指定Drawer挂载的节点
    const popupRef = useRef<HTMLElement>(null);

    const isNodeInViewport = (
        node: Node,
    ): boolean => {
        if (!reactFlowInstanceRef.current) {
            return;
        }
        const containerRect = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
        };
        const viewport = reactFlowInstanceRef.current.getViewport();

        const nodeWidth = node.width || 240;
        const nodeHeight = node.height || 90;

        const nodeTop = node.position.y;
        const nodeLeft = node.position.x;
        const nodeBottom = nodeTop + nodeHeight;
        const nodeRight = nodeLeft + nodeWidth;

        const viewportLeft = -viewport.x / viewport.zoom;
        const viewportTop = -viewport.y / viewport.zoom;

        const viewportRight = viewportLeft + containerRect.width / viewport.zoom;
        const viewportBottom = viewportTop + containerRect.height / viewport.zoom;

        const isOutside =
            nodeRight < viewportLeft || 
            nodeLeft > viewportRight || 
            nodeBottom < viewportTop || 
            nodeTop > viewportBottom;

        return !isOutside;
    };

    const getBlankAreaInViewport = () => {
        if (!reactFlowInstanceRef.current) {
            return;
        }
        const containerRect = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
        };
        const viewport = reactFlowInstanceRef.current.getViewport();

        const viewportLeft = -viewport.x / viewport.zoom;
        const viewportTop = -viewport.y / viewport.zoom;

        const viewportRight = viewportLeft + containerRect.width / viewport.zoom;
        const viewportBottom = viewportTop + containerRect.height / viewport.zoom;

        console.log({
            x: viewportLeft,
            y: viewportTop,
            width: viewportRight - viewportLeft,
            height: viewportBottom - viewportTop
        })
        return {
            x: viewportLeft,
            y: viewportTop,
            width: viewportRight - viewportLeft,
            height: viewportBottom - viewportTop
        }
        const currentNodes = reactFlowInstanceRef.current.getNodes();
        let top = 0;
        let left = 0;
        let bottom = 0;
        let right = 0;
        let index = 0;
        const filterNodes = currentNodes.filter((node) => {
            const nodeWidth = node.width || 240;
            const nodeHeight = node.height || 90;

            const nodeTop = node.position.y;
            const nodeLeft = node.position.x;
            const nodeBottom = nodeTop + nodeHeight;
            const nodeRight = nodeLeft + nodeWidth;

            const isOutside =
                nodeRight < viewportLeft || 
                nodeLeft > viewportRight || 
                nodeBottom < viewportTop || 
                nodeTop > viewportBottom;

            if (!isOutside) {
                top = index === 0 ? nodeTop : Math.min(top, nodeTop);
                left = index === 0 ? nodeLeft : Math.min(left, nodeLeft);
                bottom = Math.max(bottom, nodeBottom);
                right = Math.max(top, nodeRight);
                index++
            }

            return !isOutside;
        })
        const rect = {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top
        }
        let blankX = 0;
        let blankY = 0;
        let blankWidth = 0;
        let blankHeight = 0;
        if (rect.x -  viewportLeft > 300 ) {
            blankX = viewportLeft;
            blankY = viewportTop;
            blankWidth = rect.x - viewportLeft;
            blankHeight = viewportBottom - viewportTop;
        }
        const blankRect = {
            x: blankX,
            y: blankY,
            width: blankWidth,
            height: blankHeight
        }
        console.log(rect);
        console.log(blankRect)
        return blankRect
    }

    // 点击按钮处理函数
    const handleButtonClick = () => {
        // 更新选中的数据
        const newData = [{ id: 1, name: '对象1' }];
        setSelectData(newData);
    };

    // 菜单点击事件处理函数
    const handleMenuClick = (eventKey: string, data?: any) => {
        if (eventKey === 'removeNode') {
            handleDeleteSelected();
        }
        
        if (eventKey === 'fullImport') {
            props.fullImport()
        }

        if (eventKey === 'addRelated') {
            props.importRelRes(selectedNodeIds)
        }

        if (eventKey === 'initData') {
            handleInitData()
        }

        if (eventKey === 'partialImport') {
            props.partialImport(data)
        }

        if (eventKey === 'executeRuleSimulation') {
            console.log(data);
            handleExecuteRuleSimulation(data);
        }
    };

    const handleExecuteRuleSimulation = useCallback((data) => {
        if (simulationStatus) {
            Message.warning('仿真正在执行中，不能再次执行!');
            return;
        }
        setSimulationStatus(true)
        let currentSimulationStatus = true;
        const clientId = new Date().getTime();
        const startObjectName = data.objDetail.objectTypeName;
        const startObjectId = data.objDetail.id;
        let currentNodes = reactFlowInstanceRef.current.getNodes();
        setNodes(currentNodes.map(n => {
            if (n.data.type === 'object' && n.data.name === startObjectName) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        simulationStart: true,
                        simulationStartData: data,
                        animated: true,
                        executionStatus: null,
                        executionRelActions: [],
                        relPorts: [],
                        highlighted: true,
                        faded: false
                    }
                }
            }
            return {
                ...n,
                data: {
                    ...n.data,
                    simulationStart: undefined,
                    simulationStartData: undefined,
                    animated: false,
                    executionStatus: null,
                    executionRelActions: [],
                    relPorts: [],
                    highlighted: false,
                    faded: true
                }
            }
        }))
        let currentEdges = reactFlowInstanceRef.current.getEdges();
        setEdges(currentEdges.map(edge => {
            return {
                ...edge,
                animated: false,
                style: {
                    stroke: 'var(--color-text-4)'
                }
            }
        }))
        let log = '';
        let relObjectActionMap = {};
        let executionObjectIds = [startObjectId];
        const startEventSource = (clientId) => {
            const source = new EventSource('/simulation/_api/sse/connect/' + clientId);

            source.addEventListener('message', (event) => {
                log += `\n${event.data}`;
                props.consoleLog({
                    trackId: clientId,
                    objectName: data.objDetail.objectTypeName,
                    objectLabel: data.objDetail.objectTypeLabel,
                    actionName: data.originalAction.label,
                    log,
                    params: data.params
                })
                if (/^TaskState:/.test(event.data)) {
                    const eventData = JSON.parse(event.data.substring(10));
                    currentEdges = reactFlowInstanceRef.current.getEdges();
                    currentNodes = reactFlowInstanceRef.current.getNodes();
                    const eventDataActionLabel = currentNodes.find(n => n.data.name === eventData.action_name && n.data.type === 'action')?.data.label;
                    console.log(eventData);
                    if (relObjectActionMap[eventData.object_name]) {
                        if (relObjectActionMap[eventData.object_name].indexOf(eventDataActionLabel) < 0) {
                            relObjectActionMap[eventData.object_name].push(eventDataActionLabel);
                        }
                    } else {
                        relObjectActionMap[eventData.object_name] = [eventDataActionLabel];
                    }
                    let relObjectIds = [];
                    let relEdgeMap = {};
                    let relPorts = [];
                    if (eventData.state !== 'start' && eventData.object_name !== startObjectName) {
                        let objectId = currentNodes.find(n => n.data.name === eventData.object_name)?.id;
                        setEdges(currentEdges.map(edge => {
                            if (edge.source === objectId) {
                                if (edge.target === startObjectId || edge.target === executionObjectIds[executionObjectIds.length - 2]) {
                                    const relObjectId = edge.target === startObjectId ? startObjectId : executionObjectIds[executionObjectIds.length - 2];
                                    relObjectIds.push(relObjectId);
                                    relEdgeMap[relObjectId] = edge.targetHandle;
                                    if (relPorts.indexOf(edge.sourceHandle) < 0) {
                                        relPorts.push(edge.sourceHandle);
                                    }
                                    return {
                                        ...edge,
                                        animated: true,
                                        style: {
                                            stroke: '#FBA839'
                                        }
                                    }
                                }
                            }
                            if (edge.target === objectId) {
                                if (edge.source === startObjectId || edge.source === executionObjectIds[executionObjectIds.length - 2]) {
                                    const relObjectId = edge.source === startObjectId ? startObjectId : executionObjectIds[executionObjectIds.length - 2];
                                    relObjectIds.push(relObjectId);
                                    relEdgeMap[relObjectId] = edge.sourceHandle;
                                    if (relPorts.indexOf(edge.sourceHandle) < 0) {
                                        relPorts.push(edge.targetHandle);
                                    }
                                    return {
                                        ...edge,
                                        animated: true,
                                        style: {
                                            stroke: '#FBA839'
                                        }
                                    }
                                }
                            }
                            return edge;
                        }))
                    }
                    if (eventData.state === 'start' && (startObjectName !== eventData.object_name || executionObjectIds.lenth > 1)) {
                        console.log('start-object', eventData.object_name, eventData)
                        currentNodes = reactFlowInstanceRef.current.getNodes()
                        const currentExecNode = currentNodes.find(n => n.data.name === eventData.object_name);
                        if (currentExecNode && !isNodeInViewport(currentExecNode)) {
                            handleSetCenter(currentExecNode.id);
                        }
                        executionObjectIds.push(currentExecNode?.id)
                        setNodes(currentNodes.map(n => {
                            if (eventData.object_name === n.data.name) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        highlighted: true,
                                        faded: false,
                                        animated: true
                                    }
                                }
                            }
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    animated: false
                                }
                            }
                        }))
                    }
                    if (eventData.state === 'failed') {
                        currentNodes = reactFlowInstanceRef.current.getNodes()
                        setNodes(currentNodes.map(n => {
                            if (eventData.object_name === n.data.name) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        animated: false,
                                        executionStatus: 'failed',
                                        executionRelActions: relObjectActionMap[eventData.object_name],
                                        relPorts: [
                                            ...(n.data.relPorts || []),
                                            ...relPorts
                                        ]
                                    }
                                }
                            }
                            if (relObjectIds.indexOf(n.id) > -1) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        relPorts: [
                                            ...(n.data.relPorts || []),
                                            relEdgeMap[n.id]
                                        ]
                                    }
                                };
                            }
                            return n;
                        }))
                    }
                    if (eventData.state === 'success') {
                        currentNodes = reactFlowInstanceRef.current.getNodes()
                        setNodes(currentNodes.map(n => {
                            if (eventData.object_name === n.data.name) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        animated: false,
                                        executionStatus: 'success',
                                        executionRelActions: relObjectActionMap[eventData.object_name],
                                        relPorts: [
                                            ...(n.data.relPorts || []),
                                            ...relPorts
                                        ]
                                    }
                                }
                            }
                            if (relObjectIds.indexOf(n.id) > -1) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        relPorts: [
                                            ...(n.data.relPorts || []),
                                            relEdgeMap[n.id]
                                        ]
                                    }
                                };
                            }
                            return n;
                        }))
                    }
                }
                if (/^find请求/.test(event.data)) {
                    const eventData = JSON.parse(event.data.substring(9));
                    currentEdges = reactFlowInstanceRef.current.getEdges();
                    currentNodes = reactFlowInstanceRef.current.getNodes();
                    if (/^find请求开始:/.test(event.data)) {
                        console.log('start-object find', eventData.object_name, eventData)
                        const currentExecNode = currentNodes.find(n => n.data.name === eventData.object_name);
                        if (currentExecNode && !isNodeInViewport(currentExecNode)) {
                            handleSetCenter(currentExecNode.id);
                        }
                        executionObjectIds.push(currentExecNode?.id)
                        setNodes(currentNodes.map(n => {
                            if (eventData.object_name === n.data.name) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        highlighted: true,
                                        faded: false,
                                        animated: true
                                    }
                                }
                            }
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    animated: false
                                }
                            };
                        }))
                    }
                    if (/^find请求结束:/.test(event.data)) {
                        setNodes(currentNodes.map(n => {
                            if (eventData.object_name === n.data.name) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        animated: false,
                                        executionStatus: 'success',
                                        executionRelActions: [],
                                        relPorts: []
                                    }
                                }
                            }
                            return n;
                        }))
                    }
                }
                
                if (event.data === '[开始仿真task实例结束清理]') {
                    const currentNodes = reactFlowInstanceRef.current.getNodes()
                    setNodes(currentNodes.map(n => {
                        console.log(n.data.name, n.data.label, n.data.type, n.data.highlighted, n.data.faded);
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                animated: false
                            }
                        }
                    }))
                    currentSimulationStatus = false;
                    setSimulationStatus(false)
                }
            });

            source.onerror = (event) => {
                console.error('EventSource error:', event);
                if (currentSimulationStatus) {
                    Message.error('仿真执行失败！');
                    const currentNodes = reactFlowInstanceRef.current.getNodes()
                    setNodes(currentNodes.map(n => {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                animated: false
                            }
                        }
                    }))
                    currentSimulationStatus = false;
                    setSimulationStatus(false);
                }
                source.close();
            };

            source.addEventListener('close', (event) => {
                console.log('EventSource closed');
            });
            return source;
        }

        startEventSource(clientId);

        const action_name = nodes.find(n => n.id === data.executeAction)?.data?.name;
        setTimeout(() => {
            axios.post(window.location.origin + '/simulation/_api/monitor/run', {
                ontology_name: props.ontologyName,
                action_name,
                object_name: data.objDetail.objectTypeName,
                eventName: clientId,
                params: data.params,

                /* "ontology_name": "CSAT_customer_satisfaction",
                "action_name": "insert_new_plan",
                "object_name": "Plan",
                "eventName": clientId,
                "params": {
                    "content": "str",
                    "cust_id": "str",
                    "prod_inst_id": "str",
                    "used_stra_ids": "10"
                } */
            }).then(function (res) {

            }).catch(function (e) {
                console.log(e);
                if (currentSimulationStatus) {
                    Message.error('仿真执行失败！');
                    const currentNodes = reactFlowInstanceRef.current.getNodes()
                    setNodes(currentNodes.map(n => {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                animated: false
                            }
                        }
                    }))
                    currentSimulationStatus = false;
                    setSimulationStatus(false);
                }
            });
        }, 2000)
       

    }, [nodes, edges, currentNode, simulationStatus])


    useEffect(() => {
        const onChange = (event: ChangeEvent<HTMLInputElement>) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id !== '2') {
                        return node;
                    }

                    const color = event.target.value;

                    setBgColor(color);

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            color,
                        },
                    };
                })
            );
        };

        // setNodes(mockData.nodes);
        // setEdges(mockData.edges);
        setNodes([]);
        setEdges([]);
    }, []);

    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges((eds) => {
                return addEdge({
                    ...connection,
                    // animated: true,
                    style: {
                        stroke: 'var(--color-text-4)'
                    }
                }, eds)
            }),
        [setEdges]
    );

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        setContextMenuVisible(true);
        setCurrentNode(node);
        setSelectedNodeIds([node.id]);
        setSelectData([node].map(n => {
            return {
                id: n.id,
                ...n.data
            }
        }))
        const rect = containerRef.current.getBoundingClientRect();
        let x = event.clientX;
        let y = event.clientY;
        let height = node.data.type === 'object' ? 224 : 80;
        if ((x + 180) > (rect.x + rect.width)) {
            x = rect.x + rect.width - 180;
        } 
        if ((y + height) > (rect.y + rect.height)) {
            y = rect.y + rect.height - height;
        } 
        setPos({
            top: y,
            left: x
        })

    })

    useEffect(() => {
        const handleMouseDown = (e) => {
            if (!contextMenuRef.current.contains(e.target) && !deletePopconfirmRef.current.contains(e.target)) {
                setContextMenuVisible(false);
                setDeletePopupVisible(false);
                // setCurrentNode(null);
            }
        }
        document.body.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.body.removeEventListener('mousedown', handleMouseDown);
        }
    }, [])

    // 监听节点选中状态变化
    const handleSelectionChange = useCallback((selectedElements: { nodes: Node[]; edges: Edge[] }) => {
        setSelectedNodeIds(selectedElements.nodes.map(node => node.id));
        setSelectData(selectedElements.nodes.map(n => {
            return {
                id: n.id,
                ...n.data
            }
        }))
    }, []);

    const onInit = (reactFlowInstance: ReactFlowInstance) => {
        reactFlowInstanceRef.current = reactFlowInstance;
    };

    const handleAddNode = useCallback(() => {
        if (!reactFlowInstanceRef.current) return;
        const newNodeId = guid();

        const newNode: Node = {
            id: newNodeId,
            type: 'node',
            position: {
                x: 100,
                y: 100
            },
            data: {
                type: 'object',
                label: `新节点 ${newNodeId.slice(-4)}`,
                id: newNodeId
            },
        };

        reactFlowInstanceRef.current.setNodes([...nodes, newNode]);
    }, [nodes]);

    const handleDeleteSelected = useCallback(() => {
        if (!reactFlowInstanceRef.current || selectedNodeIds.length === 0) return;

        const filteredNodes = nodes.filter(node => !selectedNodeIds.includes(node.id));
        const filteredEdges = edges.filter(
          edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        );
        reactFlowInstanceRef.current.setNodes(filteredNodes);
        reactFlowInstanceRef.current.setEdges(filteredEdges);
        setSelectedNodeIds([]);
        setSelectData([])
    }, [nodes, edges, selectedNodeIds]);

    const handleDeleteNodes = useCallback((ids) => {
        if (!reactFlowInstanceRef.current || ids.length === 0) return;

        const filteredNodes = nodes.filter(node => !ids.includes(node.id));
        const filteredEdges = edges.filter(
          edge => !ids.includes(edge.source) && !ids.includes(edge.target)
        );
        reactFlowInstanceRef.current.setNodes(filteredNodes);
        reactFlowInstanceRef.current.setEdges(filteredEdges);
        setSelectedNodeIds([]);
        setSelectData([])
    }, [nodes, edges]);

    const handleHighlightNodes = useCallback((ids) => {
        if (!reactFlowInstanceRef.current) return;
        reactFlowInstanceRef.current.setNodes(nodes.map(n => {
            return {
                ...n,
                data: {
                    ...n.data,
                    highlighted: ids.indexOf(n.id) > -1 ? true : false,
                    faded: ids.indexOf(n.id) > -1 ? false : true,
                }
            }
        }))
        reactFlowInstanceRef.current.setEdges(edges.map(e => {
            const className = e.className || '';
            return {
                ...e,
                className: (className && className.indexOf('faded') > -1) ? className : (className + ' faded')
            }
        }))
    }, [nodes])

    const handleHighlightRelNodes = useCallback((node) => {
        if (!reactFlowInstanceRef.current) return;
    }, [nodes, edges])

    const handleSetCenter = useCallback((id) => {
        if (!reactFlowInstanceRef.current) return;
        const node = reactFlowInstanceRef.current.getNode(id)
        if (!node) return;
        reactFlowInstanceRef.current.setCenter(
            node.position.x + (node.width / 2),
            node.position.y + (node.height / 2),
            {
                zoom: reactFlowInstanceRef.current.getZoom()
            }
        )
    }, [nodes])

    const handleFocusNode = useCallback((id) => {
        if (!reactFlowInstanceRef.current) return;
        const node = nodes.find(n => n.id === id)
        if (!node) return;
        handleSetCenter(id);

        reactFlowInstanceRef.current.setNodes(nodes.map(n => {
            if (n.id === id) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        highlighted: true,
                        faded: false
                    }
                }
            } else {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        highlighted: false,
                        faded: true
                    }
                }
            }
        }));
        reactFlowInstanceRef.current.setEdges(edges.map(e => {
            const className = e.className || '';
            return {
                ...e,
                className: (className && className.indexOf('faded') > -1) ? className : (className + ' faded')
            }
        }))
    }, [nodes, edges])

    const handleUnfocus = useCallback(() => {
        if (!reactFlowInstanceRef.current) return;
        const highlightedNodes = nodes.filter(n => n.data.highlighted)
        const fadedNodes = nodes.filter(n => n.data.faded)
        if (highlightedNodes.length === 0 && fadedNodes.length === 0) return;
        reactFlowInstanceRef.current.setNodes(nodes.map(n => {
            return {
                ...n,
                data: {
                    ...n.data,
                    highlighted: false,
                    faded: false
                }
            }
        }))
        reactFlowInstanceRef.current.setEdges(edges.map(e => {
            let className = e.className || '';
            className = className.replace(' faded', '');
            return {
                ...e,
                className
            }
        }))
    }, [nodes, edges])

    const handleZoomOut = useCallback(() => {
        if (!reactFlowInstanceRef.current) return;
        reactFlowInstanceRef.current.zoomIn();
    }, [])

    const handleZoomIn = useCallback(() => {
        if (!reactFlowInstanceRef.current) return;
        reactFlowInstanceRef.current.zoomOut();
    }, [])

    const getSelectedNodeIds = useCallback(() => {
        return selectedNodeIds
    }, [selectedNodeIds])

    const handleImportData = useCallback((data, callback) => {
        setNodes(data?.nodes || []);
        setEdges(data?.edges || []);
        typeof callback === 'function' && callback();
    }, [nodes, edges])

    const handleImportDataAndLayout = useCallback((data, fixedNodeIds) => {
        handleLayout(data, 'LR', fixedNodeIds || [])
        // handleLayout(data, 'TB')
    }, [])


    useImperativeHandle(ref, () => ({
        getInst: () => {
            return reactFlowInstanceRef.current
        },
        addNode: handleAddNode,
        deleteSelectedNodes: handleDeleteSelected,
        highlightNodes: handleHighlightNodes,
        selectNodes: handleSelectionChange,
        focusNode: handleFocusNode,
        unfocus: handleUnfocus,
        getSelectedNodeIds,
        importDataAndLayout: handleImportDataAndLayout,
        importData: handleImportData,
        unHighlighted: handleUnfocus,
        setCenter: handleSetCenter,
        isNodeInViewport,
        getData: () => {
            return {
                nodes: reactFlowInstanceRef.current.getNodes(),
                edges: reactFlowInstanceRef.current.getEdges(),
            }
        }
    }));

    const onPaneClick = useCallback(() => {
        setContextMenuVisible(false);
        setDeletePopupVisible(false);
        // handleUnfocus()
    }, [nodes, edges]);

    const handleInitData = useCallback(() => {
        if (initDataTaskIdRef.current) {
            Message.warning('数据正在初始化中，不能再次执行!');
            return;
        }
        if (nodes.filter(n => n.data.type === 'object').length === 0) {
            Message.warning('没有对象节点可以数据初始化！');
            return
        }
        setNodes(nodes.map(node => {
            if (node.data.type === 'object') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        dataLoadStatus: 0,
                        dataLoadPercent: 0
                    }
                }
            }
            return node;
        }))
        initData({
            "sceneId": props.sceneId,
            "objectIds": nodes.filter(n => n.data.type === 'object').map(n => n.id)
        }).then(res => {
            if (res.data?.success) {
                initDataTaskIdRef.current = res.data.data.taskId;
                handleGetInitDataStatus();
                return;
            }
            throw 'err';
        }).catch(err => {
            setNodes(nodes.map(node => {
                if (node.data.type === 'object') {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            dataLoadStatus: 3,
                            dataLoadPercent: undefined
                        }
                    }
                }
                return node;
            }))
            initDataTaskIdRef.current = null
            Message.error('数据初始化失败！')
        }).finally(() => {

        })
    }, [nodes, currentNode]);

    const handleGetInitDataStatus = useCallback(() => {
        if (!initDataTaskIdRef.current) {
            return;
        }
        getInitDataStatus({
            taskId: initDataTaskIdRef.current
        }).then(res => {
            if (res.data?.success) {
                if (res.data.data.length > 0) {
                    let statusMap = {};
                    res.data.data.forEach(n => {
                        statusMap[n.objectTypeId] = n.status;
                    })
                    setNodes(nodes.map(node => {
                        if (node.data.type === 'object') {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    dataStatus: statusMap[node.id] === 2 ? 1 : 0,
                                    dataLoadStatus: statusMap[node.id],
                                    dataLoadPercent: undefined
                                }
                            }
                        }
                        return node;
                    }))
                    if (res.data.data.find(n => [0, 1].indexOf(n.status) > -1)) {
                        if (initDataTaskIdRef.current) {
                            setTimeout(() => {
                                handleGetInitDataStatus()
                            }, 1000)
                        }
                    } else {
                        initDataTaskIdRef.current = null;
                    }
                    return;
                }
            }
            throw 'err';
        }).catch(err => {
            console.log(err);
            setNodes(nodes.map(node => {
                if (node.data.type === 'object') {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            dataLoadStatus: 3,
                            dataLoadPercent: undefined
                        }
                    }
                }
                return node;
            }))
            initDataTaskIdRef.current = null
            Message.error('数据初始化失败！')
        })
    }, [nodes])

    const handleContextMenuClick = useCallback((key) => {
        if (key === 'addRelNodes') {
            props.importRelRes([currentNode.id])
        }
        if (key === 'delete') {
            handleDeleteNodes([currentNode.id])
        }
        if (key === 'createLogic') {
            setCreateLogicModalVisible(true);
        }
        if (key === 'createObjectAction') {
            setActionModalVisible(true);
        }
        if (key === 'createFunctionAction') {
            setFunctionActionModalVisible(true);
        }
        if (key === 'initData') {
            topMenuRef.current.openDataInitializationModal();
        }
        if (key === 'startSimulation') {
            topRightMenuRef.current.openRuleSimulationDrawer();
            //getBlankAreaInViewport();
            /*handleExecuteRuleSimulation()*/
            /*handleExecuteRuleSimulation()*/
        }
        if (key !== 'delete-button') {
            setContextMenuVisible(false)
            setDeletePopupVisible(false)
        }
    }, [currentNode, nodes])

    const handlelogicAfterCreated = useCallback((row) => {
        setCreateLogicModalVisible(false);
        const existNodeIds = nodes.map(n => n.id);
        const relEdges = row.objectTypeIds.filter(objectTypeId => {
            return existNodeIds.indexOf(objectTypeId) > -1
        }).map(objectTypeId => {
            return {
                id: row.id + '_' + objectTypeId,
                source: objectTypeId,
                target: row.id,
                sourceHandle: 'port-3',
                targetHandle: 'port-1',
                style: {
                    stroke: 'var(--color-text-4)'
                }
            }
        })
        handleImportData({
            nodes: [
                ...nodes,
                {
                    id: row.id,
                    type: 'node',
                    width: 188,
                    height: 88,
                    data: {
                        type: 'logic',
                        name: row.logicTypeName,
                        label: row.logicTypeLabel,
                        dataStatus: 0
                    },
                    position: {
                        x: currentNode.position.x + 300,
                        y: currentNode.position.y
                    }
                }
            ],
            edges: [
                ...edges,
                ...relEdges
            ]
        }, nodes.map(n => n.id))
        const node = reactFlowInstanceRef.current.getNode(row.id);
        if (!isNodeInViewport(node)) {
            handleSetCenter(row.id);
        }
        props.getOntologyGraph(() => {}, true);
    }, [nodes, edges, currentNode])

    const handleLayout = (data, direction: string, fixedNodeIds) => {
        const isHorizontal = direction === 'LR';
        const dagreGraph = dagreGraphRef.current;
        dagreGraph.setGraph({ rankdir: direction });

        data.nodes.forEach((node) => {
            dagreGraph.setNode(node.id, {
                width: 240,
                height: 90,
                ...(fixedNodeIds.indexOf(node.id) > -1 ? {
                    x: node?.position?.x,
                    y: node?.position?.y,
                    fixed: true
                } : {})
            });
        });

        data.edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = data.nodes.map((node) => {
            if (fixedNodeIds.indexOf(node.id) > -1) {
                return node;
            }
            const nodeWithPosition = dagreGraph.node(node.id);
            node.targetPosition = isHorizontal ? Position.Right : Position.Bottom;
            node.sourcePosition = isHorizontal ? Position.Left : Position.Top;
            node.position = {
                x: nodeWithPosition.x + Math.random() / 1000,
                y: nodeWithPosition.y,
            };

            return node;
        });

        setNodes(layoutedNodes);
        setEdges(data.edges.map(e => {
            return {
                ...e,
                sourceHandle: isHorizontal ? 'port-3' : 'port-4',
                targetHandle: isHorizontal ? 'port-1' : 'port-2'
            }
        }))
    }

    useEffect(() => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraphRef.current = dagreGraph;
        return () => {
            initDataTaskIdRef.current = null;
        }
    }, [])

    useEffect(() => {
    }, [nodes])

    return (
        <>
        {simulationStatus && <div className="simulation-tip"><Spin />正在仿真中...</div>}
        <ReactFlow
            ref={container => {
                containerRef.current = container
            }}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            style={{ background: bgColor }}
            onInit={onInit}
            nodeTypes={nodeTypes}
            connectionLineStyle={connectionLineStyle}
            snapToGrid={true}
            snapGrid={snapGrid}
            fitView
            minZoom={0.3}
            maxZoom={2}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onSelectionChange={handleSelectionChange}
        >
            {/*<MiniMap
            />*/}
            {/*<Controls />*/}
            <Background />
        </ReactFlow>

        <div
            className="simulation-flow-controls">
            <Button
                icon={(
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.3737 13.4311C14.6339 13.6914 14.634 14.1141 14.3737 14.3744C14.1133 14.6348 13.6907 14.6347 13.4303 14.3744L14.3737 13.4311Z" fill="currentColor"/>
                        <path d="M6.99996 4.33341C7.36815 4.33341 7.66663 4.63189 7.66663 5.00008V6.33472L8.99931 6.33341C9.3674 6.33305 9.66615 6.63131 9.66663 6.99943C9.66699 7.36752 9.36873 7.66627 9.00061 7.66675L7.66663 7.66805V9.00008C7.66663 9.36827 7.36815 9.66675 6.99996 9.66675C6.63177 9.66675 6.33329 9.36827 6.33329 9.00008V7.67L5.00582 7.67196C4.63773 7.67232 4.33898 7.37406 4.3385 7.00594C4.33813 6.63785 4.6364 6.3391 5.00452 6.33862L6.33329 6.33667V5.00008C6.33329 4.63189 6.63177 4.33341 6.99996 4.33341Z" fill="currentColor"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.99996 0.666748C10.4977 0.666748 13.3333 3.50229 13.3333 7.00008C13.3333 8.50899 12.8047 9.8939 11.9238 10.9819L14.3737 13.4311L13.9017 13.9024L13.4303 14.3744L10.9804 11.9246C9.89264 12.8049 8.50835 13.3334 6.99996 13.3334C3.50217 13.3334 0.666626 10.4979 0.666626 7.00008C0.666626 3.50229 3.50217 0.666748 6.99996 0.666748ZM6.99996 2.00008C4.23855 2.00008 1.99996 4.23867 1.99996 7.00008C1.99996 9.76149 4.23855 12.0001 6.99996 12.0001C9.76137 12.0001 12 9.76149 12 7.00008C12 4.23867 9.76137 2.00008 6.99996 2.00008Z" fill="currentColor"/>
                    </svg>
                )}
                onClick={handleZoomOut}
                />
            <Button
                icon={(
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.3737 13.4311C14.6339 13.6914 14.634 14.1141 14.3737 14.3744C14.1133 14.6348 13.6907 14.6347 13.4303 14.3744L14.3737 13.4311Z" fill="currentColor"/>
                        <path d="M8.99996 6.33341C9.36815 6.33341 9.66663 6.63189 9.66663 7.00008C9.66663 7.36827 9.36815 7.66675 8.99996 7.66675H4.99996C4.63177 7.66675 4.33329 7.36827 4.33329 7.00008C4.33329 6.63189 4.63177 6.33341 4.99996 6.33341H8.99996Z" fill="currentColor"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.99996 0.666748C10.4977 0.666748 13.3333 3.50229 13.3333 7.00008C13.3333 8.50899 12.8047 9.8939 11.9238 10.9819L14.3737 13.4311L13.9017 13.9024L13.4303 14.3744L10.9804 11.9246C9.89264 12.8049 8.50835 13.3334 6.99996 13.3334C3.50217 13.3334 0.666626 10.4979 0.666626 7.00008C0.666626 3.50229 3.50217 0.666748 6.99996 0.666748ZM6.99996 2.00008C4.23855 2.00008 1.99996 4.23867 1.99996 7.00008C1.99996 9.76149 4.23855 12.0001 6.99996 12.0001C9.76137 12.0001 12 9.76149 12 7.00008C12 4.23867 9.76137 2.00008 6.99996 2.00008Z" fill="currentColor"/>
                    </svg>
                )}
                onClick={handleZoomIn}
                />
            <Button
                icon={(
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.00004 10.3333C2.36823 10.3333 2.66671 10.6317 2.66671 10.9999V13.3333H5.00004C5.36823 13.3333 5.66671 13.6317 5.66671 13.9999C5.66671 14.3681 5.36823 14.6666 5.00004 14.6666H2.00004C1.63185 14.6666 1.33337 14.3681 1.33337 13.9999V10.9999C1.33337 10.6317 1.63185 10.3333 2.00004 10.3333Z" fill="currentColor"/>
                        <path d="M14 10.3333C14.3682 10.3333 14.6667 10.6317 14.6667 10.9999V13.9999C14.6667 14.3681 14.3682 14.6666 14 14.6666H11C10.6319 14.6666 10.3334 14.3681 10.3334 13.9999C10.3334 13.6317 10.6319 13.3333 11 13.3333H13.3334V10.9999C13.3334 10.6317 13.6319 10.3333 14 10.3333Z" fill="currentColor"/>
                        <path d="M5.00004 1.33325C5.36823 1.33325 5.66671 1.63173 5.66671 1.99992C5.66671 2.36811 5.36823 2.66659 5.00004 2.66659H2.66671V4.99992C2.66671 5.36811 2.36823 5.66659 2.00004 5.66659C1.63185 5.66659 1.33337 5.36811 1.33337 4.99992V1.99992C1.33337 1.63173 1.63185 1.33325 2.00004 1.33325H5.00004Z" fill="currentColor"/>
                        <path d="M14 1.33325C14.3682 1.33325 14.6667 1.63173 14.6667 1.99992V4.99992C14.6667 5.36811 14.3682 5.66659 14 5.66659C13.6319 5.66659 13.3334 5.36811 13.3334 4.99992V2.66659H11C10.6319 2.66659 10.3334 2.36811 10.3334 1.99992C10.3334 1.63173 10.6319 1.33325 11 1.33325H14Z" fill="currentColor"/>
                    </svg>
                )}
                onClick={props.fullScreen}
                />
        </div>

        <div
            style={{
                position: 'absolute',
                top: '4px',
                left: '-4px',
                zIndex: 10
            }}>
            <ToolMenu
                ref={topMenuRef}
                selectData={selectData}
                ontologyGraph={props.ontologyGraph}
                nodes={nodes}
                edges={edges}
                getPopupContainer={popupRef}
                onMenuClick={handleMenuClick}/>
        </div>
        <div
            style={{
                position: 'absolute',
                top: '50px',
                right: '20px',
                zIndex: 10
            }}>
            <ToolRightMenu
                ref={topRightMenuRef}
                selectData={selectData}
                ontologyGraph={props.ontologyGraph}
                nodes={nodes}
                edges={edges}
                getPopupContainer={popupRef}
                onMenuClick={handleMenuClick}/>
        </div>

        <div
            ref={popupRef}
            style={{
                padding: '20px',
                backgroundColor: '#f9fbfd',
                borderRadius: '4px',
                height: '400px',
                zIndex: 10
            }}>
        </div>

        <div
            ref={deletePopconfirmRef}>
        </div>

        <div
            ref={contextMenuRef}
            className="simulation-flow-context-menu"
            style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                zIndex: contextMenuVisible ? 1000 : -1,
                opacity: contextMenuVisible ? 1: 0,
            }}>
            <Menu
                style={{ width: 180 }}
                mode='pop'
                onClickMenuItem={handleContextMenuClick}>
                <MenuItem key='addRelNodes'>
                    <span className="icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.00004 4.66659C8.36823 4.66659 8.66671 4.96506 8.66671 5.33325V7.33325H10.6667C11.0349 7.33325 11.3334 7.63173 11.3334 7.99992C11.3334 8.36811 11.0349 8.66658 10.6667 8.66658H8.66671V10.6666C8.66671 11.0348 8.36823 11.3333 8.00004 11.3333C7.63185 11.3333 7.33337 11.0348 7.33337 10.6666V8.66658H5.33337C4.96518 8.66658 4.66671 8.36811 4.66671 7.99992C4.66671 7.63173 4.96518 7.33325 5.33337 7.33325H7.33337V5.33325C7.33337 4.96506 7.63185 4.66659 8.00004 4.66659Z" fill="currentColor"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M13 1.33325C13.9205 1.33325 14.6667 2.07944 14.6667 2.99992V12.9999C14.6667 13.9204 13.9205 14.6666 13 14.6666H3.00004C2.07957 14.6666 1.33337 13.9204 1.33337 12.9999V2.99992C1.33337 2.07944 2.07957 1.33325 3.00004 1.33325H13ZM3.00004 2.66659C2.81595 2.66659 2.66671 2.81582 2.66671 2.99992V12.9999C2.66671 13.184 2.81595 13.3333 3.00004 13.3333H13C13.1841 13.3333 13.3334 13.184 13.3334 12.9999V2.99992C13.3334 2.81582 13.1841 2.66659 13 2.66659H3.00004Z" fill="currentColor"/>
                        </svg>
                    </span>
                    <span className="text">
                        添加相关节点
                    </span>
                </MenuItem>

                <MenuItem key='delete-button' className="delete-menu-item">
                    <Popconfirm
                        popupVisible={deletePopupVisible}
                        focusLock
                        title={(
                            <>
                                <div
                                    style={{
                                        fontWeight: 600
                                    }}>
                                    移除节点
                                </div>
                                <div
                                    style={{
                                        marginTop: '4px'
                                    }}>
                                    您可以移除画布上的节点，会同步移除节点上的配置，以及相关的其他节点。
                                </div>
                            </>
                        )}
                        onOk={(e) => {
                            handleContextMenuClick('delete');
                            setDeletePopupVisible(false);
                        }}
                        onCancel={(e) => {
                            setDeletePopupVisible(false);
                        }}
                        getPopupContainer={() => {
                            return deletePopconfirmRef.current;
                        }}>
                        <div
                            className="delete-menu-item-content"
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletePopupVisible(true);
                            }}>
                            <span className="icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.66667 6.33333C7.03486 6.33333 7.33333 6.63181 7.33333 7V10.6667C7.33333 11.0349 7.03486 11.3333 6.66667 11.3333C6.29848 11.3333 6 11.0349 6 10.6667V7C6 6.63181 6.29848 6.33333 6.66667 6.33333Z" fill="currentColor"/>
                                    <path d="M9.33333 6.33333C9.70152 6.33333 10 6.63181 10 7V10.6667C10 11.0349 9.70152 11.3333 9.33333 11.3333C8.96514 11.3333 8.66667 11.0349 8.66667 10.6667V7C8.66667 6.63181 8.96514 6.33333 9.33333 6.33333Z" fill="currentColor"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.68359 1.00651C9.89261 1.03537 10.0781 1.1619 10.1797 1.35091L11.0651 3H14.3333C14.7015 3 15 3.29848 15 3.66667C15 4.03486 14.7015 4.33333 14.3333 4.33333H13.3333V14.3333C13.3333 14.7015 13.0349 15 12.6667 15H3.33333C2.96514 15 2.66667 14.7015 2.66667 14.3333V4.33333H1.66667C1.29848 4.33333 1 4.03486 1 3.66667C1 3.29848 1.29848 3 1.66667 3H4.9388L5.84505 1.34635C5.96208 1.13287 6.18623 1 6.42969 1H9.59245L9.68359 1.00651ZM4 13.6667H12V4.33333H4V13.6667ZM6.45898 3H9.55208L9.19401 2.33333H6.82422L6.45898 3Z" fill="currentColor"/>
                                </svg>

                            </span>
                            <span className="text">
                                删除节点
                            </span>
                        </div>
                    </Popconfirm>
                </MenuItem>
                
                {currentNode?.data?.type === 'object' && (
                    <>
                        <MenuItem key='initData'>
                            <span className="icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.78177 10.0001C9.56776 10.0001 10.1954 9.99979 10.701 10.0385C11.2133 10.0777 11.6577 10.1598 12.0676 10.3556C12.7243 10.6693 13.2667 11.174 13.6092 11.8041C14.0177 12.5559 13.9999 13.2352 13.9999 14.6667C13.9999 15.0349 13.7014 15.3334 13.3332 15.3334C12.9651 15.3333 12.6665 15.0349 12.6665 14.6667C12.6665 13.1116 12.6488 12.8298 12.4374 12.4408C12.2345 12.0677 11.9062 11.7562 11.4927 11.5587C11.2943 11.464 11.0355 11.4013 10.5995 11.3679C10.1566 11.334 9.58847 11.3334 8.78177 11.3334H7.21797C6.41126 11.3334 5.84316 11.334 5.40026 11.3679C4.96424 11.4013 4.70546 11.4639 4.50703 11.5587C4.09361 11.7562 3.76522 12.0677 3.56237 12.4408C3.35102 12.8298 3.33321 13.1117 3.33321 14.6667C3.33321 15.0349 3.03473 15.3334 2.66654 15.3334C2.29846 15.3333 1.99987 15.0349 1.99987 14.6667C1.99987 13.235 1.9819 12.556 2.3905 11.8041C2.73301 11.174 3.27546 10.6693 3.93217 10.3556C4.34207 10.1598 4.7865 10.0777 5.2987 10.0385C5.80431 9.99978 6.43197 10.0001 7.21797 10.0001H8.78177Z" fill="currentColor"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99987 0.666748C10.209 0.666748 11.9999 2.45761 11.9999 4.66675C11.9999 6.87589 10.209 8.66675 7.99987 8.66675C5.79079 8.66668 3.99987 6.87585 3.99987 4.66675C3.99987 2.45765 5.79079 0.666812 7.99987 0.666748ZM7.99987 2.00008C6.52717 2.00015 5.33321 3.19403 5.33321 4.66675C5.33321 6.13947 6.52717 7.33335 7.99987 7.33342C9.47263 7.33342 10.6665 6.13951 10.6665 4.66675C10.6665 3.19399 9.47263 2.00008 7.99987 2.00008Z" fill="currentColor"/>
                                </svg>

                            </span>
                            <span className="text">
                                数据初始化
                            </span>
                        </MenuItem>
                        <MenuItem key='createLogic'>
                            <span className="icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.44075 0.514974C6.75975 0.580234 7.00001 0.86223 7 1.20052V3.80013L6.98568 3.94141C6.92962 4.2147 6.71411 4.42979 6.44075 4.48568L6.30013 4.5H4.69141V7.26563H8.69987V6.70052C8.69987 6.36239 8.93969 6.0804 9.25846 6.01497L9.39974 6H14.2995C14.686 6.00009 14.9994 6.31397 14.9993 6.70052V9.30013C14.9992 9.63818 14.7595 9.92035 14.4408 9.98568L14.2995 10H9.39974L9.25846 9.98568C8.93979 9.92027 8.70002 9.63812 8.69987 9.30013V8.73177H4.69141V12.765H8.69987V12.2005C8.69987 11.8624 8.93969 11.5804 9.25846 11.515L9.39974 11.5H14.2995C14.686 11.5001 14.9994 11.814 14.9993 12.2005V14.8001C14.9992 15.1382 14.7595 15.4203 14.4408 15.4857L14.2995 15.5H9.39974L9.25846 15.4857C8.93979 15.4203 8.70002 15.1381 8.69987 14.8001V14.2311H3.95833C3.76387 14.2311 3.57696 14.1538 3.43945 14.0163C3.30209 13.8788 3.22531 13.6924 3.22526 13.498V4.5H1.46029L1.31836 4.48568C0.999769 4.42021 0.759919 4.13806 0.759766 3.80013V1.20052C0.759766 0.862494 0.999731 0.580516 1.31836 0.514974L1.46029 0.5H6.30013L6.44075 0.514974ZM10.1999 14H13.4993V13H10.1999V14ZM10.1999 8.5H13.4993V7.5H10.1999V8.5ZM2.25977 3H5.5V2H2.25977V3Z" fill="currentColor"/>
                                </svg>

                            </span>
                            <span className="text">
                                添加逻辑
                            </span>
                        </MenuItem>
                        <MenuItem key='createFunctionAction'>
                            <span className="icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_393_200)">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.3333 0.666748C12.4378 0.666748 13.3333 1.56217 13.3333 2.66675C13.3333 3.7713 12.4378 4.66675 11.3333 4.66675C11.0245 4.66675 10.7331 4.59447 10.472 4.46948L10.4713 4.47144L10.1139 4.82821C10.4631 5.35524 10.6666 5.98718 10.6666 6.66675C10.6666 7.36263 10.4532 8.00856 10.0885 8.54305L11.4778 10.2794C11.8358 10.1008 12.2394 10.0001 12.6666 10.0001C14.1394 10.0001 15.3333 11.194 15.3333 12.6667C15.3333 14.1395 14.1394 15.3334 12.6666 15.3334C11.1939 15.3334 9.99996 14.1395 9.99996 12.6667C9.99996 12.1054 10.1737 11.5847 10.47 11.155L9.12626 9.47599C8.60843 9.80718 7.99358 10.0001 7.33329 10.0001C6.91901 10.0001 6.52281 9.92336 6.15686 9.78524L5.49801 10.4441C5.8134 10.8821 5.99996 11.4191 5.99996 12.0001C5.99996 13.4728 4.80605 14.6667 3.33329 14.6667C1.86053 14.6667 0.666626 13.4728 0.666626 12.0001C0.666626 10.5273 1.86053 9.33341 3.33329 9.33341C3.73969 9.33341 4.12466 9.42473 4.46936 9.58732L5.00517 9.05151C4.38523 8.44621 3.99996 7.60163 3.99996 6.66675C3.99996 6.16227 4.11186 5.68388 4.31246 5.25529L3.52665 4.46948C3.26579 4.59416 2.97503 4.66675 2.66663 4.66675C1.56205 4.66675 0.666626 3.7713 0.666626 2.66675C0.666626 1.56218 1.56206 0.666748 2.66663 0.666748C3.77118 0.666748 4.66663 1.56217 4.66663 2.66675C4.66663 2.97515 4.59403 3.26592 4.46936 3.52677L5.11845 4.17586C5.7073 3.65189 6.48306 3.33341 7.33329 3.33341C8.01254 3.33341 8.6443 3.53662 9.17118 3.8855L9.52991 3.52743C9.40515 3.2665 9.33329 2.97526 9.33329 2.66675C9.33329 1.56217 10.2287 0.666748 11.3333 0.666748ZM12.6666 11.3334C11.9302 11.3334 11.3333 11.9304 11.3333 12.6667C11.3333 13.4031 11.9302 14.0001 12.6666 14.0001C13.403 14.0001 14 13.4031 14 12.6667C14 11.9304 13.403 11.3334 12.6666 11.3334ZM3.33329 10.6667C2.59691 10.6667 1.99996 11.2637 1.99996 12.0001C1.99996 12.7365 2.59691 13.3334 3.33329 13.3334C4.06967 13.3334 4.66663 12.7365 4.66663 12.0001C4.66663 11.2637 4.06967 10.6667 3.33329 10.6667ZM7.33329 4.66675C6.22872 4.66675 5.33329 5.56217 5.33329 6.66675C5.33329 7.77133 6.22872 8.66675 7.33329 8.66675C8.43787 8.66675 9.33329 7.77133 9.33329 6.66675C9.33329 5.56217 8.43787 4.66675 7.33329 4.66675ZM2.66663 2.00008C2.29844 2.00008 1.99996 2.29856 1.99996 2.66675C1.99996 3.03493 2.29844 3.33341 2.66663 3.33341C3.0348 3.33341 3.33329 3.03492 3.33329 2.66675C3.33329 2.29856 3.03481 2.00008 2.66663 2.00008ZM11.3333 2.00008C10.9651 2.00008 10.6666 2.29856 10.6666 2.66675C10.6666 3.03492 10.9651 3.33341 11.3333 3.33341C11.7015 3.33341 12 3.03492 12 2.66675C12 2.29856 11.7015 2.00008 11.3333 2.00008Z" fill="currentColor"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_393_200">
                                            <rect width="16" height="16" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                            </span>
                            <span className="text">
                                添加动作
                            </span>
                        </MenuItem>
                        {/*<SubMenu
                            key='5'
                            title={
                            <>
                                <span className="icon">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clip-path="url(#clip0_393_200)">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.3333 0.666748C12.4378 0.666748 13.3333 1.56217 13.3333 2.66675C13.3333 3.7713 12.4378 4.66675 11.3333 4.66675C11.0245 4.66675 10.7331 4.59447 10.472 4.46948L10.4713 4.47144L10.1139 4.82821C10.4631 5.35524 10.6666 5.98718 10.6666 6.66675C10.6666 7.36263 10.4532 8.00856 10.0885 8.54305L11.4778 10.2794C11.8358 10.1008 12.2394 10.0001 12.6666 10.0001C14.1394 10.0001 15.3333 11.194 15.3333 12.6667C15.3333 14.1395 14.1394 15.3334 12.6666 15.3334C11.1939 15.3334 9.99996 14.1395 9.99996 12.6667C9.99996 12.1054 10.1737 11.5847 10.47 11.155L9.12626 9.47599C8.60843 9.80718 7.99358 10.0001 7.33329 10.0001C6.91901 10.0001 6.52281 9.92336 6.15686 9.78524L5.49801 10.4441C5.8134 10.8821 5.99996 11.4191 5.99996 12.0001C5.99996 13.4728 4.80605 14.6667 3.33329 14.6667C1.86053 14.6667 0.666626 13.4728 0.666626 12.0001C0.666626 10.5273 1.86053 9.33341 3.33329 9.33341C3.73969 9.33341 4.12466 9.42473 4.46936 9.58732L5.00517 9.05151C4.38523 8.44621 3.99996 7.60163 3.99996 6.66675C3.99996 6.16227 4.11186 5.68388 4.31246 5.25529L3.52665 4.46948C3.26579 4.59416 2.97503 4.66675 2.66663 4.66675C1.56205 4.66675 0.666626 3.7713 0.666626 2.66675C0.666626 1.56218 1.56206 0.666748 2.66663 0.666748C3.77118 0.666748 4.66663 1.56217 4.66663 2.66675C4.66663 2.97515 4.59403 3.26592 4.46936 3.52677L5.11845 4.17586C5.7073 3.65189 6.48306 3.33341 7.33329 3.33341C8.01254 3.33341 8.6443 3.53662 9.17118 3.8855L9.52991 3.52743C9.40515 3.2665 9.33329 2.97526 9.33329 2.66675C9.33329 1.56217 10.2287 0.666748 11.3333 0.666748ZM12.6666 11.3334C11.9302 11.3334 11.3333 11.9304 11.3333 12.6667C11.3333 13.4031 11.9302 14.0001 12.6666 14.0001C13.403 14.0001 14 13.4031 14 12.6667C14 11.9304 13.403 11.3334 12.6666 11.3334ZM3.33329 10.6667C2.59691 10.6667 1.99996 11.2637 1.99996 12.0001C1.99996 12.7365 2.59691 13.3334 3.33329 13.3334C4.06967 13.3334 4.66663 12.7365 4.66663 12.0001C4.66663 11.2637 4.06967 10.6667 3.33329 10.6667ZM7.33329 4.66675C6.22872 4.66675 5.33329 5.56217 5.33329 6.66675C5.33329 7.77133 6.22872 8.66675 7.33329 8.66675C8.43787 8.66675 9.33329 7.77133 9.33329 6.66675C9.33329 5.56217 8.43787 4.66675 7.33329 4.66675ZM2.66663 2.00008C2.29844 2.00008 1.99996 2.29856 1.99996 2.66675C1.99996 3.03493 2.29844 3.33341 2.66663 3.33341C3.0348 3.33341 3.33329 3.03492 3.33329 2.66675C3.33329 2.29856 3.03481 2.00008 2.66663 2.00008ZM11.3333 2.00008C10.9651 2.00008 10.6666 2.29856 10.6666 2.66675C10.6666 3.03492 10.9651 3.33341 11.3333 3.33341C11.7015 3.33341 12 3.03492 12 2.66675C12 2.29856 11.7015 2.00008 11.3333 2.00008Z" fill="currentColor"/>
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_393_200">
                                                <rect width="16" height="16" fill="white"/>
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </span>
                                <span className="text">
                                    添加动作
                                </span>
                            </>
                            }>
                            <MenuItem key='createObjectAction'>基于对象创建</MenuItem>
                            <MenuItem key='createFunctionAction'>基于函数创建</MenuItem>
                        </SubMenu>*/}
                        <MenuItem key='startSimulation'>
                            <span className="icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_393_210)">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99996 0.666748C12.05 0.666748 15.3333 3.94999 15.3333 8.00008C15.3333 12.0502 12.05 15.3334 7.99996 15.3334C3.94987 15.3334 0.666626 12.0502 0.666626 8.00008C0.666626 3.94999 3.94987 0.666748 7.99996 0.666748ZM7.99996 2.00008C4.68625 2.00008 1.99996 4.68637 1.99996 8.00008C1.99996 11.3138 4.68625 14.0001 7.99996 14.0001C11.3137 14.0001 14 11.3138 14 8.00008C14 4.68637 11.3137 2.00008 7.99996 2.00008Z" fill="currentColor"/>
                                        <path d="M6.52208 5.38398C6.63888 5.31656 6.78284 5.31656 6.89964 5.38398L10.5263 7.67299C10.6431 7.74044 10.7151 7.86516 10.7151 8.00004C10.7151 8.13489 10.6431 8.25967 10.5263 8.32709L6.89964 10.6157C6.78282 10.6832 6.6389 10.6832 6.52208 10.6157C6.40528 10.5483 6.33329 10.4236 6.33329 10.2887V5.71104C6.33329 5.57614 6.40526 5.45143 6.52208 5.38398Z" fill="currentColor"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_393_210">
                                            <rect width="16" height="16" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                            </span>
                            <span className="text">
                                开始仿真
                            </span>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </div>
        {props.ontologyId && createLogicModalVisible && (
            <LogicTypeEditModal
                visible={createLogicModalVisible}
                ontologyId={props.ontologyId}
                ontologyName={props.ontologyName}
                onClose={() => {
                    setCreateLogicModalVisible(false);
                }}
                afterCreated={handlelogicAfterCreated}
            />
        )}
        {props.ontologyId && actionModalVisible && (
            <ActionModal
                ontology={{
                    id: props.ontologyId
                }}
                close={() => {
                    setActionModalVisible(false);
                }}
                afterCreated={(id, row) => {
                    setActionModalVisible(false);
                    setNodes([
                        ...nodes,
                        {
                            id: row.id,
                            type: 'node',
                            data: {
                                type: 'action',
                                name: row.actionName,
                                label: row.actionLabel,
                                dataStatus: 0
                            },
                            position: {
                                x: currentNode.position.x + 300,
                                y: currentNode.position.y
                            }
                        }
                    ])
                    setEdges([
                        ...edges,
                        {
                            id: row.objectTypeId + '_' + row.id,
                            source: row.objectTypeId,
                            target: row.id,
                            sourceHandle: 'port-3',
                            targetHandle: 'port-1',
                            style: {
                                stroke: 'var(--color-text-4)'
                            }
                        }
                    ])
                    props.getOntologyGraph(() => {}, true);
                }}
            />
        )}
        {props.ontologyId && (
            <FunctionActionModal
                visible={functionActionModalVisible}
                ontologyId={props.ontologyId}
                ontologyName={props.ontologyName}
                onClose={() => {
                    setFunctionActionModalVisible(false);
                }}
                afterCreated={row => {
                    setFunctionActionModalVisible(false);
                    setNodes([
                        ...nodes,
                        {
                            id: row.id,
                            type: 'node',
                            data: {
                                type: 'action',
                                name: row.actionName,
                                label: row.actionLabel,
                                dataStatus: 0
                            },
                            position: {
                                x: currentNode.position.x + 300,
                                y: currentNode.position.y
                            }
                        }
                    ])
                    setEdges([
                        ...edges,
                        {
                            id: row.objectTypeId + '_' + row.id,
                            source: row.objectTypeId,
                            target: row.id,
                            sourceHandle: 'port-3',
                            targetHandle: 'port-1',
                            style: {
                                stroke: 'var(--color-text-4)'
                            }
                        }
                    ])
                    props.getOntologyGraph(() => {}, true);
                }}
              />
        )}
        </>
    );
});

export default CustomNodeFlow;
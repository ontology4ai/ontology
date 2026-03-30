import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Graph, Path, Cell, Markup } from '@antv/x6'
import { Selection } from '@antv/x6-plugin-selection'
import insertCss from 'insert-css'
import { register } from '@antv/x6-react-shape'
import mockData from './data/dag';
import iconMap from './icon';
import './style/index1.less';
import { Tag, Trigger, Button } from '@arco-design/web-react'

const TransformScale = 0.8

class Label extends React.Component {
    constructor(props) {
        super(props);
        this.contentRef = React.createRef(null);
    }
    measureLabel() {
        if (this.contentRef.current && this.props.onMeasure) {
            const { offsetWidth, offsetHeight } = this.contentRef.current;
            this.props.onMeasure(offsetWidth, offsetHeight);
        }
    }
    componentDidMount() {
        this.measureLabel();
    }
    render() {
        // console.log(this.props)
        return (
            <div
                ref={this.contentRef}
                style={{
                    width: 'max-content',
                    height: '34px',
                    textAlign: 'center',
                    // transform: `rotate(${this.props.angle}deg)`
                }}>
                <button
                    style={{
                        width: 'max-content',
                        height: '100%',
                        padding: '0px 16px',
                        textAlign: 'center',
                        color: '#CECFFF',
                        fontSize: '16px',
                        background: 'rgba(44,50,98,0.4)',
                        boxShadow: 'inset 0px -4px 10px 0px rgba(171,168,227,0.2)',
                        border: '1px solid #535C8F',
                        borderRadius: 8,
                        backdropFilter: 'blur(2px)',
                        display: 'inline-block'
                    }}>
                    {this.props.label?.data?.text || '----'}
                </button>
            </div>
        )
    }
}

interface NodeStatus {
    id: string
    status: 'default' | 'success' | 'failed' | 'running'
    label?: string
    isShowRing?: boolean
    isClick?: boolean
    type?: string
    actions: Array<{
        id: string
        label: string
    }>
}



export default class OntologyBuild extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowNodeInfo: false,
            isShowNodeAction: false,
            isShowNodeActionInfo: false,
            isShowNodeLogicInfo: false,
            nodeCardPosition: { x: 0, y: 0 },
            selectedNodeData: null,
            activeAction: '',   
        };
        this.graphContainerRef = React.createRef();
        this.graphRef = React.createRef();
        window.xxxxx = this;

        register({
            shape: 'dag-node',
            width: 90,
            height: 90,
            component: this.AlgoNode,
            ports: {
                groups: {
                    top: {
                        position: 'top',
                        attrs: {
                            circle: {
                                r: 0,
                                magnet: true,
                                stroke: '#00FEE1',
                                strokeWidth: 1,
                                fill: '#00FEE1',
                            },
                        },
                    },
                    right: {
                        position: 'right',
                        attrs: {
                            circle: {
                                r: 0,
                                magnet: true,
                                stroke: '#00FEE1',
                                strokeWidth: 1,
                                fill: '#00FEE1',
                                visible: false,
                            },
                        },
                    },
                    bottom: {
                        position: 'bottom',
                        attrs: {
                            circle: {
                                r: 0,
                                magnet: true,
                                stroke: '#00FEE1',
                                strokeWidth: 1,
                                fill: '#00FEE1',
                                visible: false,
                            },
                        },
                    },
                    left: {
                        position: 'left',
                        attrs: {
                            circle: {
                                r: 0,
                                magnet: true,
                                stroke: '#00FEE1',
                                strokeWidth: 1,
                                fill: '#00FEE1',
                                visible: false,
                            },
                        },
                    },
                },
            },
        })

        Graph.registerEdge(
            'dag-edge',
            {
                inherit: 'edge',
                attrs: {
                    line: {
                        // stroke: '#C2C8D5',
                        stroke: 'url(#edge-gradient)',
                        strokeWidth: 1,
                        // targetMarker: 'classic',
                        // sourceMarker: 'classic',
                        targetMarker: { name: 'block', fill: 'rgba(69, 152, 255, 0.7)', stroke: 'rgba(69, 152, 255, 0.7)' },
                        // sourceMarker: { name: 'block', fill: 'rgba(255, 176, 150, 0.7)', stroke: 'rgba(255, 176, 150, 0.7)' },
                    },
                },
                defaultLabel: {
                    markup: Markup.getForeignObjectMarkup(),
                    autoSize: true, 
                    attrs: {
                        fo: {
                            width: 140,
                            height: 36,
                            x: 0,
                            y: 0,
                            transform: 'translate(-70, -17)'
                        },
                    },
                },
                label: {
                    position: 0.5,
                },
            },
            true,
        )
    }
    AlgoNode = (props) => {
        const { node } = props
        const data = node?.getData() as NodeStatus
        const { icon, label, status = 'default', isShowRing, type, isClick, actions } = data;
        return (
                <div
                    className={`node ${status}`}>
                    {
                        type === 'logic' 
                            ? <img
                                className="node-bg"
                                src={new URL(`./imgs/node-bg-rect${isClick ? '-active' : ''}.svg`, import.meta.url).href}/> 
                                : <>
                                    <img
                                        className="node-bg"
                                        src={new URL(`./imgs/node-bg${isClick ? '-active' : ''}.svg`, import.meta.url).href}/>
                                    <img
                                        className="node-icon"
                                        src={new URL(`./imgs/${iconMap[node.id] || iconMap['default']}.png`, import.meta.url).href}/>
                                    {(actions && actions.length) && <img
                                        className="node-mark"
                                        src={new URL("./imgs/node-mark-action.svg", import.meta.url).href}/>}
                                  </>
                    }
                    <div className={"label" + (type === 'logic' ? ' logic' : '')}>{label}</div>

                    {isShowRing ? <div className="node-ring">
                        <div className="node-ring-button node-ring-button-left" onClick={() => this.handleDetailClick(node)}>详情</div>
                        <div className="node-ring-button node-ring-button-right" onClick={() => this.handleActionClick(node)}>动作</div>
                    </div> : null}
                </div>
        )
    }
    addNode = (node) => {
        this.graphRef.current.addNode({
          "id": node.id,
          "x": 0,
          "y": 0,
          "data": {
            "label": node.label,
            ...node
          },
          "shape": "dag-node",
          "ports": [
            {
              "id": "1",
              "group": "top"
            },
            {
              "id": "2",
              "group": "right"
            },
            {
              "id": "3",
              "group": "bottom"
            },
            {
              "id": "4",
              "group": "left"
            }
          ]
        })
    }
    setEdgeData = (edge, data) => {
        edge.setLabels([
            {
                "position": 0.5,
                "data": data
            }
        ])
    }
    getEdgeData = (cell) => {
        const labels = cell.getLabels();
        if (Array.isArray(labels) && labels.length > 0) {
            return labels[0].data
        }
        return {}
    }
    setNodeData = (id, data) => {
        const node = this.graphRef.current.getCellById(id)
        node.setData({
            ...node.getData(),
            ...data
        })
    }
    getNodeData = (id) => {
        const node = this.graphRef.current.getCellById(id)
        return node.getData();
    }
    deleteEdge = (id) => {
        this.graphRef.current.removeEdge(this.graphRef.current.getCellById(id))
    }
    deleteNode = (id) => {
        this.graphRef.current.removeNode(this.graphRef.current.getCellById(id))
    }

    getNodePosition = (node) => {
        const nodeBBox = node.getBBox();
        const graph = this.graphRef.current;
        const containerRect = this.graphContainerRef.current.getBoundingClientRect();
        const graphScale = graph.scale();
        const graphTranslate = graph.translate();

        // 计算悬浮卡片的位置, 最外层元素有transform: scale(0.8)
        const nodeX = (nodeBBox.x + graphTranslate.tx) * graphScale.sx + containerRect.left / TransformScale;
        const nodeY = (nodeBBox.y + graphTranslate.ty) * graphScale.sy + containerRect.top / TransformScale;
        const nodeWidth = nodeBBox.width * graphScale.sx;
        const nodeHeight = nodeBBox.height * graphScale.sy;

        return {nodeX, nodeY, nodeWidth, nodeHeight}
    }

    handleDetailClick = (node) => {
        const {nodeX, nodeY, nodeHeight} = this.getNodePosition(node)

        const cardPosition = {
            ...this.getNodePosition(node),
            x: nodeX - 288 - 40 - 10,
            y: nodeY,
        };

        this.showDetail(node, cardPosition)
    }

    handleActionClick = (node) => {
        const {nodeX, nodeY, nodeHeight, nodeWidth} = this.getNodePosition(node)

        const cardPosition = {
            ...this.getNodePosition(node),
            x: nodeX + nodeWidth + 40 + 10,
            y: nodeY + nodeHeight / 2,
        };

        this.showActionInfo(node, cardPosition)
    }

    showDetail = (node, cardPosition) => {
        console.log('showDetail')
        const nodeData = node.getData();

        this.setState({
            isShowNodeAction: false,
            isShowNodeInfo: true,
            isShowNodeActionInfo: false,
            isShowNodeLogicInfo: false,
            nodeCardPosition: cardPosition,
            selectedNodeData: {
                ...nodeData,
                id: node.id,
                position: cardPosition
            }
        });
    }

    showLogicInfo = (node, cardPosition) => {
        const nodeData = node.getData();

        this.setState({
            isShowNodeAction: false,
            isShowNodeLogicInfo: true,
            isShowNodeActionInfo: false,
            isShowNodeInfo: false,
            nodeCardPosition: cardPosition,
            selectedNodeData: {
                ...nodeData,
                id: node.id,
                position: cardPosition
            }
        });
    }

    showActionInfo = (node, cardPosition) => { 
        const nodeData = node.getData();

        this.setState({
            isShowNodeAction: true,
            isShowNodeInfo: false,
            isShowNodeActionInfo: false,
            isShowNodeLogicInfo: false,
            nodeCardPosition: cardPosition,
            selectedNodeData: {
                ...node.getData(),
                id: node.id,
                position: cardPosition
            }
        });
    }

    // 处理节点点击事件
    handleNodeClick = (node, e, nodes = []) => {
        e?.stopPropagation();

        const {type, actions} = node.getData()
        
        nodes.forEach(n => {
            n.setData({
                ...n.getData(),  // 保留原有数据
                isShowRing: false,
                isClick: false
            });

            // 隐藏其他节点的端口
            if (n.id !== node.id) {
                n.prop('ports/groups/top/attrs/circle/r', 0);
                n.prop('ports/groups/bottom/attrs/circle/r', 0);
                n.prop('ports/groups/left/attrs/circle/r', 0);
                n.prop('ports/groups/right/attrs/circle/r', 0);
            }
        });

        // 使用 prop 方法设置端口配置
        node.prop('ports/groups/top/attrs/circle/r', 4);
        node.prop('ports/groups/bottom/attrs/circle/r', 4);
        node.prop('ports/groups/left/attrs/circle/r', 4);
        node.prop('ports/groups/right/attrs/circle/r', 4);

        node.setData({
            ...node.getData(),
            isShowRing: !!(actions && actions.length),
            isClick: true
        })

        if (type === 'logic') {
            const {nodeX, nodeY, nodeHeight, nodeWidth} = this.getNodePosition(node)

            const cardPosition = {
                ...this.getNodePosition(node),
                x: nodeX + nodeWidth + 30,
                y: nodeY,
            };

            this.showLogicInfo(node, cardPosition)

            return
        }

        if (!(actions && actions.length)) {
            const {nodeX, nodeY, nodeHeight, nodeWidth} = this.getNodePosition(node)

            const cardPosition = {
                ...this.getNodePosition(node),
                x: nodeX + nodeWidth + 30,
                y: nodeY,
            };

            this.showDetail(node, cardPosition)
        }
    };

    // 关闭悬浮卡片
    closeNodeCard = () => {
        this.setState({
            isShowNodeInfo: false,
            selectedNodeData: null
        });
    };

    closeNodeAction = () => {
        this.setState({
            isShowNodeAction: false,
            selectedNodeData: null
        });
    };

    closeNodeLogiInfo = () => {
        this.setState({
            isShowNodeLogicInfo: false,
            selectedNodeData: null
        });
    }

    initData = () => {
        const cells: Cell[] = []
        const graph = this.graphRef.current;
        mockData.forEach((item) => {
            if (item.shape === 'dag-node') {
                cells.push(graph.createNode(item))
            } else {
                cells.push(graph.createEdge(item))
            }
        })
        graph.resetCells(cells)
    }
    applyGradientToEdge = (edge) => {
        const sourcePoint = edge.getSourcePoint();
        const targetPoint = edge.getTargetPoint();
        
        // 创建一个基于边方向的渐变
        const gradientId = `edge-gradient-${edge.id}`;
        const svg = this.graphContainerRef.current.querySelector('svg');
        const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        if (!svg.querySelector('defs')) {
            svg.appendChild(defs);
        }
        
        // 移除旧的渐变定义（如果存在）
        const oldGradient = defs.querySelector(`#${gradientId}`);
        if (oldGradient) {
            oldGradient.remove();
        }
        
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        
        // 设置渐变方向从源点到目标点
        gradient.setAttribute('x1', targetPoint.x.toString());
        gradient.setAttribute('y1', targetPoint.y.toString());
        gradient.setAttribute('x2', sourcePoint.x.toString());
        gradient.setAttribute('y2', sourcePoint.y.toString());
        
        const colors = [
            { offset: '0%', color: '#4598FF' },
            { offset: '33%', color: '#983DFF' },
            { offset: '66%', color: '#EC7DFF' },
            { offset: '100%', color: '#FFB096' }
        ];
        
        colors.forEach(({ offset, color }) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', offset);
            stop.setAttribute('stop-color', color);
            gradient.appendChild(stop);
        });
        
        defs.appendChild(gradient);
        
        // 应用渐变到边
        edge.attr('line/stroke', `url(#${gradientId})`);
    };
    init = () => {
        const graph: Graph = new Graph({
            container: this.graphContainerRef.current,
            onEdgeLabelRendered: (args) => {
                const { edge, selectors, label } = args
                const content = selectors.foContent as HTMLDivElement
                let angle = 0;

                const sourcePos = edge.getSourcePoint();
                const targetPos = edge.getTargetPoint();
                const getAngle = () => {
                    const source = edge.getSourcePoint();
                    const target = edge.getTargetPoint();
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    return (Math.atan2(dy, dx) * 180) / Math.PI;
                };
                // if (sourcePos.x !== targetPos.x && sourcePos.y !== targetPos.y) {
                //     angle = getAngle();
                //     if (angle > 90) {
                //         angle = angle - 180
                //     }
                // }
                if (content) {
                  createRoot(content).render(<Label label={label} onMeasure={(width, height) => {
                    selectors.fo.setAttribute('width', width);
                    selectors.fo.setAttribute('transform', `translate(-${width / 2}, -${height / 2})`)
                    selectors.fo.style.transform = `rotate(${Math.floor(angle)}deg) translate(-${width / 2}px, -${height / 2}px)`
                  }}/>)
                }
            },
            panning: {
                enabled: true,
                eventTypes: ['leftMouseDown', 'mouseWheel'],
            },
            mousewheel: {
                enabled: true,
                modifiers: 'ctrl',
                factor: 1.1,
                maxScale: 1.5,
                minScale: 0.5,
            },
            highlighting: {
                magnetAdsorbed: {
                    name: 'stroke',
                    args: {
                        attrs: {
                            fill: '#fff',
                            stroke: '#31d0c6',
                            strokeWidth: 4,
                        },
                    },
                },
            },
            connecting: {
                snap: true,
                allowBlank: false,
                allowLoop: false,
                highlight: true,
                connectionPoint: 'anchor',
                anchor: 'center',
                validateMagnet({ magnet }) {
                    return magnet.getAttribute('port-group') !== 'top'
                },
                // createEdge() {
                //     return graph.createEdge({
                //         shape: 'dag-edge',
                //         attrs: {
                //             line: {
                //                 strokeDasharray: '5 5',
                //             },
                //         },
                //         zIndex: -1,
                //     })
                // },
            },
        })
        this.graphRef.current = graph;
        graph.use(
            new Selection({
                multiple: true,
                rubberEdge: true,
                rubberNode: true,
                modifiers: 'shift',
                rubberband: true,
            }),
        )

        // graph.on('edge:connected', ({ edge }) => {
        //     edge.attr({
        //         line: {
        //             strokeDasharray: '',
        //         },
        //     })
        // })

        graph.on('node:change:data', ({ node }) => {
            const edges = graph.getIncomingEdges(node)
            const { status } = node.getData() as NodeStatus
            edges?.forEach((edge) => {
                if (status === 'running') {
                    edge.attr('line/strokeDasharray', 5)
                    edge.attr('line/style/animation', 'running-line 30s infinite linear')
                } else {
                    edge.attr('line/strokeDasharray', '')
                    edge.attr('line/style/animation', '')
                }
            })
        })
        graph.on('edge:dblclick', ({ cell }) => {
            this.props.selectEdge(cell);
        })
        graph.on('node:dblclick', ({ node, e }) => {
            this.props.selectNode && this.props.selectNode(node);
        })

        // 添加节点单击事件监听器
        graph.on('node:click', ({ node, e }) => {
            this.closeNodeCard()
            this.closeNodeAction()
            this.closeNodeActionInfo()
            this.closeNodeLogiInfo()

            this.handleNodeClick(node, e, graph.getNodes());
        })

        graph.on('blank:click', () => {
            console.log('balank:click---')
            const nodes = graph.getNodes();
            nodes.forEach(n => {
                n.setData({
                    ...n.getData(),  // 保留原有数据
                    isShowRing: false,
                    isClick: false
                });

                n.prop('ports/groups/top/attrs/circle/r', 0);
                n.prop('ports/groups/bottom/attrs/circle/r', 0);
                n.prop('ports/groups/left/attrs/circle/r', 0);
                n.prop('ports/groups/right/attrs/circle/r', 0);
            });

            this.closeNodeCard()
            this.closeNodeAction()
            this.closeNodeActionInfo()
            this.closeNodeLogiInfo()

            console.log(nodes.map(node => ({...node.getPosition(), id: node.getData().id})))
        })

        // 添加节点拖拽事件监听器，拖拽时关闭卡片
        graph.on('node:change:position', ({ node }) => {
            this.closeNodeAction()
            this.closeNodeCard()
            this.closeNodeActionInfo()
        });

        // 初始化节点/边
        const initMockData = (data: Cell.Metadata[]) => {
            const cells: Cell[] = []
            data.forEach((item) => {
                if (item.shape === 'dag-node') {
                    cells.push(graph.createNode(item))
                } else {
                    cells.push(graph.createEdge(item))
                }
            })
            graph.resetCells(cells)
            setTimeout(() => {
                this.graphRef.current?.zoomToFit({
                    padding: 60,
                    maxScale: 1,
                    minScale: 0.2
                });
            }, 200);
        }


        // 显示节点状态
        const showNodeStatus = async (statusList: NodeStatus[][]) => {
            const status = statusList.shift()
            status?.forEach((item) => {
                const { id, status } = item
                const node = graph.getCellById(id)
                const data = node.getData() as NodeStatus
                node.setData({
                    ...data,
                    status,
                })
            })
            setTimeout(() => {
                showNodeStatus(statusList)
            }, 3000)
        }
        initMockData(mockData)
        // showNodeStatus(nodeStatusList)
        graph.centerContent()

        graph.getEdges().forEach((edge) => {
            this.applyGradientToEdge(edge)
        })

    }
    componentDidMount() {
        this.init()
    }

    // 渲染悬浮卡片组件
    renderNodeCard() {
        const { isShowNodeInfo, nodeCardPosition, selectedNodeData } = this.state;
        
        if (!isShowNodeInfo || !selectedNodeData) {
            return null;
        }

        const {x, y, nodeX, nodeY, nodeHeight, nodeWidth} = nodeCardPosition

        let nodeCardPositionX = x;
        let nodeCardPositionY = y;
        // 检查右侧边界
        if (nodeCardPositionX + 288 > window.innerWidth / TransformScale) {
            nodeCardPositionX = nodeX - 288 - 30;
        }

        // 检查底部边界
        if (nodeCardPositionY + 340 > window.innerHeight / TransformScale) {
            nodeCardPositionY = nodeY + nodeHeight - 340;
        }

        return (
            <div
                className="node-info-card"
                style={{
                    position: 'fixed',
                    left: nodeCardPositionX,
                    top: nodeCardPositionY,
                    zIndex: 1000,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="card-header">
                    <div className="card-header-left">
                        <div className='card-header-icon'>
                            <img height={16} src={new URL(`./imgs/${iconMap[selectedNodeData.id] || iconMap['default']}.png`, import.meta.url).href} alt="Node Icon" />
                        </div>
                        <h4>{selectedNodeData.label}</h4>
                    </div>
                    <button className="close-btn" onClick={this.closeNodeCard}>×</button>
                </div>
                <div className="card-content">
                    <div className="info-item">
                        <div className="label">中文名称:</div>
                        <div className="value">{selectedNodeData.label}</div>
                    </div>
                    <div className="info-item">
                        <div className="label">英文名称:</div>
                        <div className="value">ctc_marketing_scenario</div>
                    </div>
                    <div className="info-item">
                        <div className="label">描述:</div>
                        <div className="value">
                            公司生产的产品
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="label">属性:</div>
                        <div className="value tags">
                            <Tag color="cyan" bordered style={{color: "rgb(var(--cyan-6)", backgroundColor: 'rgba(0, 0, 0, 0)'}}>产品ID</Tag>
                            <Tag color="pinkpurple" bordered style={{color: "rgb(var(--pinkpurple-6)", backgroundColor: 'rgba(0, 0, 0, 0)'}}>产品名称</Tag>
                            <Tag color="orange" bordered style={{color: "rgb(var(--orange-6)", backgroundColor: 'rgba(0, 0, 0, 0)'}}>员工</Tag>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    closeNodeActionInfo() {
        this.setState({
            isShowNodeActionInfo: false,
            activeAction: ''
        });
    }

    renderNodeActionCard() {
        const { isShowNodeAction, nodeCardPosition, activeAction, isShowNodeActionInfo, selectedNodeData } = this.state;

        if (!isShowNodeAction) {
            return null;
        }

        const {x, y, nodeX, nodeY, nodeHeight, nodeWidth} = nodeCardPosition

        console.log(nodeCardPosition)

        // let nodeCardPositionX = x;
        // let nodeCardPositionY = y;
        let position = {
            left: x,
            top: y
        }
        let flexAlignItems = 'flex-start'
        let flexDirection = 'row'
        // 检查右侧边界
        if (x + 482 > window.innerWidth / TransformScale) {
            position.right = window.innerWidth / TransformScale - x + 10 + 170;
            flexDirection = 'row-reverse'
            delete position.left
        }

        // 检查底部边界
        if (y + 458 > window.innerHeight / TransformScale) {
            position.bottom = window.innerHeight / TransformScale - y;
            flexAlignItems = 'flex-end'
            delete position.top
        }

        const options = (selectedNodeData.actions ? selectedNodeData.actions.map(({label, id}) => ({
            value: id,
            label
        })) : []).concat([
            // { label: '动作名称2', value: '2' },
            // { label: '动作名称3', value: '3' },
        ])

        const handleItemClick = (value) => {
            this.setState({
                activeAction: value,
                isShowNodeActionInfo: true,
            });
        };

        return (
            <div 
                className="node-action-card" 
                style={{
                    position: 'fixed',
                    ...position,
                    // left: nodeCardPositionX,
                    // top: nodeCardPositionY,
                    zIndex: 1000,
                    alignItems: flexAlignItems,
                    flexDirection: flexDirection
                }}>
                <div className="node-action-card-list">
                    {
                        options.map((option) => (
                            <div 
                                className={`node-action-card-list-item ${option.value === activeAction ? 'active': ''}`}
                                onClick={() => handleItemClick(option.value)}>
                                {option.label}
                            </div>
                        ))
                    }
                </div>
                {isShowNodeActionInfo ? <div
                    className="node-info-card"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="card-header">
                        <div className="card-header-left">
                            <h4>异常天气预警</h4>
                        </div>
                        <button className="close-btn" onClick={() => this.closeNodeActionInfo()}>×</button>
                    </div>
                    <div className="card-content">
                        <div className="info-item">
                            <div className="label">中文名称:</div>
                            <div className="value">异常天气预警</div>
                        </div>
                        <div className="info-item">
                            <div className="label">英文名称:</div>
                            <div className="value">Abnormal weather warning</div>
                        </div>
                        <div className="info-item">
                            <div className="label">描述:</div>
                            <div className="value">
                                模拟未来某个时间，某个地区将发生异常天气，分析带来的影响
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="label">执行对象:</div>
                            <div className="value">
                                天气
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="label">输入:</div>
                            <div className="value">
                                异常天气类型
                                异常天气危害等级
                                异常天气发生时间
                                异常天气发生地点
                                异常天气持续时长
                            </div>
                        </div>
                    </div>
                </div> : null}
            </div>
        )
    }

    renderNodeLogicCard() {
        const { isShowNodeLogicInfo, nodeCardPosition } = this.state;

        if (!isShowNodeLogicInfo) {
            return null;
        }

        const {x, y, nodeX, nodeY, nodeHeight, nodeWidth} = nodeCardPosition

        let nodeCardPositionX = x;
        let nodeCardPositionY = y;
        // 检查右侧边界
        if (nodeCardPositionX + 288 > window.innerWidth / TransformScale) {
            nodeCardPositionX = nodeX - 288 - 30;
        }

        // 检查底部边界
        if (nodeCardPositionY + 458 > window.innerHeight / TransformScale) {
            nodeCardPositionY = nodeY + nodeHeight - 458;
        }


        return (
            <div
                className="node-info-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    left: nodeCardPositionX,
                    top: nodeCardPositionY,
                    zIndex: 1000,
                }}
            >
                <div className="card-header">
                    <div className="card-header-left">
                        <h4>异常天气预警</h4>
                    </div>
                    <button className="close-btn" onClick={() => this.closeNodeActionInfo()}>×</button>
                </div>
                <div className="card-content">
                    <div className="info-item">
                        <div className="label">中文名称:</div>
                        <div className="value">异常天气预警</div>
                    </div>
                    <div className="info-item">
                        <div className="label">英文名称:</div>
                        <div className="value">Abnormal weather warning</div>
                    </div>
                    <div className="info-item">
                        <div className="label">描述:</div>
                        <div className="value">
                            模拟未来某个时间，某个地区将发生异常天气，分析带来的影响
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="label">访问对象:</div>
                        <div className="value">
                            天气
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="label">输入:</div>
                        <div className="value">
                            异常天气类型
                            异常天气危害等级
                            异常天气发生时间
                            异常天气发生地点
                            异常天气持续时长
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    render() {
        return (
            
            <div
                className="flow-container"
                ref={this.graphContainerRef}>
                {this.renderNodeCard()}
                {this.renderNodeActionCard()}
                {this.renderNodeLogicCard()}
            </div>
        )
    }
}

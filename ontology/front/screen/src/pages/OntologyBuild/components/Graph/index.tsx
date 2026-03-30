import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Graph, Path, Cell, Markup } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { register } from '@antv/x6-react-shape';
import mockData from './data/mockData';
import './style/index.less';
import { Tag, Button, Form, Input } from '@arco-design/web-react';
import { createPortal } from 'react-dom';
import { IconCaretRight, IconFile } from '@arco-design/web-react/icon';
import { withTranslation } from 'react-i18next';

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
        }}
      >
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
            display: 'inline-block',
          }}
        >
          {this.props.label?.data?.text || '----'}
        </button>
      </div>
    );
  }
}

interface NodeStatus {
  id: string;
  icon: string;
  status: 'default' | 'success' | 'failed' | 'running';
  label?: string;
  isShowRing?: boolean;
  isHighlight?: boolean;
  type?: string;
  actions: Array<{
    id: string;
    label: string;
  }>;
  maskAngle?: number;
}

class OntologyGraph extends React.Component {
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
      rootElement: document.body,
      rootElementTransformScale: 1
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
    });

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
            targetMarker: {
              name: 'block',
              fill: 'rgba(69, 152, 255, 0.7)',
              stroke: 'rgba(69, 152, 255, 0.7)',
            },
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
              transform: 'translate(-70, -17)',
            },
          },
        },
        label: {
          position: 0.5,
        },
      },
      true,
    );
  }
  AlgoNode = props => {
    const { node } = props;
    const { t } = this.props
    const data = node?.getData() as NodeStatus;
    const { icon, label, status = 'default', isShowRing, type, isHighlight, actions, maskAngle } = data;
    return (
      <div className={`node ${status}`}>
        {type === 'logic' ? (
          <img
            className="node-bg"
            src={
              new URL(`./imgs/node-bg-rect${isHighlight ? '-active' : ''}.svg`, import.meta.url).href
            }
          />
        ) : (
          <>
            <img
              className="node-bg"
              src={new URL(`./imgs/node-bg${isHighlight ? '-active' : ''}.svg`, import.meta.url).href}
            />
            <img
              className="node-icon"
              src={
                new URL(`./imgs/${icon}`, import.meta.url)
                  .href
              }
            />
            {actions && actions.length && (
              <img
                className="node-mark"
                src={new URL('./imgs/node-mark-action.svg', import.meta.url).href}
              />
            )}

            <div className='node-mask-overlay' style={{
              background: `conic-gradient(transparent 0deg ${maskAngle || 360}deg, rgba(128, 128, 128, 0.4) 0deg 360deg)`
            }}></div>
          </>
        )}
        <div className={'label' + (type === 'logic' ? ' logic' : '')}>{label}</div>

        

        {isShowRing ? (
          <div className="node-ring">
            <div
              className="node-ring-button node-ring-button-left"
              onClick={() => this.handleDetailClick(node)}
              title={t("details")}
            >
              {/* {t("details")} */}
              <IconFile />
            </div>
            <div
              className="node-ring-button node-ring-button-right"
              onClick={() => this.handleActionClick(node)}
              title={t("actions")}
            >
              {/* {t("actions")} */}
              <IconCaretRight />
            </div>
          </div>
        ) : null}
      </div>
    );
  };
  addNode = node => {
    this.graphRef.current.addNode({
      id: node.id,
      x: 0,
      y: 0,
      data: {
        label: node.label,
        ...node,
      },
      shape: 'dag-node',
      ports: [
        {
          id: '1',
          group: 'top',
        },
        {
          id: '2',
          group: 'right',
        },
        {
          id: '3',
          group: 'bottom',
        },
        {
          id: '4',
          group: 'left',
        },
      ],
    });
  };
  setEdgeData = (edge, data) => {
    edge.setLabels([
      {
        position: 0.5,
        data: data,
      },
    ]);
  };
  getEdgeData = cell => {
    const labels = cell.getLabels();
    if (Array.isArray(labels) && labels.length > 0) {
      return labels[0].data;
    }
    return {};
  };
  setNodeData = (id, data) => {
    const node = this.graphRef.current.getCellById(id);
    node.setData({
      ...node.getData(),
      ...data,
    });
  };
  getNodeData = id => {
    const node = this.graphRef.current.getCellById(id);
    return node.getData();
  };
  deleteEdge = id => {
    this.graphRef.current.removeEdge(this.graphRef.current.getCellById(id));
  };
  deleteNode = id => {
    this.graphRef.current.removeNode(this.graphRef.current.getCellById(id));
  };

  getNodePosition = node => {
    const nodeBBox = node.getBBox();
    const graph = this.graphRef.current;
    const containerRect = this.graphContainerRef.current.getBoundingClientRect();
    const graphScale = graph.scale();
    const graphTranslate = graph.translate();

    // 计算悬浮卡片的位置, 最外层元素有transform: scale(0.8)
    const nodeX =
      (nodeBBox.x + graphTranslate.tx) * graphScale.sx + containerRect.left / this.state.rootElementTransformScale;
    const nodeY =
      (nodeBBox.y + graphTranslate.ty) * graphScale.sy + containerRect.top / this.state.rootElementTransformScale;
    const nodeWidth = nodeBBox.width * graphScale.sx;
    const nodeHeight = nodeBBox.height * graphScale.sy;

    console.log(nodeBBox, containerRect, graphScale, graphTranslate)

    return { nodeX, nodeY, nodeWidth, nodeHeight };
  };

  handleDetailClick = node => {
    const { nodeX, nodeY, nodeHeight } = this.getNodePosition(node);

    const cardPosition = {
      ...this.getNodePosition(node),
      x: nodeX - 288 - 40 - 10,
      y: nodeY,
    };

    this.showDetail(node, cardPosition);
  };

  handleActionClick = node => {
    const { nodeX, nodeY, nodeHeight, nodeWidth } = this.getNodePosition(node);

    const cardPosition = {
      ...this.getNodePosition(node),
      x: nodeX + nodeWidth + 40 + 10,
      y: nodeY + nodeHeight / 2,
    };

    this.showActionInfo(node, cardPosition);
  };

  showDetail = (node, cardPosition) => {
    console.log('showDetail');
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
        position: cardPosition,
      },
    });
  };

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
        position: cardPosition,
      },
    });
  };

  showActionInfo = (node, cardPosition) => {
    const nodeData = node.getData();

    this.setState({
      // isShowNodeAction: true,
      // isShowNodeActionInfo: false,
      isShowNodeActionInfo: true,
      isShowNodeInfo: false,
      isShowNodeLogicInfo: false,
      nodeCardPosition: cardPosition,
      selectedNodeData: {
        ...node.getData(),
        id: node.id,
        position: cardPosition,
      },
    });
  };

  // 处理节点点击事件
  handleNodeClick = (node, e, nodes = []) => {
    e?.stopPropagation();

    const { type, actions } = node.getData();

    this.clearNodesHighlight()

    // 使用 prop 方法设置端口配置
    node.prop('ports/groups/top/attrs/circle/r', 4);
    node.prop('ports/groups/bottom/attrs/circle/r', 4);
    node.prop('ports/groups/left/attrs/circle/r', 4);
    node.prop('ports/groups/right/attrs/circle/r', 4);

    node.setData({
      ...node.getData(),
      isShowRing: !!(actions && actions.length),
      isHighlight: true,
    });

    if (type === 'logic') {
      const { nodeX, nodeY, nodeHeight, nodeWidth } = this.getNodePosition(node);

      const cardPosition = {
        ...this.getNodePosition(node),
        x: nodeX + nodeWidth + 30,
        y: nodeY,
      };

      this.showLogicInfo(node, cardPosition);

      return;
    }

    if (!(actions && actions.length)) {
      const { nodeX, nodeY, nodeHeight, nodeWidth } = this.getNodePosition(node);

      const cardPosition = {
        ...this.getNodePosition(node),
        x: nodeX + nodeWidth + 30,
        y: nodeY,
      };

      this.showDetail(node, cardPosition);
    }
  };

  clearNodesHighlight = () => {
    const nodes = this.graphRef.current.getNodes();

    nodes.forEach(n => {
      n.setData({
        ...n.getData(), // 保留原有数据
        isShowRing: false,
        isHighlight: false,
      });

      // 隐藏其他节点的端口
      // if (n.id !== node.id) {
      n.prop('ports/groups/top/attrs/circle/r', 0);
      n.prop('ports/groups/bottom/attrs/circle/r', 0);
      n.prop('ports/groups/left/attrs/circle/r', 0);
      n.prop('ports/groups/right/attrs/circle/r', 0);
      // }
    });
  }

  // 关闭悬浮卡片
  closeNodeCard = () => {
    this.setState({
      isShowNodeInfo: false,
      selectedNodeData: null,
    });
  };

  closeNodeAction = () => {
    this.setState({
      isShowNodeAction: false,
      selectedNodeData: null,
    });
  };

  closeNodeActionInfo() {
    this.setState({
      isShowNodeActionInfo: false,
      activeAction: '',
    });
  }

  closeNodeLogicInfo = () => {
    this.setState({
      isShowNodeLogicInfo: false,
      selectedNodeData: null,
    });
  };

  initData = () => {
    const cells: Cell[] = [];
    const graph = this.graphRef.current;
    mockData[this.props.i18n.language].forEach(item => {
      if (item.shape === 'dag-node') {
        cells.push(graph.createNode(item));
      } else {
        cells.push(graph.createEdge(item));
      }
    });
    graph.resetCells(cells);

    graph.getEdges().forEach(edge => {
      this.applyGradientToEdge(edge);
    });
  };
  applyGradientToEdge = edge => {
    const sourcePoint = edge.getSourcePoint();
    const targetPoint = edge.getTargetPoint();

    // 创建一个基于边方向的渐变
    const gradientId = `edge-gradient-${edge.id}`;
    const svg = this.graphContainerRef.current.querySelector('svg');
    const defs =
      svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
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
      { offset: '100%', color: '#FFB096' },
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
    if (this.graphRef.current) {
      this.graphRef.current.dispose()
    }
    const graph: Graph = new Graph({
      container: this.graphContainerRef.current,
      onEdgeLabelRendered: args => {
        const { selectors, label } = args;
        const content = selectors.foContent as HTMLDivElement;
        let angle = 0;

        if (content) {
          createRoot(content).render(
            <Label
              label={label}
              onMeasure={(width, height) => {
                selectors.fo.setAttribute('width', width);
                selectors.fo.setAttribute('transform', `translate(-${width / 2}, -${height / 2})`);
                selectors.fo.style.transform = `rotate(${Math.floor(angle)}deg) translate(-${
                  width / 2
                }px, -${height / 2}px)`;
              }}
            />,
          );
        }
      },
      panning: {
        enabled: true,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      },
      transform: {
        scale: 0.8,
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
          return magnet.getAttribute('port-group') !== 'top';
        },
      },
    });

    this.graphRef.current = graph;

    graph.use(
      new Selection({
        multiple: true,
        rubberEdge: true,
        rubberNode: true,
        modifiers: 'shift',
        rubberband: true,
      }),
    );

    graph.on('node:change:data', ({ node }) => {
      const edges = graph.getIncomingEdges(node);
      const { status } = node.getData() as NodeStatus;
      edges?.forEach(edge => {
        if (status === 'running') {
          edge.attr('line/strokeDasharray', 5);
          edge.attr('line/style/animation', 'running-line 30s infinite linear');
        } else {
          edge.attr('line/strokeDasharray', '');
          edge.attr('line/style/animation', '');
        }
      });
    });
    graph.on('edge:dblclick', ({ cell }) => {
      this.props.selectEdge && this.props.selectEdge(cell);
    });
    graph.on('node:dblclick', ({ node, e }) => {
      this.props.selectNode && this.props.selectNode(node);
    });

    // 添加节点单击事件监听器
    graph.on('node:click', ({ node, e }) => {
      if (this.props.scene === 'build') {
        return
      }

      this.closeNodeCard();
      this.closeNodeAction();
      this.closeNodeActionInfo();
      this.closeNodeLogicInfo();

      this.handleNodeClick(node, e, graph.getNodes());
    });

    graph.on('blank:click', () => {
      console.log('balank:click---');
      
      this.clearNodesHighlight()

      this.closeNodeCard();
      this.closeNodeAction();
      this.closeNodeActionInfo();
      this.closeNodeLogicInfo();

      const nodes = graph.getNodes();
      console.log(nodes.map(node => ({ ...node.getPosition(), id: node.getData().id })));
    });

    // 添加节点拖拽事件监听器，拖拽时关闭卡片
    graph.on('node:change:position', ({ node }) => {
      this.closeNodeAction();
      this.closeNodeCard();
      this.closeNodeActionInfo();
    });

    // 初始化节点/边
    const initMockData = (data: Cell.Metadata[]) => {
      const cells: Cell[] = [];
      data.forEach(item => {
        if (item.shape === 'dag-node') {
          cells.push(graph.createNode(item));
        } else {
          cells.push(graph.createEdge(item));
        }
      });
      graph.resetCells(cells);
    };

    initMockData(mockData[this.props.i18n.language]);

    graph.centerContent();

    // 自适应缩放
    // graph.zoomToFit();

    this.props.scene === 'build' && graph.zoom(-0.2);

    graph.getEdges().forEach(edge => {
      this.applyGradientToEdge(edge);
    });
  };

  loadingNode = (nodes) => {
    return new Promise((resolve, reject) => {
      if (this.timer) {
        clearInterval(this.timer);
      }

      let angle = 0;

      // 启动定时查询
      this.timer = setInterval(() => {
        angle = angle + 1;

        // 更新节点数据，这将触发节点的重新渲染
        nodes.forEach(node => {
          // 更新节点数据，这将触发节点的重新渲染
          node.setData({
            ...node.getData(),
            maskAngle: angle
          });
        });

        console.log(angle);
        
        if (angle >= 360) {
          clearInterval(this.timer);
          this.timer = null;
          resolve({ success: true, message: '动画完成', finalAngle: angle });
        }
      }, 6);
    });
  }

  startInitData = async () => {
    try {
      this.initData();
      const allNodes = this.graphRef.current.getNodes();
      const res = await this.loadingNode(allNodes);

      return res;
    } catch (error) {
      return error;
    }
  };

  clearTimer() {
    this.timer && clearInterval(this.timer);
  }

  getScaleFromTransform(transformValue) {
    if (!transformValue || transformValue === 'none') {
      return 1; // 默认没有缩放时返回 1
    }

    // 匹配 scale(x) 或 scale(x,y)
    const scaleMatch = transformValue.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      const scaleValues = scaleMatch[1].split(',');
      if (scaleValues.length === 1) {
        return parseFloat(scaleValues[0]);
      } else {
        // 如果有 X 和 Y 方向的缩放，可以取平均值或只返回 X 轴缩放
        return parseFloat(scaleValues[0]);
      }
    }

    // 匹配 matrix(a, b, c, d, tx, ty) 形式的变换
    const matrixMatch = transformValue.match(/matrix\(([^)]+)\)/);
    if (matrixMatch) {
      const values = matrixMatch[1].split(',').map(val => parseFloat(val.trim()));
      if (values.length >= 4) {
        // 计算实际的 scaleX 和 scaleY
        const scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
        const scaleY = Math.sqrt(values[2] * values[2] + values[3] * values[3]);
        return scaleX; // 返回 X 轴缩放值
      }
    }

    return 1; // 默认值
  }

  getRootElement = () => {
    const rootElement = document.querySelector('.screen-content') || document.body;
    const rootElementTransformScale = this.getScaleFromTransform(rootElement.style.transform);

    console.log('rootElement', rootElement, rootElementTransformScale);
    this.setState({
      rootElement,
      rootElementTransformScale
    })

    return document.querySelector('.screen-content');
  }
  componentDidMount() {
    this.init();

    this.getRootElement()
    window.addEventListener('resize', this.getRootElement);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    window.removeEventListener('resize', this.getRootElement);
  }

  // 渲染悬浮卡片组件
  renderNodeCard() {
    const { isShowNodeInfo, nodeCardPosition, selectedNodeData, rootElementTransformScale, rootElement } = this.state;
    const {t} = this.props;

    if (!isShowNodeInfo || !selectedNodeData) {
      return null;
    }

    const { x, y, nodeX, nodeY, nodeHeight, nodeWidth } = nodeCardPosition;

    let nodeCardPositionX = x;
    let nodeCardPositionY = y;
    // 检查右侧边界
    if (nodeCardPositionX + 288 > window.innerWidth / rootElementTransformScale) {
      nodeCardPositionX = nodeX - 288 - 30;
    }

    // 检查底部边界
    if (nodeCardPositionY + 340 > window.innerHeight / rootElementTransformScale) {
      nodeCardPositionY = nodeY + nodeHeight - 340;
    }


    const {label, icon, name, desc, attrs} = selectedNodeData

    const colors = [ "cyan", "pinkpurple", "orange" ]

    const element = (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
      }}>
        <div
          className="node-info-card"
          style={{
            position: 'absolute',
            left: nodeCardPositionX,
            top: nodeCardPositionY,
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-header-icon">
                <img
                  height={16}
                  src={
                    new URL(
                      `./imgs/${icon}`,
                      import.meta.url,
                    ).href
                  }
                  alt="Node Icon"
                />
              </div>
              <h4>{label}</h4>
            </div>
            <button className="close-btn" onClick={() => {this.clearNodesHighlight();this.closeNodeCard()}}>
              ×
            </button>
          </div>
          <div className="card-content">
            <div className="info-item">
              <div className="label">{t("chinese.name")}:</div>
              <div className="value">{label}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("english.name")}:</div>
              <div className="value">{name}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("description")}:</div>
              <div className="value">{desc}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("attributes")}:</div>
              <div className="value tags">
                {
                  attrs.map((item, index) => (
                    <Tag
                      color={colors[index % colors.length]}
                      bordered
                      style={{ color: `rgb(var(--${colors[index % colors.length]}-6)`, backgroundColor: 'rgba(0, 0, 0, 0)' }}
                    >
                      {item.label}
                    </Tag>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(element, rootElement);
  }

  handleStartSimulate() {

    this.props.onBeforeSimulate && this.props.onBeforeSimulate();

    this.closeNodeCard();
    this.closeNodeAction();
    this.closeNodeActionInfo();
    this.closeNodeLogicInfo();

    console.log('handleStartSimulate')

    setTimeout(async () => {
      this.init();
      this.graphRef.current.zoom(-0.25);

      const runNodeIds = [["weather"], ["address"], ["road", "flight"], ["waybill"], ["order", "logistics_company"], ["Contract", "customer"]]

      for (const nodeId of runNodeIds) {

        const nodes = nodeId.map(id => this.graphRef.current.getCellById(id))

        nodes.forEach(node => {
          node.setData({
            ...node.getData(),
            isHighlight: false,
          })
        })

        await this.loadingNode(nodes)

        nodes.forEach(node => {
          node.setData({
            ...node.getData(),
            isHighlight: true,
          })
        })
      }

      this.props.onAfterSimulate && this.props.onAfterSimulate();
    }, 0);
  }

  renderNodeActionCard() {
    const {
      isShowNodeAction,
      nodeCardPosition,
      activeAction,
      isShowNodeActionInfo,
      selectedNodeData,
      rootElementTransformScale,
      rootElement
    } = this.state;
    const {t} = this.props;

    if (!isShowNodeAction) {
      return null;
    }

    const { x, y, nodeX, nodeY, nodeHeight, nodeWidth } = nodeCardPosition;

    console.log(nodeCardPosition);

    // let nodeCardPositionX = x;
    // let nodeCardPositionY = y;
    let position = {
      left: x,
      top: y,
    };
    let flexAlignItems = 'flex-start';
    let flexDirection = 'row';
    // 检查右侧边界
    if (x + 482 > window.innerWidth / rootElementTransformScale) {
      position.right = window.innerWidth / rootElementTransformScale - x + 10 + 170;
      flexDirection = 'row-reverse';
      delete position.left;
    }

    // 检查底部边界
    if (y + 458 > window.innerHeight / rootElementTransformScale) {
      position.bottom = window.innerHeight / rootElementTransformScale - y;
      flexAlignItems = 'flex-end';
      delete position.top;
    }

    const options = (
      selectedNodeData.actions
        ? selectedNodeData.actions.map(({ label, id }) => ({
            value: id,
            label,
          }))
        : []
    ).concat([
      // { label: '动作名称2', value: '2' },
      // { label: '动作名称3', value: '3' },
    ]);

    const handleItemClick = value => {
      this.setState({
        activeAction: value,
        isShowNodeActionInfo: true,
      });
    };

    const {label, name, input, desc} = selectedNodeData.actions.find(item => item.id === activeAction) || {}

    const scene = this.props.scene;

    const element = (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0.,
        width: "100%",
        zIndex: 1000,
      }}>
        <div
          className="node-action-card"
          style={{
            position: 'fixed',
            ...position,
            // left: nodeCardPositionX,
            // top: nodeCardPositionY,
            zIndex: 1000,
            alignItems: flexAlignItems,
            flexDirection: flexDirection,
          }}
        >
          <div className="node-action-card-list">
            {options.map(option => (
              <div
                className={`node-action-card-list-item ${
                  option.value === activeAction ? 'active' : ''
                }`}
                onClick={() => handleItemClick(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
          {isShowNodeActionInfo ? (
            <div className="node-info-card" onClick={e => e.stopPropagation()}>
              <div className="card-header">
                <div className="card-header-left">
                  <h4>{label}</h4>
                </div>
                <button className="close-btn" onClick={() => {this.clearNodesHighlight();this.closeNodeAction();this.closeNodeActionInfo()}}>
                  ×
                </button>
              </div>
              <div className="card-content">
                <div className="info-item">
                  <div className="label">{t("chinese.name")}:</div>
                  <div className="value">{name}</div>
                </div>
                <div className="info-item">
                  <div className="label">{t("english.name")}:</div>
                  <div className="value">{name}</div>
                </div>
                <div className="info-item">
                  <div className="label">{t("description")}:</div>
                  <div className="value">
                    {desc}
                  </div>
                </div>
                <div className="info-item">
                  <div className="label">{t("execute.object")}:</div>
                  <div className="value">{selectedNodeData.label}</div>
                </div>
                <div className="info-item">
                  <div className="label">{t("enter")}:</div>
                  <div className="value">
                    {scene === 'simulate' ? <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      {input.map(item => (
                        <div style={{display: 'flex', gap: '12px'}}>
                          <div>
                            {item.label}
                          </div>
                          <div style={{flex: '1', overflow: 'hidden'}}>
                            <Input size='mini' style={{height: "auto"}} defaultValue={item.defaultValue || ''} />
                          </div>
                        </div>
                      ))}
                    </div> : input.map(item => item.label).join('\n')}
                  </div>
                </div>
                {scene === 'simulate' && <div className="info-item">
                  <Button disabled={selectedNodeData.id !== 'weather'} onClick={() => {this.handleStartSimulate()}} style={{
                    color: "#fff",
                    background: "linear-gradient(125deg, #7121FF 9.29%, #FF7AF6 25.98%, #8642FF 49.13%, #983DFF 88.21%)"
                  }}><IconCaretRight />{this.props.t("simulation.execute")}</Button>
                </div>}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );

    return createPortal(element, rootElement);
  }

  renderNodeActionInfo() {
    const {
      nodeCardPosition,
      activeAction,
      isShowNodeActionInfo,
      selectedNodeData,
      rootElementTransformScale,
      rootElement
    } = this.state;

    const {t} = this.props;

    if (!isShowNodeActionInfo) {
      return null;
    }

    const { x, y, nodeX, nodeY, nodeHeight, nodeWidth } = nodeCardPosition;

    console.log(nodeCardPosition);

    let nodeCardPositionX = x;
    let nodeCardPositionY = y;
    // 检查右侧边界
    if (nodeCardPositionX + 288 > window.innerWidth / rootElementTransformScale) {
      nodeCardPositionX = nodeX - 288 - 30;
    }

    // 检查底部边界
    if (nodeCardPositionY + 500 > window.innerHeight / rootElementTransformScale) {
      nodeCardPositionY = nodeY + nodeHeight - 600;
    }

    const scene = this.props.scene;

    const {label, name, input, desc} = selectedNodeData.actions[0] || {}

    const element = (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0.,
        width: "100%",
        zIndex: 1000,
      }}>
        <div className="node-info-card" onClick={e => e.stopPropagation()} style={{
            position: 'absolute',
            left: nodeCardPositionX,
            top: nodeCardPositionY,
            zIndex: 1000,
          }}>
          <div className="card-header">
            <div className="card-header-left">
              <h4>{label}</h4>
            </div>
            <button className="close-btn" onClick={() => {this.clearNodesHighlight();this.closeNodeAction();this.closeNodeActionInfo()}}>
              ×
            </button>
          </div>
          <div className="card-content">
            <div className="info-item">
              <div className="label">{t("chinese.name")}:</div>
              <div className="value">{name}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("english.name")}:</div>
              <div className="value">{name}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("description")}:</div>
              <div className="value">
                {desc}
              </div>
            </div>
            <div className="info-item">
              <div className="label">{t("execute.object")}:</div>
              <div className="value">{selectedNodeData.label}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("enter")}:</div>
              <div className="value">
                {scene === 'simulate' ? <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {input.map(item => (
                    <div style={{display: 'flex', gap: '12px'}}>
                      <div>
                        {item.label}
                      </div>
                      <div style={{flex: '1', overflow: 'hidden'}}>
                        <Input size='mini' style={{height: "auto"}} defaultValue={item.defaultValue || ''} />
                      </div>
                    </div>
                  ))}
                </div> : input.map(item => item.label).join('\n')}
              </div>
            </div>
            {scene === 'simulate' && <div className="info-item">
              <Button disabled={selectedNodeData.id !== 'weather'} onClick={() => {this.handleStartSimulate()}} style={{
                color: "#fff",
                background: "linear-gradient(125deg, #7121FF 9.29%, #FF7AF6 25.98%, #8642FF 49.13%, #983DFF 88.21%)"
              }}><IconCaretRight />{this.props.t("simulation.execute")}</Button>
            </div>}
          </div>
        </div>
      </div>
    );

    return createPortal(element, rootElement);
  }

  renderNodeLogicCard() {
    const { isShowNodeLogicInfo, nodeCardPosition, selectedNodeData, rootElementTransformScale, rootElement } = this.state;
    const {t} = this.props;

    if (!isShowNodeLogicInfo) {
      return null;
    }

    const { x, y, nodeX, nodeY, nodeHeight, nodeWidth } = nodeCardPosition;

    let nodeCardPositionX = x;
    let nodeCardPositionY = y;
    // 检查右侧边界
    if (nodeCardPositionX + 288 > window.innerWidth / rootElementTransformScale) {
      nodeCardPositionX = nodeX - 288 - 30;
    }

    // 检查底部边界
    if (nodeCardPositionY + 416 > window.innerHeight / rootElementTransformScale) {
      nodeCardPositionY = nodeY + nodeHeight - 416;
    }

    const { label, name, desc, objectLabels } = selectedNodeData || {}

    const element = (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
      }}>
        <div
          className="node-info-card"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: nodeCardPositionX,
            top: nodeCardPositionY,
            zIndex: 1000,
          }}
        >
          <div className="card-header">
            <div className="card-header-left">
              <h4>{label}</h4>
            </div>
            <button className="close-btn" onClick={() => {this.clearNodesHighlight();this.closeNodeLogicInfo()}}>
              ×
            </button>
          </div>
          <div className="card-content">
            <div className="info-item">
              <div className="label">{t("chinese.name")}:</div>
              <div className="value">{label}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("english.name")}:</div>
              <div className="value">{name}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("description")}:</div>
              <div className="value">{desc}</div>
            </div>
            <div className="info-item">
              <div className="label">{t("access.object")}:</div>
              <div className="value">{objectLabels?.join('、')}</div>
            </div>
            {/* <div className="info-item">
              <div className="label">输入:</div>
              <div className="value">
                异常天气类型 异常天气危害等级 异常天气发生时间 异常天气发生地点 异常天气持续时长
              </div>
            </div>
            <div className="info-item">
              <div className="label">输出:</div>
              <div className="value">
                异常天气类型 异常天气危害等级 异常天气发生时间 异常天气发生地点 异常天气持续时长
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );

    return createPortal(element, rootElement);
  }

  render() {
    return (
      <div className="flow-container" ref={this.graphContainerRef}>
        {this.renderNodeCard()}
        {/* {this.renderNodeActionCard()} */}
        {this.renderNodeActionInfo()}
        {this.renderNodeLogicCard()}
      </div>
    );
  }
}

export default withTranslation()(OntologyGraph)

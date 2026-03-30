import React, { useState, useEffect, useMemo } from 'react'
import { Graph, ExtensionCategory, BaseEdge, register, BaseEdgeStyleProps } from '@antv/g6';
import i18n from '../../../../i18n';
import bgMap from './bg';
import iconMap from './icon';
import './style/index.less';

class PolylineEdge extends BaseEdge {
  // 计算边的方向角度
  calculateEdgeAngle(sourcePoint: number[], targetPoint: number[]): number {
    const dx = targetPoint[0] - sourcePoint[0];
    const dy = targetPoint[1] - sourcePoint[1];
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
  }

  // 获取折线路径
  getKeyPath(attributes: Required<BaseEdgeStyleProps>): (string | number)[][] {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes);

    if (sourcePoint[0] !== targetPoint[0] && sourcePoint[1] !== targetPoint[1]) {
      const midY = sourcePoint[1] + (targetPoint[1] - sourcePoint[1]) / 2;
      return [
        ['M', sourcePoint[0], sourcePoint[1]],
        ['L', sourcePoint[0], midY],
        ['L', targetPoint[0], midY],
        ['L', targetPoint[0], targetPoint[1]],
      ];
    } else {
      return [
        ['M', sourcePoint[0], sourcePoint[1]],
        ['L', targetPoint[0], targetPoint[1]],
      ];
    }
  }

  // 关键样式定义（G6 v5+ 新增）
  getKeyStyle(attributes: Required<BaseEdgeStyleProps>) {
    // 获取端点坐标
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes);
    const edgeAngle = this.calculateEdgeAngle(sourcePoint, targetPoint);
    const gradientAngle = (edgeAngle === 90 || edgeAngle === 270) ? 90 : edgeAngle;
    const gradient = `l(${gradientAngle}) 0:rgba(69, 152, 255, 1) 0.33:rgba(152, 61, 255, 1) 0.66:rgba(236, 125, 255, 1) 1:rgba(255, 176, 150, 1)`;

    return {
      ...super.getKeyStyle(attributes),
      stroke: gradient,
      lineWidth: 1,
      endArrow: {
        ...attributes.endArrow,
        fill: gradient,   // 箭头与边线一致的彩色渐变
        stroke: gradient
      }
    };
  }
}

register(ExtensionCategory.EDGE, 'custom-polyline', PolylineEdge);

export default class ChatFlow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.graphRef = React.createRef();
        this.flowContainerRef = React.createRef();
    }
    init = () => {
        const isEn = (i18n.language || '').startsWith('en');
        const graph = new Graph({
            container: this.flowContainerRef.current,
            data: {
                nodes: [],
                edges: []
            },
            
            node: {
                type: 'html',
                style: {
                    size: [90, 90],
                    dx: 0,
                    dy: 0,
                    innerHTML: (d) => {
                        const {
                            data: { label, selected },
                        } = d;
                        const state = selected ? 'selected' : 'inactive';
                        const textClass = `chat-flow-node-text ${isEn ? 'chat-flow-node-text-en' : ''}`;
                        return `
                            <div
                                class="chat-flow-node ${(d.states || []).join(' ')}">
                                <div
                                    class="chat-flow-node-bg">
                                    ${bgMap['out']}
                                    ${bgMap[state] || bgMap['inactive']}

                                </div>
                                <div
                                    class="chat-flow-node-icon">
                                    ${iconMap[label] || iconMap['产品']}
                                </div>
                                <div
                                    class="${textClass}">
                                    ${label}
                                </div>
                            </div>
                        `;
                    },
                    portR: 0,
                    ports: [{ placement: 'top' }, { placement: 'bottom' }]
                },
            },
            edge: {
                type: 'custom-polyline',
                style: {
                  router: {
                    type: 'orth',
                  },
                  endArrow: true,
                  endArrowType: 'triangle',
                  endArrowSize: 4
                },
              },
            layout: {
            // type: 'antv-dagre',
          },
            behaviors: [
                {
                    type: 'click-select',
                    degree: 1,
                    state: 'selected',
                    neighborState: 'active',
                    unselectedState: 'inactive',
                }
            ],
        });
        this.graphRef.current = graph;
        this.staggerTimerIds = [];
        this.initData(undefined, { animate: this.props.animate });
        graph.render();
    }
    clearStaggerTimers = () => {
        if (this.staggerTimerIds) {
            this.staggerTimerIds.forEach(id => clearTimeout(id));
            this.staggerTimerIds = [];
        }
    }
    initData = (data, options = {}) => {
        const { animate = true } = options;
        const fullData = data || this.props.data;
        if (!fullData || !this.graphRef.current || this.graphRef.current.destroyed) return;
        window.xxx = this;
        this.clearStaggerTimers();
        const nodes = fullData.nodes || [];
        const edges = fullData.edges || [];
        if (nodes.length === 0) {
            this.graphRef.current.setData({ nodes: [], edges: [] });
            this.graphRef.current.render();
            return;
        }
        const interval = 1800; // 每 2 秒出一个节点
        if (!animate || nodes.length <= 1) {
            // 不播放动画时，直接展示全部节点，最后一个节点设为 selected
            const dataToSet = {
                nodes: nodes.map((n, i) => ({ ...n, data: { ...n.data, selected: i === nodes.length - 1 } })),
                edges
            };
            this.graphRef.current.setData(dataToSet);
            this.graphRef.current.render();
            return;
        }
        const graph = this.graphRef.current;
        // 先清空图，再逐个节点出场
        graph.setData({ nodes: [], edges: [] });
        graph.render();
        for (let k = 0; k < nodes.length; k++) {
            const timerId = setTimeout(() => {
                const visibleNodes = nodes.slice(0, k + 1).map((node, i) => ({
                    ...node,
                    data: { ...node.data, selected: i === k }
                }));
                const visibleIds = new Set(visibleNodes.map(n => n.id));
                const visibleEdges = edges.filter(
                    e => visibleIds.has(e.source) && visibleIds.has(e.target)
                );
                graph.setData({ nodes: visibleNodes, edges: visibleEdges });
                graph.render();
            }, (k) * interval);
            this.staggerTimerIds.push(timerId);
        }
    }
    select = (labels) => {
        let inFlow = false;
        this.props.data.nodes.forEach(node => {
            if (labels.indexOf(node.data.label) > -1) {
                inFlow = true;
            }
        })
        if (!inFlow) {
            return;
        }
        console.log(labels[0]);
        this.initData({
            nodes: this.props.data.nodes.map(node => {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        selected: labels.indexOf(node.data.label) > -1
                    }
                }
            }),
            edges: this.props.data.edges
        }, { animate: false });
    }
    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data || prevProps.animate !== this.props.animate) {
            this.initData(undefined, { animate: this.props.animate });
        }
    }
    componentWillUnmount() {
        this.clearStaggerTimers();
        if (this.graphRef.current && !this.graphRef.current.destroyed) {
            this.graphRef.current.destroy();
            this.graphRef.current = null;
        }
    }
    componentDidMount() {
        this.init()
    }
    render() {
        return (
            <div
                ref={this.flowContainerRef}
                className="chat-flow"
                style={{
                    width: '100%',
                    height: '100%'
                }}>
            </div>
        )
    }
}
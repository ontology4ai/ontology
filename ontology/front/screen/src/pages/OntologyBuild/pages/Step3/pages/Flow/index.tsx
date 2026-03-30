import React, { useState, useEffect, useMemo } from 'react'
import { Graph, ExtensionCategory, BaseEdge, register } from '@antv/g6';
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
    // 计算角度
    const edgeAngle = this.calculateEdgeAngle(sourcePoint, targetPoint);
    let color = '#C4B1FF';
    if (edgeAngle !== 90) {
        color = `l(${edgeAngle}) 0:#6169FF 1:#C4B1FF`;
    }

    return {
      ...super.getKeyStyle(attributes),
      stroke: color,
      lineWidth: 1,
      endArrow: {
        ...attributes.endArrow,
        fill: '#C4B1FF', // 箭头使用渐变终点颜色
        stroke: '#C4B1FF'
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
        this.flowContainerRef = React.createRef();
    }
    init = () => {
        const graph = new Graph({
            container: this.flowContainerRef.current,
            data: {
                nodes: [
                    { id: 'node-1', data: { label: '航线' }, style: { x: 55, y: 50 } },
                    { id: 'node-2', data: { label: '公路' }, style: { x: 205, y: 50 } },
                    { id: 'node-3', data: { label: '货运单' }, style: { x: 130, y: 150 } },
                    { id: 'node-4', data: { label: '产品' }, style: { x: 55, y: 250 } },
                    { id: 'node-5', data: { label: '物流公司' }, style: { x: 205, y: 250 } },
                    { id: 'node-6', data: { label: '订单' }, style: { x: 55, y: 350 } },
                    { id: 'node-7', data: { label: '物流合同' }, style: { x: 205, y: 350 } },
                    { id: 'node-8', data: { label: '客户' }, style: { x: 55, y: 450 } },
                    { id: 'node-9', data: { label: '销售合同' }, style: { x: 55, y: 550 } },
                    /*{ id: 'node-1', data: { label: '航线' } },
                    { id: 'node-2', data: { label: '公路' } },
                    { id: 'node-3', data: { label: '货运单' } },
                    { id: 'node-4', data: { label: '产品' } },
                    { id: 'node-5', data: { label: '物流公司' } },
                    { id: 'node-6', data: { label: '订单' } },
                    { id: 'node-7', data: { label: '物流合同' } },
                    { id: 'node-8', data: { label: '客户' } },
                    { id: 'node-9', data: { label: '销售合同' } },*/
                ],
                edges: [
                    { source: 'node-1', target: 'node-3' },
                    { source: 'node-2', target: 'node-3' },
                    { source: 'node-3', target: 'node-4' },
                    { source: 'node-3', target: 'node-5' },
                    { source: 'node-4', target: 'node-6' },
                    { source: 'node-5', target: 'node-7' },
                    { source: 'node-6', target: 'node-8' },
                    { source: 'node-8', target: 'node-9' }
                ]
            },
            
            node: {
                type: 'html',
                style: {
                    size: [60, 60],
                    dx: 0,
                    dy: 0,
                    innerHTML: (d) => {
                        const {
                            data: { label },
                        } = d;
                        const state = (d.states || ['inactive'])[0];
                        return `
                            <div
                                class="chat-flow-node ${(d.states || []).join(' ')}">
                                <div
                                    class="chat-flow-node-bg">
                                    ${bgMap[state] || bgMap['inactive']}
                                </div>
                                <div
                                    class="chat-flow-node-icon">
                                    ${iconMap[label]}
                                </div>
                                <div
                                    class="chat-flow-node-text">
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

        graph.render();
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
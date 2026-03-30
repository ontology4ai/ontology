import React, { useState, useEffect, useMemo } from 'react'
import { Chart } from '@antv/g2';

class Line extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.chartRef = React.createRef()
    }
    init = () => {
      const data = [
        { a: '影响客户', b: '广州A基站', c: 80000 },
        { a: '影响客户', b: '广州B基站', c: 81000 },
        { a: '影响客户', b: '广州C基站', c: 83000 },
        { a: '影响客户', b: '深圳D基站', c: 81000 },
        { a: '影响客户', b: '深圳E基站', c: 85000 },
        { a: '影响客户', b: '深圳F基站', c: 87000 },
        { a: '预计投诉', b: '广州A基站', c: 20000 },
        { a: '预计投诉', b: '广州B基站', c: 27000 },
        { a: '预计投诉', b: '广州C基站', c: 26000 },
        { a: '预计投诉', b: '深圳D基站', c: 20000 },
        { a: '预计投诉', b: '深圳E基站', c: 22000 },
        { a: '预计投诉', b: '深圳F基站', c: 28000 },
        { a: '预计违约损失(元)', b: '广州A基站', c: 50000 },
        { a: '预计违约损失(元)', b: '广州B基站', c: 51000 },
        { a: '预计违约损失(元)', b: '广州C基站', c: 52000 },
        { a: '预计违约损失(元)', b: '深圳D基站', c: 56000 },
        { a: '预计违约损失(元)', b: '深圳E基站', c: 51000 },
        { a: '预计违约损失(元)', b: '深圳F基站', c: 50500 },
      ];

      const chart = new Chart({
        container: this.chartRef.current,
        autoFit: true,
        /*interaction: {
          elementSelectByColor: {
            single: true
          },
        }*/
      });

      chart.data(data)

      chart
        .area()
        .encode('x', 'b')
        .encode('y', 'c')
        .encode('color', 'a')
        .encode('shape', 'smooth')
        .tooltip(false)
        .axis({
          x: {
            title: '',
            tick: false,
            labelFill: 'rgba(172, 180, 192, 1)',
            labelTransform: 'rotate(-45)',
            labelFontSize: 14
          },
          y: {
            title: '',
            tick: false,
            gridLineDash: [],
            gridStroke: 'rgba(83, 92, 143, 1)',
            gridLineWidth: 1,
            gridStrokeOpacity: 1,
            labelFill: 'rgba(172, 180, 192, 1)',
            labelFontSize: 12
          }
        })
        .style('cursor', 'pointer')
        .style('fill', (a, b, c) => {
          if (a[0].a === '影响客户') {
            return 'l(90) 0:rgba(59, 130, 255, 0.8) 1:rgba(59, 130, 255, 0)'
          }
          if (a[0].a === '预计投诉') {
            return 'l(90) 0:rgba(37, 227, 255, 0.8) 1:rgba(37, 227, 255, 0)'
          }
          return 'l(90) 0:rgba(223, 35, 254, 0.8) 1:rgba(223, 35, 254, 0)'

        })
        .style('fillOpacity', 0.2)
        .state({
          selected: {
            fillOpacity: 1,
            lineOpacity: 0
          }
        })
        .legend('color', {
          position: 'bottom',
          layout: {
            justifyContent: 'center'
          },
          itemLabelFontSize: 14,
          itemLabelFill: 'rgba(172, 180, 192, 1)'
        })
        .scale('color', {
          type: 'ordinal',
          range: ['rgba(59, 130, 255, 1)', 'rgba(37, 227, 255, 1)', 'rgba(223, 35, 254, 1)'],
        });

      chart
        .line()
        .encode('shape', 'smooth')
        .encode('x', 'b')
        .encode('y', 'c')
        .encode('color', 'a')
        .style('lineWidth', 4)
        .tooltip(false)
        .scale('color', {
          type: 'ordinal',
          range: ['rgba(59, 130, 255, 1)', 'rgba(37, 227, 255, 1)', 'rgba(223, 35, 254, 1)'],
        });

      chart.render();
    }
    componentDidMount() {
        this.init()
    }
    render() {
        const {
        } = this.state;
        return (
            <div
                style={{
                  height: '400px'
                }}
                ref={this.chartRef}>
            </div>
        )
    }
}

export default Line;

import React, { useState, useEffect, useMemo } from 'react'
import { Chart } from '@antv/g2';

class Pie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.chartRef = React.createRef()
    }
    init = () => {
      const data = [
        { item: '通信和网络质量', count: 16531, percent: 0.95 },
        { item: '产品质量', count: 23, percent: 0.12 },
        { item: '业务营销', count: 11, percent: 0.03 },
        { item: '其他', count: 0, percent: 0 }
      ];
      const colors = ['rgba(59, 130, 255, 1)', 'rgba(255, 194, 83, 1)', 'rgba(37, 223, 251, 1)', 'rgba(223, 35, 254, 1)'];
      const chart = new Chart({
        container: this.chartRef.current,
        autoFit: true,
      });
      chart.options({
        tooltip: false
      })

      chart.coordinate({ type: 'theta', outerRadius: 0.8, innerRadius: 0.5 });

      chart
        .interval()
        .data(data)
        .transform({ type: 'stackY' })
        .tooltip(false)
        .encode('y', 'percent')
        .encode('color', 'item')
        .style('cursor', 'pointer')
        .legend('color', {
          position: 'bottom',
          layout: {
            justifyContent: 'center'
          },
          itemValueFill: (a, b, c) => {
            return colors[b]
          },
          itemLabelText: (a, b, c) => {
            return data[b].item + ' ' + (data[b].percent * 100) + '%'
          },
          // itemValueFontSize: 14,
          // itemLabelFontSize: 14,
          itemLabelFill: 'rgba(172, 180, 192, 1)',
          // itemSpacing: [8, 0, 0],
          // itemSpan: [1,0,0],
          // colPadding: 0
          //itemMarkerFill: 'rgba(145, 111, 245, 1)'
        })
        .label({
          text: '',
        })
        .scale('color', {
          type: 'ordinal',
          range: colors,
        });

      chart
        .text()
        .style('text', '投诉数量分布')
        // Relative position
        .style('x', '50%')
        .style('y', '50%')
        .style('dy', 0)
        .style('fontSize', 16)
        .style('fill', 'rgba(206, 207, 255, 1)')
        .style('textAlign', 'center');

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
                  height: '300px'
                }}
                ref={this.chartRef}>
            </div>
        )
    }
}

export default Pie;

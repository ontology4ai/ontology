import React, { useState, useEffect, useMemo } from 'react'
import { Chart } from '@antv/g2';

class Bar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.chartRef = React.createRef()
    }
    init = () => {
        const chart = new Chart({
          container: this.chartRef.current,
          autoFit: true,
          
        });
        chart.options({
          interaction: {
            elementSelectByX: {
              link: true,
              single: true
            },
          },
        })
        chart
          .interval()
          .data([
            { a: '意向客户数', name: '免停机服务&话…', value: 45000 },
            { a: '意向客户数', name: '定向流量包/通用…', value: 35000 },
            { a: '意向客户数', name: '亲情网升级/视频…', value: 61000 },
            { a: '意向客户数', name: '千兆宽带体验包/…', value: 45000 },
            { a: '意向客户数', name: '移动高清/咪咕…', value: 35000 },
            { a: '意向客户数', name: '云空间/和飞信…', value: 61000 },
            { a: '意向客户数', name: '企业宽带保障…', value: 61000 },
          ])
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
          .state({
            selected: {
              radius: 15,
              fill: 'l(90) 0:#1F4AFE 1:#DE23FE'
            }
          })
          .tooltip(false)
          .legend('color', {
            position: 'bottom',
            layout: {
              justifyContent: 'center'
            },
            itemLabelFontSize: 14,
            itemLabelFill: 'rgba(172, 180, 192, 1)',
            itemMarkerFill: 'rgba(145, 111, 245, 1)'
          })
          .encode('x', 'name')
          .encode('y', 'value')
          .encode('color', 'a')
          .encode('size', 30)
          .style('cursor', 'pointer')
          .style('radiusTopLeft', 15)
          .style('radiusTopRight', 15)
          .style('radiusBottomRight', 0)
          .style('radiusBottomLeft', 0)
          .style('fill', 'l(90) 0:rgba(145, 111, 245, 1) 1:rgba(46, 50, 99, 0.40)')
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

export default Bar;

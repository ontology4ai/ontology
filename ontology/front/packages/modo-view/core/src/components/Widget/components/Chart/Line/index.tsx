import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import wrapHOC from '../../../hoc/wrap';
import { Spin } from '@arco-design/web-react';
import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';
import { Empty } from '@arco-design/web-react';
import getVal from 'packages/modo-view/core/src/utils/getVal';

import * as echarts from 'echarts';

class ModoLine extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            size: {
                height: '100%',
                width: '100%'
            },
            empty: true,
            loading: false,
            origin: null
        };
        this.chart = null;
        this.options = null;
    }
    initSerie(serie) {
        return {
            type: 'line',
            name: serie.alias,
            data: serie.data,
            smooth: true,
            showSymbol: false,
            lineStyle: {
                width: serie.line.width,
                color: serie.line.color
            },
            stack: serie.stack || undefined,
            areaStyle: serie.areaColorArgs ? {
                opacity: 0.8,
                color: new echarts.graphic.LinearGradient(...serie.areaColorArgs)
            } : undefined,
            emphasis: {
                focus: 'series'
            }
        }
    }
    initOption() {
        let {
            chartTooltip,
            xAxis,
            yAxis,
            grid,
            series,
            meta,
            yField,
            legend
        } = this.props;
        xAxis = xAxis || {};
        yAxis = yAxis || {};
        grid = grid || {};
        chartTooltip = chartTooltip || {};
        const xAxisLabel = (xAxis && xAxis.axisLabel) || {};
        const xAxisLine = (xAxis && xAxis.axisLine) || {};
        const xSplitLine = (xAxis && xAxis.splitLine) || {};
        const xAxisTick = (xAxis && xAxis.axisTick) || {};

        const yAxisLabel = (yAxis && yAxis.axisLabel) || {};
        const yAxisLine = (yAxis && yAxis.axisLine) || {};
        const ySplitLine = (yAxis && yAxis.splitLine) || {};
        const yAxisTick = (yAxis && yAxis.axisTick) || {};

        this.option = {
            gradientColor: [
                '#14C9C9',
                '#3491FA',
                '#165DFF',
                '#722ED1'
            ],
            visualMap: [
                {
                    show: false,
                    type: 'continuous',
                    dimension: 0,
                    min: 0,
                    max: 0
                }
            ],
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: false,
                show: getVal(xAxis.show,  true),
                axisLabel: {
                    show: getVal(xAxisLabel.show, true),
                    color: getVal(xAxisLabel.color, '#4E5969'),
                    interval: getVal(xAxisLabel.interval, 0),
                    rotate: getVal(xAxisLabel.rotate, -20),
                    fontSize: getVal(xAxisLabel.fontSize, 10),
                    formatter: getVal(xAxisLabel.formatter, '{value}')
                },
                axisTick: {
                    show: getVal(xAxisTick.show, false)
                },
                axisLine: {
                    show: getVal(xAxisLine.show, false)
                },
                splitLine: {
                    show: getVal(xSplitLine.show, true),
                    lineStyle: {
                        color: ['#F2F3F5']
                    }
                },
                z: 1
            },
            yAxis: {
                type: 'value',
                show: getVal(yAxis.show, true),
                axisLabel: {
                    show: getVal(yAxisLabel.show, true),
                    color: '#4E5969',
                    fontSize: 10,
                    formatter: getVal(yAxisLabel.formatter, '{value}')
                },
                axisTick: {
                    show:  getVal(yAxisTick.show,  false)
                },
                axisLine: {
                    show:  getVal(yAxisLine.show, false)
                },
                splitLine: {
                    show:  getVal(ySplitLine.show, true),
                    lineStyle: {
                        color: ['#F2F3F5']
                    }
                }
            },
            grid: {
                left: getVal(grid.left, 20),
                top: getVal(grid.top, 10),
                right: getVal(grid.right, 10),
                bottom: getVal(grid.bottom, 26)
            },
            tooltip: {
                trigger: 'axis',
                // appendToBody: true,
                className: chartTooltip.className,
                valueFormatter: getVal(chartTooltip.valueFormatter, undefined),
                formatter: getVal(chartTooltip.formatter, undefined)
            },
            legend: legend || {
                show: false
            },
            series: Array.isArray(series) && series.length > 0 ? series.map(serie => {
                return this.initSerie(serie);
            }): [
                {
                    type: 'line',
                    name: meta[yField] ? (meta[yField].alias || yField) : yField,
                    data: [],
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 2,
                        color: '#165DFF'
                    },
                    stack: 'Total',
                    areaStyle: {
                        opacity: 0.8,
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 0,
                                color: 'rgba(22,93,255,0.1000)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(22,93,255,0)'
                            }
                        ])
                    },
                    emphasis: {
                        focus: 'series'
                    }
                }
            ]
        };
    }
    initData = (data) => {
        const currentData = this.props.store ? data : this.props.data;
        if (Array.isArray(currentData)) {
            this.option.xAxis.data = currentData.map(item => {
                return item[this.props.xField];
            });
            if (Array.isArray(this.props.series) && this.props.series.length > 0) {
                this.props.series.forEach((serie, index) => {
                    this.option.series[index].data = currentData.map(item => {
                        return item[serie.name];
                    });
                });
            } else {
                this.option.series[0].data = currentData.map(item => {
                    return item[this.props.yField];
                });
            }
            this.option.visualMap[0].max = currentData.length - 1;
        }

        this.setState({
            empty: this.option.xAxis.data.length === 0 && this.option.series[0].data.length === 0
        });
    };
    initStoreData = () => {
        const chartStore = this.props.stores.find(store => {
            return store.id === this.props.store;
        });
        if (chartStore) {
            const chartData = this.props.get$this()[chartStore.name + 'Store'];
            if (chartData) {
                this.initData(chartData.root);
                this.setState({
                    loading: chartData.loading,
                    origin: chartData
                });
                return true
            }
        }
    };
    parseStoreData = () => {
        const init = this.initStoreData();
        if (init) {
            this.chart.setOption(this.option, true);
            this.afterRefresh();
        }
    };
    diffStoreData = (prevProps, prevState) => {
        if (this.props.store && prevProps.store && this.props.store === prevProps.store) {
            const chartStore = this.props.stores.find(store => {
                return store.id === this.props.store;
            });
            if (chartStore) {
                const chartData = this.props.get$this()[chartStore.name + 'Store'];
                const prevChartData = this.state.origin;
                if (chartData) {
                    if (prevChartData) {
                        if (!_.isEqual(chartData, prevChartData)) {
                            this.parseStoreData();
                        }
                    } else {
                        this.parseStoreData();
                    }
                }
            }

        }
        if (this.props.store !== prevProps.store) {
            this.parseStoreData();
        }
    };
    afterRefresh() {
        typeof this.props.afterRefresh === 'function' && this.props.afterRefresh(this.chart);
    }
    componentDidMount() {
        this.chart = echarts.init(this.refs.chartRef);
        let option: EChartsOption;

        this.initOption();
        if (this.props.store) {
            this.initStoreData();
        } else {
            this.initData();
        }

        this.chart.setOption(this.option);
        this.afterRefresh();
    }
    componentDidUpdate(prevProps, prevState) {
        if (!_.isEqual(prevProps.data, this.props.data) && this.option) {
            if (this.props.store) {
                this.initStoreData();
            } else {
                this.initData();
            }
            this.chart.setOption(this.option, true);
            this.afterRefresh();
        }
        this.diffStoreData(prevProps, prevState);
        let change = false;
        [
            'xField',
            'yField',
            'xAxis',
            'yAxis',
            'meta',
            'series',
            'grid',
            'chartTooltip'
        ].forEach(key => {
            if (!_.isEqual(this.props[key], prevProps[key])) {
                change = true;
            }
        });
        if (change && this.chart) {
            this.initOption();
            if (this.props.store) {
                this.initStoreData();
            } else {
                this.initData();
            }
            this.chart.setOption(this.option, true);
            this.afterRefresh();
        }
        if (prevState.empty !== this.state.empty) {
            this.chart && this.chart.resize();
        }
    }
    render() {
        if (window.abc) {
            console.log('render-line');
        }
        const {
            width,
            height
        } = this.state.size;

        const {
            onMouseLeave,
            onMouseOver,
            onClick,
        } = this.props;

        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            children,
            headersBindVar,
            options,
            props,
            value,
            style,
            className,
            ...rest
        } = this.props;

        let {
            loading,
            loadingTip
        } = this.props;
        if (this.props.store) {
            loading = this.state.loading;
            loadingTip = undefined;
        }

        return (
            <ResizeObserver
                onResize={(e) => {
                    this.chart && this.chart.resize();
                }}>
                <div
                    className={className + ' modo-line'}
                    style={{
                        ...style
                    }}
                    onMouseLeave={onMouseLeave}
                    onMouseOver={onMouseOver}
                    onClick={onClick}>
                    {children}
                    <div
                        ref="chartRef"
                        style={{
                            width,
                            height,
                            display: this.state.empty ? 'none' : 'block'
                        }}>
                    </div>
                    <Empty
                        style={{
                            width,
                            height,
                            display: this.state.empty ? 'block' : 'none'
                        }}/>
                    {loading ? <Spin
                        size={20} /> : null}
                </div>
            </ResizeObserver>
        );
    }
}

export default wrapHOC(ModoLine, 'line');

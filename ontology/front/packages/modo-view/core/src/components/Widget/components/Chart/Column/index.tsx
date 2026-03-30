import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import wrapHOC from '../../../hoc/wrap';
import { Spin } from '@arco-design/web-react';
import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';
import { Empty } from '@arco-design/web-react';
import * as echarts from 'echarts';

class ModoColumn extends React.Component {
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
            name: serie.alias,
            data: serie.data,
            type: 'bar',
            barMaxWidth: serie.barMaxWidth,
            // showBackground: true,
            itemStyle: {
                borderRadius: serie.itemStyle.borderRadius,
                color: Array.isArray(serie.itemStyle.color) ? new echarts.graphic.LinearGradient(...serie.itemStyle.color) : serie.itemStyle.color
            },
            emphasis: {
                itemStyle: {
                    color: Array.isArray(serie.emphasis.color) ? new echarts.graphic.LinearGradient(...serie.emphasis.color) : serie.emphasis.color
                }
            }
        };
    }
    initOptions = () => {
        const {
            meta,
            yField,
            xField,
            chartTooltip,
            legend,
            customOption
        } = this.props;
        const xAxisLabel = this.props.xAxis && this.props.xAxis.axisLabel;
        const yAxisLabel = this.props.yAxis && this.props.yAxis.axisLabel;
        this.option = {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            xAxis: {
                type: this.props.dir !== '0' ? 'category' : 'value',
                data: [],
                axisLabel: {
                    // color: (xAxisLabel && xAxisLabel.color) || '#4E5969',
                    color: (xAxisLabel && xAxisLabel.color) || '#c5c5c5',
                    interval:(xAxisLabel && xAxisLabel.interval) ||  0,
                    rotate: (xAxisLabel && xAxisLabel.rotate) || -20,
                    fontSize: (xAxisLabel && xAxisLabel.fontSize) || 10,
                    formatter: (xAxisLabel && xAxisLabel.formatter) || '{value}'
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    show: false
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: ['#F2F3F5']
                    }
                },
                z: 1
            },
            yAxis: {
                type: this.props.dir !== '0' ? 'value' : 'category',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#4E5969',
                    fontSize: 10,
                    formatter: (yAxisLabel && yAxisLabel.formatter) || '{value}'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: ['#F2F3F5']
                    }
                }
            },
            grid: {
                left: (this.props.grid && this.props.grid.left) || 20,
                top: (this.props.grid && this.props.grid.top) || 10,
                right: (this.props.grid && this.props.grid.right) || 14,
                bottom: (this.props.grid && this.props.grid.bottom) || 26
            },
            tooltip: {
                trigger: 'axis',
                // appendToBody: true,
                className: chartTooltip && chartTooltip.className,
                valueFormatter: (chartTooltip && chartTooltip.valueFormatter) || undefined
            },
            legend: legend || {
                show: false
            },
            series: Array.isArray(this.props.series) && this.props.series.length > 0 ? this.props.series.map(serie => {
                return this.initSerie(serie);
            }): [
                {
                    data: [],
                    name: this.props.dir !== '0' ? (meta[yField] ? (meta[yField].alias || yField) : yField) : (meta[xField] ? (meta[xField].alias || xField) : xField),
                    type: 'bar',
                    barMaxWidth: 14,
                    // showBackground: true,
                    itemStyle: {
                        borderRadius: this.props.dir !== '0' ? [7, 7, 0, 0] : [0, 7, 7, 0],
                        color: this.props.dir !== '0' ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#722ED1' },
                            { offset: 0.25, color: '#165DFF' },
                            { offset: 0.75, color: '#14B1D5' },
                            { offset: 1, color: '#14C9C9' }
                        ]) : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: '#722ED1' },
                            { offset: 0.25, color: '#165DFF' },
                            { offset: 0.75, color: '#14B1D5' },
                            { offset: 1, color: '#14C9C9' }
                        ])
                    },
                    emphasis: {
                        itemStyle: {
                            color: this.props.dir !== '0' ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#2378f7' },
                                { offset: 0.7, color: '#2378f7' },
                                { offset: 1, color: '#83bff6' }
                            ]) : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                                { offset: 0, color: '#2378f7' },
                                { offset: 0.7, color: '#2378f7' },
                                { offset: 1, color: '#83bff6' }
                            ])
                        }
                    }
                }
            ]
        };
        if (typeof customOption === 'function') {
            this.option = customOption(this.option);
        }
    };
    initData = (data) => {
        const currentData = this.props.store ? data : this.props.data;
        if (Array.isArray(currentData)) {
            const data = currentData.map(item => {
                return item[this.props[(this.props.dir !== '0' ? 'xField' : 'yField')]];
            });
            if (this.props.dir !== '0') {
                this.option.xAxis.data = data;
            } else {
                this.option.yAxis.data = data;
            }

            if (Array.isArray(this.props.series) && this.props.series.length > 0) {
                this.props.series.forEach((serie, index) => {
                    this.option.series[index].data = currentData.map(item => {
                        return item[serie.name];
                    });
                });
            } else {
                this.option.series[0].data = currentData.map(item => {
                    return item[this.props[(this.props.dir !== '0' ? 'yField' : 'xField')]];
                });
            }
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
    componentDidMount() {
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
        this.chart = echarts.init(this.refs.chartRef);
        let option: EChartsOption;

        this.initOptions();
        if (this.props.store) {
            this.initStoreData();
        } else {
            this.initData();
        }

        this.chart.setOption(this.option);
        this.afterRefresh();
    }
    afterRefresh() {
        typeof this.props.afterRefresh === 'function' && this.props.afterRefresh(this.chart);
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
            'chartTooltip',
            'customOption'
        ].forEach(key => {
            if (!_.isEqual(this.props[key], prevProps[key])) {
                change = true;
            }
        });
        if (change && this.chart) {
            this.initOptions();
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
    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }
    render() {
        if (window.abc) {
            console.log('render-column');
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
                    className={className + ' modo-column'}
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
                        size={20}
                        tip={loadingTip} /> : null}
                </div>
            </ResizeObserver>
        );
    }
}

export default wrapHOC(ModoColumn, 'column');

import React from 'react';
import { connect } from 'react-redux';
import wrapHOC from '../../../hoc/wrap';
import { Spin, Empty } from '@arco-design/web-react';
import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';

import * as echarts from 'echarts';

class ModoPie extends React.Component {
    chart: echarts.ECharts | null;

    option: echarts.EChartsOption | null;

    constructor(props: any) {
        super(props);
        this.state = {
            size: {
                height: '100%',
                width: '100%',
            },
            empty: true,
            loading: false,
            origin: null
        };
        this.chart = null;
        this.option = null;
    }

    initOption = () => {
        const { chartTooltip, radius, roseType, legend, customOption } = this.props;
        this.option = {
            color: this.props.color || [
                '#165DFF',
                '#5EDFD6',
                '#4080FF',
                '#C3E7FE',
                '#EDF8BB',
                '#0E42D2',
                '#FADC6D',
                '#4CD263',
                '#FADC6D',
                '#14C9C9',
            ],
            grid: {
                left: 10,
                top: 10,
                right: 10,
                bottom: 10,
            },
            tooltip: {
                trigger: 'item',
                // appendToBody: true,
                className: chartTooltip && chartTooltip.className,
                valueFormatter: (chartTooltip && chartTooltip.valueFormatter) || undefined,
            },
            legend: legend ?? {
                orient: 'vertical',
                left: 'left',
                itemWidth: 12,
                itemHeight: 12,
                itemGap: 4,
                borderRadius: 6,
                padding: 0,
            },
            series: [
                {
                    name:
                        (this.props.meta[this.props.angleField] &&
                            this.props.meta[this.props.angleField].alias) ||
                        this.props.angleField,
                    type: 'pie',
                    radius: radius ?? '70%',
                    avoidLabelOverlap: false,
                    roseType: roseType || '',
                    itemStyle: {},
                    label: {
                        show: false,
                    },
                    emphasis: {
                        label: {},
                    },
                    labelLine: {},
                    data: [],
                },
            ],
        };
        if (typeof customOption === 'function') {
            this.option = customOption(this.option);
        }
    };

    initData = (data) => {
        const currentData = this.props.store ? data : this.props.data;
        if (Array.isArray(currentData)) {
            this.option.series[0].data = currentData.map(item => ({
                name: item[this.props.colorField],
                value: item[this.props.angleField],
            }));
        }

        this.setState({
            empty: this.option.series[0].data.length === 0,
        });
    };

    renderChart = (notMerge = false) => {
        this.initOption();
        if (this.props.store) {
            this.initStoreData();
        } else {
            this.initData();
        }

        this.chart?.setOption(this.option!, notMerge);
        this.afterRefresh();
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

        this.initOption();
        if (this.props.store) {
            this.initStoreData();
        } else {
            this.initData();
        }

        this.chart.setOption(this.option!);
        this.afterRefresh();
    }

    componentDidUpdate(prevProps, prevState) {
        this.diffStoreData(prevProps, prevState);
        const change = [
            'data',
            'colorField',
            'angleField',
            'meta',
            'color',
            'chartTooltip',
            'radius',
            'legend',
            'customOption',
        ].some(key => !_.isEqual(this.props[key], prevProps[key]));

        if (change && this.chart) {
            this.renderChart(true);
        }

        if (prevState.empty !== this.state.empty) {
            this.chart?.resize();
        }
    }

    render() {
        if (window.abc) {
            console.log('render-pie');
        }
        const { width, height } = this.state.size;

        const { onMouseLeave, onMouseOver, onClick } = this.props;

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
                onResize={e => {
                    this.chart && this.chart.resize();
                }}
            >
                <div
                    className={`${className} modo-pie`}
                    style={{
                        ...style,
                    }}
                    onMouseLeave={onMouseLeave}
                    onMouseOver={onMouseOver}
                    onClick={onClick}
                >
                    {children}
                    <div
                        ref="chartRef"
                        style={{
                            width,
                            height,
                            display: this.state.empty ? 'none' : 'block',
                        }}
                    ></div>
                    <Empty
                        style={{
                            width,
                            height,
                            display: this.state.empty ? 'block' : 'none',
                        }}
                    />
                    {loading ? <Spin size={20} /> : null}
                </div>
            </ResizeObserver>
        );
    }
}

export default wrapHOC(ModoPie, 'pie');

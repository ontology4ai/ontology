import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Line extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: `:root{ width: 100%; height: 200px}`,
            meta: {},
            series: [],
            xAxis: {
                show: true,
                axisLabel: {
                    show: true,
                    color: '#4E5969',
                    interval: 0,
                    rotate: -20,
                    fontSize: 10
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    show: false
                },
                splitLine: {
                    show: true
                }
            },
            yAxis: {
                show: true,
                axisLabel: {
                    show: true,
                    color: '#4E5969',
                    fontSize: 10,
                    formatter: '{value}'
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
                }
            },
            grid: {
                left: 20,
                top: 10,
                right: 14,
                bottom: 26
            }
        };
        this.type = 'line';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
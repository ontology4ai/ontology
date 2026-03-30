import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Column extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: `:root{ width: 100%; height: 200px}`,
            meta: {},
            xAxis: {
                axisLabel: {
                    color: '#4E5969',
                    interval: 0,
                    rotate: -20,
                    fontSize: 10
                }
            },
            grid: {
                left: 20,
                top: 10,
                right: 14,
                bottom: 26
            }
        };
        this.type = 'column';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
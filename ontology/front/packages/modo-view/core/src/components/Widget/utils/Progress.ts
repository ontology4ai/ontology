import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string
}

export default class Progress extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            percentBindVar: null,
            percent: 10,
            animation: true,
            buffer: false,
            showText: true,
            steps: 0,
            strokeWidth: 2,
            trailColor: null,
            size: 'default',
            type: 'line',
            width: null
        };
        this.type = 'progress';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

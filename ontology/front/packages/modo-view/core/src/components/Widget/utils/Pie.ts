import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Pie extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: `:root{ width: 100%; height: 200px}`,
            meta: {}
        };
        this.type = 'pie';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Divider extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	type: 'horizontal'
        };
        this.type = 'divider';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string
}

export default class Face extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}'
        };
        this.type = 'face';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

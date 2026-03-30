import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
}

export default class ResizeBox extends Node {
	defaultOptions = {
        css: ':root {\nheight: 100%\n}',
        width: 200,
        minWidth: 200,
        maxWidth: '100%'
    };
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        this.type = 'container';
        this.children = [];
        this.options = {
            ...this.options,
            ...this.defaultOptions,
            ...options
        };
    }
}

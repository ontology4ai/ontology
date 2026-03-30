import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Editor extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	css: ':root {\n\n}',
            language: 'javascript',
            height: '200px'
        };
        this.type = 'editor';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
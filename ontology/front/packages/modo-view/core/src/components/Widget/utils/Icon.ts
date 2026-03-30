import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string,
    icon: string
}

export default class Text extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            icon: 'IconEdit'
        };
        this.type = 'icon';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

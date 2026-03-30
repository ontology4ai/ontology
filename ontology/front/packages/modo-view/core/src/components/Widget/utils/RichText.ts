import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
}

export default class RichText extends Node {
	defaultOptions = {
        css: ':root {\nmin-height: 30px\n}',
        span: '24',
        labelFlex: '',
        value: '<span>富文本</span>'
    };
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        this.type = 'richText';
        this.children = [];
        this.options = {
            ...this.options,
            ...this.defaultOptions,
            ...options
        };
    }
}

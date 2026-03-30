import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string
}

export default class WordCloud extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\nwidth: 200px;\nheight:200px;\n}',
            dataBindVar: `[
                { "text": "abcd", weight: 12 },
                { "text": "defg", weight: 14},
                { "text": "hijk", weight: 16}
            ]`
        };
        this.type = 'wordCloud';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

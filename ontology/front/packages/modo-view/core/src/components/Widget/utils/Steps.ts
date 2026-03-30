import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    defaultCurrent: any;
    steps: Array<any>;
}

export default class Steps extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            defaultCurrent: 1,
            steps: [{
                title: '第一步',
                disabled: false,
                status: 'wait',
                description: '描述',
                hidden: false,
                hiddenBindVar: ''
            }]
        };
        this.type = 'steps';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

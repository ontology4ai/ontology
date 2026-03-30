import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    buttons: Array<any>;
}

export default class Dropdown extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            buttons: [{
                label: '编辑',
                icon: 'IconEdit',
                tooltip: null,
                event: null
            }]
        };
        this.type = 'dropdown';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

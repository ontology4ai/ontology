import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    options: Array<any>;
    showSearch: boolean;
    allowClear: boolean;
    showAllPath: boolean;
}

export default class Cascader extends Node {
    constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const _self = this;
        const defaultOptions = {
            css: ':root {\n\n}',
            mode: '',
            options: [],
            showSearch: false,
            showAllPath: true,
            allowClear: false,
            fieldNames: {
              value: 'value',
              label: 'label'
            }
        };
        this.type = 'cascader';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

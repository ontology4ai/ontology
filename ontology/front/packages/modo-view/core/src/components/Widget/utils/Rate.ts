import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Rate extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	span: '24',
            labelFlex: '',
            allowHalf: true,
            readonly: false,
            allowClear: false,
            count: 5,
            defaultValue: 0
        };
        this.type = 'rate';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
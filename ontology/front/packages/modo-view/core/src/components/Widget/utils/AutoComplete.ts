import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class AutoComplete extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	span: '24',
            labelFlex: '',
            options: []
        };
        this.type = 'autoComplete';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
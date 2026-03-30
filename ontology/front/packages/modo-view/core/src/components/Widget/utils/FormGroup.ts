import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
}

export default class FormGroup extends Node {
	defaultOptions = {
        css: ':root {}',
        span: '24',
        labelFlex: '',
        configBindVar: `{
            layout: 'inline',
            fields: []
        }`
    };
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        this.type = 'formGroup';
        this.children = [];
        this.options = {
            ...this.options,
            ...this.defaultOptions,
            ...options
        };
    }
}

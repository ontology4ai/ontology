import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Form extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            labelFlex: '60px',
            modelName: null,
            min: 3
        };
        this.type = 'form';
        this.children = [];
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
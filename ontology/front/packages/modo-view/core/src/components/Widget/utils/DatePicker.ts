import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class DatePicker extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	css: ':root {\n\n}',
            showTime: false,
            mode: 'date',
            format: 'YYYY-MM-DD'
        };
        this.type = 'datePicker';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
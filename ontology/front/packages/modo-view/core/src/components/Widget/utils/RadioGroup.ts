import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class RadioGroup extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	span: '24',
            labelFlex: '',
            options: [],
            props: {
                label: 'label',
                value: 'value'
            }
        };
        this.type = 'radioGroup';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
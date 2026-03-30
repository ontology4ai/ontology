import Node from './Node';
import Button from './Button';
import Loop, { LoopInterface } from './Loop';
require('static/guid');

interface Options {
}

export default class ButtonGroup extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	span: '6',
            labelFlex: ''
        };
        this.type = 'buttonGroup';
        const btnId1 = guid();
        const btnId2 = guid();
        this.children = [
            new Button(btnId1, btnId1, '按钮'),
            new Button(btnId2, btnId2, '按钮')
        ];
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

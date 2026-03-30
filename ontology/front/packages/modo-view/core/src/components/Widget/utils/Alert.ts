import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
}

export default class Alert extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
        	banner: false,
            closable: false,
            showIcon: true,
            type: 'info',
            content: '',
            contentBindVar: '',
            icon: 'IconInformation',
            title: '',
            titleBindVar: '',
            afterCloseBindVar: '',
            onCloseBindVar: ''
        };
        this.type = 'alert';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}
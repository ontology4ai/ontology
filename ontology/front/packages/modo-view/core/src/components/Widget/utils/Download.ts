import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
}

export default class Download extends Node {
	defaultOptions = {
        css: ':root {\n\n}',
        showTitle: false,
        showDownload: false,
        titleAlign: 'left'
    };
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        this.type = 'download';
        this.options = {
            ...this.options,
            ...this.defaultOptions,
            ...options
        };
    }
}

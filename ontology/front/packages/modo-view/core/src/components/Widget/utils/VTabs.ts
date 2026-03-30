import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    edit: boolean;
    activeTab: any;
    tabs: Array<any>;
}

export default class VTabs extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            edit: false,
            defaultActiveTab: null,
            lazyLoad: true
        };
        this.type = 'vTabs';
        this.children = [];
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

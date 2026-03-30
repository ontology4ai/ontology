import Node from './Node';

export interface Options {
	type: string;
    titleVisible: Boolean;
    css: string;
    eventMap: any;
    vars: Array<any>
}

export default class View extends Node{
	constructor(id:string, name:string, label:string, type:string , options: any, children:Array<any>) {
		super(id, name, label, type, options, children);
		const defaultOptions = {
			type: 'one-screen-layout',
			titleVisible: false,
			css: ':root {\n}',
			eventMap: {},
			vars: [],
			models: [],
			services: []
		};
		this.type = 'view';
		this.children = [];
		this.options = {
			...this.options,
			...defaultOptions,
			...options
		};
    }
}

import Loop, { LoopInterface } from './Loop';
require('static/guid');

interface Options {
    hidden: boolean;
    hiddenBindVar: string | null;

    isLoading: boolean;
    loading: boolean;
    loadingBindVar: string | null;
    loadingText: string | null;
	loadingTextBindVar:string | null;

	showTooltip: boolean;
	tooltip: string | null;
	tooltipBindVar: string | null;

    className: '';
	css: string;

    loop: LoopInterface,
    eventMap: any
}

export default class Node {
	id: string | null;
	name: string | null;
	label: string;
	type: string;
	children: Array<string>;
	options: Options = {
		hidden: false,
	    hiddenBindVar: null,

	    isLoading: false,
	    loading: false,
	    loadingBindVar: null,
	    loadingText: null,
		loadingTextBindVar: null,

		showTooltip: false,
		tooltip: null,
		tooltipBindVar: null,

	    className: '',
		css: ':root{}',

	    loop: new Loop(),
	    eventMap: {}
	};
	constructor(id:string, name:string, label:string, type:string, options:any, children:Array<any>) {
		let currentId = id;
		let currentName = name;
		if (!id) {
			currentId = guid();
		}
		if (!name) {
			currentName = currentId;
		}
		this.id = currentId;
		this.name = currentName;
		this.label = label;
		this.type = type;
		this.options = {
            ...this.options,
            ...options
        };
		this.children = children;
	}
}

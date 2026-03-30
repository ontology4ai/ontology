import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    gutter: string;
    width: string;
    height: string;
    flexDirection: string;
    flex: string;
    flexGrow: Boolean;
}

export default class FlexLayout extends Node {
	defaultOptions = {
        gutter: '5px',
        width: '100%',
        height: '200px',
        flexDirection: 'row',
        flex: 'auto',
        flexGrow: true
    };
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        this.type = 'flexLayout';
        this.children = [];
        this.options = {
            ...this.options,
            ...this.defaultOptions,
            ...options
        };
    }
}

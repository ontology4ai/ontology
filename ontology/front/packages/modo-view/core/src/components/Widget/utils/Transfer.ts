import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string
}

export default class Transfer extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            data: [],
            dataBindVar: '',
            columns: [],
            pageSize: 10,
            height: 300,
            fieldNames: {
                key: 'key'
            },
            titleTexts: [
                '可选列表',
                '已选列表'
            ]
        };
        this.type = 'transfer';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

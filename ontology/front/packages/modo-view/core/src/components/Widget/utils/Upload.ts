import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string,
    action: string,
    disabled: boolean
}

export default class Upload extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            action: '/_api/minio/singleFileUpload',
            headers: {},
            headersBindVar: '{}',
            disabled: false,
            autoUpload: true
        };
        this.type = 'upload';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

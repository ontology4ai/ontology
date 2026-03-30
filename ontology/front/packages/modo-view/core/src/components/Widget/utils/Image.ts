import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    width: number;
    height: number;
    src: string;
    alt: string;
    preview: Boolean;
    loader: Boolean;
}

export default class Image extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            width: 100,
            height: 100,
            src: '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a8c8cdb109cb051163646151a4a5083b.png~tplv-uwbnlip3yd-webp.webp',
            alt: '',
            preview: false,
            loader: false
        };
        this.type = 'image';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

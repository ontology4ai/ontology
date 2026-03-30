import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string
}

export default class TreeChart extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            data: [
                { "key": "root", "name": "root", "label": "数据架构定义", "descr": "数据架构定义描述" },
                { "key": "topic", "name": "topic", "label": "主题", "descr": "主题描述", "parent": "root" },
                { "key": "lvl", "name": "lvl", "label": "层次", "descr": "层次描述", "parent": "root" },
                { "key": "sys", "name": "sys", "label": "系统", "descr": "系统描述", "parent": "root" },
                { "key": "db", "name": "db", "label": "数据库", "descr": "数据库描述", "parent": "root" }
            ],
            dataBindVar: `[
                { "key": "root", "name": "root", "label": "数据架构定义", "descr": "数据架构定义描述" },
                { "key": "topic", "name": "topic", "label": "主题", "descr": "主题描述", "parent": "root" },
                { "key": "lvl", "name": "lvl", "label": "层次", "descr": "层次描述", "parent": "root" },
                { "key": "sys", "name": "sys", "label": "系统", "descr": "系统描述", "parent": "root" },
                { "key": "db", "name": "db", "label": "数据库", "descr": "数据库描述", "parent": "root" }
            ]`,
            contextMenus: [
            ],
            fieldNames: {
                key: 'key',
                parent: 'parent',
                label: 'label'
            }
        };
        this.type = 'treeChart';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

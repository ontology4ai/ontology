import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    data: Array<any>;
    showLine: boolean;
    isExpandedAll: boolean;
}

export default class Tree extends Node {
    constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            data: [
              {
                title: 'Trunk 0-0',
                key: '0-0',
                children: [
                  {
                    title: 'Leaf 0-0-1',
                    key: '0-0-1',
                  },
                  {
                    title: 'Branch 0-0-2',
                    key: '0-0-2',
                    children: [
                      {
                        title: 'Leaf 0-0-2-1',
                        key: '0-0-2-1',
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Trunk 0-1',
                key: '0-1',
                children: [
                  {
                    title: 'Leaf 0-1-1',
                    key: '0-1-1',
                  },
                  {
                    title: 'Leaf 0-1-2',
                    key: '0-1-2',
                  },
                ],
              },
            ],
            showLine: false,
            isExpandedAll: false,
            fieldNames: {
              key: 'key',
              title: 'title',
              children: 'children'
            }
        };
        this.type = 'tree';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

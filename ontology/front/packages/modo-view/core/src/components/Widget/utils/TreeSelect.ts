import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    data: Array<any>;
    showSearch: boolean;
    isMultiple: boolean;
    maxTagCount: number;
    treeCheckStrictly: boolean;
}

export default class TreeSelect extends Node {
    constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            data: [
              {
                title: 'Trunk 0-0',
                value: 'Trunk 0-0',
                key: '0-0',
                children: [
                  {
                    title: 'Branch 0-0-1',
                    value: 'Branch 0-0-1',
                    key: '0-0-1',
                    children: [
                      {
                        title: 'Leaf 0-0-1-1',
                        value: 'Leaf 0-0-1-1',
                        key: '0-0-1-1',
                      },
                      {
                        title: 'Leaf 0-0-1-2',
                        value: 'Leaf 0-0-1-2',
                        key: '0-0-1-2',
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Trunk 0-1',
                value: 'Trunk 0-1',
                key: '0-1',
                children: [
                  {
                    title: 'Branch 0-1-1',
                    value: 'Branch 0-1-1',
                    key: '0-1-1',
                    children: [
                      {
                        title: 'Leaf 0-1-1-0',
                        value: 'Leaf 0-1-1-0',
                        key: '0-1-1-0',
                      },
                    ],
                  },
                  {
                    title: 'Branch 0-1-2',
                    value: 'Branch 0-1-2',
                    key: '0-1-2',
                    children: [
                      {
                        title: 'Leaf 0-1-2-0',
                        value: 'Leaf 0-1-2-0',
                        key: '0-1-2-0',
                      },
                    ],
                  },
                ],
              },
            ],
            showSearch: true,
            isMultiple: true,
            maxTagCount: 2,
            treeCheckStrictly: true
        };
        this.type = 'treeSelect';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    options: Array<any>;
    showSearch: boolean;
    allowClear: boolean;
    showAllPath: boolean;
}

export default class CascaderPanel extends Node {
    constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const _self = this;
        const defaultOptions = {
            css: ':root {\n\n}',
            options: [],
            optionsBindVar: `[
              {
                value: 'beijing',
                label: 'Beijing',
                children: [
                  {
                    value: 'Beijing',
                    label: 'Beijing',
                    children: [
                      {
                        value: 'chaoyang',
                        label: 'Chaoyang',
                        children: [
                          {
                            value: 'datunli',
                            label: 'Datunli',
                          },
                        ],
                      },
                      {
                        value: 'dongcheng',
                        label: 'Dongcheng',
                      },
                      {
                        value: 'xicheng',
                        label: 'Xicheng',
                      },
                      {
                        value: 'haidian',
                        label: 'Haidian',
                      },
                    ],
                  },
                ],
              },
              {
                value: 'shanghai',
                label: 'Shanghai',
                children: [
                  {
                    value: 'shanghaishi',
                    label: 'Shanghai',
                    children: [
                      {
                        value: 'huangpu',
                        label: 'Huangpu',
                      },
                    ],
                  },
                ],
              },
            ]`,
            showSearch: false,
            showAllPath: true,
            allowClear: false,
            fieldNames: {
              value: 'value',
              label: 'label'
            }
        };
        this.type = 'cascaderPanel';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

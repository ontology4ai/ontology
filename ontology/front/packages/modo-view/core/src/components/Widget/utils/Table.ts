import Node from './Node';
import Loop, { LoopInterface } from './Loop';

interface Options {
    css: string;
    columns: Array<any>;
    data: Array<any>;
    pagination: any
}

export default class Table extends Node {
	constructor(id:string, name:string, label:string, type:string, options: any, children:Array<any>) {
        super(id, name, label, type, options, children);
        const defaultOptions = {
            css: ':root {\n\n}',
            modelName: null,
            showHeader: true,
            borderCell: false,
            columns: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                },
            ],
            data: [
                {
                    key: '1',
                    name: 'Jane Doe',
                    salary: 23000,
                    address: '32 Park Road, London',
                    email: 'jane.doe@example.com',
                }
            ],
            actions: [],
            actionShowNumber: 1,
            actionMoreShowType: 'icon',
            actionMoreIcon: 'IconMoreCol',
            actionMoreText: '',
            pagination: {
                style: {
                    display: 'block'
                },
                sizeOptions: [10, 20, 30, 40, 50],
                show: true,
                showTotal: true,
                pageSizeChangeResetCurrent: true,
                sizeCanChange: true,
                total: 0,
                totalBindVar: null,
                pageSize: 20,
                pageSizeBindVar: null,
                current: 1,
                currentBindVar: null
            },
            scroll: {
                x: true,
                y: false
            }
        };
        this.type = 'table';
        this.options = {
            ...this.options,
            ...defaultOptions,
            ...options
        };
    }
}

import React, { useState, useEffect, useMemo } from 'react';
import Form from './index';
import FilterForm from '../FilterForm';

class Demo extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            filterForm: {
                labelCol: {
                    flex: '78px'
                },
                wrapperCol: {
                    flex: '1'
                },
                initialValues: {
                    type: ''
                },
                fields: [
                    {
                        type: 'input',
                        field: 'label',
                        label: '名称名称名称',
                        options: {
                            placeholder: '请输入视图名称'
                        }
                    },
                    {
                        type: 'radioGroup',
                        field: 'type',
                        label: '视图类型',
                        options: {
                            placeholder: 'please enter your layout...',
                            options: [
                                { value: '', label: '全部' },
                                { value: 'activity', label: '活动试图' },
                                { value: 'fragment', label: '绑定试图' }
                            ],
                            type: 'button'
                        }
                    },
                    {
                        type: 'select',
                        field: 'state',
                        label: '视图状态',
                        options: {
                            placeholder: '',
                            options: [
                                { value: '0', label: '已失效' },
                                { value: '1', label: '已生效' }
                            ],
                            type: 'button'
                        }
                    },
                    {
                        type: 'input',
                        field: 'a',
                        label: 'a',
                        options: {
                            placeholder: 'aa'
                        }
                    },
                    {
                        type: 'input',
                        field: 'b',
                        label: 'b',
                        options: {
                            placeholder: 'bb'
                        }
                    },
                    {
                        type: 'input',
                        field: 'c',
                        label: 'c',
                        options: {
                            placeholder: 'cc'
                        }
                    },
                    {
                        type: 'input',
                        field: 'd',
                        label: 'd',
                        options: {
                            placeholder: 'dd'
                        }
                    },
                    {
                        type: 'input',
                        field: 'e',
                        label: 'e',
                        options: {
                            placeholder: 'ee'
                        }
                    },
                    {
                        type: 'input',
                        field: 'g',
                        label: 'g',
                        options: {
                            placeholder: 'gg'
                        }
                    }
                ],
            },
            form: {
                fields: [
                    {
                        type: 'radioGroup',

                        field: 'layout',
                        label: 'Layout',
                        options: {
                            placeholder: 'please enter your layout...',
                            options: ['a', 'b', 'c'],
                            type: 'button'
                        }
                    },
                    {
                        type: 'input',
                        field: 'userName',
                        label: 'Username',
                        options: {
                            placeholder: 'please enter your username...'
                        },
                        required: true,
                        rules: [
                            {
                                validator: (value, cb, ref) => {
                                    console.log(ref);
                                    if (value !== 'hahaha') {
                                        return cb('必须填写hahaha');
                                    }
                                    return cb();
                                }
                            }
                        ]
                    },
                    {
                        type: 'input',
                        field: 'post',
                        label: 'Post',
                        options: {
                            placeholder: 'please enter your post...'
                        }
                    },
                    {
                        type: 'checkbox',
                        field: 'post',
                        wrapperCol: {
                            offset: 5
                        },
                        options: {
                            children: 'I have read the manual'
                        }
                    },
                    {
                        type: 'button',
                        wrapperCol: {
                            offset: 5
                        },
                        options: {
                            type: 'primary',
                            children: 'Submit',
                        }
                    }
                ]
            }
        	
        }
    }
    render() {
        return (
            <>
                <div
                    style={{
                        padding: '10px 12px',
                        background: 'var(--color-gray-2)',
                        overflow: 'auto',
                        width: '100%',
                        height: '100%',
                        overflowX: 'hidden',
                        boxSizing: 'border-box'
                    }}>
                    <div
                        style={{
                            marginBottom: '10px'
                        }}>
                        <FilterForm
                            {...this.state.filterForm}></FilterForm>
                    	
                    </div>
                    <div
                        style={{
                            background: '#fff',
                            padding: '10px 16px'
                        }}>
                        <Form
                            {...this.state.form}
                            onValuesChange={(_, values) => console.log(_, values)}>
                        </Form>
                    </div>
                </div>
            </>
        )
    }
}

export default Demo;

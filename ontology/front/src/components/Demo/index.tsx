import React, { useState, useEffect, useMemo } from 'react';
import { Carousel, Button, AutoComplete, Modal } from '@arco-design/web-react';
import { IconEdit, IconCDataAsset } from 'modo-design/icon';
import Form from '@/components/Form';
import FilterForm from '@/components/FilterForm';
import ModoTabsForm from '../ModoTabsForm';
import FormList from '../FormList';
import WordCloud from '../WordCloud';

import Flink from 'packages/modo-platform/flink-sql/images/fileTypeIcons/flink.svg';

import './style/index.less';

import img1 from './images/img1.png';
import img2 from './images/img2.png';

function ImgComponent(props) {
  const { src, style, className } = props;
  return (
    <div style={style} className={className}>
      <img
        src={src}
        style={{
            width: '100%',
            height: '100%'
        }}
      />
    </div>
  );
}
const imageSrc = [
  '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/cd7a1aaea8e1c5e3d26fe2591e561798.png~tplv-uwbnlip3yd-webp.webp',
  '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/6480dbc69be1b5de95010289787d64f1.png~tplv-uwbnlip3yd-webp.webp',
  //'//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/0265a04fddbd77a19602a15d9d55d797.png~tplv-uwbnlip3yd-webp.webp',
  //'//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/24e0dd27418d2291b65db1b21aa62254.png~tplv-uwbnlip3yd-webp.webp',
];

const options = [
    {
        value: 'qichefuwu',
        label: '汽车服务',
        children: new Array(5).fill(null).map((val, i) =>{
            return {
                value: 'qichefuwu' + i,
                label: '汽车服务' + i,
                children: new Array(50).fill(null).map((val, j) =>{
                    return {
                        value: 'qiche' + j,
                        label: '汽车' + j
                    }
                })
            }
        })
    },
    {
        value: 'jinrong',
        label: '金融',
        children: new Array(5).fill(null).map((val, i) =>{
            return {
                value: 'chaoyangs' + i,
                label: 'Chaoyang',
                children: new Array(50).fill(null).map((val, j) =>{
                    return {
                        value: 'datunlis' + j,
                        label: 'Datunli'
                    }
                })
            }
        })
    }
];

class Demo extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            wordList: [
                { text: '生效日期' },
                { text: '入网渠道标识' },
                { text: '移动公共电话类型代码' },
                { text: '移动号码' },
                { text: '用户付费类型代码' },
                { text: '直管渠道唯一编码' },
                { text: 'SP服务/产品名称' },
                { text: '统计日期（年月日）' }
            ],
            visible: false,
            filterForm1: {
                initialValues: {
                    type: ''
                },
                min: 1,
                fields: [
                    {
                        type: 'input',
                        field: 'label',
                        label: '名称名称名称',
                        options: {
                            placeholder: '请输入视图名称'
                        }
                    },
                    /*{
                        type: 'checkboxGroup',
                        field: 'type',
                        label: '视图类型',
                        options: {
                            placeholder: 'please enter your layout...',
                            options: [
                                { value: '', label: '全部' },
                                { value: 'activity', label: '活动视图' },
                                { value: 'fragment', label: '绑定视图' }
                            ],
                            type: 'button'
                        }
                    },*/
                    {
                        type: 'tabsForm',
                        field: 'tabsForm',
                        // label: 'tabsForm',
                        labelCol: {
                            flex: '0px'
                        },
                        wrapperCol: {
                            flex: '1'
                        },
                        span: 24,
                        options: {
                            fields: [
                                {
                                    name: 'aa',
                                    label: '兴趣点行业型',
                                    type: 'cascaderPanel',
                                    options: {
                                        options,
                                        mode: 'multiple',
                                        checkedStrategy: 'parent',
                                        dropdownMenuClassName: 'xxxxxx'
                                    }
                                },
                                {
                                    name: 'bb',
                                    label: '行业区域',
                                    type: 'cascaderPanel',
                                    options: {
                                        options,
                                        mode: 'multiple',
                                        checkedStrategy: 'parent'
                                    }
                                },
                                {
                                    name: 'cc',
                                    label: '地址类型',
                                    type: 'cascaderPanel',
                                    options: {
                                        options,
                                        mode: 'multiple',
                                        checkedStrategy: 'parent'
                                    }
                                },
                                {
                                    name: 'ee',
                                    label: '地址',
                                    type: 'textArea',
                                    options: {
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            filterForm: {
                initialValues: {
                    type: ''
                },
                min: 1,
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
                        type: 'cascader',
                        field: 'type1',
                        label: '类型',
                        options: {
                            placeholder: 'please enter your layout...',
                            options: [
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
                                        ],
                                      },
                                    ],
                                  }
                            ]
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
                                { value: 'activity', label: '活动视图' },
                                { value: 'fragment', label: '绑定视图' }
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
                        type: 'formList',
                        field: 'formList',
                        label: 'formList',
                        options: {
                            onChange: (value => {
                                console.log(value);
                            }),
                            fields: [
                                {
                                    type: 'input',
                                    name: 'label',
                                    label: '名称名称名称',
                                    options: {
                                        placeholder: '请输入视图名称'
                                    }
                                },
                                {
                                    type: 'radioGroup',
                                    name: 'type',
                                    label: '视图类型',
                                    options: {
                                        placeholder: 'please enter your layout...',
                                        options: [
                                            { value: '', label: '全部' },
                                            { value: 'activity', label: '活动视图' },
                                            { value: 'fragment', label: '绑定视图' }
                                        ],
                                        type: 'button'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        type: 'tableForm',
                        field: 'tableForm',
                        label: 'tableForm',
                        pagination: false,
                        options: {
                            model:{
                                fields: [
                                    {
                                        name: 'url',
                                        valueType: 'string',
                                        defaultValue: '',
                                        label: '事件名',
                                        type: 'input'
                                    }
                                ]
                            },
                            rowKey: "url",
                            operWidth: 70,
                            addOper: false,
                            editAllOper: false,
                            deleteOper: false,
                            rowExtra: (col, record, index) => (
                                <Button
                                    size="mini"
                                    icon={<IconEdit />}
                                    onClick={() => this.handleEditEvent(record, index)}>
                                </Button>
                            )
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
                    },

                ]
            },
            list: [
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0},
                {currentIndex: 0}
            ],
            activeCardIndexs: [],
            inViewIndexs: {},
        }
    }
    updateCarousel() {
        const container =  document.querySelector('.demo');
        const cards = new Array(...document.querySelectorAll('.card'));
        
        var indexs = {};
        cards.forEach((node, index) => {
            const offsetTop = node.offsetTop;
            if ((offsetTop  + node.offsetHeight) > (container.offsetTop + container.scrollTop) && 
                (offsetTop) < (container.offsetHeight + container.offsetTop + container.scrollTop)) {
                if (indexs[offsetTop]) {
                    indexs[offsetTop].push(index);
                } else {
                    indexs[offsetTop] = [index];
                }
            }
        });
        this.state.inViewIndexs = indexs;
        const activeCardIndexs = [];
        for (let top in indexs) {
            const index = indexs[top][Math.floor(Math.random() * indexs[top].length)];
            activeCardIndexs.push(index);
            this.state.list[index].currentIndex = 0;
        }
        this.setState({
            activeCardIndexs,
            list: this.state.list,
            inViewIndexs: indexs
        });
    }
    componentDidMount () {
        window.demo = this;
        this.updateCarousel();
        window.addEventListener('resize', () => {
            this.updateCarousel();
        });
        document.querySelector('.demo').addEventListener('scroll', () => {
            this.updateCarousel();
            /* const nodes = new Array(...document.querySelectorAll('.card')).filter((node, index) => {
                if ((node.offsetTop) > (container.offsetTop + container.scrollTop) && 
                    (node.offsetTop  + node.offsetHeight) < (container.offsetHeight + container.offsetTop + container.scrollTop)) {
                    return true;
                }
                return false
            }); */
            /*if (nodes.length > 0) {
                const {
                    activeCardIndex
                } = this.state;
                if (nodes.indexOf(cards[activeCardIndex]) < 0 ) {
                    const currentActiveCardIndex = cards.indexOf(nodes[Math.floor(Math.random() * nodes.length)]);
                    if (activeCardIndex !== currentActiveCardIndex) {
                        this.state.list[activeCardIndex].currentIndex = 0;
                        this.setState({
                            activeCardIndex: currentActiveCardIndex,
                            list: this.state.list
                        });
                    }
                }
            } */
        })
    }
    setVisible = (val) => {
        this.setState({
            visible: val
        })
    }
    render() {
        return (
            <>
            {/*<img src={Flink}/>
            <div style={{
                height: '100px',
                background: 'yellow'
            }}>
            </div>*/}
            <Button onClick={() => this.setVisible(true)} type='primary'>
                Open Modal
            </Button>
            <WordCloud
                style={{
                    width: '300px',
                    height: '150px'
                }}
                data={this.state.wordList}/>
            <div className="demo">
                {/*<div style={{
                    height: '100px',
                    background: 'blue'
                }}>
                </div>*/}
                <div className="card-list">
                    {
                        this.state.list.map((item, index) => {
                            return (
                                <Carousel
                                    currentIndex={item.currentIndex}
                                    miniRender={true}
                                    autoPlay={this.state.activeCardIndexs.indexOf(index) > -1 ? {
                                        interval: 2000,
                                        hoverToPause: true
                                    } : false}
                                    key={index}
                                    className="card"
                                    showArrow='hover'
                                    style={{
                                        height: 160
                                    }}
                                    onChange={(i) => {
                                        if (i === 0) {
                                            const preI = this.state.activeCardIndexs.indexOf(index);
                                            for (let top in this.state.inViewIndexs) {
                                                const i = this.state.inViewIndexs[top].indexOf(index);
                                                if (i > -1) {
                                                    this.state.activeCardIndexs.splice(preI, 1, this.state.inViewIndexs[top][Math.floor(Math.random() * this.state.inViewIndexs[top].length)])
                                                    // console.log(this.state.activeCardIndexs);
                                                    this.setState({
                                                        activeCardIndexs: this.state.activeCardIndexs,
                                                    });
                                                }
                                            }
                                            
                                        }
                                        this.state.list[index].currentIndex = i;
                                        this.setState({
                                            list: this.state.list,

                                        });
                                    }}>
                                    {imageSrc.map((src, index) => (
                                        <ImgComponent key={index} src={src} />
                                    ))}
                                </Carousel>
                            );
                        })
                    }
                </div>
                <AutoComplete
                    placeholder='请输入...'
                    data={[
                      {
                        name: React.createElement(
                            Arco.Button,
                            {size: 'mini'},
                            'xxxx'
                        ),
                        value: 'Beijing',
                        other: 'other custom data',
                      },
                    ]}/>
                <FormList
                    onChange={(value => {
                        console.log(value);
                    })}
                    fields ={ [
                        {
                            type: 'input',
                            name: 'label',
                            label: '名称名称名称',
                            options: {
                                placeholder: '请输入视图名称'
                            }
                        },
                        {
                            type: 'radioGroup',
                            name: 'type',
                            label: '视图类型',
                            options: {
                                placeholder: 'please enter your layout...',
                                options: [
                                    { value: '', label: '全部' },
                                    { value: 'activity', label: '活动视图' },
                                    { value: 'fragment', label: '绑定视图' }
                                ],
                                type: 'button'
                            }
                        }
                    ]}
                    value={[{type: 'activity'}, {}]}/>
                <ModoTabsForm
                    value={{
                        aa: [['qichefuwu']]
                    }}
                    fields={[
                        {
                            name: 'aa',
                            label: '兴趣点行业型',
                            type: 'cascaderPanel',
                            options: {
                                options,
                                mode: 'multiple',
                                checkedStrategy: 'parent',
                                dropdownMenuClassName: 'xxxxxx'
                            }
                        },
                        {
                            name: 'bb',
                            label: '行业区域',
                            type: 'cascaderPanel',
                            options: {
                                options,
                                mode: 'multiple',
                                checkedStrategy: 'parent'
                            }
                        },
                        {
                            name: 'cc',
                            label: '地址类型',
                            type: 'cascaderPanel',
                            options: {
                                options,
                                mode: 'multiple',
                                checkedStrategy: 'parent'
                            }
                        },
                        {
                            name: 'ee',
                            label: '地址',
                            type: 'textArea',
                            options: {
                            }
                        }
                    ]}
                    onChange={(value => {
                        console.log(value);
                    })}
                    />
                <div>
                     <div
                        style={{
                            marginBottom: '10px'
                        }}>
                        <FilterForm
                            {...this.state.filterForm1}
                            search={(values) => {
                                console.log(values)
                            }}>
                        </FilterForm>
                        
                    </div>
                    <div
                        style={{
                            marginBottom: '10px'
                        }}>
                        <FilterForm
                            {...this.state.filterForm}
                            search={(values) => {
                                console.log(values)
                            }}>
                        </FilterForm>
                    	
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
            </div>
            </>
        )
    }
}

export default Demo;

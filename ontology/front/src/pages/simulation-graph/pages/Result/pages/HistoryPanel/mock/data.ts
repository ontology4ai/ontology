import moment from 'moment';

export default [
    {
        key: 'a',
        label: '更新客户“张*”的套餐',
        descr: '手机号为“133****9588”的客户“张*”,将其“全家享109套餐”升级为“全家享299套餐”，客户满意度提升20.5%',
        time: moment().format('YYYY-MM-DD'),
        checked: false,
        data: [
            {
                type: 'title',
                data: '说明'
            },
            {
                type: 'pre-text',
                data: `手机号为“133****9588”的客户“张*”，将其“全家享109套餐”升级为“全家享299套餐”后：
1）超套网速下降、通话超时、网页延时、视频会议卡顿的情况都会有明显下降，网络性能整体实现大幅度提升；
2）升级套餐后，套餐价格增加，但结合优惠策略，客户实际只需支付199便可享受价值299的套餐，并且与现有套餐相比，承担的额外支出为90元/月，套餐资费适量增加，客户资费体验仅小幅度降低。
3）此方案站在客户角度，平衡效果与投入，且无其他附加条件，另外结合客户及时反馈积极解决问题，可使客户服务体验上升约30%。

综上，此方案可满足移动和宽带网络性能基础优化的需求，网络性能增强，客户需承担的额外成本适中。
综合分析得到客户的网络体验评分提升40%、资费感知评分下降10%、服务体验评分上升40%，最终得出客户满意度提升20.5%。`
            },
            {
                type: 'source',
                data: [
                    {
                        type: 'table',
                        title: '1、套餐产品',
                        data: [
                            {
                                "changeContent": "套餐内容",
                                "changeBefore": "全家享109套餐",
                                "changeAfter": "全家享299套餐",
                                "changeValue": ""
                            },
                            {
                                "changeContent": "资费",
                                "changeBefore": "109元",
                                "changeAfter": "199元",
                                "changeValue": "82.57%"
                            },
                            {
                                "changeContent": "通用流量",
                                "changeBefore": "20G",
                                "changeAfter": "100G",
                                "changeValue": "400%"
                            },
                            {
                                "changeContent": "国内通话时长",
                                "changeBefore": "100分钟",
                                "changeAfter": "1500分钟",
                                "changeValue": "1400%"
                            },
                            {
                                "changeContent": "家庭带宽",
                                "changeBefore": "500MB",
                                "changeAfter": "1000MB",
                                "changeValue": "100%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '2、客户行为',
                        data: [
                            {
                                "changeContent": "达量降速触发率",
                                "changeBefore": "15%",
                                "changeAfter": "1.5%",
                                "changeValue": "-90%"
                            },
                            {
                                "changeContent": "套餐外通话费用占比",
                                "changeBefore": "25%",
                                "changeAfter": "2%",
                                "changeValue": "-92%"
                            },
                            {
                                "changeContent": "网页首屏打开时延",
                                "changeBefore": "3.5秒",
                                "changeAfter": "1.2秒",
                                "changeValue": "-65.7%"
                            },
                            {
                                "changeContent": "视频卡顿率",
                                "changeBefore": "8%",
                                "changeAfter": "0.5%",
                                "changeValue": "-93.8%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '3、客户感知评估',
                        data: [
                            {
                                "changeContent": "网络体验评分",
                                "changeBefore": "3.2",
                                "changeAfter": "4.48",
                                "changeValue": "40%"
                            },
                            {
                                "changeContent": "资费感知评分",
                                "changeBefore": "5.5",
                                "changeValue": "-10%",
                                "changeAfter": "4.95"
                            },
                            {
                                "changeContent": "服务体验评分",
                                "changeBefore": "4.9",
                                "changeAfter": "6.86",
                                "changeValue": "40%"
                            },
                            {
                                "changeContent": "满意度评分",
                                "changeBefore": "4.23",
                                "changeAfter": "5.10",
                                "changeValue": "20.5%"
                            }
                        ]
                    }
                ]
            },
            /*{
                type: 'rel-result',
                data: [
                    {
                        type: 'table',
                        title: '客户行为',
                        data: [
                            {
                                changeContent: '服务体验评分',
                                changeBefore: '4.3',
                                changeAfter: '5.6',
                                changeValue: '30%'
                            },
                            {
                                changeContent: '资费感知评分',
                                changeBefore: '5.1',
                                changeAfter: '6.7',
                                changeValue: '31%'
                            },
                            {
                                changeContent: '网络体验评分',
                                changeBefore: '3.2',
                                changeAfter: '4.7',
                                changeValue: '47%'
                            },
                            {
                                changeContent: '满意度评分',
                                changeBefore: '4.0',
                                changeAfter: '5.3',
                                changeValue: '33%'
                            }
                        ]
                    }
                ]
            }*/
        ]
    },
    {
        key: 'b',
        label: '更新客户“张*”的网络设备',
        descr: '手机号为“133****9588”的客户“张*”,将其“全家享109套餐”升级为“全家享299套餐”，同时增加一台无线路由子节点，客户满意度提升24.7%',
        time: moment().format('YYYY-MM-DD'),
        checked: false,
        data: [
            {
                type: 'title',
                data: '说明'
            },
            {
                type: 'text',
                data: '现将客户“张*”所在区域“深圳市南山区**路**号”的基站设备从25台增加至27台，在接入设备数量小幅增加的情况下，视频加载成功率、网页加载成功率及游戏时延率单项体验指标均得到改善，整体网络感知得分和客户满意度评分显著提升，从4.0提升至6.1，提升53%。影响的对象明细信息如下：'
            },
            {
                type: 'source',
                data: [
                    {
                        type: 'table',
                        title: '1、套餐产品',
                        data: [
                            {
                                "changeContent": "套餐内容",
                                "changeBefore": "全家享109套餐",
                                "changeAfter": "全家享299套餐",
                                "changeValue": ""
                            },
                            {
                                "changeContent": "资费",
                                "changeBefore": "109元",
                                "changeAfter": "199元",
                                "changeValue": "82.57%"
                            },
                            {
                                "changeContent": "通用流量",
                                "changeBefore": "20G",
                                "changeAfter": "100G",
                                "changeValue": "400%"
                            },
                            {
                                "changeContent": "国内通话时长",
                                "changeBefore": "100分钟",
                                "changeAfter": "1500分钟",
                                "changeValue": "1400%"
                            },
                            {
                                "changeContent": "家庭带宽",
                                "changeBefore": "500MB",
                                "changeAfter": "1000MB",
                                "changeValue": "100%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '2、无限网络',
                        data: [
                            {
                                "changeContent": "无线网设备数量",
                                "changeBefore": "1台",
                                "changeAfter": "2台",
                                "changeValue": "100%"
                            },
                            {
                                "changeContent": "多设备并发吞吐量",
                                "changeBefore": "100%",
                                "changeAfter": "220%",
                                "changeValue": "120%"
                            },
                            {
                                "changeContent": "平均信噪比",
                                "changeBefore": "100%",
                                "changeValue": "150%",
                                "changeAfter": "250%"
                            },
                            {
                                "changeContent": "速率达标点位占比",
                                "changeBefore": "100%",
                                "changeAfter": "400%",
                                "changeValue": "200%"
                            },
                            {
                                "changeContent": "日均连接保持率",
                                "changeBefore": "100%",
                                "changeAfter": "101%",
                                "changeValue": "1%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '3、客户行为',
                        data: [
                            {
                                "changeContent": "达量降速触发率",
                                "changeBefore": "15%",
                                "changeAfter": "1.5%",
                                "changeValue": "-90%"
                            },
                            {
                                "changeContent": "套餐外费用占比",
                                "changeBefore": "25%",
                                "changeAfter": "2%",
                                "changeValue": "-92%"
                            },
                            {
                                "changeContent": "网页首屏打开时延",
                                "changeBefore": "3.5秒",
                                "changeAfter": "1.2秒",
                                "changeValue": "-65.7%"
                            },
                            {
                                "changeContent": "视频卡顿率",
                                "changeBefore": "8%",
                                "changeValue": "-93.8%",
                                "changeAfter": "0.5%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '4、无限网络',
                        data: [
                            {
                                "changeContent": "家庭内网设备性能",
                                "changeBefore": "60%",
                                "changeAfter": "95%",
                                "changeValue": "58.3%"
                            },
                            {
                                "changeContent": "无线信道质量",
                                "changeBefore": "18dB",
                                "changeAfter": "32dB",
                                "changeValue": "77.8%"
                            },
                            {
                                "changeContent": "用户侧速率达标率",
                                "changeBefore": "20%",
                                "changeAfter": "98%",
                                "changeValue": "390%"
                            },
                            {
                                "changeContent": "无线连接稳定性",
                                "changeBefore": "95%",
                                "changeAfter": "99.5%",
                                "changeValue": "4.7%"
                            },
                            {
                                "changeContent": "设备费用及安装费",
                                "changeBefore": "300元",
                                "changeAfter": "740元",
                                "changeValue": "146.7%"
                            }
                        ]
                    },
                    {
                        type: 'table',
                        title: '5、客户感知评估',
                        data: [
                            {
                                "changeContent": "网络体验评分",
                                "changeBefore": "3.2",
                                "changeAfter": "6.08",
                                "changeValue": "90%"
                            },
                            {
                                "changeContent": "资费感知评分",
                                "changeBefore": "5.5",
                                "changeAfter": "3.85",
                                "changeValue": "-30%"
                            },
                            {
                                "changeContent": "服务体验评分",
                                "changeBefore": "4.9",
                                "changeAfter": "5.39",
                                "changeValue": "10%"
                            },
                            {
                                "changeContent": "满意度评分",
                                "changeBefore": "4.23",
                                "changeAfter": "5.273",
                                "changeValue": "24.7%"
                            }
                        ]
                    }
                ]
            },
            /*{
                type: 'rel-result',
                data: [
                    {
                        type: 'table',
                        title: '客户行为',
                        data: [
                            {
                                changeContent: '网页加载成功率',
                                changeBefore: '50%',
                                changeAfter: '57%',
                                changeValue: '14%'
                            },
                            {
                                changeContent: '视频加载成功率',
                                changeBefore: '46%',
                                changeAfter: '48%',
                                changeValue: '4%'
                            },
                            {
                                changeContent: '视频平均加载时长',
                                changeBefore: '3.2分钟',
                                changeAfter: '2.1分钟',
                                changeValue: '-34%'
                            },
                            {
                                changeContent: '游戏延迟率',
                                changeBefore: '51%',
                                changeAfter: '47%',
                                changeValue: '-7.8%'
                            },
                            {
                                changeContent: '满意度评分',
                                changeBefore: '4.0',
                                changeAfter: '5.8',
                                changeValue: '45%'
                            }
                        ]
                    }
                ]
            }*/
        ]
    }
]
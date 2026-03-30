import React, { useState, useEffect, useMemo } from 'react'
import { Button, Drawer, Table, Form, Select, Input } from '@arco-design/web-react';
import RoundRect from '../../../../components/RoundRect';
import Flow from './pages/Flow';
import Title from '../../components/Title'
import './style/index.less'

const FormItem = Form.Item;
const Option = Select.Option;

class Step3 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stepActive: 1,
            knowledgeDetailVisible: false,
            serviceDetailVisible: false,
            actionColumns: [
                {
                    title: '名称',
                    dataIndex: 'name',
                    align: 'center',
                    // width: 350,
                },
                {
                    title: '描述',
                    dataIndex: 'remark',
                    align: 'center',
                },
            ],
            actionData: [
                {
                    name: '新建客户',
                    remark: '新建一个客户',
                },
                {
                    name: '编辑客户',
                    remark: '修改客户状态',
                },
                {
                    name: '删除客户',
                    remark: '删除一个客户',
                },
                {
                    name: '新建仓库',
                    remark: '新建一个仓库',
                },
                {
                    name: '编辑仓库',
                    remark: '编辑仓库状态',
                },
                {
                    name: '删除仓库',
                    remark: '删除一个仓库',
                },
                {
                    name: '新建产品',
                    remark: '新建一个产品',
                },
                {
                    name: '编辑产品',
                    remark: '编辑产品状态',
                },
                {
                    name: '删除产品',
                    remark: '删除一个产品',
                },
                {
                    name: '新建订单',
                    remark: '新建一个订单',
                },
                {
                    name: '编辑订单',
                    remark: '编辑订单状态',
                },
                {
                    name: '删除订单',
                    remark: '删除一个订单',
                },
                {
                    name: '新建货运单',
                    remark: '新建一个货运单',
                },
                {
                    name: '编辑货运单',
                    remark: '编辑货运单状态',
                },
                {
                    name: '删除货运单',
                    remark: '删除一个货运单',
                },
                {
                    name: '新建工厂',
                    remark: '新建一个工厂',
                },
                {
                    name: '编辑工厂',
                    remark: '编辑工厂状态',
                },
                {
                    name: '删除工厂',
                    remark: '删除一个工厂',
                }
            ],
            logicColumns: [
                {
                  title: '逻辑名称',
                  dataIndex: 'name',
                  align: 'center',
                  // width: 350,
                },
                {
                  title: '动作描述',
                  dataIndex: 'remark',
                  align: 'center',
                },
            ],
            logicData: [
                {
                  name: '异常天气影响订单分析',
                  remark: '分析异常天气对订单物流运输的影响',
                },
                {
                  name: '异常天气影响基站分析',
                  remark: '分析异常天气对基站的影响',
                },
                {
                  name: '异常天气影响营销分析',
                  remark: '分析异常天气对线下营销活动的影响',
                },
            ]
        };
        

  
    }
    render() {
        const {
            stepActive,
            knowledgeDetailVisible,
            serviceDetailVisible,
            actionColumns,
            actionData,
            logicColumns,
            logicData
        } = this.state;
        return (
            <>
            <div
                className="build-step-3">
                <div
                    className="build-step-3-bg">
                    <svg width="1556" height="938" viewBox="0 0 1556 938" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="1554" height="934" rx="30.5" fill="#2C3262" fill-opacity="0.3" stroke="url(#paint0_linear_5209_339)"/>
                        <defs>
                            <linearGradient id="paint0_linear_5209_339" x1="-776" y1="469" x2="51.3766" y2="1842.66" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#535D98"/>
                                <stop offset="1" stop-color="#2C3257"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="build-step-3-header">
                    <div
                        className="build-step-3-header-content">
                        <div
                            className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                              <path d="M15.75 2.33301C15.75 2.8513 15.5247 3.31696 15.1667 3.6374V5.83301H21C22.9331 5.83301 24.5 7.40002 24.5 9.33301V20.9997C24.5 22.9327 22.9331 24.4997 21 24.4997H7C5.06701 24.4997 3.5 22.9327 3.5 20.9997V9.33301C3.5 7.40002 5.06701 5.83301 7 5.83301H12.8333V3.6374C12.4753 3.31696 12.25 2.8513 12.25 2.33301C12.25 1.36651 13.0335 0.583008 14 0.583008C14.9665 0.583008 15.75 1.36651 15.75 2.33301ZM0 11.6663H2.33333V18.6663H0V11.6663ZM28 11.6663H25.6667V18.6663H28V11.6663ZM10.5 16.9163C11.4665 16.9163 12.25 16.1328 12.25 15.1663C12.25 14.1999 11.4665 13.4163 10.5 13.4163C9.5335 13.4163 8.75 14.1999 8.75 15.1663C8.75 16.1328 9.5335 16.9163 10.5 16.9163ZM19.25 15.1663C19.25 14.1999 18.4665 13.4163 17.5 13.4163C16.5335 13.4163 15.75 14.1999 15.75 15.1663C15.75 16.1328 16.5335 16.9163 17.5 16.9163C18.4665 16.9163 19.25 16.1328 19.25 15.1663Z" fill="url(#paint0_linear_5209_365)"/>
                              <defs>
                                <linearGradient id="paint0_linear_5209_365" x1="1.67322" y1="48.8365" x2="37.0627" y2="15.9927" gradientUnits="userSpaceOnUse">
                                  <stop offset="0.124199" stop-color="#54A6FF"/>
                                  <stop offset="1" stop-color="#9A6CFF"/>
                                </linearGradient>
                              </defs>
                            </svg>
                        </div>
                         <div
                            className="info">
                            <div
                                className="label">
                                异常天气影响分析智能体
                            </div>
                            <div
                                className="descr">
                                描述：分析异常天气给企业经营带来的影响，提供应对方案。
                            </div>
                        </div>
                    </div>
                    <svg className="border-bottom" xmlns="http://www.w3.org/2000/svg" width="1514" height="1" viewBox="0 0 1514 1" fill="none">
                    <path d="M0 0.501953H1514" stroke="url(#paint0_linear_5209_357)"/>
                    <defs>
                    <linearGradient id="paint0_linear_5209_357" x1="1514" y1="0.513977" x2="36.4078" y2="0.513977" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#50576E" stop-opacity="0.5"/>
                    <stop offset="0.538528" stop-color="#50576E"/>
                    <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                    </linearGradient>
                    </defs>
                    </svg>
                </div>
                <div
                    className="build-step-3-main">
                    <div
                        className="build-step-3-menu">
                        <div
                            className="step-list">
                            {[
                                {
                                    key: 1,
                                    label: '添加知识',
                                    descr: '添加本体生成的知识'
                                },
                                {
                                    key: 2,
                                    label: '添加MCP服务',
                                    descr: '添加本体生成的MCP服务'
                                }
                            ].map((step, index) => {
                                return (
                                    <div
                                        className={`step-item ${stepActive === step.key ? 'active' : ''} ${stepActive > step.key ? 'finish' : ''}`}
                                        onClick={() => {
                                            this.setState({
                                                stepActive: step.key
                                            })
                                        }}>
                                        <div
                                            className="step-icon">
                                            {stepActive === step.key || stepActive > step.key ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none">
                                                  <g filter="url(#filter0_i_5209_369)">
                                                    <rect width="42" height="42" rx="21" fill="url(#paint0_linear_5209_369)"/>
                                                  </g>
                                                  <rect x="0.5" y="0.5" width="41" height="41" rx="20.5" stroke="url(#paint1_linear_5209_369)"/>
                                                  <mask id="mask0_5209_369" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="42" height="42">
                                                    <rect x="0.5" y="0.5" width="41" height="41" rx="20.5" fill="white" stroke="white"/>
                                                  </mask>
                                                  <g mask="url(#mask0_5209_369)">
                                                    <g filter="url(#filter1_f_5209_369)">
                                                      <path d="M-5.46953 11.5246C-6.14422 3.89669 0.365733 -3.30582 9.07086 -4.56261C17.776 -5.8194 25.3798 -0.654553 26.0545 6.9734C26.7292 14.6014 20.2193 21.8039 11.5141 23.0607C2.80901 24.3174 -4.79484 19.1526 -5.46953 11.5246Z" fill="#A457EB"/>
                                                    </g>
                                                  </g>
                                                  <defs>
                                                    <filter id="filter0_i_5209_369" x="0" y="-4" width="42" height="46" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                                      <feOffset dy="-4"/>
                                                      <feGaussianBlur stdDeviation="5"/>
                                                      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                                      <feColorMatrix type="matrix" values="0 0 0 0 0.670216 0 0 0 0 0.660201 0 0 0 0 0.89054 0 0 0 0.200175 0"/>
                                                      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_5209_369"/>
                                                    </filter>
                                                    <filter id="filter1_f_5209_369" x="-21.8273" y="-21.0607" width="64.2405" height="60.6194" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                                      <feGaussianBlur stdDeviation="8.15485" result="effect1_foregroundBlur_5209_369"/>
                                                    </filter>
                                                    <linearGradient id="paint0_linear_5209_369" x1="10.5" y1="21" x2="10.5" y2="42" gradientUnits="userSpaceOnUse">
                                                      <stop stop-color="#4C4EB5"/>
                                                      <stop offset="1" stop-color="#958AE3"/>
                                                    </linearGradient>
                                                    <linearGradient id="paint1_linear_5209_369" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
                                                      <stop stop-color="#C1CAFF"/>
                                                      <stop offset="1" stop-color="#5A53FF" stop-opacity="0.01"/>
                                                    </linearGradient>
                                                  </defs>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none">
                                                    <foreignObject x="-27.1828" y="-27.1828" width="96.3656" height="96.3656">
                                                        <div xmlns="http://www.w3.org/1999/xhtml"
                                                            style={{
                                                                backdropFilter: 'blur(13.59px)',
                                                                clipPath: 'url(#bgblur_0_5209_379_clip_path)',
                                                                height: '100%',
                                                                width: '100%'
                                                            }}>
                                                        </div>
                                                    </foreignObject>
                                                    <path data-figma-bg-blur-radius="27.1828" d="M21 0.5C32.3218 0.5 41.5 9.67816 41.5 21C41.5 32.3218 32.3218 41.5 21 41.5C9.67816 41.5 0.5 32.3218 0.5 21C0.5 9.67816 9.67816 0.5 21 0.5Z" fill="url(#paint0_linear_5209_379)" stroke="url(#paint1_linear_5209_379)"/>
                                                    <defs>
                                                        <clipPath id="bgblur_0_5209_379_clip_path" transform="translate(27.1828 27.1828)"><path d="M21 0.5C32.3218 0.5 41.5 9.67816 41.5 21C41.5 32.3218 32.3218 41.5 21 41.5C9.67816 41.5 0.5 32.3218 0.5 21C0.5 9.67816 9.67816 0.5 21 0.5Z"/>
                                                        </clipPath>
                                                        <linearGradient id="paint0_linear_5209_379" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
                                                            <stop stop-color="#57619B" stop-opacity="0.4"/>
                                                            <stop offset="1" stop-color="#2C3262" stop-opacity="0.4"/>
                                                        </linearGradient>
                                                        <linearGradient id="paint1_linear_5209_379" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
                                                            <stop stop-color="white" stop-opacity="0.6"/>
                                                            <stop offset="1" stop-color="white" stop-opacity="0.01"/>
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            )}
                                            <div
                                                className="text">
                                                {step.key < stepActive ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                      <path d="M1.66797 9.58333L3.16797 8.08333L8.0013 13.0833L16.8346 3.75L18.3346 5.41667L8.0013 16.25L1.66797 9.58333Z" fill="white" stroke="white" stroke-width="1.25"/>
                                                    </svg>
                                                ) : step.key}
                                            </div>
                                        </div>
                                        <div
                                            className="step-info">
                                            <div
                                                className="label">
                                                {step.label}
                                            </div>
                                            <div
                                                className="descr">
                                                {step.descr}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="2" height="830" viewBox="0 0 2 830" fill="none">
                          <path d="M1 0.5V830" stroke="url(#paint0_linear_5209_344)"/>
                          <defs>
                            <linearGradient id="paint0_linear_5209_344" x1="2" y1="324" x2="2.94258e-06" y2="323.998" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#2E3345" stop-opacity="0.01"/>
                              <stop offset="0.461472" stop-color="#50576E"/>
                              <stop offset="1" stop-color="#5B627B" stop-opacity="0.01"/>
                            </linearGradient>
                          </defs>
                        </svg>
                    </div>
                    <div
                        className="build-step-3-content">
                        {stepActive === 1 && (
                            <div
                            className="add-knowledge">
                            <div
                                className="add-knowledge-content">
                                <div
                                    className="label">
                                    添加知识
                                </div>
                                <div
                                    className="descr">
                                    添加本体生成的知识
                                </div>
                                <div
                                    className="card-list">
                                    <div
                                        className="card-item">
                                        <div
                                            className="radio">
                                            <div
                                                className="radio-item">
                                            </div>
                                        </div>
                                        <div
                                            className="icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M17.6544 1.7002L14.8716 4.23334C16.147 4.6235 17.3453 5.28121 18.3612 6.20645C21.8744 9.40625 21.8744 14.5942 18.3612 17.794C15.7696 20.1544 11.7644 21.6565 6.3456 22.3002L9.12838 19.7671C7.85304 19.3769 6.65466 18.7192 5.6388 17.794C2.1256 14.5942 2.1048 9.4252 5.6388 6.20645C8.2304 3.84604 12.2356 2.34395 17.6544 1.7002ZM12 8.0002C9.51472 8.0002 7.5 9.79105 7.5 12.0002C7.5 14.2094 9.51472 16.0002 12 16.0002C14.4853 16.0002 16.5 14.2094 16.5 12.0002C16.5 9.79105 14.4853 8.0002 12 8.0002Z" fill="white"/>
                                            </svg>
                                        </div>
                                        <div
                                            className="label">
                                            异常天气影响分析
                                        </div>
                                        <div
                                            className="oper">
                                            <Button
                                                onClick={() => {
                                                    this.setState({
                                                        knowledgeDetailVisible: true
                                                    })
                                                }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="124" height="44" viewBox="0 0 124 44" fill="none">
                                                  <g filter="url(#filter0_i_5209_405)">
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint0_linear_5209_405)"/>
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint1_radial_5209_405)"/>
                                                  </g>
                                                  <path d="M12 0.5H112C118.351 0.5 123.5 5.64873 123.5 12V32C123.5 38.3513 118.351 43.5 112 43.5H12C5.64873 43.5 0.5 38.3513 0.5 32V12C0.5 5.64873 5.64873 0.5 12 0.5Z" stroke="url(#paint2_linear_5209_405)"/>
                                                  <defs>
                                                    <filter id="filter0_i_5209_405" x="0" y="-4" width="124" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                                      <feOffset dy="-4"/>
                                                      <feGaussianBlur stdDeviation="5"/>
                                                      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                                      <feColorMatrix type="matrix" values="0 0 0 0 0.670216 0 0 0 0 0.660201 0 0 0 0 0.89054 0 0 0 0.200175 0"/>
                                                      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_5209_405"/>
                                                    </filter>
                                                    <linearGradient id="paint0_linear_5209_405" x1="59.3735" y1="0" x2="59.3735" y2="42.945" gradientUnits="userSpaceOnUse">
                                                      <stop stop-color="#6861D1"/>
                                                      <stop offset="1" stop-color="#8A9FE3"/>
                                                    </linearGradient>
                                                    <radialGradient id="paint1_radial_5209_405" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14.5 4) rotate(146.553) scale(65.3165 74.7523)">
                                                      <stop stop-color="#9956E4"/>
                                                      <stop offset="1" stop-color="#9956E4" stop-opacity="0"/>
                                                    </radialGradient>
                                                    <linearGradient id="paint2_linear_5209_405" x1="-18.451" y1="5.59353" x2="-14.259" y2="52.0597" gradientUnits="userSpaceOnUse">
                                                      <stop stop-color="#BEC5FF"/>
                                                      <stop offset="1" stop-color="#29283F" stop-opacity="0.01"/>
                                                    </linearGradient>
                                                  </defs>
                                                </svg>
                                                <span
                                                    className="text">
                                                    详情
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="add-knowledge-footer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1260" height="1" viewBox="0 0 1260 1" fill="none">
                                  <path d="M0.5 0.5H1260" stroke="url(#paint0_linear_5209_340)"/>
                                  <defs>
                                    <linearGradient id="paint0_linear_5209_340" x1="1505" y1="0.512024" x2="27.4086" y2="0.512024" gradientUnits="userSpaceOnUse">
                                      <stop stop-color="#50576E" stop-opacity="0.5"/>
                                      <stop offset="0.538528" stop-color="#50576E"/>
                                      <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <Button
                                    onClick={() => {
                                        this.setState({
                                            stepActive: 2
                                        })
                                    }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="124" height="44" viewBox="0 0 124 44" fill="none">
                                      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint0_linear_5209_386)"/>
                                      <mask id="mask0_5209_386" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="124" height="44">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="white"/>
                                      </mask>
                                      <g mask="url(#mask0_5209_386)">
                                        <g filter="url(#filter0_f_5209_386)">
                                          <path d="M45.9217 23.5449C44.1692 15.7276 61.0781 8.34627 83.6887 7.05828C106.299 5.77028 126.049 11.0634 127.802 18.8807C129.554 26.698 112.645 34.0793 90.0349 35.3673C67.4243 36.6553 47.6741 31.3623 45.9217 23.5449Z" fill="#7547EA"/>
                                        </g>
                                        <g filter="url(#filter1_f_5209_386)">
                                          <path d="M-9.30098 24.8496C-11.0534 17.0323 5.85547 9.65096 28.4661 8.36296C51.0767 7.07497 70.8268 12.368 72.5793 20.1854C74.3317 28.0027 57.4228 35.384 34.8122 36.672C12.2016 37.96 -7.54854 32.6669 -9.30098 24.8496Z" fill="#646EE3"/>
                                        </g>
                                      </g>
                                      <defs>
                                        <filter id="filter0_f_5209_386" x="18.6141" y="-20.3176" width="136.495" height="83.0609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                          <feGaussianBlur stdDeviation="13.5914" result="effect1_foregroundBlur_5209_386"/>
                                        </filter>
                                        <filter id="filter1_f_5209_386" x="-36.6086" y="-19.0129" width="136.495" height="83.0609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                          <feGaussianBlur stdDeviation="13.5914" result="effect1_foregroundBlur_5209_386"/>
                                        </filter>
                                        <linearGradient id="paint0_linear_5209_386" x1="0" y1="44" x2="124" y2="44" gradientUnits="userSpaceOnUse">
                                          <stop stop-color="#1D4BFF"/>
                                          <stop offset="1" stop-color="#DF23FE"/>
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <span
                                        className="text">
                                        下一步
                                    </span>
                                </Button>
                            </div>
                            </div>
                        )}
                        {stepActive === 2 && (
                            <div
                                className="add-service">
                                <div
                                    className="add-service-content">
                                    <div
                                        className="label">
                                        添加MCP服务
                                    </div>
                                    <div
                                        className="descr">
                                        添加本体生成的MCP服务，该服务中包括：？
                                    </div>
                                    <div
                                        className="card-list">
                                        <div
                                            className="card-item">
                                            <div
                                                className="radio">
                                                <div
                                                    className="radio-item">
                                                </div>
                                            </div>
                                            <div
                                                className="icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                  <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM4.5 7.65788V16.3469L12 20.689V12L4.5 7.65788Z" fill="white"/>
                                                </svg>
                                            </div>
                                            <div
                                                className="info">
                                                <div
                                                    className="label">
                                                    ontology_service
                                                </div>
                                                <div
                                                    className="descr">
                                                    Tools that call the ontology REST API and return structured results.
                                                </div>
                                                
                                            </div>
                                            <div
                                                className="oper">
                                                <Button
                                                    onClick={() => {
                                                        this.setState({
                                                            serviceDetailVisible: true
                                                        })
                                                    }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="124" height="44" viewBox="0 0 124 44" fill="none">
                                                      <g filter="url(#filter0_i_5209_405)">
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint0_linear_5209_405)"/>
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint1_radial_5209_405)"/>
                                                      </g>
                                                      <path d="M12 0.5H112C118.351 0.5 123.5 5.64873 123.5 12V32C123.5 38.3513 118.351 43.5 112 43.5H12C5.64873 43.5 0.5 38.3513 0.5 32V12C0.5 5.64873 5.64873 0.5 12 0.5Z" stroke="url(#paint2_linear_5209_405)"/>
                                                      <defs>
                                                        <filter id="filter0_i_5209_405" x="0" y="-4" width="124" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                                          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                                          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                                          <feOffset dy="-4"/>
                                                          <feGaussianBlur stdDeviation="5"/>
                                                          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                                          <feColorMatrix type="matrix" values="0 0 0 0 0.670216 0 0 0 0 0.660201 0 0 0 0 0.89054 0 0 0 0.200175 0"/>
                                                          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_5209_405"/>
                                                        </filter>
                                                        <linearGradient id="paint0_linear_5209_405" x1="59.3735" y1="0" x2="59.3735" y2="42.945" gradientUnits="userSpaceOnUse">
                                                          <stop stop-color="#6861D1"/>
                                                          <stop offset="1" stop-color="#8A9FE3"/>
                                                        </linearGradient>
                                                        <radialGradient id="paint1_radial_5209_405" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14.5 4) rotate(146.553) scale(65.3165 74.7523)">
                                                          <stop stop-color="#9956E4"/>
                                                          <stop offset="1" stop-color="#9956E4" stop-opacity="0"/>
                                                        </radialGradient>
                                                        <linearGradient id="paint2_linear_5209_405" x1="-18.451" y1="5.59353" x2="-14.259" y2="52.0597" gradientUnits="userSpaceOnUse">
                                                          <stop stop-color="#BEC5FF"/>
                                                          <stop offset="1" stop-color="#29283F" stop-opacity="0.01"/>
                                                        </linearGradient>
                                                      </defs>
                                                    </svg>
                                                    <span
                                                        className="text">
                                                        详情
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="add-service-footer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1260" height="1" viewBox="0 0 1260 1" fill="none">
                                      <path d="M0.5 0.5H1260" stroke="url(#paint0_linear_5209_340)"/>
                                      <defs>
                                        <linearGradient id="paint0_linear_5209_340" x1="1505" y1="0.512024" x2="27.4086" y2="0.512024" gradientUnits="userSpaceOnUse">
                                          <stop stop-color="#50576E" stop-opacity="0.5"/>
                                          <stop offset="0.538528" stop-color="#50576E"/>
                                          <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <Button
                                        onClick={() => this.props.push('agent-app')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="124" height="44" viewBox="0 0 124 44" fill="none">
                                          <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="url(#paint0_linear_5209_386)"/>
                                          <mask id="mask0_5209_386" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="124" height="44">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 5.37258 5.37258 0 12 0H112C118.627 0 124 5.37258 124 12V32C124 38.6274 118.627 44 112 44H12C5.37259 44 0 38.6274 0 32V12Z" fill="white"/>
                                          </mask>
                                          <g mask="url(#mask0_5209_386)">
                                            <g filter="url(#filter0_f_5209_386)">
                                              <path d="M45.9217 23.5449C44.1692 15.7276 61.0781 8.34627 83.6887 7.05828C106.299 5.77028 126.049 11.0634 127.802 18.8807C129.554 26.698 112.645 34.0793 90.0349 35.3673C67.4243 36.6553 47.6741 31.3623 45.9217 23.5449Z" fill="#7547EA"/>
                                            </g>
                                            <g filter="url(#filter1_f_5209_386)">
                                              <path d="M-9.30098 24.8496C-11.0534 17.0323 5.85547 9.65096 28.4661 8.36296C51.0767 7.07497 70.8268 12.368 72.5793 20.1854C74.3317 28.0027 57.4228 35.384 34.8122 36.672C12.2016 37.96 -7.54854 32.6669 -9.30098 24.8496Z" fill="#646EE3"/>
                                            </g>
                                          </g>
                                          <defs>
                                            <filter id="filter0_f_5209_386" x="18.6141" y="-20.3176" width="136.495" height="83.0609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                              <feGaussianBlur stdDeviation="13.5914" result="effect1_foregroundBlur_5209_386"/>
                                            </filter>
                                            <filter id="filter1_f_5209_386" x="-36.6086" y="-19.0129" width="136.495" height="83.0609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                              <feGaussianBlur stdDeviation="13.5914" result="effect1_foregroundBlur_5209_386"/>
                                            </filter>
                                            <linearGradient id="paint0_linear_5209_386" x1="0" y1="44" x2="124" y2="44" gradientUnits="userSpaceOnUse">
                                              <stop stop-color="#1D4BFF"/>
                                              <stop offset="1" stop-color="#DF23FE"/>
                                            </linearGradient>
                                          </defs>
                                        </svg>
                                        <span
                                            className="text"
                                            >
                                            保存
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            <Drawer
                width={470}
                title={<span>本体图谱</span>}
                getPopupContainer={() => {
                    return document.querySelector('.screen-content')
                }}
                footer={null}
                visible={knowledgeDetailVisible}
                onOk={() => {
                    this.setState({
                        knowledgeDetailVisible: false
                    })
                }}
                onCancel={() => {
                    this.setState({
                        knowledgeDetailVisible: false
                    })
                }}>
                <div
                    style={{
                        width: '320px',
                        height: '100%',
                        margin: '0px auto'
                    }}>
                    <Flow/>
                </div>
            </Drawer>
            <Drawer
                width={470}
                title={<span>MCP服务详情</span>}
                getPopupContainer={() => {
                    return document.querySelector('.screen-content')
                }}
                footer={null}
                visible={serviceDetailVisible}
                onOk={() => {
                    this.setState({
                        serviceDetailVisible: false
                    })
                }}
                onCancel={() => {
                    this.setState({
                        serviceDetailVisible: false
                    })
                }}>
                <div
                    style={{
                        width: '430px',
                        // height: '100%',
                        margin: '0px auto',
                        paddingTop: '20px',
                        marginBottom: '20px'
                    }}>
                    <Title className="publish-drawer-title">MCP服务</Title>
                    <Form layout="vertical">
                      <FormItem label="服务名称" required>
                        <Input value={'ontology_service'} disabled placeholder="请输入" style={{ width: '300px' }} />
                      </FormItem>
                    </Form>
                    <Title className="publish-drawer-title">动作</Title>
                    <Table
                      columns={actionColumns}
                      data={actionData}
                      borderCell={true}
                      pagination={false}
                      style={{ marginBottom: '30px' }}
                    />
                    <Title className="publish-drawer-title">逻辑</Title>
                    <Table columns={logicColumns} data={logicData} borderCell={true} pagination={false} />
                </div>
            </Drawer>
            </>
        )
    }
}

export default Step3;

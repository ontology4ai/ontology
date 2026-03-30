import React, { useState, useEffect, useMemo } from 'react'
import { withTranslation } from 'react-i18next';
import { Tabs, Table, Button, Switch, Input } from '@arco-design/web-react';
import RoundRect from '../../../../../../components/RoundRect'
import Bar from '../Bar'
import Line from '../Line'
import Pie from '../Pie';
import aiIcon from '../../../../imgs/ai.png';
import imgPieTitleSvg from '../../../../imgs/img-pie-title.svg';
import barChartZh from '../../../../imgs/bar-zh.png';
import barChartEn from '../../../../imgs/bar-en.png';

const TabPane = Tabs.TabPane;

const renderItem = (item, send, thinkPreVisible = true) => {
    if (item.type === 'tip') {
        return (
            <div
                className="tip"
                onClick={() => {
                    send(item.key)
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path opacity="0.25" fill-rule="evenodd" clip-rule="evenodd" d="M16.5 8.99998C16.5 10.9891 15.7098 12.8968 14.3033 14.3033C12.8968 15.7098 10.9891 16.5 9 16.5H2.4053C2.33113 16.5 2.25863 16.478 2.19696 16.4368C2.13529 16.3956 2.08723 16.337 2.05885 16.2685C2.03046 16.2 2.02304 16.1246 2.0375 16.0518C2.05197 15.9791 2.08768 15.9123 2.14013 15.8598L3.69668 14.3033C2.82455 13.4311 2.18097 12.3574 1.82294 11.1771C1.46491 9.99684 1.40349 8.74648 1.64412 7.5368C1.88474 6.32712 2.41998 5.19546 3.20243 4.24204C3.98488 3.28863 4.99039 2.5429 6.12988 2.0709C7.26938 1.59891 8.50769 1.41522 9.73513 1.53612C10.9626 1.65701 12.1413 2.07875 13.1668 2.76398C14.1923 3.44921 15.033 4.37677 15.6144 5.46452C16.1958 6.55226 16.5 7.7666 16.5 8.99998ZM5.25 7.87498H6.75V10.125H5.25V7.87498ZM11.25 7.87498H12.75V10.125H11.25V7.87498ZM8.25 7.87498H9.75V10.125H8.25V7.87498Z" fill="white"/>
                    <path d="M5.25 7.875H6.75V10.125H5.25V7.875ZM8.25 7.875H9.75V10.125H8.25V7.875ZM12.75 7.875H11.25V10.125H12.75V7.875Z" fill="white"/>
                    <path d="M5.25 7.875H6.75V10.125H5.25V7.875ZM8.25 7.875H9.75V10.125H8.25V7.875ZM12.75 7.875H11.25V10.125H12.75V7.875Z" fill="white"/>
                </svg>
                <span
                    className="text">
                    {item.data}
                </span>
            </div>
        )
    }
    if (item.type === 'pre') {
        return (
            <pre>
                {item.data}
            </pre>
        )
    }
    if (item.type === 'think-pre') {
        return (
            <div className={`think-pre ${thinkPreVisible ? '' : 'think-pre-hidden'}`}>
                <pre>
                    {item.data}
                </pre>
            </div>
        )
    }
    if (item.type === 'text') {
        return (
            <div  className="text">
                {item.data}
            </div>
        )
    }
    if (item.type === 'text-700') {
        return (
            <div className="text-700">
                {item.data}
            </div>
        )
    }
    if (item.type === 'text-16') {
        return (
            <div className="text-16">
                {item.data}
            </div>
        )
    }
    if (item.type === 'text-500') {
        return (
            <div className="text-500">
                {item.data}
            </div>
        )
    }
    if (item.type === 'text-500-fff') {
        return (
            <div className="text-500-fff">
                {item.data}
            </div>
        )
    }
    if (item.type === 'text-light') {
        return (
            <div className="text-light">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="18" viewBox="0 0 13 18" fill="none">
                    <path d="M6.49964 0C2.92431 0 -0.0122625 2.76452 3.85058e-05 6.26099C3.85058e-05 8.81591 1.29455 10.7533 2.84378 11.7392V14.8696C2.84378 15.6736 3.23692 16.0435 4.06252 16.0435H8.93748C9.76229 16.0435 10.1562 15.6728 10.1562 14.8696V11.7392C11.7078 10.7556 13.0019 8.81821 13 6.26101C13.0123 2.76376 10.0757 0 6.49964 0ZM8.9375 14.4783C8.96488 14.7305 8.73321 14.8696 8.53127 14.8696H4.46877C4.2708 14.8688 4.06254 14.6701 4.06254 14.4783V13.3044H8.9375V14.4783ZM8.9375 10.9566V12.1305H4.06254V10.9566C4.06254 10.9566 1.21681 9.95008 1.2188 6.26101C1.2188 3.37595 3.54083 1.17392 6.50004 1.17392C9.44891 1.17392 11.7916 3.37595 11.7813 6.26101C11.786 9.95237 8.9375 10.9566 8.9375 10.9566ZM8.75265 16.8261H4.25017C3.9221 16.8261 3.65626 17.089 3.65626 17.4131C3.65626 17.7371 3.92208 18 4.25017 18H8.75265C8.90974 17.9992 9.06009 17.9373 9.1712 17.8273C9.28189 17.7165 9.34378 17.5674 9.34339 17.4123C9.34337 17.089 9.07914 16.8269 8.75265 16.8261Z" fill="url(#paint0_linear_0_52908)"/>
                    <defs>
                        <linearGradient id="paint0_linear_0_52908" x1="10.5529" y1="17.5756" x2="3.45824" y2="0.858527" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#83FE4D"/>
                        <stop offset="1" stop-color="#30FD98"/>
                        </linearGradient>
                    </defs>
                </svg>
                <span className="text">{item.data}</span>
            </div>
        )
    }
    if (item.type === 'text-detail') {
        return (
            <div className="text-detail">
                {item.data.map((data, index) => {
                    return (
                        <div className="detail-item-container" key={index}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8.00008 0L10.7826 5.21741L16 7.99992L10.7826 10.7826L8.00008 16L5.21741 10.7826L0 7.99992L5.21741 5.21741L8.00008 0Z" fill="url(#paint0_linear_0_52964)" />
                                <defs>
                                    <linearGradient id="paint0_linear_0_52964" x1="0" y1="8" x2="16" y2="8" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#30FD98" />
                                        <stop offset="1" stop-color="#83FE4D" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="detail-item-content">
                                <div className="text-detail-item">
                                    <div className="text-detail-item-title">{data.title}：</div>
                                    <div className="text-detail-item-content">{data.content}</div>
                                </div>
                                <div className="text-detail-item-details">
                                    {data.details && data.details.map(detail => {
                                        return (
                                            <div className="text-detail-item-details-item">
                                                <div className="text-detail-item-details-item-title">{detail.title}</div>
                                                <div className="text-detail-item-details-item-content">{detail.data}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    if (item.type === 'table') {
        return (
            <Table
                border={false}
                pageSize={10}
                scroll={{
                    x: true
                }}
                pagination={false}
                {...item.data}/>
        )
    }
    if (item.type === 'tabs') {
        return (
            <Tabs
                type="capsule">
                {item.data.map(t => {
                    return (
                        <TabPane
                            key={t.title}
                            title={t.title}>
                            {t.tab.map(p => {
                                return renderItem(p)
                            })}
                        </TabPane>
                    )
                })}
            </Tabs>
        )
    }
    if (item.type === 'oper-group') {
        return (
            <div
                className="oper-group">
                <div>
                {item.data.map(b => {
                    return (
                        <Button
                            onClick={() => send(b.key)}>
                            <RoundRect
                                width={124}
                                height={50}
                                radius={12}
                                x1={'0%'}
                                y1={'0%'}
                                x2={'100%'}
                                y2={'0%'}
                                color1={'rgba(29, 75, 255, 1)'}
                                color2={'rgba(223, 35, 254, 1)'}/>
                            <div
                                className="button-content">
                                {b.text}
                            </div>
                        </Button>
                    )
                })}
                </div>
            </div>
        )
    }
    if (item.type === 'line-chart') {
        return <Line/>
    }
    if (item.type === 'bar-chart') {
        return <Bar/>
    }
    if (item.type === 'pie-chart') {
        return <Pie/>
    }
    if (item.type === 'bar-chart-zh') {
        return <div className="bar-chart-zh">
            <img src={barChartZh} alt="" />
        </div>
    }
    if (item.type === 'bar-chart-en') {
        return <div className="bar-chart-en">
            <img src={barChartEn} alt="" />
        </div>
    }
    if (item.type === 'img-pie') {
        return <div className="img-pie"> 
                    <div className="img-pie-title">
                        <div className="img-pie-title-text">
                            <img className="img-pie-title-svg" src={imgPieTitleSvg} alt="" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
                                <g filter="url(#filter0_i_0_52836)">
                                    <circle cx="50" cy="50" r="50" fill="url(#paint0_linear_0_52836)" fill-opacity="0.3"/>
                                </g>
                                <circle cx="50" cy="50" r="49.5" stroke="url(#paint1_linear_0_52836)"/>
                                <defs>
                                    <filter id="filter0_i_0_52836" x="0" y="-4" width="100" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                    <feOffset dy="-4"/>
                                    <feGaussianBlur stdDeviation="5"/>
                                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                    <feColorMatrix type="matrix" values="0 0 0 0 0.670216 0 0 0 0 0.660201 0 0 0 0 0.89054 0 0 0 0.200175 0"/>
                                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_52836"/>
                                    </filter>
                                    <linearGradient id="paint0_linear_0_52836" x1="38.3499" y1="54.766" x2="47.8818" y2="97.6024" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#6861D1"/>
                                    <stop offset="1" stop-color="#8A9FE3"/>
                                    </linearGradient>
                                    <linearGradient id="paint1_linear_0_52836" x1="-14.8799" y1="12.7126" x2="10.5453" y2="112.713" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#BEC5FF"/>
                                    <stop offset="1" stop-color="#29283F" stop-opacity="0.01"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            {item.data.title}

                        </div>
                    </div>
                    <div className="img-pie-content">
                        {item.data.data.map((item, i) => {
                            return (
                                <div className="pie-data-item" key={i}>
                                    <div className="pie-data-item-name">
                                      <div className="pie-data-item-color" style={{background:item.color}}/>{item.name}
                                    </div>
                                    <div className="pie-data-item-value" style={{color:item.color}}>
                                        {item.value}
                                    </div>
                                </div>
                            )
                        })}
                    </div>  
             </div>
    }
}

class Message extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentData: [],
            loading: true,
            animate: true,
            thinkPreVisible: true,
            thinkDurationSec: null
        };
        this.aniRef = React.createRef();
        this.thinkStartTimeRef = { current: 0 };
    }
    stopAni = () => {
        this.setState({
            animate: false,
            loading: false
        })
    }
    init = () => {
        const {
            data
        } = this.props;
        // 历史渲染：不播放“打字/逐字”动画，直接展示最终结果
        if (this.props.disableTypingAnimation) {
            this.setState({
                currentData: Array.isArray(data) ? data : [],
                loading: false,
                animate: false,
            });
            return;
        }
        // 英文：每 6ms 出 1 个字；中文：每 15ms 出 1 个字
        const lang = (this.props as any).i18n?.language || '';
        const isChinese = /^zh(-|$)/i.test(lang);
        const CHARS_PER_TICK = 1;
 
        console.log(lang, CHARS_PER_TICK, 'lang-------')
      
        this.thinkStartTimeRef.current = Date.now();
        let index = 0;
        const ani = () => {
            if (!this.state.animate) {
                return;
            }
            this.props.scrollToBottom()
            // this.aniRef = requestAnimationFrame(() => {
            this.aniRef = setTimeout(() => {
                if (!data[index]) {
                    const durationSec = (Date.now() - this.thinkStartTimeRef.current) / 1000;
                    this.setState(() => {
                        return {
                            loading: false,
                            thinkDurationSec: durationSec
                        }
                    }, () => {
                        this.props.onThinkComplete?.(durationSec);
                    });
                    return
                }
                const cData = [...this.state.currentData]
                if (['text','text-700', 'text-500', 'text-500-fff', 'text-16', 'pre', 'think-pre', 'tip'].indexOf(data[index].type) > -1) {
                    if (cData[index]) {
                        if (cData[index].data.length < data[index].data.length) {
                            const nextLen = Math.min(cData[index].data.length + CHARS_PER_TICK, data[index].data.length);
                            cData[index].data = data[index].data.substring(0, nextLen);
                            let text = cData[index].data;
                            this.setState(() => {
                                return{
                                    currentData: cData
                                }
                            }, () => {
                                // 不再根据打字末尾引号自动选中图上节点
                                // const matchs = text.match(/“[^“”]+”$/);
                                // if (matchs) {
                                //     this.props.select(matchs[0])
                                // }
                                ani()
                            })
                        } else {
                            index++;
                            ani()
                        }
                    } else {
                        cData[index] = {
                            ...data[index],
                            data: data[index].data.substring(0, Math.min(CHARS_PER_TICK, data[index].data.length))
                        }
                        this.setState(() => {
                            return {
                                currentData: cData
                            }
                        }, () => {
                            ani()
                        })
                    }
                } else {
                    if (data[index] && !cData[index]) {
                        this.setState(() => {
                            return {
                                currentData: [
                                    ...cData,
                                    data[index]
                                ],
                            }
                        }, () => {
                            index++;
                            ani()
                        })
                    } 
                }
            // })
            }, isChinese ? 15 : 6)
        }
        ani()
    }
    componentDidMount() {
        this.init();
    }
    componentDidUpdate(prevProps) {
        // 父组件在 messages 增加后异步更新 lastAnimateAiIndex，本条会从 disableTypingAnimation=true 变为 false，需重新开启动画
        if (prevProps.disableTypingAnimation === true && this.props.disableTypingAnimation === false) {
            clearTimeout(this.aniRef.current);
            this.setState({ currentData: [], loading: true, animate: true }, () => this.init());
        }
    }
    componentWillUnmount() {
        // cancelAnimationFrame(this.aniRef.current);}
        clearTimeout(this.aniRef.current);
    }
    render() {
        const {
            loading,
            currentData
        } = this.state;

        const {
            send
        } = this.props;
        const { t } = (this.props as any);

        return (
            <div
                className="message-item-container ai">
                <div
                    className="message-icon">
                        <img src={aiIcon} alt="" style={{height:'31px',verticalAlign:'middle'}} />
                                  
                     
                </div>
                <div
                    className="message-container">
                    <div
                        className="message ai">
                        <div
                            className={`deep-mind ${loading ? 'thinking' : 'finish'}  ${!this.state.thinkPreVisible ? 'collapsed' : ''}`}
                            >
                            <div
                                className="icon">
                                {loading ?
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path opacity="0.25" d="M10.0639 1.667C9.57728 1.65111 9.10425 1.82894 8.74862 2.16144C8.39299 2.49394 8.18381 2.95396 8.16699 3.44053C8.40881 5.59623 9.05219 7.68758 10.0639 9.60644C11.0727 7.68639 11.7159 5.5956 11.9608 3.44053C11.9411 2.95494 11.7311 2.49662 11.3761 2.16472C11.0211 1.83281 10.5497 1.65401 10.0639 1.667ZM16.8441 5.08719C16.6702 4.84757 16.4428 4.65182 16.18 4.51552C15.9171 4.37921 15.6261 4.3061 15.3301 4.302C14.9715 4.30022 14.6227 4.41926 14.3401 4.63993C12.8052 6.13141 11.566 7.89958 10.6879 9.85133C12.7802 9.5032 14.7873 8.76075 16.6025 7.66346C16.9701 7.34989 17.2009 6.90538 17.246 6.42435C17.2911 5.94332 17.147 5.46364 16.8441 5.08719Z" fill="#00FEE1" />
                                        <path d="M17.0351 10.0784C14.9641 9.8356 12.8657 9.99339 10.8543 10.5431C12.4208 11.9341 14.2355 13.0171 16.2034 13.7356C16.4343 13.7789 16.6715 13.7761 16.9013 13.7273C17.1311 13.6784 17.349 13.5846 17.5423 13.4511C17.7357 13.3176 17.9007 13.1472 18.0278 12.9496C18.155 12.7521 18.2417 12.5313 18.2831 12.3C18.4071 11.84 18.3459 11.3498 18.1126 10.9344C17.8792 10.5191 17.4924 10.2118 17.0351 10.0784ZM10.3308 10.9399C10.257 13.1247 10.5898 15.3041 11.3122 17.3674C11.4245 17.5817 11.5784 17.7714 11.7649 17.9256C11.9513 18.0797 12.1666 18.1952 12.3982 18.2652C12.6298 18.3352 12.873 18.3583 13.1136 18.3332C13.3542 18.3082 13.5875 18.2354 13.7996 18.1192C14.2465 17.9137 14.5951 17.5414 14.7708 17.082C14.9465 16.6226 14.9353 16.1126 14.7395 15.6614C13.5793 13.8248 12.0837 12.223 10.3308 10.9399ZM5.38856 15.6535C5.19671 16.1046 5.18948 16.613 5.36844 17.0694C5.54739 17.5258 5.89823 17.8937 6.34558 18.0942C6.55843 18.2082 6.79182 18.2787 7.03218 18.3018C7.27254 18.3248 7.51508 18.2998 7.74572 18.2283C7.97635 18.1568 8.19047 18.0402 8.37565 17.8853C8.56083 17.7303 8.71337 17.5401 8.82441 17.3257C9.52923 15.2593 9.84243 13.0795 9.74796 10.8982C8.01036 12.1969 6.53167 13.8099 5.38856 15.6535Z" fill="#00FEE1" />
                                        <path opacity="0.55" d="M3.58377 7.47792C5.35719 8.62172 7.33431 9.41326 9.4071 9.80927C8.58447 7.84524 7.40231 6.05211 5.9214 4.52207C5.73216 4.38029 5.51661 4.27757 5.2873 4.21988C5.05799 4.1622 4.81949 4.1507 4.58569 4.18607C4.35189 4.22143 4.12746 4.30295 3.92547 4.42587C3.72347 4.54879 3.54794 4.71067 3.4091 4.90207C3.09643 5.26943 2.93969 5.74443 2.97233 6.22573C3.00496 6.70703 3.22438 7.15612 3.58377 7.47792ZM3.02672 9.96947C2.54822 10.1056 2.14273 10.425 1.89824 10.8583C1.65375 11.2915 1.58998 11.8037 1.72078 12.2837C1.76398 12.5257 1.85442 12.7567 1.98696 12.9636C2.1195 13.1706 2.29152 13.3494 2.4932 13.4898C2.69487 13.6302 2.92225 13.7295 3.16232 13.782C3.40239 13.8345 3.65046 13.8391 3.89233 13.7957C5.95405 13.0572 7.85665 11.9336 9.49887 10.4847C7.39455 9.90012 5.19703 9.7252 3.02672 9.96947Z" fill="#00FEE1" />
                                    </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <g clip-path="url(#clip0_0_60025)">
                                            <path d="M10.0003 18.3337C5.39783 18.3337 1.66699 14.6028 1.66699 10.0003C1.66699 5.39783 5.39783 1.66699 10.0003 1.66699C14.6028 1.66699 18.3337 5.39783 18.3337 10.0003C18.3337 14.6028 14.6028 18.3337 10.0003 18.3337ZM9.16949 13.3337L15.0612 7.44116L13.8828 6.26283L9.16949 10.977L6.81199 8.61949L5.63366 9.79783L9.16949 13.3337Z" fill="#00FEE1" />
                                            <path d="M9.16949 13.3337L15.0612 7.44116L13.8828 6.26283L9.16949 10.977L6.81199 8.61949L5.63366 9.79783L9.16949 13.3337Z" fill="#2B1F52" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_0_60025">
                                                <rect width="20" height="20" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>}
                            </div>
                            {loading ? (
                                <div
                                    className="thinking">
                                    {t('agent.thinking')}
                                </div>
                            ) : (
                                <div
                                    className="text">
                                    {t('agent.deepThinkingCompleted')}
                                    <span className="time">{t('agent.timeUsed')}{Math.round(this.state.thinkDurationSec ?? (this.props as any).thinkDurationSec ?? 10)}s</span>
                                </div>
                            )}
                            
                            <div
                                className={`expand-icon ${!this.state.thinkPreVisible ? 'collapsed' : ''}`}
                                onClick={() => this.setState({ thinkPreVisible: !this.state.thinkPreVisible })}
                                role="button"
                                onKeyDown={(e) => e.key === 'Enter' && this.setState({ thinkPreVisible: !this.state.thinkPreVisible })}
                                tabIndex={0}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                    <g clipPath="url(#clip0_0_60031)">
                                        <path d="M11 14.667L5.5 9.16699H16.5L11 14.667Z" fill="white"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_0_60031">
                                        <rect width="22" height="22" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                        {currentData.map(item => {
                            return renderItem(item, send, this.state.thinkPreVisible)
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(Message);

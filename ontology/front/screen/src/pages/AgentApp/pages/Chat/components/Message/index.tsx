import React, { useState, useEffect, useMemo } from 'react'
import { Tabs, Table, Button, Switch, Input } from '@arco-design/web-react';
import RoundRect from '../../../../../../components/RoundRect'
import Bar from '../Bar'
import Line from '../Line'
import Pie from '../Pie'

const TabPane = Tabs.TabPane;

const renderItem = (item, send) => {
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
    if (item.type === 'text') {
        return (
            <div>
                {item.data}
            </div>
        )
    }
    if (item.type === 'table') {
        return (
            <Table
                border={false}
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
}

class Message extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentData: [],
            loading: true,
            animate: true
        };
        this.aniRef = React.createRef();
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
        let index = 0;
        const ani = () => {
            if (!this.state.animate) {
                return;
            }
            this.props.scrollToBottom()
            // this.aniRef = requestAnimationFrame(() => {
            this.aniRef = setTimeout(() => {
                if (!data[index]) {
                    this.setState(() => {
                        return {
                            loading: false
                        }
                    })
                    return
                }
                const cData = [...this.state.currentData]
                if (['text', 'pre', 'tip'].indexOf(data[index].type) > -1) {
                    if (cData[index]) {
                        if (cData[index].data.length < data[index].data.length) {
                            cData[index].data += data[index].data.substring(cData[index].data.length, cData[index].data.length + 1);
                            let text = cData[index].data;
                            this.setState(() => {
                                return{
                                    currentData: cData
                                }
                            }, () => {
                                const matchs = text.match(/“[^“”]+”$/);
                                if (matchs) {
                                    this.props.select(matchs[0])
                                }
                                ani()
                            })
                        } else {
                            index++;
                            ani()
                        }
                    } else {
                        cData[index] = {
                            ...data[index],
                            data: data[index].data.substring(0, 1)
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
            }, 20)
        }
        ani()
    }
    componentDidMount() {
        this.init();
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
            data,
            send
        } = this.props;

        return (
            <div
                className="message-item-container ai">
                <div
                    className="message-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M15.75 2.33301C15.75 2.8513 15.5247 3.31696 15.1667 3.6374V5.83301H21C22.9331 5.83301 24.5 7.40002 24.5 9.33301V20.9997C24.5 22.9327 22.9331 24.4997 21 24.4997H7C5.06701 24.4997 3.5 22.9327 3.5 20.9997V9.33301C3.5 7.40002 5.06701 5.83301 7 5.83301H12.8333V3.6374C12.4753 3.31696 12.25 2.8513 12.25 2.33301C12.25 1.36651 13.0335 0.583008 14 0.583008C14.9665 0.583008 15.75 1.36651 15.75 2.33301ZM0 11.6663H2.33333V18.6663H0V11.6663ZM28 11.6663H25.6667V18.6663H28V11.6663ZM10.5 16.9163C11.4665 16.9163 12.25 16.1328 12.25 15.1663C12.25 14.1999 11.4665 13.4163 10.5 13.4163C9.5335 13.4163 8.75 14.1999 8.75 15.1663C8.75 16.1328 9.5335 16.9163 10.5 16.9163ZM19.25 15.1663C19.25 14.1999 18.4665 13.4163 17.5 13.4163C16.5335 13.4163 15.75 14.1999 15.75 15.1663C15.75 16.1328 16.5335 16.9163 17.5 16.9163C18.4665 16.9163 19.25 16.1328 19.25 15.1663Z" fill="url(#paint0_linear_5141_794268)"/>
                      <defs>
                        <linearGradient id="paint0_linear_5141_794268" x1="16" y1="27.5" x2="16" y2="2" gradientUnits="userSpaceOnUse">
                          <stop offset="0.124199" stop-color="#E5E3FF"/>
                          <stop offset="0.697864" stop-color="white"/>
                        </linearGradient>
                      </defs>
                    </svg>
                </div>
                <div
                    className="message-container">
                    <div
                        className="message ai">
                        <div
                            className={`deep-mind ${loading ? 'thinking' : 'finish'}`}
                            >
                            <div
                                className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path opacity="0.25" d="M9.05778 1.4999C8.61984 1.48561 8.19412 1.64565 7.87405 1.94491C7.55399 2.24416 7.36573 2.65817 7.35059 3.09609C7.56822 5.03622 8.14727 6.91843 9.05778 8.64541C9.9657 6.91736 10.5446 5.03565 10.765 3.09609C10.7473 2.65906 10.5582 2.24657 10.2387 1.94786C9.91926 1.64914 9.49501 1.48822 9.05778 1.4999ZM15.16 4.57808C15.0035 4.36242 14.7988 4.18625 14.5623 4.06357C14.3257 3.9409 14.0638 3.8751 13.7974 3.87141C13.4746 3.8698 13.1608 3.97694 12.9064 4.17555C11.525 5.51788 10.4097 7.10923 9.61941 8.8658C11.5025 8.55249 13.3089 7.88429 14.9426 6.89672C15.2734 6.61451 15.4811 6.21445 15.5217 5.78153C15.5623 5.3486 15.4326 4.91689 15.16 4.57808Z" fill="#D425FE"/>
                                    <path d="M15.3321 9.07121C13.4682 8.85272 11.5796 8.99474 9.76938 9.48951C11.1792 10.7413 12.8125 11.7161 14.5835 12.3627C14.7913 12.4017 15.0048 12.3992 15.2117 12.3552C15.4185 12.3113 15.6146 12.2268 15.7886 12.1067C15.9626 11.9866 16.1111 11.8332 16.2255 11.6554C16.34 11.4775 16.418 11.2788 16.4553 11.0707C16.5669 10.6567 16.5118 10.2155 16.3018 9.84168C16.0918 9.46787 15.7437 9.19127 15.3321 9.07121ZM9.29817 9.84657C9.23181 11.8129 9.53134 13.7744 10.1815 15.6313C10.2826 15.8242 10.421 15.995 10.5889 16.1337C10.7567 16.2724 10.9504 16.3763 11.1589 16.4393C11.3673 16.5023 11.5862 16.5232 11.8027 16.5006C12.0193 16.478 12.2292 16.4125 12.4202 16.3079C12.8224 16.123 13.1361 15.7879 13.2942 15.3745C13.4523 14.961 13.4422 14.5021 13.266 14.096C12.2219 12.443 10.8758 11.0014 9.29817 9.84657ZM4.85019 14.0889C4.67753 14.4949 4.67102 14.9524 4.83208 15.3631C4.99314 15.7739 5.3089 16.105 5.71151 16.2854C5.90308 16.388 6.11313 16.4516 6.32945 16.4723C6.54578 16.493 6.76406 16.4705 6.97163 16.4062C7.1792 16.3418 7.37191 16.2369 7.53857 16.0974C7.70524 15.958 7.84252 15.7868 7.94246 15.5938C8.57679 13.734 8.85868 11.7722 8.77365 9.80907C7.20981 10.9779 5.87899 12.4296 4.85019 14.0889Z" fill="#D425FE"/>
                                    <path opacity="0.55" d="M3.2248 6.72974C4.82088 7.75916 6.60029 8.47154 8.4658 8.82795C7.72544 7.06033 6.66149 5.44651 5.32867 4.06947C5.15836 3.94187 4.96437 3.84942 4.75798 3.7975C4.5516 3.74559 4.33695 3.73524 4.12653 3.76707C3.91612 3.7989 3.71413 3.87226 3.53233 3.98289C3.35054 4.09352 3.19256 4.23921 3.0676 4.41147C2.7862 4.7421 2.64514 5.16959 2.67451 5.60276C2.70388 6.03593 2.90135 6.44012 3.2248 6.72974ZM2.72346 8.97213C2.29281 9.09468 1.92787 9.38211 1.70783 9.77205C1.48778 10.162 1.4304 10.623 1.54812 11.055C1.58699 11.2727 1.6684 11.4806 1.78768 11.6669C1.90696 11.8531 2.06178 12.014 2.24329 12.1404C2.4248 12.2668 2.62944 12.3562 2.8455 12.4034C3.06157 12.4506 3.28483 12.4548 3.50251 12.4157C5.35806 11.7511 7.0704 10.7398 8.54839 9.43586C6.6545 8.90972 4.67674 8.75229 2.72346 8.97213Z" fill="#D425FE"/>
                                </svg>
                            </div>
                            {loading ? (
                                <div
                                    className="thinking">
                                    正在思考中...
                                </div>
                            ) : (
                                <div
                                    className="text">
                                    深度思考完成
                                    {/*深度思考完成（用时15.7秒）*/}
                                </div>
                            )}
                            
                            {/*<div
                                className="expand-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                  <g opacity="0.8">
                                    <path d="M3 6.75L3.975 5.625L9 10.35L13.95 5.625L15 6.675L9 12.375L3 6.75Z" fill="white" stroke="white" stroke-width="0.3"/>
                                  </g>
                                </svg>
                            </div>*/}
                        </div>
                        {currentData.map(item => {
                            return renderItem(item, send)
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

export default Message;

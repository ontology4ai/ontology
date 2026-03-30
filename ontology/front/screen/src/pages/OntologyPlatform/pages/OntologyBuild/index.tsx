import React, { useState, useEffect, useMemo } from 'react'
import { Spin } from '@arco-design/web-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import titleEn from './imgs/title-en.svg';
import titleCn from './imgs/title-cn.svg';
import './style/index.less'

// 创建一个高阶组件或包装函数来处理国际化
const withI18n = (WrappedComponent) => {
  const WrapperComponent = (props) => {
    const { i18n, t } = useTranslation();
    return <WrappedComponent {...props} i18n={i18n} t={t} />;
  };
  return WrapperComponent;
};

class OntologyBuild extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pos: {
                top: 100,
                left: 100
            },
            data: {
                objectTypes: [],
                attributes: [],
                actions: []
            },
            tooltipLoading: false,
            linkPos: {
                top: 100,
                left: 100
            },
            linkData: '',
            linkTooltipVisible: false,
        };
    }
    
    getImagePath = (imageName) => {
        const { i18n } = this.props;
        const isEnglish = i18n && i18n.language && i18n.language.startsWith('en');
        
        // 定义图片映射对象
        const imageMap = {
          'title': isEnglish ? titleEn : titleCn,
        };
        
        // 返回对应的图片导入路径
        return imageMap[imageName] || `./imgs/${imageName}.png`;
      }
    
    switchActive = e => {
        // e.stopPropagation();
        // e.preventDefault();
        // this.props.switchActive(2);
    }
    selectNode = (e, objectName) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.switchActive(2);
        this.getData(objectName);
        this.props.setTooltipVisible(true);
        this.setState({
            linkTooltipVisible: false,
            pos: {
                top: e.target.offsetTop + 40,
                left: e.target.offsetLeft + 90
            }
        })
    }
    selectLink = (e, text) => {
        // e.preventDefault();
        // e.stopPropagation();
        const scale = document.body.offsetWidth / 1920;
        this.props.setTooltipVisible(false);
        this.setState({
            linkTooltipVisible: true,
            linkPos: {
                // top: e.target.offsetTop + 40,
                // left: e.target.offsetLeft + 90
                top: e.clientY / scale - 80,
                left: e.clientX / scale - 466
            },
            linkData: text
        })
    }
    getData = (objectName) => {
        this.setState({
            data: {
                objectTypes: [],
                attributes: [],
                actions: []
            },
            tooltipLoading: true
        })
        axios.get(
            '/ontology_show/_api/object/type/detail',
            {
                params: {
                    id: objectName
                }
            }
        ).then(res => {
            const { data } = res.data;
            const objectTypes = data.info ? [data.info.label] : [];
            const attributes = data.column ? data.column.map(item => item.label) : [];
            const actions = data.action ? data.action : [];
            
            this.setState({
                data: {
                    objectTypes: objectTypes,
                    attributes: attributes,
                    actions: actions
                }
            })
        }).catch(err => {

        }).finally(() => {
            this.setState({
                tooltipLoading: false
            })
        })
    }
    componentDidMount() {
    }
    render() {
        const { t, tooltipVisible, setTooltipVisible } = this.props; // 获取翻译函数和弹框状态
        const {
            pos,
            data,
            tooltipLoading,
            linkTooltipVisible,
            linkPos,
            linkData
        } = this.state;
        
        return (
            <div
            className={`ontology-build ${this.props.i18n?.language?.startsWith('en') ? 'en' : ''}`}
            onClick={e => {
                    if(/(icon|screen|car|air-line|airplane|building|ground\-top|ground\-bottom)/g.test(e.target.className)) {
                        // this.switchActive(e);
                    }
                    // 点击其他区域关闭弹框
                    if (tooltipVisible || linkTooltipVisible) {
                        setTooltipVisible(false);
                        this.setState({
                            linkTooltipVisible: false
                        })
                    }
                }}>
                
                <div
                    className="ontology-build-content">
                {tooltipVisible ? (
                    <div
                        className="tooltip"
                        style={{
                            position: 'absolute',
                            top: `${pos.top}px`,
                            left: `${pos.left}px`
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}>
                            <img className="tooltip-bg" src={new URL('../DataPrepare/imgs/tooltip_bg.png', import.meta.url).href}/>
                        <Spin
                            className="ontology-build-tooltip-spin"
                            size={40}
                            loading={tooltipLoading}>
                            <div
                                className="tooltip-content">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTooltipVisible(false)
                                    }}
                                    className="close-btn">
                                        <img src={new URL('../DataPrepare/imgs/close.png', import.meta.url).href}/>
                                </div>
                                <div
                                    className="label">
                                    {t('object.type')}
                                </div>
                                <div
                                    className="value">
                                    {data.objectTypes.join('，')}
                                </div>
                                <div
                                    className="label">
                                    {t('attributes')} {/* 属性 */}
                                </div>
                                <div
                                    className="value">
                                    {data.attributes.join('，')}
                                </div>
                                {/* 动作 */}
                                {/* <div
                                    className="label">
                                    {t('actions')} 
                                </div>
                                <div
                                    className="value">
                                    {data.actions.map(action => action.label).join('，')}
                                </div> */}
                            </div>
                        </Spin>
                    </div>
                    
                ) : null}
                {linkTooltipVisible ? (
                    <div
                        className="link-tooltip"
                        style={{
                            position: 'absolute',
                            top: `${linkPos.top}px`,
                            left: `${linkPos.left}px`
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault()
                        }}>
                            <img className="tooltip-bg" src={new URL('../DataPrepare/imgs/tooltip_bg.png', import.meta.url).href}/>
                        <div
                            className="tooltip-content">
                            <div
                                onClick={() => {
                                    this.setState({
                                        linkTooltipVisible: false
                                    })
                                }}
                                className="close-btn">
                                    <img src={new URL('../DataPrepare/imgs/close.png', import.meta.url).href}/>
                            </div>
                            <div className="value">{linkData || '---'}</div>
                        </div>
                    </div>
                ) : null}
                <img
                    className="ground"
                    src={new URL('./imgs/ground.png', import.meta.url).href}/>
                <img
                    className="ground-top"
                    src={new URL('./imgs/ground-top.png', import.meta.url).href}/>
                <img
                    className="ground-bottom"
                    src={new URL('./imgs/ground-bottom.png', import.meta.url).href}/>
                {/*<img
                    className="outer-line-1"
                    src={new URL('./imgs/outer-line-1.png', import.meta.url).href}/>
                <img
                    className="outer-line-2"
                    src={new URL('./imgs/outer-line-2.png', import.meta.url).href}/>
                <img
                    className="outer-line-3"
                    src={new URL('./imgs/outer-line-3.png', import.meta.url).href}/>
                <img
                    className="outer-line-4"
                    src={new URL('./imgs/outer-line-4.png', import.meta.url).href}/>
                <img
                    className="outer-line-5"
                    src={new URL('./imgs/outer-line-5.png', import.meta.url).href}/>
                <img
                    className="outer-line-6"
                    src={new URL('./imgs/outer-line-6.png', import.meta.url).href}/>*/}

                <img
                    className="road-map"
                    src={new URL('./imgs/road-map.png', import.meta.url).href}/>

                <div
                    className="ani-line_1"
                    style={{
                        position: 'absolute',
                        top: '210px',
                        left: '324px',
                        transform: 'rotateZ(59.5deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.factory.linked.contract'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="280" viewBox="0 0 5 208" fill="none">
                        <path id="path-1" d="M0 0 L0 280 Z" stroke="none" stroke-width="3" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="3" stroke="url(#paint0_linear_5054_11009)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="paint0_linear_5054_11009" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_2"
                    style={{
                        position: 'absolute',
                        top: '250px',
                        left: '493px',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                        // transform: 'rotateZ(59.5deg)'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.warehouse.linked.contract'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="240" viewBox="0 0 32 240" fill="none">
                        <path id="path-1" d="M0 0 L0 240 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-2)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-2" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_3"
                    style={{
                        position: 'absolute',
                        top: '190px',
                        left: '658px',
                        transform: 'rotateZ(-59.5deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.customer.signs.contract'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="300" viewBox="0 0 32 300" fill="none">
                        <path id="path-1" d="M0 0 L0 300 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-3)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-3" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_4"
                    style={{
                        position: 'absolute',
                        top: '450px',
                        left: '224px',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                        // transform: 'rotateZ(59.5deg)'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.device.produces.product'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="110" viewBox="0 0 32 110" fill="none">
                        <path id="path-1" d="M0 0 L0 110 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-4)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-4" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_5"
                    style={{
                        position: 'absolute',
                        top: '450px',
                        left: '764px',
                        // transform: 'rotateZ(59.5deg)'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="110" viewBox="0 0 32 110" fill="none">
                        <path id="path-1" d="M0 0 L0 110 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-5)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-5" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_6"
                    style={{
                        position: 'absolute',
                        top: '450px',
                        left: '484px',
                        // transform: 'rotateZ(59.5deg)'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="250" viewBox="0 0 32 250" fill="none">
                        <path id="path-1" d="M0 0 L0 250 Z" stroke="none" stroke-width="38" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="38" stroke="url(#linearGradient-6)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-6" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FFFFFF" stop-opacity="0"/>
                                <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.5"/>
                                <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_7"
                    style={{
                        position: 'absolute',
                        top: '486px',
                        left: '358px',
                        transform: 'rotateZ(-59.5deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.device.produces.product'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="300" viewBox="0 0 32 300" fill="none">
                        <path id="path-1" d="M0 0 L0 300 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-7)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-7" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_8"
                    style={{
                        position: 'absolute',
                        top: '501px',
                        left: '624px',
                        transform: 'rotateZ(59.5deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.product.belongs.order'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="280" viewBox="0 0 5 208" fill="none">
                        <path id="path-1" d="M0 0 L0 280 Z" stroke="none" stroke-width="3" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="3" stroke="url(#linearGradient-8)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-8" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_9"
                    style={{
                        position: 'absolute',
                        top: '420px',
                        left: '362px',
                        transform: 'rotateZ(67deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.device.stored.warehouse'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="220" viewBox="0 0 5 220" fill="none">
                        <path id="path-1" d="M0 0 L0 220 Z" stroke="none" stroke-width="3" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="3" stroke="url(#linearGradient-9)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-9" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_10"
                    style={{
                        position: 'absolute',
                        top: '330px',
                        left: '622px',
                        transform: 'rotateZ(75deg)',
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="220" viewBox="0 0 5 220" fill="none">
                        <path id="path-1" d="M0 0 L0 220 Z" stroke="none" stroke-width="3" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="3" stroke="url(#linearGradient-10)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-10" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_11"
                    style={{
                        position: 'absolute',
                        top: '410px',
                        left: '610px',
                        transform: 'rotateZ(-67deg)',
                        pointerEvents: 'all',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => this.selectLink(e, t('relation.warehouse.ships.order'))}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="220" viewBox="0 0 32 220" fill="none">
                        <path id="path-1" d="M0 0 L0 220 Z" stroke="none" stroke-width="8" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="8" stroke="url(#linearGradient-11)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-11" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF" stop-opacity="0"/>
                                {/*<stop offset="0.8" stop-color="#0BFFFF" stop-opacity="1"/>*/}
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="ani-line_12"
                    style={{
                        position: 'absolute',
                        top: '334px',
                        left: '340px',
                        transform: 'rotateZ(101deg)',
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="250" viewBox="0 0 32 250" fill="none">
                        <path id="path-1" d="M0 0 L0 250 Z" stroke="none" stroke-width="38" stroke-linejoin="round"/>
                        <path d="M0 0 L 50 0" stroke-width="38" stroke="url(#linearGradient-12)">
                            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#path-1" />
                            </animateMotion>
                        </path>
                        <defs>
                            <linearGradient id="linearGradient-12" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FFFFFF" stop-opacity="0"/>
                                <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.5"/>
                                <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>


                <img
                    onClick={(e) => this.selectNode(e, 'warehouse')}
                    className="building"
                    src={new URL('./imgs/building.png', import.meta.url).href}/>

                <img
                    onClick={(e) => this.selectNode(e, 'Contract')}
                    className="icon icon-1"
                    src={new URL('./imgs/icon-1.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'customer')}
                    className="icon icon-2"
                    src={new URL('./imgs/icon-2.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'order')}
                    className="icon icon-3"
                    src={new URL('./imgs/icon-3.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'product')}
                    className="icon icon-4"
                    src={new URL('./imgs/icon-4.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'equipment')}
                    className="icon icon-5"
                    src={new URL('./imgs/icon-5.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'factory')}
                    className="icon icon-6"
                    src={new URL('./imgs/icon-6.png', import.meta.url).href}/>
                <img
                    // onClick={(e) => this.selectNode(e, 'truck')}
                    className="car-1"
                    src={new URL('./imgs/car-1.png', import.meta.url).href}/>
                <img
                    // onClick={(e) => this.selectNode(e)}
                    className="car-2"
                    src={new URL('./imgs/car-2.png', import.meta.url).href}/>
                <img
                    className="airplane-line"
                    src={new URL('./imgs/air-line.png', import.meta.url).href}/>
                <img
                    onClick={(e) => this.selectNode(e, 'flight')}
                    className="airplane"
                    src={new URL('./imgs/airplane.png', import.meta.url).href}/>
                <img
                    // onClick={(e) => this.selectNode(e)}
                    className="title"
                    src={new URL(this.getImagePath('title'), import.meta.url).href}/>
                </div>
            </div>
        )
    }
}

// 使用高阶组件包装 OntologyBuild
export default withI18n(OntologyBuild);
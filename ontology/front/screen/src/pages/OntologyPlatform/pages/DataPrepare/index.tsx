import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'; // 导入 i18n hook
import './style/index.less'

// 创建一个高阶组件或包装函数来处理国际化
const withI18n = (WrappedComponent) => {
  const WrapperComponent = (props) => {
    const { i18n, t } = useTranslation();
    return <WrappedComponent {...props} i18n={i18n} t={t} />;
  };
  return WrapperComponent;
};

class DataPrepare extends React.Component {
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
            tooltipVisible: false,
            tooltipLoading: false
        };
    }
    switchActive = e => {
        // e.stopPropagation();
        // e.preventDefault();
        // this.props.switchActive(3);
    }
    selectLink = (e, data) => {
        // e.preventDefault();
        // e.stopPropagation();
        const scale = document.body.offsetWidth / 1920;
        this.setState({
            tooltipVisible: true,
            pos: {
                top: e.clientY / scale - 80,
                left: e.clientX / scale - 466
            },
            data
        })
    }
    render() {
        const { t } = this.props; // 获取翻译函数
        const {
            pos,
            data,
            tooltipVisible,
            tooltipLoading,
            linkTooltipVisible,
            linkPos,
            linkData
        } = this.state;
        return (
            <div
                className={`data-prepare ${this.props.i18n?.language?.startsWith('en') ? 'en' : ''}`}
                onClick={e => {
                    if(/(icon|screen|road-title|ground\-top|ground\-bottom)/g.test(e.target.className)) {
                        this.switchActive(e);
                    }
                }}>
                
                <div
                    className="data-prepare-content">
                {tooltipVisible ? (
                    <div
                        className="tooltip"
                        style={{
                            position: 'absolute',
                            top: `${pos.top}px`,
                            left: `${pos.left}px`
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault()
                        }}>
                            <img className="tooltip-bg" src={new URL('./imgs/tooltip_bg.png', import.meta.url).href}/>
                        <div
                            className="ontology-build-tooltip-spin">
                            <div
                                className="tooltip-content">
                                <div
                                    onClick={() => {
                                        this.setState({
                                            tooltipVisible: false
                                        })
                                    }}
                                    className="close-btn">
                                        <img src={new URL('./imgs/close.png', import.meta.url).href}/>
                                </div>
                                <div
                                    className="label">
                                    {data.title}
                                </div>
                                <div
                                    className="value">
                                    {data.descr}
                                </div>
                            </div>
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
                <img
                    className="road"
                    src={new URL('./imgs/road.png', import.meta.url).href}/>
                <svg
                    style={{
                        position: 'absolute',
                        top: '240px',
                        left: '140px'
                    }}
                    xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="none">
                    <g
                        transform="translate(356, 64)">
                        <g
                            style={{
                                transform: 'rotateX(54deg) rotateZ(45deg)'
                            }}>
                            <path
                                id="data-glow-path"
                                d="M0 0 L0 440 L440 440 L440 0 Z "
                                stroke="none"
                                strokeWidth="50"/>
                            <path
                                d="M-25 0 L40 0"
                                stroke="url(#paint0_linear_4940_26441)"
                                strokeWidth="56">
                                <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
                                    <mpath href="#data-glow-path" />
                                </animateMotion>
                            </path>
                            <defs>
                                <linearGradient id="paint0_linear_4940_26441" x1="-25" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#fff" stop-opacity="0"/>
                                    <stop offset="0.4" stop-color="#fff" stop-opacity="0.4"/>
                                    <stop offset="0.4" stop-color="#fff" stop-opacity="0.4"/>
                                    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                        </g>
                    </g>
                </svg>
                <img
                    className="road-arrow-1"
                    src={new URL('./imgs/road-arrow-1.png', import.meta.url).href}/>
                <img
                    className="road-arrow-2"
                    src={new URL('./imgs/road-arrow-2.png', import.meta.url).href}/>
                <img
                    className="road-arrow-3"
                    src={new URL('./imgs/road-arrow-3.png', import.meta.url).href}/>
                <img
                    className="road-arrow-4"
                    src={new URL('./imgs/road-arrow-4.png', import.meta.url).href}/>
               
                <img
                    className="road-title-1"
                    onClick={(e) => this.selectLink(e, {
                        title: t('data.service'), // '数据服务'
                        descr: t('data.service.description') // '治理后的高质量数据集，提供给本体和业务系统使用。'
                    })}
                    src={new URL(`./imgs/road-title-1${this.props.i18n?.language?.startsWith('en') ? '-en.svg' : '.png'}`, import.meta.url).href}/>
                <img
                    className="road-title-2"
                    onClick={(e) => this.selectLink(e, {
                        title: t('data.integration'), // '数据集成'
                        descr: t('data.integration.description') // '从各个业务系统统一采集原始业务数据。'
                    })}
                    src={new URL(`./imgs/road-title-2${this.props.i18n?.language?.startsWith('en') ? '-en.svg' : '.png'}`, import.meta.url).href}/>
                <img
                    className="road-title-3"
                    onClick={(e) => this.selectLink(e, {
                        title: t('data.processing'), // '数据加工'
                        descr: t('data.processing.description') // '把原始数据加工为半成品或成品数据。'
                    })}
                    src={new URL(`./imgs/road-title-3${this.props.i18n?.language?.startsWith('en') ? '-en.svg' : '.png'}`, import.meta.url).href}/>
                <img
                    className="road-title-4"
                    onClick={(e) => this.selectLink(e, {
                        title: t('data.governance'), // '数据治理'
                        descr: t('data.governance.description') // '对数据的标准和质量进行治理。'
                    })}
                    src={new URL(`./imgs/road-title-4${this.props.i18n?.language?.startsWith('en') ? '-en.svg' : '.png'}`, import.meta.url).href}/>
                 <img
                    className="road-box-1"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-2"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-3"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-4"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-5"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-6"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="road-box-7"
                    src={new URL('./imgs/box.png', import.meta.url).href}/>
                <img
                    className="icon-1"
                    src={new URL('./imgs/icon-1.png', import.meta.url).href}/>
                <img
                    className="icon-2"
                    src={new URL('./imgs/icon-2.png', import.meta.url).href}/>
                <img
                    className="icon-3"
                    src={new URL('./imgs/icon-3.png', import.meta.url).href}/>
                <img
                    className="icon-4"
                    src={new URL('./imgs/icon-4.png', import.meta.url).href}/>
                <img
                    className="title"
                    src={new URL(`./imgs/${this.props.i18n?.language?.startsWith('en') ? 'title-en.svg':'title-cn.svg'}`, import.meta.url).href}/>
                <img
                    className="car-1"
                    src={new URL('./imgs/car-1.png', import.meta.url).href}/>
                <img
                    className="car-2"
                    src={new URL('./imgs/car-2.png', import.meta.url).href}/>
                <img
                    className="car-3"
                    src={new URL('./imgs/car-3.png', import.meta.url).href}/>
                <img
                    className="car-4"
                    src={new URL('./imgs/car-4.png', import.meta.url).href}/>
                </div>
            </div>
        )
    }
}

// 使用高阶组件包装 DataPrepare
export default withI18n(DataPrepare);
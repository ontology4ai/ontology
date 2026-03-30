import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'; // 导入 i18n hook
import screen1En from './imgs/screen-1-en.png';
import screen1Zh from './imgs/screen-1.png';
import lightScreen1En from './imgs/light-screen-1-en.png';
import lightScreen1Zh from './imgs/light-screen-1.png';
import screen2En from './imgs/screen-2-en.png';
import screen2Zh from './imgs/screen-2.png';
import lightScreen2En from './imgs/light-screen-2-en.png';
import lightScreen2Zh from './imgs/light-screen-2.png';
import screen3En from './imgs/screen-3-en.png';
import screen3Zh from './imgs/screen-3.png';
import lightScreen3En from './imgs/light-screen-3-en.png';
import lightScreen3Zh from './imgs/light-screen-3.png';
import screen5En from './imgs/screen-5-en.png';
import screen5Zh from './imgs/screen-5.png';
import lightScreen5En from './imgs/light-screen-5-en.png';
import lightScreen5Zh from './imgs/light-screen-5.png';
import titleEn from './imgs/title-en.svg';
import titleZh from './imgs/title-cn.svg';
import './style/index.less'

// 创建一个高阶组件或包装函数来处理国际化
const withI18n = (WrappedComponent) => {
  return (props) => {
    const { i18n } = useTranslation();
    return <WrappedComponent {...props} i18n={i18n} />;
  };
};

class AgentApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lightActive: -1,
            posData: [
                [
                    {
                        top: '267px',
                        left: '496px'
                    },
                    {
                        top: '378px',
                        left: '308px'
                    },
                    {
                        top: '480px',
                        left: '132px'
                    }
                ],
                [
                    {
                        top: '485px',
                        left: '132px'
                    },
                    {
                        top: '580px',
                        left: '292px'
                    },
                    {
                        top: '694px',
                        left: '486px'
                    }
                ],
                [
                    {
                        top: '698px',
                        left: '486px'
                    },
                    {
                        top: '586px',
                        left: '675px'
                    },
                    {
                        top: '486px',
                        left: '846px'
                    }
                ],
                [
                    {
                        top: '482px',
                        left: '846px'
                    },
                    {
                        top: '378px',
                        left: '667px'
                    },
                    {
                        top: '276px',
                        left: '496px'
                    }
                ]
            ]
        };
        window.xxx = this;
        this.timeoutRef = React.createRef();
        this.aniRef = React.createRef();
    }
    
    // 获取图片路径的方法
    getImagePath = (imageName) => {
        const { i18n } = this.props;
        const isEnglish = i18n && i18n.language && i18n.language.startsWith('en');
        
        // 定义图片映射对象
        const imageMap = {
          'screen-1': isEnglish ? screen1En : screen1Zh,
          'light-screen-1': isEnglish ? lightScreen1En : lightScreen1Zh,
          'screen-2': isEnglish ? screen2En : screen2Zh,
          'light-screen-2': isEnglish ? lightScreen2En : lightScreen2Zh,
          'screen-3': isEnglish ? screen3En : screen3Zh,
          'light-screen-3': isEnglish ? lightScreen3En : lightScreen3Zh,
          'screen-5': isEnglish ? screen5En : screen5Zh,
          'light-screen-5': isEnglish ? lightScreen5En : lightScreen5Zh,
          'title': isEnglish ? titleEn : titleZh,
        };
        
        // 返回对应的图片导入路径
        return imageMap[imageName] || `./imgs/${imageName}.png`;
      }
    
    switchActive = e => {
        // e.stopPropagation();
        // e.preventDefault();
        // this.props.switchActive(1);
    }
    
    jump = (index, edge, next) => {
        const {
            posData
        } = this.state;
        for (let i = 1; i < 5; i++) {
            if (i !== edge) {
                document.querySelector(`.arrow-${i}`).style.display = 'none';
                document.querySelector(`.arrow-${i}`).style.top = posData[i - 1][0].top;
                document.querySelector(`.arrow-${i}`).style.left = posData[i - 1][0].left;
            }
        }
        document.querySelector(`.arrow-${edge}`).style.display = 'block';
        
        const arrow = document.querySelector(`.arrow-${edge}`);
        let j = 0;
        const pos = posData[edge - 1][index];
        const gapX = Number(pos.left.replace('px', '')) - Number(arrow.style.left.replace('px', ''));
        const gapY = Number(pos.top.replace('px', '')) - Number(arrow.style.top.replace('px', ''));
        const stepX = gapX / 100
        const stepY = gapY / 100

        const ani = () => {
            this.aniRef.current = requestAnimationFrame(() => {
                j++;
                const top = (Number(arrow.style.top.replace('px', '')) + (stepY));
                const left = (Number(arrow.style.left.replace('px', '')) + (stepX))
                arrow.style.top = top + 'px'
                arrow.style.left = left + 'px'
                if (j !== 100) {
                    ani()
                } else {
                    this.setState({
                        lightActive: 3 * (edge - 1) + index
                    })
                    typeof next === 'function' && next()
                    /* if (typeof next === 'function') {
                        this.timeoutRef = setTimeout(() => {
                            next();
                        }, 200)
                    } */
                }
            })
        }
        ani()
    }
    
    startAni = () => {
        let index = 0;
        let aniMap = {};
        const {
            posData
        } = this.state;
        const posArr = [
            // [0, 1],
            [1, 1],
            [2, 1],
            // [0, 2],
            [1, 2],
            [2, 2],
            // [0, 3],
            [1, 3],
            [2, 3],
            // [0, 4],
            [1, 4],
            [2, 4]
        ]
        const next = () => {
            if (index == 8) {
                index = 0; 
            }
            this.jump(...posArr[index], next);
            index++;
        }
        next()
    }
    
    componentDidMount() {
        this.startAni();
    }
    
    componentWillUnmount() {
        cancelAnimationFrame(this.aniRef.current);
        clearTimeout(this.timeoutRef.current)
    }
    
    render() {
        const {
            lightActive
        } = this.state;
        
        return (
            <div
                className="agent-app"
                onClick={e => {
                    if(/(icon|screen|ground\-top)/g.test(e.target.className)) {
                        this.switchActive(e);
                    }
                }}>
                <div
                    className="agent-app-content">
                
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
                    className="grid-ground"
                    src={new URL('./imgs/grid-ground.png', import.meta.url).href}/>
                <img
                    className="road"
                    src={new URL('./imgs/road.png', import.meta.url).href}/>

                <div
                    className="arrow-1"
                    style={{
                        position: 'absolute',
                        top: '267px',
                        left: '496px',
                        // transition: 'all .8s'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="10" viewBox="0 0 15 10" fill="none">
                        <path d="M0.213244 9.53533L14.8188 7.07066L8.2368 4.85931L6.39231 -4.76837e-07L0.213244 9.53533Z" fill="#0BFFFF"/>
                    </svg>
                    <svg
                        style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '8px'
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none">
                        <path d="M40 0L0 24" 
                            // stroke="red"
                            stroke="url(#paint0_linear_4940_23877)"
                            stroke-width="2"/>
                            <defs>
                            <linearGradient id="paint0_linear_4940_23877" x2="40" y2="0" x1="0" y1="24" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF"/>
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                
                <div
                    className="arrow-2"
                    style={{
                        position: 'absolute',
                        top: '485px',
                        left: '132px',
                        // transition: 'all .8s'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="10" viewBox="0 0 15 10" fill="none">
                        <path d="M14.7868 9.93377L0.181206 7.4691L6.7632 5.25775L8.60769 0.398437L14.7868 9.93377Z" fill="#0BFFFF"/>
                    </svg>
                    <svg
                        style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '-32px'
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none">
                        <path d="M0 0L40 24" 
                            // stroke="red"
                            stroke="url(#paint0_linear_4940_238771)"
                            stroke-width="2"/>
                            <defs>
                            <linearGradient id="paint0_linear_4940_238771" x2="0" y2="0" x1="40" y1="24" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF"/>
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                
                <div
                    className="arrow-3"
                    style={{
                        position: 'absolute',
                        top: '698px',
                        left: '486px',
                        // transition: 'all .8s'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="11" viewBox="0 0 15 11" fill="none">
                        <path d="M14.7868 0.636544L0.181206 3.10121L6.7632 5.31256L8.60769 10.1719L14.7868 0.636544Z" fill="#0BFFFF"/>
                    </svg>
                    <svg
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-30px'
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none">
                        <path d="M0 40L40 16" 
                            // stroke="red"
                            stroke="url(#paint0_linear_4940_238772)"
                            stroke-width="2"/>
                            <defs>
                            <linearGradient id="paint0_linear_4940_238772" x2="0" y2="40" x1="40" y1="16" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF"/>
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                
                <div
                    className="arrow-4"
                    style={{
                        position: 'absolute',
                        top: '482px',
                        left: '846px',
                        // transition: 'all .8s'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="10" viewBox="0 0 15 10" fill="none">
                        <path d="M0.213244 0.2342L14.8188 2.69887L8.2368 4.91022L6.39231 9.76953L0.213244 0.2342Z" fill="#0BFFFF"/>
                    </svg>
                    <svg
                        style={{
                            position: 'absolute',
                            top: '5px',
                            left: '0px'
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none">
                        <path d="M0 0L40 25" 
                            //stroke="red"
                            stroke="url(#paint0_linear_4940_238773)"
                            stroke-width="2"/>
                            <defs>
                            <linearGradient id="paint0_linear_4940_238773" x1="0" y1="0" x2="40" y2="25" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#0BFFFF"/>
                                <stop offset="1" stop-color="#0BFFFF" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                
                <div
                    className={`icon icon-1 ${lightActive === 2 || lightActive === 3 ? 'active' : ''}`}>
                    <img
                        src={new URL('./imgs/icon-1.png', import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL('./imgs/light-icon-1.png', import.meta.url).href}/>
                </div>
                <div
                    className={`icon icon-2 ${lightActive === 0 || lightActive === 11 ? 'active' : ''}`}>
                    <img
                        src={new URL('./imgs/icon-2.png', import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL('./imgs/light-icon-2.png', import.meta.url).href}/>
                </div>
                <div
                    className={`icon icon-3 ${lightActive === 8 || lightActive === 9 ? 'active' : ''}`}>
                    <img
                        src={new URL('./imgs/icon-3.png', import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL('./imgs/light-icon-3.png', import.meta.url).href}/>
                </div>
                <div
                    className={`icon icon-4 ${lightActive === 5 || lightActive === 6 ? 'active' : ''}`}>
                    <img
                        src={new URL('./imgs/icon-4.png', import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL('./imgs/light-icon-4.png', import.meta.url).href}/>
                </div>
                
                {/* 动态加载 screen-1 */}
                <div
                    className={`screen screen-1 ${lightActive === 1 ? 'active' : ''}`}>
                    <img
                        src={new URL(this.getImagePath('screen-1'), import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL(this.getImagePath('light-screen-1'), import.meta.url).href}/>
                </div>
                
                {/* 动态加载 screen-2 */}
                <div
                    className={`screen screen-2 ${lightActive === 10 ? 'active' : ''}`}>
                    <img
                        src={new URL(this.getImagePath('screen-2'), import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL(this.getImagePath('light-screen-2'), import.meta.url).href}/>
                </div>
                
                {/* 动态加载 screen-3 */}
                <div
                    className={`screen screen-3 ${lightActive === 7 ? 'active' : ''}`}>
                    <img
                        src={new URL(this.getImagePath('screen-3'), import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL(this.getImagePath('light-screen-3'), import.meta.url).href}/>
                </div>
                
                {/* 动态加载 screen-5 */}
                <div
                    className={`screen screen-4 ${lightActive === 4 ? 'active' : ''}`}>
                    <img
                        src={new URL(this.getImagePath('screen-5'), import.meta.url).href}/>
                    <img
                        className="light"
                        src={new URL(this.getImagePath('light-screen-5'), import.meta.url).href}/>
                </div>
                
                <img
                    className="main-screen"
                    src={new URL('./imgs/main-screen.png', import.meta.url).href}/>
                <img
                    className="desktop"
                    src={new URL('./imgs/desktop.png', import.meta.url).href}/>
                <img
                    className="robot"
                    src={new URL('./imgs/robot.png', import.meta.url).href}/>
                <img
                    className="title"
                    src={new URL(this.getImagePath('title'), import.meta.url).href}/>
                </div>
            </div>
        )
    }
}

// 使用高阶组件包装 AgentApp
export default withI18n(AgentApp);
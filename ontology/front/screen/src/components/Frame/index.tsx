import { Button, Dropdown, Menu, Message } from '@arco-design/web-react';
import { IconDown, IconUndo } from '@arco-design/web-react/icon';
import moment from 'moment';
import 'moment/locale/zh-cn';
import React from 'react';
import i18n from '../../i18n';
import globalSvg from './imgs/gloabl.svg';
import logo from './imgs/logo.png';
import './style/index.less';
import axios from 'axios';


// 中文星期显示
moment.updateLocale('zh-cn', {
  weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  weekdaysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
});
// 英文使用 moment 内置 en  locale（Sunday, Monday, ...），无需额外配置

class Frame extends React.Component {
    constructor(props: any) {
        super(props);
        // 从 localStorage 读取语言，默认为 'zh'
        const savedLanguage = localStorage.getItem('app_language') || 'zh';
        const langMap = {
            'zh': 'zh-CN',
            'en': 'en-US'
        };
        i18n.changeLanguage(langMap[savedLanguage]);
        moment.locale(savedLanguage === 'zh' ? 'zh-cn' : 'en');
        this.state = {
            url1: '',
            url2: '',
            currentNavActive: props.navActive,
            currentLanguage: savedLanguage,
            weatherMap: {
                'sunny': {
                    text: '晴',
                    img: new URL('./imgs/sunny.png', import.meta.url).href
                },
                'rain': {
                    text: '雨',
                    img: new URL('./imgs/rain.png', import.meta.url).href
                },
                'cloudy': {
                    text: '多云',
                    img: new URL('./imgs/cloudy.png', import.meta.url).href
                },
                'overcast': {
                    text: '阴',
                    img: new URL('./imgs/cloudy.png', import.meta.url).href
                }
            },
            weatherInfo: {
                temperature: '30℃',
                type: 'sunny'
            },
            date: '2021.12.13',
            week: 'WED',
            time: '14:54:45',
        };
    }
    resizeBg = () => {
        var el = document.body;
        var height = el.offsetHeight;
        var width = el.offsetWidth;
        var scaleX = width / 1920;
        var scaleY = height / 1080;
        var geoEl = document.querySelector('.screen-content');
        geoEl.style.transform = `scale(${scaleX})`;
        geoEl.style.width = `calc(100% / ${scaleX})`;
        geoEl.style.height = `calc(100% / ${scaleX})`;
    }
    refreshTime = () => {
        this.setState({
            date: moment().format('YYYY.MM.DD'),
            time: moment().format('HH:mm:ss'),
            week: moment().format('dddd')
        })
        window.requestAnimationFrame(this.refreshTime);
    }
    handlePush = (nav, index) => {
         
        this.setState({
            currentNavActive: index
        })
        this.props.push(nav)
    }
    handleScroll = (e) => {
        this.props.contentScroll(e.target.scrollTop);
    }
    handleSwitchApp = () => {
        window.location.href = '/chatbi_agent';
        return;
        if (!document.documentElement.requestFullscreen) {  
            //alert('Fullscreen API is not supported');  
            return;  
        }
        document.documentElement.requestFullscreen().catch(err => {  
            //alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);  
        });
    }
    handleLanguageChange = (key: string) => {
        const { currentLanguage } = this.state;
        if (currentLanguage === key) {
            return; // 语言未变化，不做任何操作
        } 

        axios.post(
            '/ontology_show/_api/language/switch',
            {
                lang: key
            }
        ).then(res => {
            if(res.data.success) {
                // 保存语言到 localStorage
                localStorage.setItem('app_language', key);
                   // 刷新页面
                   window.location.reload();
                const langMap = {
                    'zh': 'zh-CN',
                    'en': 'en-US'
                };
                i18n.changeLanguage(langMap[key]);
                moment.locale(key === 'zh' ? 'zh-cn' : 'en');
                this.setState({
                    currentLanguage: key
                });
              
            } else {
           
            }
        }).catch(err => { 
        })
    }
    componentDidUpdate(prevProps, prevState) {
        if (typeof prevProps.navActive === 'string' && typeof this.props.navActive === 'string') {
            if (prevProps.navActive !== this.props.navActive) {
                this.setState({
                    currentNavActive: this.props.navActive
                })
            }
        }
    }
    componentDidMount() {
        window.requestAnimationFrame(this.refreshTime);
        this.resizeBg();
        window.addEventListener('resize', this.resizeBg);
        document.querySelector('#app').setAttribute('class', 'visible')
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeBg);
    }
    
    render() {
        const {
            weatherMap,
            currentNavActive,
            currentLanguage,
            weatherInfo,
            time,
            week,
            date
        } = this.state;
        
        const dropList = (
            <Menu className='language-drop-list' selectedKeys={[currentLanguage]} onClickMenuItem={this.handleLanguageChange}>
              <Menu.Item key='zh'>中文</Menu.Item>
              <Menu.Item key='en'>English</Menu.Item>
            </Menu>
          );
        const {
            navList,
            bgSrc,
            navActive,
            title
        } = this.props;

        return (
            <div
                className="copilot-frame">
                <div className="screen">
                    <div
                        className="screen-background">
                        <img
                            src={bgSrc || new URL('./imgs/screen_bg.png', import.meta.url).href}/>
                    </div>
                    <div
                        className="screen-content"
                        onScroll={this.handleScroll}
                        onClick={this.props.handleClick}>
                        {/*<div
                            className="point"
                            style={{
                                top: '185px',
                                left: '964px'
                            }}>
                        </div>
                        <div
                            className="point"
                            style={{
                                top: '405px',
                                left: '1340px'
                            }}>
                        </div>
                        <div
                            className="point"
                            style={{
                                top: '630px',
                                left: '964px'
                            }}>
                        </div>
                        <div
                            className="point"
                            style={{
                                top: '614px',
                                left: '586px'
                            }}>
                        </div>*/}
                        <div className="header">
                            <div className="header-bg-group">
                            </div>
                            <img
                                className="logo"
                                src={logo}
                                alt=""/>
                            <div
                                className="page-title">
                                {title}
                            </div>
                            <ul className="nav-list">
                                {navList.map((nav, index) => {
                                    return <li
                                        key={nav.name}
                                        className={nav.name === currentNavActive ? 'active' : ''}
                                        onClick={() => {this.handlePush(nav, index)}}>
                                        <span
                                            className="manuItem"
                                            id={nav.name}>
                                            {nav.label}
                                        </span>
                                    </li>
                                })}
                            </ul>
                            <div className={`pos-right ${currentLanguage === 'en' ? 'is-en' : ''}`.trim()}>
                            <Button type='secondary' icon={<IconUndo />} onClick={() => {this.props.handleBackHome()}}>{i18n.t('back.to.home')}</Button>
                            <Dropdown droplist={dropList} position='bl' trigger='click'>
                                <Button type='secondary' icon={<img src={globalSvg} />}>
                                    {currentLanguage === 'zh' ? '中文' : 'English'} <IconDown style={{marginLeft: '16px'}} />
                                </Button>
                            </Dropdown>
                            </div>
                            <div
                                className="time">
                                {time}
                            </div>
                            <div
                                className="date-week">
                                <div
                                    className="week">
                                    {week}
                                </div>
                                <div
                                    className="date">
                                    {date}
                                </div>
                            </div>
                        </div>
                        <div className="content">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Frame;

import React, { useState, useEffect, useMemo } from 'react'
import './style/index.less'
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language === 'en-US';
    
    // 提取图片路径逻辑
    const centerImgLabel = isEnglish 
      ? new URL('./imgs/label-en.svg', import.meta.url).href 
      : new URL('./imgs/label-cn.svg', import.meta.url).href;

    return (
        <div
            className={`home ${isEnglish ? 'home-en' : ''}`}>
                <div className='left'>
                    <div className='side'>
                        <div className='side-header'>
                            <img src={new URL('./imgs/left-gray.png', import.meta.url).href}/>
                            {t('ai.adoption.challenges')}
                            <img src={new URL('./imgs/left-gray.png', import.meta.url).href}/>
                        </div>
                        <div className='side-content'> 
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_1.png', import.meta.url).href}/>
                                <span>{t('lack.of.business.context')}</span>
                            </div>
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_2.png', import.meta.url).href}/>
                                <span>{t('untraceable.processes')}</span>
                            </div>
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_3.png', import.meta.url).href}/>
                                <span>{t('decision.execution.gap')}</span>
                            </div>
                        </div>
                    </div>
                    <img src={new URL('./imgs/arrow.png', import.meta.url).href} className='arrow'/>
                </div>
                <div className='center'>
                    <div className='home-header'>
                        <div className='title'>
                            {isEnglish ? <span>{t('what.is')}·<span className='name'>{t('ontology')}</span></span>: <span><span className='name'>{t('ontology')}</span>·{t('what.is')}</span>}
                        </div>
                        <div className='desc'>
                            {t('ontology.definition')}
                        </div>
                    </div>
                    <div className='info'>
                        <div className='info-title'>
                            <img src={new URL('./imgs/left.png', import.meta.url).href}/>
                            <div className='label'>{t('ontology.teaches.ai')}</div>
                            <img src={new URL('./imgs/right.png', import.meta.url).href}/>
                        </div>
                        <div className='info-content'>
                            <div className='step'>
                                <img src={new URL('./imgs/step_1.png', import.meta.url).href}/>
                                <div className='step-title'>{t('ai.object.recognition')}</div>
                            </div>
                            <img src={new URL('./imgs/line.png', import.meta.url).href}/>
                            <div className='step'>
                                <img src={new URL('./imgs/step_2.png', import.meta.url).href}/>
                                <div className='step-title'>{t('ai.logic.comprehension')}</div>
                            </div>
                            <img src={new URL('./imgs/line.png', import.meta.url).href}/>
                            <div className='step'>
                                <img src={new URL('./imgs/step_3.png', import.meta.url).href}/>
                                <div className='step-title'>{t('ai.action.execution')}</div>
                            </div>
                        </div>
                    </div>
                    <div className='img-group'>
                        <img src={new URL('./imgs/center-bg.png', import.meta.url).href} className='center-img'/>
                        <img src={centerImgLabel} className='center-img-label'/>
                    </div>

                </div>
                <div className='right'>
                    <div className='side'>
                        <div className='side-header'>
                            <img src={new URL('./imgs/left-blue.png', import.meta.url).href}/>
                            {t('ontology.ai.value')}
                            <img src={new URL('./imgs/left-blue.png', import.meta.url).href}/>
                        </div>
                        <div className='side-content'> 
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_4.png', import.meta.url).href}/>
                                <div>
                                    <div>{t('unified.collaboration').split('<br>')[0]}</div>
                                    <div>{t('unified.collaboration').split('<br>')[1]}</div>
                                </div>
                            </div>
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_5.png', import.meta.url).href}/>
                                <div>
                                    <div>{t('precise.reasoning').split('<br>')[0]}</div>
                                    <div>{t('precise.reasoning').split('<br>')[1]}</div>
                                </div>
                            </div>
                            <div className='side-item'>
                                <img src={new URL('./imgs/icon_6.png', import.meta.url).href}/>
                                <div>
                                    <div>{t('accurate.execution').split('<br>')[0]}</div>
                                    <div>{t('accurate.execution').split('<br>')[1]}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src={new URL('./imgs/arrow.png', import.meta.url).href} className='arrow'/>
                </div>
               
        </div>
    )
}

export default Home;
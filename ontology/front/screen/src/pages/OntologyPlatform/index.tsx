import React, { useState, useEffect, useMemo } from 'react'
import AgentApp from './pages/AgentApp';
import OntologyBuild from './pages/OntologyBuild';
import DataPrepare from './pages/DataPrepare';
import { useTranslation } from 'react-i18next';
import './style/index.less'

function isPointInRhombus(Px, Py, Ax, Ay, Bx, By, Cx, Cy, Dx, Dy) {
  // 确保顶点按顺序连接：A->B->C->D->A
  const vertices = [
    [Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]
  ];
  
  // 方法：检查点是否在所有边的同一侧
  let prevSign = 0;
  
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % 4];
    
    // 计算边向量和点到起点的向量的叉积
    const crossProduct = (x2 - x1) * (Py - y1) - (y2 - y1) * (Px - x1);
    
    // 如果点在边上，可以认为是内部
    if (crossProduct === 0) {
      // 检查点是否在线段上（不仅仅是直线上）
      const onSegment = 
        Math.min(x1, x2) <= Px && Px <= Math.max(x1, x2) &&
        Math.min(y1, y2) <= Py && Py <= Math.max(y1, y2);
      if (onSegment) return true;
    }
    
    if (crossProduct !== 0) {
      const currentSign = crossProduct > 0 ? 1 : -1;
      
      if (prevSign === 0) {
        prevSign = currentSign;
      } else if (prevSign !== currentSign) {
        return false; // 在不同侧，点在外部
      }
    }
  }
  
  return true;
}

const OntologyPlatform = () => {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState(0);
  const isEnglish = i18n.language === 'en-US';
  const [ontologyBuildTooltipVisible, setOntologyBuildTooltipVisible] = useState(false);

  const introList = [
    {
      title: 'agent.application',
      descr: 'agent.application.description'
    },
    {
      title: 'ontology.construction',
      descr: 'ontology.construction.description'
    },
    {
      title: 'data.preparation',
      descr: 'data.preparation.description'
    }
  ];

  const switchActive = (active) => {
    setActive(active);
  }

  const handlePos = (e) => {
    console.log('xx3')
    const scale = document.body.offsetWidth / 1920;
    
    if (active) {
      if (!isPointInRhombus(
        e.clientX / scale, e.clientY / scale,
        964, 265,
        1468, 558,
        964, 856,
        460, 560 
      )) {
        setActive(null);
      }
    } else {
      if (isPointInRhombus(
        e.clientX / scale, e.clientY / scale,
        964, 185,
        1340, 405,
        964, 630,
        586, 408 
      )) {
        setActive(1);
        return;
      }
      if (isPointInRhombus(
        e.clientX / scale, e.clientY / scale,
        964, 185 + 206,
        1340, 405 + 206,
        964, 630 + 206,
        586, 408  + 206
      )) {
        setActive(2);
        return;
      }
      if (isPointInRhombus(
        e.clientX / scale, e.clientY / scale,
        964, 185 + 206 * 2,
        1340, 405 + 206 * 2,
        964, 630 + 206 * 2,
        586, 408  + 206 * 2
      )) {
        setActive(3);
      }
    }
  }

  // 添加点击空白区域的处理函数
  const handleDocumentClick = (e) => {
    // 检查点击的目标是否在主容器之外或在非交互元素上
    const mainContainer = document.querySelector('.ontology-platform');
    if (mainContainer && !mainContainer.contains(e.target)) {
      setActive(null);
      setOntologyBuildTooltipVisible(false);
      return;
    }

    // 检查是否点击在可交互区域之外
    const clickedOnInteractiveArea = e.target.closest('.lvl-group') ||
                                     e.target.closest('.lvl-intro') ||
                                     e.target.closest('.agent-app') ||
                                     e.target.closest('.ontology-build') ||
                                     e.target.closest('.data-prepare');

    if (!clickedOnInteractiveArea && active !== null) {
      setActive(null);
      setOntologyBuildTooltipVisible(false);
    }
  };

  useEffect(() => {
    // 添加点击事件监听器
    document.addEventListener('click', handleDocumentClick, true);
    
    return () => {
      // 移除点击事件监听器
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [active]);

  return (
    <div 
      className={`ontology-platform ${isEnglish ? 'ontology-platform-en' : ''}`}
      onClick={handlePos}
    >
      <div className='left'>
        <div className='side'>
          <div className='side-header'>
            <img src={new URL('../Home/imgs/left-gray.png', import.meta.url).href}/>
            {t('ai.adoption.challenges')}
            <img src={new URL('../Home/imgs/left-gray.png', import.meta.url).href}/>
          </div>
          <div className='side-content'> 
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_1.png', import.meta.url).href}/>
              <span>{t('lack.of.business.context')}</span>
            </div>
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_2.png', import.meta.url).href}/>
              <span>{t('untraceable.processes')}</span>
            </div>
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_3.png', import.meta.url).href}/>
              <span>{t('decision.execution.gap')}</span>
            </div>
          </div>
        </div>
        <img src={new URL('../Home/imgs/arrow.png', import.meta.url).href} className='arrow'/>
      </div>

      <div className="home-title">
        <span className='name'>{t('ontology.platform.name1')}</span>·{t('ontology.platform.name2')}
      </div>
      <div className={`lvl-group ${active ? 'has-active' : ''} ${active ? `active-${active}` : ''}`}>
        <AgentApp switchActive={switchActive}/>
        <OntologyBuild switchActive={switchActive} tooltipVisible={ontologyBuildTooltipVisible} setTooltipVisible={setOntologyBuildTooltipVisible}/>
        <DataPrepare switchActive={switchActive}/>
      </div>
      {!active ? (
        <div className="lvl-arrow-group">
          <img
            className="lvl-arrow-1"
            src={new URL('./imgs/lvl-arrow.png', import.meta.url).href}/>
          <img
            className="lvl-arrow-2"
            src={new URL('./imgs/lvl-arrow.png', import.meta.url).href}/>
          <img
            className="lvl-arrow-3"
            src={new URL('./imgs/lvl-arrow.png', import.meta.url).href}/>
          <img
            className="lvl-arrow-4"
            src={new URL('./imgs/lvl-arrow.png', import.meta.url).href}/>
        </div>
      ) : null}
      {active && introList[active - 1] ? (
        <div className="lvl-intro">
          <img
            src={new URL('./imgs/rect_bg.png', import.meta.url).href}/>
          <div className="lvl-title">
            {t(introList[active - 1].title)}
          </div>
          <div className="lvl-descr">
            {t(introList[active - 1].descr)}
          </div>
        </div>
      ) : null}
      <div className='right'>
        <div className='side'>
          <div className='side-header'>
            <img src={new URL('../Home/imgs/left-blue.png', import.meta.url).href}/>
            {t('ontology.ai.value')}
            <img src={new URL('../Home/imgs/left-blue.png', import.meta.url).href}/>
          </div>
          <div className='side-content'> 
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_4.png', import.meta.url).href}/>
              <div>
                <div>{t('unified.collaboration').split('<br>')[0]}</div>
                <div>{t('unified.collaboration').split('<br>')[1]}</div>
              </div>
            </div>
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_5.png', import.meta.url).href}/>
              <div>
                <div>{t('precise.reasoning').split('<br>')[0]}</div>
                <div>{t('precise.reasoning').split('<br>')[1]}</div>
              </div>
            </div>
            <div className='side-item'>
              <img src={new URL('../Home/imgs/icon_6.png', import.meta.url).href}/>
              <div>
                <div>{t('accurate.execution').split('<br>')[0]}</div>
                <div>{t('accurate.execution').split('<br>')[1]}</div>
              </div>
            </div>
          </div>
        </div>
        <img src={new URL('../Home/imgs/arrow.png', import.meta.url).href} className='arrow'/>
      </div>
    </div>
  )
}

export default OntologyPlatform;
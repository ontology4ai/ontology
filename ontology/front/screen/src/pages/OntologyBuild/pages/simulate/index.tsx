import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import OntologyGraph from '../../components/Graph';
import './index.less'
import { Button, Table } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import mockData from './mockData';
import loadingGif from './images/loading.gif'

let timer = null;
const OntologySimulate = () => {
  const ontologyGraphRef = useRef(null);
  const { t, i18n } = useTranslation();
  const language = i18n.language

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('数据初始化中');
  const [loadingIcon, setLoadingIcon] = useState('loading.gif');

  const handleInitData = () => {
    setLoading(true);
    setLoadingText(t('simulation.init.loading'));
    setLoadingIcon('loading.svg');

    ontologyGraphRef.current?.startInitData().then(res => {
      setLoadingText(t('simulation.init.success'));
      setLoadingIcon('success.svg');

      setTimeout(() => {
        setLoading(false);
      }, 3000);
    });

    console.log(ontologyGraphRef.current.graphRef.current)
  };

  const [isSimulate, setIsSimulate] = useState(false);

  const [simulateLoading, setSimulateLoading] = useState(false);

  const [isResultLoaded, setIsResultLoaded] = useState(false);
  const handleBeforeSimulate = () => { 
    setIsSimulate(true)
    setSimulateLoading(true)
    setLoadingText(t('simulation.execute.loading'));
    setLoadingIcon('loading.svg');

    timer && clearInterval(timer);

    // let cutLength = 0
    // setIsResultLoaded(false)
    // setResultContent('')
    // const allResultContent = mockData[language]?.allResultContent || ''

    // console.log(allResultContent, mockData, language, mockData[language])

    // timer = setInterval(() => {
    //   cutLength = cutLength + 1
      
    //   setResultContent(allResultContent.substring(0, cutLength))

    //   console.log(cutLength, allResultContent.length)
      
    //   if (cutLength >= allResultContent.length) {
    //     setIsResultLoaded(true)
    //     clearInterval(timer);
    //   }
    // }, 10);
    setIsResultLoaded(false)
    setResultContent([])
    setCurrentIndex(0)
  };
  const handleAfterSimulate = () => {
    setLoadingText(t("simulation.execute.success"));
    setLoadingIcon('success.svg');

    setTimeout(() => {
      setSimulateLoading(false)
    }, 3000);
  };

  const handleBack = () => {
    // ontologyGraphRef.current.graphRef.current.zoom(1)
    setTimeout(() => {
      ontologyGraphRef.current.init()
    }, 0);
    
    console.log(ontologyGraphRef.current.graphRef.current)
    setIsSimulate(false)
    setResultContent([])
    setSchemeContent([]);
    timer && clearInterval(timer);
    ontologyGraphRef.current.clearTimer();
  }

  const [schemeType, setSchemeType] = useState(0);
  const handleScheme = async (type: number) => {
    setSimulateLoading(true)
    setLoadingText(t("simulation.execute.loading"));
    setLoadingIcon('loading.svg');

    timer && clearInterval(timer);

    // let cutLength = 0
    // const schemeContent1 = mockData[language]?.schemeContent1 || ''
    // const schemeContent2 = mockData[language]?.schemeContent2 || ''
    // const content = type === 1 ? schemeContent1 : schemeContent2;
    // setSchemeContent('');
    // timer = setInterval(() => {
    //   cutLength = cutLength + 1
    //   setSchemeContent(content.substring(0, cutLength))

    //   console.log(cutLength, content.length)
      
    //   if (cutLength >= content.length) {
    //     clearInterval(timer);
    //   }
    // }, 10);
    setSchemeType(type)
    setSchemeContent([])
    setCurrentIndex(0)

    const runNodeIds = [["waybill"], ["employee"], ["workorder"]]

    for (const nodeId of runNodeIds) {

      const nodes = nodeId.map(id => ontologyGraphRef.current.graphRef.current.getCellById(id))

      nodes.forEach(node => {
        node.setData({
          ...node.getData(),
          isHighlight: false,
        })
      })

      await ontologyGraphRef.current.loadingNode(nodes)

      nodes.forEach(node => {
        node.setData({
          ...node.getData(),
          isHighlight: true,
        })
      })
    }

    setLoadingText(t('simulation.execute.success'));
    setLoadingIcon('success.svg');

    setTimeout(() => {
      setSimulateLoading(false)
    }, 3000);
  }

  const resultRef = useRef<HTMLDivElement>(null);
  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }

  const [resultContent, setResultContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const loadResultContent = () => {
    timer && clearTimeout(timer);

    const data = mockData[language]?.allResultContent || []

    console.log(mockData, language, data)

    scrollToBottom()

    let index = currentIndex;
    console.log(index, 'index-----')
    timer = setTimeout(() => {
      const cData = [...resultContent]
      if (['text', 'list'].includes(data[index]?.type)) {
        console.log(cData, 'cData=-=====', cData[index], index)
        if (cData[index]) {
            if (cData[index].data.length < data[index].data.length) {
                cData[index].data += data[index].data.substring(cData[index].data.length, cData[index].data.length + (i18n?.language === 'zh-CN' ? 2 : 4));
                setResultContent([...cData])
            } else {
                setCurrentIndex(index + 1);
            }
        } else {
          cData[index] = {
              ...data[index],
              data: data[index].data.substring(0, 1)
          }
          setResultContent([...cData])
        }
      } else {
        if (data[index] && !cData[index]) {
          setResultContent([
              ...cData,
              data[index]
          ])
          setCurrentIndex(index + 1);
        } else {
          setIsResultLoaded(true);
        }
      }
    }, 20)
  }

  const [schemeContent, setSchemeContent] = useState([]);
  const loadSchemeContent = () => {
    timer && clearTimeout(timer);

    const data = mockData[language][schemeType === 1 ? 'schemeContent1' : 'schemeContent2'] || []

    console.log(mockData, language, data)

    scrollToBottom()

    let index = currentIndex;
    console.log(index, 'index-----')
    timer = setTimeout(() => {
      const cData = [...schemeContent]
      if (['text', 'list'].includes(data[index]?.type)) {
        console.log(cData, 'cData=-=====', cData[index], index)
        if (cData[index]) {
            if (cData[index].data.length < data[index].data.length) {
                cData[index].data += data[index].data.substring(cData[index].data.length, cData[index].data.length + (i18n?.language === 'zh-CN' ? 2 : 4));
                setSchemeContent([...cData])
            } else {
                setCurrentIndex(index + 1);
            }
        } else {
          cData[index] = {
              ...data[index],
              data: data[index].data.substring(0, 1)
          }
          setSchemeContent([...cData])
        }
      } else {
        if (data[index] && !cData[index]) {
          setSchemeContent([
              ...cData,
              data[index]
          ])
          setCurrentIndex(index + 1);
        } else {
          setIsResultLoaded(true);
        }
      }
    }, 20)
  }

  useEffect(() => { 
    if (isResultLoaded) {
      scrollToBottom()
    }
  }, [isResultLoaded])

  useEffect(() => {
    if(isSimulate) {
      loadResultContent()
    }
    
    return () => { 
      timer && clearTimeout(timer);
    };
  }, [resultContent, currentIndex])

  useEffect(() => {
    if(isSimulate && isResultLoaded && schemeType) {
      loadSchemeContent()
    }
    
    return () => { 
      timer && clearTimeout(timer);
    };
  }, [schemeContent, currentIndex, schemeType])

  useEffect(() => { 
    return () => {
      timer && clearTimeout(timer);
    };
  }, [])

  const renderItem = (item) => {
    console.log(item, 'item-------')
    if (item.type === 'text') {
        return (
            <div  className="text">
                {item.data}
            </div>
        )
    }
    if (item.type === 'list') {
      return (
        <div className="result-list">
          {item.data}
        </div>
      )
    }
    if (item.type === 'table') {
      return (
        <Table
          className="result-table"
          border={false}
          pageSize={10}
          scroll={{
              x: true
          }}
          pagination={false}
          {...item.data}/>
      )
    }
    if (item.type === 'tip') {
      return (
        <div className="result-scheme-title">
          <div className="result-scheme-title-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8.00008 0L10.7826 5.21741L16 7.99992L10.7826 10.7826L8.00008 16L5.21741 10.7826L0 7.99992L5.21741 5.21741L8.00008 0Z" fill="url(#paint0_linear_0_37789)"/>
              <defs>
                <linearGradient id="paint0_linear_0_37789" x1="0" y1="8" x2="16" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#30FD98"/>
                  <stop offset="1" stop-color="#83FE4D"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
            <div className="result-scheme-title-right">
              <div className="result-scheme-title-right-top">{item.data.title}</div>
              <div className="result-scheme-title-right-bottom">{item.data.subtitle}</div>
            </div>
        </div>
      )
    }
  }

  

  return (
    <div className='ontology-simulate'>
      
      <div className='ontology-simulate-graph'>
        <OntologyGraph scene="simulate" ref={ontologyGraphRef} onBeforeSimulate={handleBeforeSimulate} onAfterSimulate={handleAfterSimulate} />
        
        {isSimulate && <div className='ontology-simulate-graph-mask'>
            { simulateLoading && <div className='ontology-simulate-tip'>
              {loadingIcon === 'loading.svg' ? <img width='20' height='20' src={loadingGif} /> : <img src={
                new URL(`./images/${loadingIcon}`, import.meta.url).href
              } />}
              {loadingText}
            </div>}
          </div>}
      </div>

      {isSimulate && <div className='ontology-simulate-result' ref={resultRef}>
        <div className='ontology-simulate-result-title'>{t("simulation.result.title")}</div>

        {/* <div className='ontology-simulate-result-content' dangerouslySetInnerHTML={{__html: resultContent}}></div> */}
        <div className='ontology-simulate-result-content'>
          {resultContent.map(item => {
              return renderItem(item)
          })}
          {isResultLoaded && <div className="result-button-wrap">
            <Button onClick={() => {handleScheme(1)}}>{t("simulation.result.button.scheme1")}</Button>
            <Button onClick={() => {handleScheme(2)}}>{t("simulation.result.button.scheme2")}</Button>
          </div>}
          {schemeContent.map(item => {
              return renderItem(item)
          })}
        </div>
      </div>}

      {(isSimulate) && <div className='ontology-simulate-button ontology-simulate-button-back' onClick={handleBack}>
          <Button>{"<"}</Button>{t("simulation.back")}
        </div> }

      {!isSimulate && <div className='ontology-simulate-button ontology-simulate-button-init'>
              <Button onClick={() => handleInitData()}>{t("simulation.data.init")}</Button>
            </div>}

      {loading ? <div className="ontology-simulate-mask">
        <div className='ontology-simulate-tip'>
          {loadingIcon === 'loading.svg' ? <img width='20' height='20' src={loadingGif} /> : <img src={
            new URL(`./images/${loadingIcon}`, import.meta.url).href
          } />}
          
          {loadingText}
        </div>
      </div> : null}
    </div>
  );
};

export default OntologySimulate;

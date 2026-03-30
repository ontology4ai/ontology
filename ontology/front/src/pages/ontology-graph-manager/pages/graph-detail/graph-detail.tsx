import {Button, Select, Empty, Input, List, Message, Space, Tag, Tooltip} from "@arco-design/web-react";
import {
    IconArrowDown, IconArrowLeft,
    IconArrowUp,
    IconCross, IconDataResDirColor, IconDownload,
    IconFullscreen,
    IconFullscreenExit,
    IconSearchColor, IconStarFill, IconStarOn
} from "modo-design/icon";
import Graph from '@/pages/graph';
import './index.less';
import React, {useState, useRef, useCallback, useEffect} from "react";
import {getOntologyGraphData, getOntologyOverview, updateOntologyFavorite} from "@/pages/ontology-graph-preview/api";
import SideCard from "@/pages/diagram/side-card";
import GraphLegend from '@/pages/diagram/legend';
import GraphStatistics from '@/pages/diagram/statistics';

import mockData1 from '@/pages/graph/mock/data1';
const Option = Select.Option;
const initObjectSelect = [
    {label:'关联数据源',value:'dsId',disabled:false},
    {label:'未关联数据源',value:'noDsId',disabled:false},
    {label:'继承接口',value:'interfaceId',disabled:false},
    {label:'未继承接口',value:'noInterfaceId',disabled:false},
];
// 防抖函数
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
const graphDetail = (props)=>{
    const {ontology} = props;
    const [isFavorite,setIsFavorite] = useState(ontology.isFavorite);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [siderCardOpen, setSiderCardOpen] = useState(false);
    const [siderType, setSiderType] = useState('');
    const [searchKeywords, setSearchKeywords] = useState('');
    const [objSelect, setObjSelect] = useState([]);
    const [nodeLimit, setNodeLimit] = useState(150);
    const [siderData, setSiderData] =  useState({});
    const [siderOntologyData, setSiderOntologyData] =  useState({});
    const [graphData, setGraphData] =  useState({});
    const [actionSelect, setActionSelect] = useState('');
    const [contentHeight, setContentHeight] = useState(0);
    const [objectList, setObjectList] = useState(initObjectSelect);
    const [actionList, setActionList] = useState([
      {label:'基于函数',value:'function'},
      {label:'基于对象',value:'object'},
    ]);
    const searchTimeoutRef = useRef();
    const graphRef = useRef();

    const graphContentRef = useRef(null);


    // 处理搜索输入变化
    const handleSearchChange = useCallback((value) => {
        setSearchKeywords(value);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // 设置新的定时器
        searchTimeoutRef.current = setTimeout(() => {
            getGraphData(value);
        }, 500);
    }, []);
    // 清理定时器
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const toggleFullScreen = async () => {
        await setIsFullScreen(!isFullScreen);
        setTimeout(()=>{
            const graph = graphRef.current?.graph;
            if (graph && !graph.destroyed) {
                const container = document.getElementById('graph-'+ontology.id);
                if (container) {
                    graph.resize(container.clientWidth, container.clientHeight);
                    graph.fitView();
                }
            }
        },500)
    };
    const getData = ()=>{

    };
    const getGraphData = useCallback((keywords = searchKeywords)=>{
        const param = {
            ontologyId: ontology.id,
            nodesAmount: nodeLimit,
            pubVersion:props.pubVersion,  //查询生产或发布态，发布态为true
        };
        const searchValue = keywords || searchKeywords;
        if (searchValue.length > 0) {
            param.nodeNames = searchValue;
        }
        getOntologyGraphData(param).then(res=>{
            if(res.data.success && res.data.data?.status === 'success'){
                const graphData =  res.data.data.data;
                graphData.nodes = graphData.nodes.filter(item=>{
                    const nodeData = item.data;
                    if(nodeData.node_type == 'action' && actionSelect !== '') {
                        return nodeData.build_type == actionSelect
                    }else if(nodeData.node_type == 'object'){
                        let flag = true;
                        if(objSelect.includes('dsId')){
                            flag = flag && nodeData.ds_id
                        }
                        if(objSelect.includes('noDsId')){
                            flag = flag && !nodeData.ds_id
                        }
                        if(objSelect.includes('interfaceId')){
                            flag = flag && nodeData.interface_id
                        }
                        if(objSelect.includes('noInterfaceId')){
                            flag = flag && !nodeData.interface_id
                        }
                        return flag
                    }
                    return true
                });
                setGraphData(graphData);
                //  setGraphData(mockData1)
            }else{
                Message.error('获取图谱信息失败');
            }
        });
    },[searchKeywords, objSelect, actionSelect, ontology.id, nodeLimit, props.pubVersion]);
    const getOverviewData = ()=>{
        getOntologyOverview({ontologyId:ontology.id}).then(res=>{
            if(res.data.success){
                const data = res.data.data;
                data.linkTypes = data.linkTypes.filter(item=>item.column)||[];
                data.title = data.ontologyLabel;
                data.type = 'ontology';
                setSiderOntologyData(data);
            }else{
                Message.error('获取本体概览信息失败')
            }
        })
    };
    const toggleOntologyStar = () => {
        const favorite = isFavorite==1?0:1;
        updateOntologyFavorite({
            ontologyId:ontology.id,
            isFavorite:favorite
        }).then(res=>{
            if(res.data.success){
                Message.success(`${favorite==0?'取消':''}收藏成功`);
                setIsFavorite(favorite);
            }else{
                Message.error(`${favorite==0?'取消':''}收藏失败`)
            }
        }).finally(()=>{
            getData();
            props.onChange && props.onChange();
        })
    };
    const objectChange = async(values,o)=>{
        // 使用当前的 objectList 状态作为基础，而不是 initObjectSelect
        const currentList = [...objectList];

        const newObjectList = currentList.map(item => {
            const newItem = {...item};

            newItem.disabled = false;

            // 如果当前选项是"关联数据源"(1)且选中了"未关联数据源"(2)，则置灰
            // 或者当前选项是"未关联数据源"(2)且选中了"关联数据源"(1)，则置灰
            if ((item.value === 'dsId' && values.includes('noDsId')) ||
              (item.value === 'noDsId' && values.includes('dsId'))) {
                newItem.disabled = true;
            }
            // 同理处理"继承接口"(3)和"未继承接口"(4)
            else if ((item.value === 'interfaceId' && values.includes('noInterfaceId')) ||
              (item.value === 'noInterfaceId' && values.includes('interfaceId'))) {
                newItem.disabled = true;
            }

            return newItem;
        });
        await setObjectList(newObjectList);
        console.log(values,objectList);
        await setObjSelect(values);
    };
    const openSiderTab = (tabData)=>{
        setSiderCardOpen(true);
        if(tabData.type == 'ontology'){
            setSiderType('');
        }else{
            tabData.data.type = tabData.type;
            setSiderData(tabData.data);
            setSiderType(tabData.type);
        }

    };
    useEffect(()=>{
        getOverviewData()
    },[]);
    useEffect(()=>{
        getGraphData()
    },[objSelect,actionSelect]);


    // 监听容器高度变化
    useEffect(() => {
        const updateHeight = () => {
            if (graphContentRef.current) {
                const height = graphContentRef.current.clientHeight;
                setContentHeight(height-24);
            }
        };

        // 初始获取高度
        updateHeight();

        // 监听窗口大小变化
        window.addEventListener('resize', updateHeight);

        // 使用 ResizeObserver 监听元素大小变化
        const resizeObserver = new ResizeObserver(updateHeight);
        if (graphContentRef.current) {
            resizeObserver.observe(graphContentRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateHeight);
            resizeObserver.disconnect();
        };
    }, []);

    return (
      <div className={`graph-card ${isFullScreen ? ' fullscreen-active' : ''} ${props.innerTab?'graph-inner-card':''}`}>
          <div className="graph-head">
              <div className="head-left">
                  <div className="dot"></div>
                  <span>{ontology.ontologyLabel}</span>
                  <span>{ontology.ontologyName}</span>
              </div>
              <div className="head-right">

              </div>
          </div>
          <div className='graph-body'>
              <div className="graph-search">
                  <div className="graph-body-top-left">
                      <Input
                        placeholder={`可输入多个关键字,以英文逗号“,”相隔`}
                        allowClear
                        suffix={<IconSearchColor/>}
                        value={searchKeywords}
                        onChange={handleSearchChange}
                      />
                      <div className="filter-item">
                          <div className="filter-item-label">对象</div>
                          <div className="filter-item-content">
                              <Select
                                mode='multiple'
                                placeholder='请选择'
                                style={{ width: 300 }}
                                allowClear
                                value={objSelect}
                                onChange={(value)=>{objectChange(value)}}
                              >
                                  {objectList.map((option) => (
                                    <Option key={option.value} disabled={option.disabled} value={option.value}>
                                        {option.label}
                                    </Option>
                                  ))}
                              </Select>
                          </div>
                      </div>
                      <div className="filter-item">
                          <div className="filter-item-label">动作</div>
                          <div className="filter-item-content">
                              <Select
                                placeholder='请选择'
                                style={{ width: 300 }}
                                value={actionSelect}
                                allowClear
                                onChange={setActionSelect}
                              >
                                  {actionList.map((option) => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                  ))}
                              </Select>
                          </div>
                      </div>
                  </div>
                  <div className="graph-body-top-right">
                      {props.innerTab?'':<><Button  icon= {isFavorite ? <IconStarFill style={{color: 'var(--color-warning-6)'}}/> :
                        <IconStarOn style={{color: 'var(--color-text-2)'}}/>}  size='mini'  type='text' className="star-icon" onClick={() => toggleOntologyStar()}>
                          {isFavorite ? '已收藏':'未收藏'}
                      </Button>
                          <div className="split"/></>}
                      <Button size='mini' icon={<IconDownload/>} disabled type='text'>下载</Button>
                      {isFullScreen ?
                        <Button
                          shape='circle'
                          size='mini'
                          type='text'
                          onClick={() => toggleFullScreen()}
                        >
                            <IconFullscreenExit />
                        </Button>
                        : <Space size='mini'>
                            <Button
                              shape='circle'
                              size='mini'
                              type='text'
                              onClick={() => toggleFullScreen()}
                            >
                                <IconFullscreen />
                            </Button>
                            {/*<Button shape='circle'  size='mini' onClick={() => deleteActiveOntology()} type='text'><IconCross/></Button>*/}
                        </Space>}
                  </div>
              </div>
              <div className="graph-content" ref={graphContentRef}>
                  {/*  // G6 容器*/}
                  <div
                    id={`graph-${ontology.id}`}
                    className="graph-left"
                    style={{width: 'calc(100% - 200px)', height: '100%'}}
                  >
                      <Graph openSiderTab={openSiderTab} ontology={ontology} data={graphData} ref={graphRef}/>
                      <div className="graph-tool-info">
                          <GraphStatistics data={siderOntologyData} ontology={ontology} height={contentHeight}/>
                          <GraphLegend height={contentHeight}/>
                      </div>

                  </div>
                  <Button type='outline' className='open-detail-icon' style={{opacity:siderCardOpen?0:1}}
                          onClick={() => {setSiderCardOpen(true)}}>
                      <IconArrowLeft/>
                  </Button>
                  <div
                    className="sider-cards"
                    style={{width: siderCardOpen ? '280px' : '0', opacity: siderCardOpen ? 1 : 0}}>
                      <SideCard
                        hide={siderType ? true : false}
                       // type='ontology'
                        onClose={() => {
                            setSiderCardOpen(false)
                        }}
                        data={siderOntologyData}
                      />
                      {siderType ?
                        <SideCard
                          data={siderData}
                          //type={siderType}
                          onClose={() => {
                              setSiderCardOpen(false)
                          }}/> : ''}
                  </div>

              </div>

          </div>
      </div>
    )
};
export default graphDetail;

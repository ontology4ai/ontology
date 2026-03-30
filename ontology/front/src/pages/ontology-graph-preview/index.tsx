import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Collapse, Input, Space,
    Spin, Alert, Typography, Tag, Tooltip, List,
    Button, Message, Empty
} from '@arco-design/web-react';

const { Title, Paragraph, Text } = Typography;
import {debounce} from 'lodash';
import Tabs from '@/components/Tabs';
import {
    IconStarOn,
    IconStarFill,
    IconDataResDirColor,
    IconMgmtNodeColor, IconInformationColor,
    IconArrowUp,
    IconArrowDown,
    IconArrowLeft,
    IconFullscreen,
    IconCross,
    IconSearchColor,
  IconFullscreenExit,
    IconDownload, IconTextareaColor, IconCounterColor, IconDataIntegrationColor, IconUnitMgrColor, IconCalendarColor
} from 'modo-design/icon'
import './index.less'
import {getOntologyList, updateOntologyFavorite, getOntologyGraphData, getObjectData,getOntologyOverview,getObjectExpandData,getActionData,getLogicData} from './api'
import circleIcon from './images/circle.svg';
import rectIcon from './images/rect.svg';
import hexagonIcon from './images/hexagon.svg';

  // 引入 G6
import { CanvasEvent, Graph, NodeEvent } from '@antv/g6';

import emptyIcon from "@/pages/object/images/empty.svg";

const CollapseItem = Collapse.Item;


const renderIcon = (option) => {
    let labelIcon = '';
    switch (option) {
        case 'string':
            labelIcon = <IconTextareaColor/>;
            break;
        case 'int':
            labelIcon = <IconCounterColor/>;
            break;
        case 'decimal':
            labelIcon = <IconDataIntegrationColor/>;
            break;
        case 'bool':
            labelIcon = <IconUnitMgrColor/>;
            break;
        case 'date':
            labelIcon = <IconCalendarColor/>;
            break
    }
    return labelIcon
};/*
const colors=['#DDFFFB','#FFEEB9','#FFE8F4','#E3E9EF','rgba(131, 201, 165, 0.35)','rgba(221, 118, 183, 0.35)','rgba(247, 186, 72, 0.35)','rgba(98, 212, 201, 0.35)'];*/
const colors=['#f9fbfd','#f8fffc','#fffdf7','#f7fffe','#fffbfe'];
const tooltipColor=['#fff','#f8fffc','#fffdf7','#f7fffe','#fffbfe'];
const nodeColors = ['#F5A623','#64BE4B','#5097d5','#d65745','#d65745'];
let count =0;
const OntologyList = () => {
    const tabsRef = useRef();
    //存储 G6 图实例
    const graphRefs = useRef({});
    const cardsContainerRef = useRef(null);
    const clickTimers = useRef({});
    // 保存当前全屏卡片 ID
    const [fullScreenId, setFullScreenId] = useState(null);
    const [filterVal, setFilterVal] = useState('');
    const [showStar, setShowStar] = useState(0);
    const [current,setCurrent] = useState({});
    const [nodeLimit, setNodeLimit] = useState(150);
    const [cardExpandStates, setCardExpandStates] = useState({});  //记录本体图谱收起展开状态
    const [cardDetailStates, setCardDetailStates] = useState({});  //记录侧边概览的收起展开状态
    const [cardOntologyInfo, setCardOntologyInfo] = useState({});  //记录侧边概览信息
    const [cardObjectInfo, setCardObjectInfo] = useState({});  //记录侧边对象类型信息
    const [searchKeywords, setSearchKeywords] = useState({});
    const [cardLoading, setCardLoading] = useState({});
    const [allListData, setAllListData] = useState([]);
    const [activedOntologys, setActivedOntologys] = useState([]);
    const [filterListData, setFilterListData] = useState([]);
    const [loading, setLoading] = useState(false);


    const toggleOntologyStar = (ontology, index) => {
        const isFavorite = ontology.isFavorite==1?0:1;
        updateOntologyFavorite({
            ontologyId:ontology.id,
            isFavorite:isFavorite
        }).then(res=>{
            if(res.data.success){
                const newData = [...activedOntologys];
                newData[index] = {...ontology, isFavorite: isFavorite};
                setActivedOntologys(newData)
            }else{
                Message.error('收藏失败')
            }
        }).finally(()=>{
            getData();
        })
    };
    const toggleGraph = (item) => {
        setCardExpandStates(prev => ({
            ...prev,
            [item.id]: !prev[item.id]
        }));
    };
    const toggleFullScreen = async (itemId) => {
        await setFullScreenId(fullScreenId === itemId ? null : itemId);
        if(fullScreenId !== itemId){
            await setCardExpandStates(prev => ({
                ...prev,
                [itemId]: true
            }));
        }
        setTimeout(()=>{
            const graph = graphRefs.current['graph-'+itemId];
            if (graph && !graph.destroyed) {
                const container = document.getElementById('graph-'+itemId);
                if (container) {
                    graph.resize(container.clientWidth, container.clientHeight);
                    graph.fitView();
                }
            }
        },500)
    };

    const handleSearchChange = (id, value) => {
        const keyword = value.trim();
        setSearchKeywords(prev => ({
            ...prev,
            [id]: keyword
        }));
        debouncedSearch(id, keyword)
    };

    // 添加防抖的搜索函数
    const debouncedSearch = useCallback(
      debounce(async (id, keyword) => {
          try {
              setCardLoading(prev => ({
                  ...prev,
                  [id]: true
              }));
              const param = {
                  ontologyId: id,
                  nodesAmount: nodeLimit,
                  pubVersion:true,  //查询生产或发布态，发布态为true
              };
              keyword.length >0 ? param.nodeNames = keyword : '';
              await getOntologyGraphData(param).then(async(res) => {
                  if (res.data.success) {
                      const newActivedOntologys = [...activedOntologys];
                      const index = newActivedOntologys.findIndex(item => item.id == id);
                      const ontology = newActivedOntologys[index];
                      const graphData =  res.data.data.data;
                      if (graphData.nodes) {
                          graphData.nodes = graphData.nodes.map(item => {
                              let label = '';
                              const nodeType = item.data.node_type;
                              if(nodeType == 'object'){
                                  label=item.data.object_type_label
                              }else if(nodeType == 'action'){
                                  label=item.data.action_name
                              }else if(nodeType == 'logic'){
                                  label=item.data.logic_type_label
                              }
                              return {
                                  //id: item.id,
                                  ...item,
                                  //...item.data,
                                  label: label,
                                  color:nodeColors[Math.floor(Math.random() * nodeColors.length)],
                                  ontologyId: item.data.ontology_id,
                                  expanded: false,
                                  parentId: null,
                              }
                          });
                      } else {
                          graphData.nodes = []
                      }

                      if (graphData.edges) {
                          graphData.edges = graphData.edges.map(item => {
                              return {
                                  ...item,
                                  id:item.id ||`${item.source}-${item.target}`
                                  //source: item.source,
                                  //target: item.target,
                                  //...item.data,
                              }
                          });
                      } else {
                          graphData.edges = []
                      }
                      const newOntology = {
                          ...ontology,
                          graphData
                      };
                      newActivedOntologys[index] = newOntology;
                      setActivedOntologys([...newActivedOntologys]);
                      setCardExpandStates({...cardExpandStates, [newOntology.id]: true});
                      const containerId = `graph-${id}`;
                      const graph = graphRefs.current[containerId];
                      if (graph && !graph.destroyed) {
                         // await graph.clear();
                          const currentZoom = graph.getZoom();
                          console.log('当前缩放比例:', currentZoom);
                          graph.setData(graphData);
                          graph.render();
                          graph.zoomTo(currentZoom);
                          graph.fitView();
                      }
                  }else{
                      Message.error('查询节点失败');
                  }
              }).finally(() => {
                  setCardLoading(prev => ({
                      ...prev,
                      [id]: false
                  }));
              })
          } catch (error) {
              console.log('搜索失败:', error);
          }
      }, 500), // 500毫秒防抖延迟
      [activedOntologys,cardExpandStates]
    );
    const addActiveOntology = (ontology) => {
        const data = activedOntologys.find(item => item.id == ontology.id);
        if (!data) {
            getOntologyGraphData({
                ontologyId: ontology.id,
                nodesAmount: nodeLimit,
                pubVersion:true,  //查询生产或发布态，发布态为true
            }).then(res=>{
                if(res.data.success && res.data.data?.status === 'success'){
                    const graphData =  res.data.data.data;
                    if (graphData.nodes) {
                        graphData.nodes = graphData.nodes.map(item =>{
                            let label = '';
                            const nodeType = item.data.node_type;
                            if (nodeType == 'object') {
                                label = item.data.object_type_label
                            } else if (nodeType == 'action') {
                                label = item.data.action_name
                            } else if (nodeType == 'logic') {
                                label = item.data.logic_type_label
                            }
                            return {
                                //id: item.id,
                                ...item,
                                //...item.data,
                                color:nodeColors[Math.floor(Math.random() * nodeColors.length)],
                                label: label,
                                ontologyId: item.data.ontology_id,
                                expanded: false,
                                parentId: null,
                            }
                        });
                    } else {
                        graphData.nodes = []
                    }

                    if (graphData.edges) {
                        graphData.edges = graphData.edges.map(item => {
                            return {
                              ...item,
                                id:item.id ||`${item.source}-${item.target}`
                                //source: item.source,
                                //target: item.target,
                                //...item.data,
                            }
                        });
                    } else {
                        graphData.edges = []
                    }
                    const newOntology = {
                        ...ontology,
                        graphData
                    };
                    setActivedOntologys([newOntology,...activedOntologys]);
                    setCardExpandStates({...cardExpandStates, [ontology.id]: true});
                }else{
                    Message.error('获取图谱信息失败');
                }
            });
            getOntologyOverview({ontologyId:ontology.id}).then(res=>{
                if(res.data.success){
                    const data = res.data.data;
                    data.linkTypes = data.linkTypes.filter(item=>item.column)||[];
                    setCardOntologyInfo((prev)=>({
                      ...prev,
                        [ontology.id]:data
                    }));
                    setCardDetailStates(prev => ({
                        ...prev,
                        [ontology.id]: '1'
                    }));
                }else{
                    Message.error('获取本体概览信息失败')
                }
            })

        }
    };
    const deleteActiveOntology = (index) => {
        const newData = [...activedOntologys];
        const deletedItem = newData[index];

        // 1. 销毁对应的 G6 图实例
        if (graphRefs.current[`graph-${deletedItem.id}`]) {
            graphRefs.current[`graph-${deletedItem.id}`].destroy();
            delete graphRefs.current[`graph-${deletedItem.id}`]; // 从 ref 中移除
        }

        // 2. 更新状态
        newData.splice(index, 1);
        setActivedOntologys(newData);

        // 3. 清理相关状态
        setCardExpandStates(prev => {
            const newStates = {...prev};
            delete newStates[deletedItem.id];
            return newStates;
        });
        setCardDetailStates(prev => {
            const newStates = {...prev};
            delete newStates[deletedItem.id];
            return newStates;
        });
        //清理概览信息
        setCardOntologyInfo(prev => {
            const newdata = {...prev};
            delete newdata[deletedItem.id];
            return newdata;
        });

        setSearchKeywords(prev => {
            const newdata = {...prev};
            delete newdata[deletedItem.id];
            return newdata;
        });
    };


    const getData = (isFavorite=null)=>{
        const param = {status:1,published:1};
        if(isFavorite){
            param.isFavorite = isFavorite;
        }
        setLoading(true);
        getOntologyList(param).then(res=>{
            if(res.data.success){
                setAllListData(res.data.data);
            }
        }).finally(()=>{
            setLoading(false);
        })
    };
    useEffect(() => {
        if (activedOntologys.length > 0 && cardsContainerRef.current) {
            // 滚动到第一个卡片（因为新卡片添加在最前面）
            const firstCard = cardsContainerRef.current.firstElementChild;
            if (firstCard) {
                firstCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [activedOntologys.length]);
    useEffect(() => {
        const data = allListData.filter(item => {
            if(showStar == 1){
                return (item.ontologyLabel.toLowerCase().includes(filterVal.toLowerCase()) || item.ontologyName.toLowerCase().includes(filterVal.toLowerCase())) && item.isFavorite == showStar
            }
            return (item.ontologyLabel.toLowerCase().includes(filterVal.toLowerCase()) || item.ontologyName.toLowerCase().includes(filterVal.toLowerCase()))

        });
        setFilterListData(data);
    }, [allListData, filterVal, showStar]);
// 初始化 G6 图的函数
    const initGraph = useCallback(async (containerId, data) => {
        //更换背景颜色
        const currentValue = count % 4;
        const color = colors[ currentValue];
        count++;

        // 如果已经存在实例，先销毁
        if (graphRefs.current[containerId]) {
            graphRefs.current[containerId].destroy();
        }

        // 创建新的图实例
        const graph = new Graph({
            container: containerId,
            width: document.getElementById(containerId).clientWidth,
            height: document.getElementById(containerId).clientHeight,
            autoFit: 'view',
            padding: 16,
            data,
            layout: {
                type: 'force',
                preventOverlap: true,
                nodeSize: 30
            },

            node: {
                type: (d)=>d.data?.node_type=='object'?'circle':d.data?.node_type=='action'?'hexagon':'rect',
                style: {
                    radius: 4,
                    size: 70,
                    fill: (d) => {
                        return d.color;
                    },
                  //  fill: (d)=>d.data?.node_type=='object'?'#3261CE':d.data?.node_type=='action'?'#F5A623':'#64BE4B',
                    labelText: (d) => {
                        return d.label
                    },
                    labelFill:'#fff',
                    labelFontWeight:500,
                    labelMaxLines:3,
                    labelMaxWidth:'90%',
                    labelPlacement: 'center',
                    labelTextAlign: 'center',
                    labelWordWrap: true,
                    labelTextOverflow:'ellipsis'
                },
                state: {
                    highlight: {
                      //  fill: '#3261CE',
                        stroke: '#fff',
                        //haloStroke: '#69a6ce',
                        //haloOpacity: 0.8,
                    },
                    // 相邻节点状态
                    active: {
                        halo:false
                    },
                    selected: {
                        size: 90,
                        //fill: '#3261CE',
                        stroke: '#fff',
                        haloLineWidth: 30,
                    },
                },
            },
            edge: {
                type: (d)=>d.data?.edge_type=='object-object'?'quadratic':'line',
                style: {
                    stroke: d=>d.data?.edge_type=='object-object'?'#79879C':'#B3C0CC',
                    lineWidth: d=>d.data?.edge_type=='object-object'?1.4:1,
                    labelText: (d) =>{
                        return d.data.label
                    },
                    labelBackground: true,
                    endArrow: true,
                },
                /*state:{
                    neighborActive: {
                        haloStroke: '#b7c3cc',
                        haloOpacity: 0.8,
                    },
                }*/

            },
            behaviors: [
              'drag-element','drag-canvas', 'drag-node',
                //'zoom-canvas',
                {
                    type: 'click-select',
                    degree: 1,
                    state: 'selected', // 选中的状态
                    neighborState: 'active', // 相邻节点附着状态
                    unselectedState: 'inactive', // 未选中节点状态
                    multiple: true,
                    trigger: ['shift'],
                },
            ],
            plugins: [
                {
                    type: 'background',
                    key: 'my-background', // 为插件指定标识符，方便动态更新
                    backgroundColor: color, // 设置背景色
                   // opacity:0.2
                },
                {
                    type: 'toolbar',
                    position: 'bottom-right',
                    onClick: (item, graphInstance) => {  // 添加 graphInstance 参数
                        const currentZoom = graph.getZoom();
                        switch (item) {
                            case 'zoom-in':
                                graph.zoomTo(currentZoom * 1.2, {
                                    x: graph.width / 2,
                                    y: graph.height / 2
                                });
                                break;
                            case 'zoom-out':
                                graph.zoomTo(currentZoom * 0.8, {
                                    x: graph.width / 2,
                                    y: graph.height / 2
                                });
                                break;
                            case 'auto-fit':
                                graph.fitView();
                                break;
                        }
                    },
                    getItems: () => {
                        return [
                            { id: 'zoom-in', value: 'zoom-in' },
                            { id: 'zoom-out', value: 'zoom-out' },
                            { id: 'auto-fit', value: 'auto-fit' },
                        ];
                    },
                },
                /*{
                    type: 'tooltip',
                    key:'node-tooltip',
                    trigger: 'click',
                    offset:[-2,-2],
                    position:'bottom-right',
                    enable:(event,items)=>{
                        const model = items[0]; // 获取节点数据
                        return event.targetType === 'node' && model.data.node_type=='object';
                    },
                    getContent: (e, items) => {
                        const model = items[0]; // 获取节点数据
                        return `
                            <div class="g6-tooltip-content" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <div class="toggle-action">
                                ${!model.expanded ? '展开' : '收起'}
                              </div>
                            </div>
                          `;
                    },
                    onOpenChange: (open) => {
                        const tooltip = graph.getPluginInstance('node-hover-tooltip');
                        if (tooltip && open) {
                            tooltip.hide();
                        }
                    },
                    enterable:true,
                },*/
                {
                    type: 'tooltip',
                    key:'node-hover-tooltip',
                    trigger: 'hover',
                    enable:(event)=>{
                       // const tooltip = graph.getPluginInstance('node-tooltip');
                        return event.targetType === 'node';// ||event.target.id !== tooltip.currentTarget ;
                    },
                    getContent: (e, items) => {
                        const model = items[0]; // 获取节点数据
                        const type = model.data.node_type;
                        let content = '';
                        switch (type) {
                            case 'object':
                                content = `
                            <div class="g6-tooltip-content object" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <li><span>节点类型：</span><div>对象</div></li>
                              <li><span>中文名：</span><div>${model.data.object_type_label}</div></li>
                              <li><span>英文名：</span><div>${model.data.object_type_name}</div></li>
                              <li><span>描述：</span><div>${model.data.object_type_desc||''}</div></li>
                               
                            </div>
                          `;
                                break;
                            case 'action':
                                content = `
                            <div class="g6-tooltip-content action" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <li><span>节点类型：</span><div>动作</div></li>
                              <li><span>中文名：</span><div>${model.data?.action_name}</div></li>
                              <li><span>描述：</span><div>${model.data?.action_desc||''}</div></li>
                            </div>
                          `;
                                break;
                            case 'logic':
                                content = `
                            <div class="g6-tooltip-content logic" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <li><span>节点类型：</span><div>逻辑</div></li>
                              <li><span>中文名：</span><div>${model.data?.logic_type_label}</div></li>
                              <li><span>英文名：</span><div>${model.data?.logic_type_name}</div></li>
                              <li><span>描述：</span><div>${model.data?.logic_type_desc||''}</div></li>
                            </div>
                          `;
                                break;
                        }
                        return content;
                    },
                    /*onOpenChange: (open) => {
                        const tooltip = graph.getPluginInstance('node-tooltip');
                        if (tooltip && open) {
                            tooltip.hide();
                        }
                    }*/
                },
            ],
        });

        // 存储图实例
        graphRefs.current[containerId] = graph;
        const ontologyId = containerId.split('-')[1];
        graph.on(NodeEvent.CLICK, (event) => {
            const { target, originalTarget } = event;
            const id = target.id;

            if (clickTimers.current[id]) {
                clearTimeout(clickTimers.current[id]);
                delete clickTimers.current[id];
                return; // 如果是双击的一部分，忽略这次单击
            }


            clickTimers.current[id] = setTimeout(() => {
                delete clickTimers.current[id];
                console.log("单击");
                const data = graph.getNodeData(id);
                const nodeType = data.data.node_type;
                const ontologyId = data.ontologyId;
                if(nodeType == 'object'){
                    getObjectData({objectTypeId:id}).then(res=>{
                        if(res.data.success){
                            const data = res.data.data;
                            data.nodeType = nodeType;
                            setCardObjectInfo(prev => ({
                                ...prev,
                                [ontologyId]: data
                            }));
                            setCardDetailStates(prev => ({
                                ...prev,
                                [ontologyId]: '2'
                            }));
                        }
                    });
                }else if(nodeType == 'action'){
                    getActionData(id).then(res=>{
                        if(res.data.success){
                            const data = res.data.data;
                            data.nodeType = nodeType;
                            if(data.buildType == 'function'){
                                let inputKeys = [];
                                try{
                                    const inputParam = JSON.parse(data.inputParam);
                                    inputKeys = Object.keys(inputParam);
                                }catch{

                                }
                                data.inputKeys = inputKeys;
                            }
                            setCardObjectInfo(prev => ({
                                ...prev,
                                [ontologyId]: data
                            }));
                            setCardDetailStates(prev => ({
                                ...prev,
                                [ontologyId]: '3'
                            }));
                        }
                    })
                }else if(nodeType == 'logic'){
                    getLogicData(id).then(res=>{
                        if(res.data.success){
                            const data = res.data.data;
                            data.nodeType = nodeType;
                            if(data.buildType == 'function'){
                                let inputKeys = [];
                                try{
                                    const inputParam = JSON.parse(data.inputParam);
                                    inputKeys = Object.keys(inputParam);
                                }catch{

                                }
                                data.inputKeys = inputKeys;
                            }
                            setCardObjectInfo(prev => ({
                                ...prev,
                                [ontologyId]: data
                            }));
                            setCardDetailStates(prev => ({
                                ...prev,
                                [ontologyId]: '4'
                            }));
                        }
                    })
                }
                },300);
        });
        graph.on(NodeEvent.DBLCLICK, (event) => {
            const { target, originalTarget } = event;
            const id = target.id;

            if (clickTimers.current[id]) {
                clearTimeout(clickTimers.current[id]);
                delete clickTimers.current[id];
            }
            console.log("双击");
            const node = graph.getNodeData(id);
            if (!node) return;
            const nodeType = node.data.node_type;
            if(nodeType == 'object'){
                toggleExpansion(node,graph);
            }
        });

        graph.on(CanvasEvent.CLICK, () => {
            const selectedIds = graph.getElementDataByState('node', 'selected').map((node) => node.id);
            const  data = {...cardOntologyInfo};
            delete data[ontologyId];
            setCardObjectInfo(data);

            setCardDetailStates(prev => ({
                ...prev,
                [ontologyId]: prev[ontologyId]?'1':false
            }));
            /*graph.updateNodeData(selectedIds.map((id) => ({ id, states: [], style: { labelText: 'Click the Light' } })));
            graph.draw();*/
        });

        // 渲染数据
        if (data) {
            await graph.render();
            //graph.fitView();
        }

        return graph;
    }, []);

   /* useEffect(() => {
        const handleTooltipClick = (e) => {
            // 检查点击的是否是tooltip中的操作元素
            const toggleAction = e.target.closest('.toggle-action');
            if (!toggleAction) return;

            // 获取节点ID
            const tooltipContent = e.target.closest('.g6-tooltip-content');
            if (!tooltipContent) return;

            const nodeId = tooltipContent.dataset.nodeId;
            if (!nodeId) return;

            const notologyId = tooltipContent.dataset.notologyId;
            if (!notologyId) return;

            const graph = graphRefs.current[`graph-${notologyId}`];
            if (graph && !graph.destroyed) {

                // 找到对应的节点
                const node = graph.getNodeData(nodeId);
                if (!node) return;
                toggleExpansion(node,graph);
            }

        };

        // 添加到document
        document.addEventListener('click', handleTooltipClick);

        return () => {
            document.removeEventListener('click', handleTooltipClick);
        };
    }, []);*/

    // 当卡片展开或全屏时，重新计算图大小
    useEffect(() => {
        const handleResize = () => {
            Object.keys(graphRefs.current).forEach(key => {
                const graph = graphRefs.current[key];
                if (graph && !graph.destroyed) {
                    const container = document.getElementById(key);
                    if (container) {
                        graph.resize(container.clientWidth, container.clientHeight);
                       // graph.fitView();
                    }
                }
            });
        };

        const debouncedResize = debounce(handleResize, 200);
        window.addEventListener('resize', debouncedResize);
        return () => window.removeEventListener('resize', debouncedResize);
    }, []);
    useEffect(() => {
        return () => {
            // 组件卸载时销毁所有图实例
            Object.values(graphRefs.current).forEach(key => {
                const graph = graphRefs.current[key];
                if (graph && !graph.destroyed) {
                    debugger;
                    graph.destroy();
                }
            });
            graphRefs.current = {};
        };
    }, []);
    const getNodeChildren = (objectTypeId,ontologyId)=>{
        return new Promise((resolve)=>{
            getObjectExpandData({
                objectTypeId,
                pubVersion:true
            }).then(res=>{
                if(res.data.success && res.data.data?.status === 'success'){
                    const graphData = res.data.data.data;
                    //假数据
                      /*{
                          nodes: [{
                              id: objectTypeId + '011',
                              data: {object_type_label: 'test_logic', node_type: 'logic', ontology_id: ontologyId}
                          }, {
                              id: objectTypeId + '012',
                              data: {object_type_label: 'test_action', node_type: 'action', ontology_id: ontologyId}
                          }, {
                              id: objectTypeId + '01',
                              data: {object_type_label: 'test', node_type: 'object', ontology_id: ontologyId}
                          },],
                          edges: [{
                              source: objectTypeId,
                              target: objectTypeId + '01',
                              data: {label: 'fffffff', edge_type: 'object-object'}
                          },
                              {source: objectTypeId + '011', target: objectTypeId + '01', data: {label: '引用'}},
                              {source: objectTypeId + '012', target: objectTypeId + '01', data: {label: '执行'}}]
                      };*/

                    if (graphData.nodes) {
                        graphData.nodes = graphData.nodes.map(item => {
                            let label = '';
                            const nodeType = item.data.node_type;
                            if(nodeType == 'object'){
                                label=item.data.object_type_label
                            }else if(nodeType == 'action'){
                                label=item.data.action_name
                            }else if(nodeType == 'logic'){
                                label=item.data.logic_type_label
                            }
                            return {
                                //id: item.id,
                                ...item,
                                //...item.data,
                                label: label,
                                color:nodeColors[Math.floor(Math.random() * nodeColors.length)],
                                ontologyId: item.data.ontology_id,
                                expanded: false,
                                parentId: objectTypeId,
                            }
                        });
                    } else {
                        graphData.nodes = []
                    }

                    if (graphData.edges) {
                        graphData.edges = graphData.edges.map(item => {
                            return {
                                ...item,
                                id:item.id ||`${item.source}-${item.target}`
                            }
                        });
                    } else {
                        graphData.edges = []
                    }
                    resolve(graphData);
                }else{
                    Message.error('展开节点失败');
                    resolve(null);
                }
            }).catch(()=>{
                resolve(null)
            })
        })
    };
    const expandNode = async (graph, model) => {
        const id = model.id;
        if (model.expand) return;
        const children = await getNodeChildren(id,model.ontologyId);
        if(children){
            const existNodes = graph.getNodeData();//[model,...graph.getNeighborNodesData(id)];
            existNodes.forEach(node=>{
                const index = children?.nodes?.findIndex(item=>item.id==node.id);
                if(index>-1){  //剔除已经存在的节点，避免重复添加
                    children?.nodes?.splice(index,1)
                }
            });
            if(children.nodes.length>0){
                children.edges = children?.edges.filter((edge)=>{
                    try {
                        //剔除已存在的边
                        const edge = graph.getEdgeData(edge.id);
                        if(edge){
                            return false
                        }else{
                            return true;
                        }
                    }catch (e) {
                        return true;
                    }
                })
            }else{
                children.edges = [];
            }
            graph.addData(children);
            graph.updateNodeData([{...model,expanded:true}]);
            graph.render();
            graph.layout();
        }
        /*graph.updatePlugin({
            key:'node-tooltip',
            getContent: (e, items) => {
                const model = items[0]; // 获取节点数据
                return `<div style="background:#fff; color: var(--color-text-1);"  class="g6-tooltip-content" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <div class="toggle-action">
                                ${!model.expanded ? '展开' : '收起'}
                              </div>
                            </div>
                          `;
            },
        })*/
    };
    const collapseNode = (graph,model)=>{
        if (!model.expanded) return;

        // 递归查找并删除所有子节点
        const removeChildren = (parentId) => {
            const children = graph.getNodeData().filter(n => {
                return n.parentId === parentId;
            });

            children.forEach(child => {
                // 先递归删除子节点的子节点
                removeChildren(child.id);

                // 删除与子节点相连的边

                // 删除子节点
                graph.removeNodeData([child.id]);
            });
        };

        // 开始删除子节点
        removeChildren(model.id);
        graph.updateNodeData([{...model,expanded:false}]);
        graph.render();
        graph.layout();
        /*graph.updatePlugin({
            key:'node-tooltip',
            getContent: (e, items) => {
                const model = items[0]; // 获取节点数据
                return `
                            <div class="g6-tooltip-content" data-node-id="${model.id}" data-notology-id="${model.ontologyId}">
                              <div class="toggle-action">
                                ${!model.expanded ? '展开' : '收起'}
                              </div>
                            </div>
                          `;
            },
        })*/
    };
    const toggleExpansion =(model, graph)=>{
        if(!model.expanded){
            console.log('展开');
            expandNode(graph,model);
        }else{
            console.log('收起');
            collapseNode(graph,model);
        }
    };

    // 当激活的本体变化时，初始化或更新图
    useEffect(() => {
        activedOntologys.forEach(item => {
            if (cardExpandStates[item.id] && !graphRefs.current[`graph-${item.id}`]) {
                initGraph(`graph-${item.id}`, item.graphData);
            }
        });
    }, [activedOntologys, cardExpandStates, initGraph]);
    useEffect(()=>{
        getData()

    },[]);

    return (
      <div className='ontology-list-container'>
          <Tabs title='本体列表' icon={<IconMgmtNodeColor/>} ref={tabsRef}>
              <Spin style={{display: 'block', width: '100%', height: '100%'}} loading={loading}>
                  <div className="ontology-graph-container">
                      <div className="left-content">
                          <div className="list-header">
                              <Input
                                placeholder="请输入"
                                value={filterVal}
                                suffix={<IconSearchColor/>}
                                onChange={value => setFilterVal(value)}
                              />
                              <div className="star-icon" onClick={() => setShowStar(showStar==1?0:1)}>
                                  {showStar==1 ? <IconStarFill style={{color: 'var(--color-warning-6)'}}/> :
                                    <IconStarOn style={{color: 'var(--color-text-2)'}}/>}

                              </div>
                          </div>
                          <div className="list-body">
                              {filterListData.map((item) => (
                                <div className='ontology-card'
                                     key={item.id}
                                     onClick={() => addActiveOntology(item)}>
                                    <IconDataResDirColor style={{color: 'var(--color-primary-6)'}}/>
                                    <div className='ontology-content'>
                                        <Tooltip content={item.ontologyLabel}>
                                            <span>{item.ontologyLabel}</span>
                                        </Tooltip>
                                        <Tooltip content={item.ontologyName}>
                                            <span>{item.ontologyName}</span>
                                        </Tooltip>
                                    </div>
                                    {item.isFavorite ? <IconStarFill style={{color: 'var(--color-warning-6)'}}/> : ''}
                                </div>
                              ))}
                          </div>
                      </div>
                      <div className="right-content"  ref={cardsContainerRef}>
                          {activedOntologys.length == 0 ?
                            <Alert className='action-alert' icon={<IconInformationColor/>} content='选择一个本体查看图谱'/> : ''}

                          {activedOntologys.map((item, index) => (
                            <div key={item.id}
                                 className={`graph-card ${fullScreenId === item.id ? ' fullscreen-active' : ''}                        ${cardExpandStates[item.id] ? '' : 'graph-card-up'}`}
                                 onDoubleClick={(e) => e.preventDefault()}
                                /* ref={el => {
                                     // 新添加的卡片自动滚动到视图
                                     if (el && index === 0) {
                                         el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                     }
                                 }}*/

                            >
                                <div className="graph-head">
                                    <div className="head-left">
                                        <div className="dot"></div>
                                        <span>{item.ontologyLabel}</span>
                                        <span>{item.ontologyName}</span>
                                    </div>
                                    <div className="head-right">
                                        {fullScreenId == item.id?
                                          <Button
                                            shape='circle'
                                            size='mini'
                                            type='text'
                                            onClick={() => toggleFullScreen(item.id)}
                                          >
                                              <IconFullscreenExit />
                                          </Button>
                                          : <Space size='mini'>
                                              {cardExpandStates[item.id] ?
                                                <Button shape='circle' size='mini' onClick={() => toggleGraph(item)}type='text'><IconArrowUp/></Button> :
                                                <Button shape='circle'  size='mini' onClick={() => toggleGraph(item)}  type='text'><IconArrowDown/></Button>
                                              }
                                              <Button
                                                shape='circle'
                                                size='mini'
                                                type='text'
                                                onClick={() => toggleFullScreen(item.id)}
                                              >
                                                  <IconFullscreen />
                                              </Button>
                                              <Button shape='circle'  size='mini' onClick={() => deleteActiveOntology(index)} type='text'><IconCross/></Button>
                                          </Space>}

                                    </div>
                                </div>
                                <div className={`graph-body ${cardExpandStates[item.id] ? '' : 'hide'}`}>
                                    <div className="graph-search">
                                        <Input
                                          placeholder={`图谱初始默认展示${nodeLimit}个对象节点，请输入需要查询节点的关键字，可输入多个关键字,以英文逗号“,”相隔`}
                                          allowClear
                                          suffix={<IconSearchColor/>}
                                          value={searchKeywords[item.id]}
                                          onChange={(value) => handleSearchChange(item.id, value)}
                                        />
                                        <Button shape='circle'  size='mini'  type='text' className="star-icon" onClick={() => toggleOntologyStar(item, index)}>
                                            {item.isFavorite ? <IconStarFill style={{color: 'var(--color-warning-6)'}}/> :
                                              <IconStarOn style={{color: 'var(--color-text-2)'}}/>}

                                        </Button>
                                        <Button shape='circle'  size='mini'  type='text'><IconDownload/></Button>
                                    </div>
                                    <div className="graph-content">
                                      {/*  // G6 容器*/}
                                        <div
                                          id={`graph-${item.id}`}
                                          className="graph-left"
                                          style={{width: 'calc(100% - 200px)', height: '100%'}}
                                        />

                                        {cardDetailStates[item.id]
                                          ? <div className="graph-right">
                                              <div className="ontology-info">
                                                  <Collapse
                                                    accordion
                                                    lazyload
                                                    activeKey={cardDetailStates[item.id]}
                                                    onChange={async (key,keys)=>{
                                                        //收起
                                                        if(keys.length==0){
                                                            await setCardDetailStates(prev => ({
                                                                ...prev,
                                                                [item.id]: false
                                                            }));
                                                            const containerId = `graph-${item.id}`;
                                                            const graph = graphRefs.current[containerId];
                                                            if (graph && !graph.destroyed) {
                                                                const container = document.getElementById(containerId);
                                                                if (container) {
                                                                    graph.resize(container.clientWidth, container.clientHeight);
                                                                   // graph.fitView();
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    expandIconPosition='right'
                                                    expandIcon={<IconArrowDown/>}
                                                  >
                                                      {cardDetailStates[item.id] == 1 ? <CollapseItem
                                                        header={<div className='info-title'><div className="dot"></div>概览</div>}
                                                        name='1'
                                                        extra={
                                                            <div className='info-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>描述:</Typography.Text>
                                                                  {cardOntologyInfo[item.id]?.ontologyDesc||''}
                                                              </span>
                                                                <span>
                                                                  <Typography.Text
                                                                    type='secondary'>拥有者:</Typography.Text>
                                                                    {cardOntologyInfo[item.id]?.ownerId}
                                                              </span>
                                                                <span>
                                                                  <Typography.Text
                                                                    type='secondary'>更新时间:</Typography.Text>
                                                                    {cardOntologyInfo[item.id]?.lastUpdate}
                                                              </span>
                                                                <span>
                                                                  <Typography.Text
                                                                    type='secondary'>版本:</Typography.Text>
                                                                    {cardOntologyInfo[item.id]?.version}
                                                              </span>
                                                            </div>}
                                                      >
                                                          <div className="info-container object-info-container">
                                                              <div className="info-content">
                                                                  <div className='info-title'><div className="dot"></div>节点</div>
                                                                  <div className="tag-container">
                                                                      <Tag
                                                                        color='#517ED8' icon={<img src={circleIcon}/>}>对象（{cardOntologyInfo[item.id]?.objectTypes}）</Tag>
                                                                      <Tag
                                                                        color='#64BE4B' icon={<img src={rectIcon}/>}>逻辑（{cardOntologyInfo[item.id]?.logicTypes}）</Tag>
                                                                      <Tag
                                                                        color='#F5A623' icon={<img src={hexagonIcon}/>}>动作（{cardOntologyInfo[item.id]?.objectActions}）</Tag>
                                                                  </div>

                                                              </div>
                                                              <div className="info-content attr-info-content">
                                                                  <div className='info-title'><div className="dot"></div>关系类型</div>
                                                                  <div className="tag-container">
                                                                      {cardOntologyInfo[item.id]?.linkTypes?.length > 0 ?
                                                                        <List
                                                                          onReachBottom={
                                                                              () => setCurrent((prev) => ({
                                                                                    ...prev,
                                                                                    [item.id]: prev[item.id] || 1 + 1
                                                                                })
                                                                              )}
                                                                          dataSource={cardOntologyInfo[item.id]?.linkTypes?.slice(0, 20 * (current[item.id] || 1))}
                                                                          render={(link, index) => {

                                                                              return link.column ? <Tag
                                                                                key={index}>{link.column}（{link.columnCount}）</Tag> : ''
                                                                          }}
                                                                        /> : <Empty
                                                                          key={item.id}
                                                                          icon={<img style={{height: '50px'}}
                                                                                     src={emptyIcon}/>}
                                                                          description='暂无数据'
                                                                        />}

                                                                      {/*{cardOntologyInfo[item.id]?.linkTypes.map((link,idx)=>{
                                                                          return link.column?<Tag key={idx}>{link.column}（{link.columnCount}）</Tag>:''
                                                                      })}*/}
                                                                  </div>

                                                              </div>
                                                          </div>

                                                      </CollapseItem> : ''}
                                                      {cardDetailStates[item.id] == 2 ? <CollapseItem
                                                        header={<div className='info-title'>
                                                            <IconDataResDirColor/>{cardObjectInfo[item.id]?.objectTypeLabel}
                                                        </div>}
                                                        name='2'
                                                        extra={
                                                            <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>{cardObjectInfo[item.id]?.objectTypeName}</Typography.Text>
                                                              </span>

                                                            </div>}
                                                      >
                                                          <div className="info-container">

                                                              <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>描述:</Typography.Text>
                                                                  {cardObjectInfo[item.id]?.objectTypeDesc||''}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>数据源:</Typography.Text>
                                                                      {cardObjectInfo[item.id]?.dsSchema}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>主键属性:</Typography.Text>
                                                                      {cardObjectInfo[item.id]?.typeAttributes?.find(i => i.isPrimaryKey == 1)?.attributeName}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>标题属性:</Typography.Text>
                                                                      {cardObjectInfo[item.id]?.typeAttributes?.find(i => i.isTitle == 1)?.attributeName}
                                                              </span>
                                                              </div>
                                                              <div className="info-content info-attr-content">
                                                                  <div className='info-title'><div className="dot"></div>对象类型属性</div>
                                                                  {cardObjectInfo[item.id]?.typeAttributes?.map((attr, idx) => {
                                                                      return (
                                                                        <div className="attr-list" key={idx}>
                                                                            <Space size='mini'>
                                                                                {renderIcon(attr.fieldType)}
                                                                                <Tooltip content={attr.attributeName}>
                                                                                    <span>{attr.attributeName}</span>
                                                                                </Tooltip>
                                                                            </Space>
                                                                        </div>
                                                                      )
                                                                  })}
                                                                  {cardObjectInfo[item.id]?.typeAttributes?.length==0 && <Empty
                                                                      key={item.id}
                                                                      icon={<img style={{height:'50px'}} src={emptyIcon}/>}
                                                                      description='暂无数据'
                                                                      />}

                                                              </div>
                                                          </div>


                                                      </CollapseItem> : ''}

                                                      {cardDetailStates[item.id] == 3 ? <CollapseItem
                                                        header={<div className='info-title'>
                                                            <IconDataResDirColor/>{cardObjectInfo[item.id]?.actionName}
                                                        </div>}
                                                        name='3'
                                                        extra={
                                                            <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>{cardObjectInfo[item.id]?.actionLabel||cardObjectInfo[item.id]?.actionName}</Typography.Text>
                                                              </span>

                                                            </div>}
                                                      >
                                                          <div className="info-container">

                                                              <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>描述:</Typography.Text>
                                                                  {cardObjectInfo[item.id]?.actionDesc||''}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>执行对象:</Typography.Text>
                                                                      {cardObjectInfo[item.id]?.objectType?.objectTypeLabel}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>构建方式:</Typography.Text>
                                                                      {cardObjectInfo[item.id]?.buildType=='function'?
                                                                        '函数':cardObjectInfo[item.id]?.buildType=='object'?'对象':''}
                                                              </span>
                                                              </div>
                                                              <div className="info-content info-attr-content">
                                                                  <div className='info-title'><div className="dot"></div>入参</div>
                                                                  {cardObjectInfo[item.id]?.buildType=='object' && cardObjectInfo[item.id]?.params?.map((attr, idx) => {
                                                                  return (
                                                                    <div className="attr-list" key={idx}>
                                                                        <Space size='mini'>
                                                                            <Tooltip content={attr.attributeName}>
                                                                                <span>{attr.attributeName}</span>
                                                                            </Tooltip>
                                                                        </Space>
                                                                    </div>
                                                                  )
                                                              })}
                                                              {cardObjectInfo[item.id]?.buildType=='object' && !cardObjectInfo[item.id]?.params?<Empty
                                                                key={item.id}
                                                                icon={<img style={{height:'50px'}} src={emptyIcon}/>}
                                                                description='此对象没有入参信息'
                                                              />:''}
                                                                  {cardObjectInfo[item.id]?.buildType=='function' && cardObjectInfo[item.id]?.inputKeys?.length>0 && cardObjectInfo[item.id]?.inputKeys?.map((attr, idx) => {
                                                                      return (
                                                                        <div className="attr-list" key={idx}>
                                                                            <Space size='mini'>
                                                                                <Tooltip content={attr}>
                                                                                    <span>{attr}</span>
                                                                                </Tooltip>
                                                                            </Space>
                                                                        </div>
                                                                      )
                                                                  })}
                                                                  {(cardObjectInfo[item.id]?.buildType=='function' && cardObjectInfo[item.id]?.inputKeys?.length == 0) ? <Empty
                                                                    key={item.id}
                                                                    icon={<img style={{height:'50px'}} src={emptyIcon}/>}
                                                                    description='此函数没有入参信息'
                                                                  />:''}
                                                              </div>
                                                          </div>


                                                      </CollapseItem> : ''}

                                                      {cardDetailStates[item.id] == 4 ? <CollapseItem
                                                        header={<div className='info-title'>
                                                            <IconDataResDirColor/>{cardObjectInfo[item.id]?.logicTypeLabel}
                                                        </div>}
                                                        name='4'
                                                        extra={
                                                            <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>{cardObjectInfo[item.id]?.logicTypeName}</Typography.Text>
                                                              </span>

                                                            </div>}
                                                      >
                                                          <div className="info-container">

                                                              <div className='info-detail info-attr-detail'>
                                                              <span>
                                                                  <Typography.Text
                                                                    type='secondary'>描述:</Typography.Text>
                                                                  {cardObjectInfo[item.id]?.logicTypeDesc||''}
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>存储路径:</Typography.Text>
                                                                      <Paragraph>{cardObjectInfo[item.id]?.storagePath}</Paragraph>
                                                              </span>
                                                                  <span>
                                                                  <Typography.Text
                                                                    type='secondary'>构建方式:</Typography.Text>{cardObjectInfo[item.id]?.buildType=='function'?'函数':cardObjectInfo[item.id]?.buildType=='api'?'API':cardObjectInfo[item.id]?.buildType=='link'?'Link':''}
                                                              </span>
                                                              </div>
                                                              <div className="info-content info-attr-content">
                                                                  <div className='info-title'><div className="dot"></div>入参</div>
                                                                  {cardObjectInfo[item.id]?.buildType=='function' && cardObjectInfo[item.id]?.inputKeys?.length>0 && cardObjectInfo[item.id]?.inputKeys?.map((attr, idx) => {
                                                                      return (
                                                                        <div className="attr-list" key={idx}>
                                                                            <Space size='mini'>
                                                                                <Tooltip content={attr}>
                                                                                    <span>{attr}</span>
                                                                                </Tooltip>
                                                                            </Space>
                                                                        </div>
                                                                      )
                                                                  })}
                                                                  {(cardObjectInfo[item.id]?.buildType=='function' && cardObjectInfo[item.id]?.inputKeys?.length == 0) ? <Empty
                                                                    key={item.id}
                                                                    icon={<img style={{height:'50px'}} src={emptyIcon}/>}
                                                                    description='此函数没有入参信息'
                                                                  />:''}
                                                              </div>
                                                          </div>


                                                      </CollapseItem> : ''}


                                                  </Collapse>

                                              </div>
                                          </div>
                                          : <Button type='outline'   className='open-detail-icon'
                                                    onClick={() => {
                                                        let tab = '1';
                                                        if (cardObjectInfo[item.id]) {
                                                            const data = cardObjectInfo[item.id];
                                                            tab = data.nodeType == 'object' ? '2' : data.nodeType == 'action' ? '3' : data.nodeType == 'logic' ? '4' : '1'
                                                        }
                                                        setCardDetailStates(prev => ({
                                                            ...prev,
                                                            [item.id]: tab
                                                        }))
                                                    }}>
                                              <IconArrowLeft/>
                                          </Button>
                                        }
                                    </div>

                                </div>
                            </div>
                          ))}
                      </div>
                  </div>
              </Spin>
          </Tabs>
      </div>
    )
};
export default OntologyList

import React, { useState, useEffect, useMemo } from 'react';
import useClassLocale from 'modo-plugin-common/src/utils/useClassLocale';
import { GlobalContext } from 'modo-plugin-common/src/utils/context';
import { connect } from "react-redux";
import locale from './locale';
import { Typography, Spin, Alert, Form, Button, Popconfirm, Message, Trigger, Checkbox, Input, Select, Steps, Radio, Switch, Modal } from '@arco-design/web-react';
import { IconRight, IconEdit, IconRefresh, IconBack } from 'modo-design/icon';
import Graph from './pages/Graph'
import mockData from './pages/Graph/mock/graph';
import {
    getData,
    updateData,
    checkSceneLabel,
    getOntologyGraph,
    getCanvas,
    createCanvas,
    updateCanvas,
    sceneIsLabelExists,
    sceneIsNameExists,
    ontologyFindAll
} from './api';
import axios from 'modo-plugin-common/src/core/src/http';
import './style/index.less';
import OntologySimulationResult from '../ontology-simulation/result';
import OntologySimulationResultDemo from './pages/Result';

const CancelToken = axios.CancelToken;

const _ = require("lodash");

const Step = Steps.Step;
const FormItem = Form.Item;

class SimulationFlow extends React.Component {
    constructor(props: any) {
        super(props);
        console.log(this);
        this.state = {
            isDemo: window.location.pathname.indexOf('ontology_simulation_demo') > -1,
            sceneLabel: '',
            loading: true,
            sceneData: {},
            graphInit: false,
            ontologyGraph: [],
            ontologyGraphData: null,
            ontologyGraphEdgeMap: null,
            originCanvasLayout: `{"nodes": [], "edges": []}`,
            deletePopupVisible: false,
            fullScreen: false,
            titleEditing: false,
            sceneEditModalVisible: false,
            sceneEditFormInitialValues: {},
            ontologyOptions: [],
            SIMULATION_GRAPH_TIP_HIDDEN: localStorage.getItem('SIMULATION_GRAPH_TIP_HIDDEN'),
            logData: {}
        };
        this.graphRef = React.createRef();
        this.checkLabelTokens = React.createRef();
        this.checkLabelTokens.current = [];
        this.sceneEditFormRef = React.createRef();
        this.simulationFlowRef = React.createRef();
        this.cancelTokensRef = React.createRef();
        this.cancelTokensRef.current = [];
    }
    handleSearch = (val) => {
        if (!val) {
            this.graphRef.current.unHighlighted();
            return;
        }   
        const nodes = (this.graphRef.current.getInst().getNodes() || []).filter(n => n.data.label.indexOf(val) > -1 || n.data.name.indexOf(val) > -1);
        const ids = nodes.map(n => n.id);
        this.graphRef.current.highlightNodes(ids)
        /*this.graphRef.current.selectNodes({
            nodes: [nodes[0]]
        })*/
        if (nodes.filter(n => {
            return this.graphRef.current.isNodeInViewport(n)
        }).length === 0 && ids.length > 0) {
            this.graphRef.current.setCenter(ids[0])
        }
    }
    handleRefresh = () => {
        this.graphRef.current.unfocus();
    }
    importGraph = () => {
        this.setState({
            loading: true
        })
        this.getOntologyGraph((success, data) => {
            if (success) {
                this.graphRef.current.importDataAndLayout(data);
            }
            this.setState({
                loading: false
            });
        })
    }
    importRelRes = (ids) => {
        if (ids.length === 0) {
            return;
        }
        this.setState({
            loading: true
        });
        const data = this.graphRef.current.getData();
        let existEdgeMap = {};
        let existNodeIds = [];
        data.nodes.forEach(n => {
            existNodeIds.push(n.id);
            existEdgeMap[n.id] = []
        })
        data.edges.forEach(e => {
            existEdgeMap[e.source].push(e.target)
            existEdgeMap[e.target].push(e.source)
        })

        this.getOntologyGraph((success, ontologyGraphData, ontologyGraphEdgeMap) => {
            if (success) {
                let relIds = [];

                const graphIds = ontologyGraphData.nodes.map(o => {
                    if (!existEdgeMap[o.id]) {
                        existEdgeMap[o.id] = [];
                    }
                    return o.id;
                })

                const getRel = (id) => {
                    ontologyGraphEdgeMap[id].filter(relId => {
                        if (existNodeIds.indexOf(relId) < 0 && relIds.indexOf(relId) < 0 && graphIds.indexOf(relId) > -1) {
                            relIds.push(relId);
                            getRel(relId);
                        }
                    })
                }
                ids.forEach(id => {
                    getRel(id);
                })

                const allNodesIds = [...existNodeIds, ...relIds]

                const relNodes = ontologyGraphData.nodes.filter(n => relIds.indexOf(n.id) > -1)

                const relEdges = ontologyGraphData.edges.filter(e => {
                    if (allNodesIds.indexOf(e.source) > -1 && allNodesIds.indexOf(e.target) > -1 && existEdgeMap[e.source].indexOf(e.target) < 0) {
                        return true
                    }
                    return false
                })

                this.graphRef.current.importDataAndLayout({
                    nodes: [
                        ...data.nodes,
                        ...relNodes
                    ],
                    edges: [
                        ...data.edges,
                        ...relEdges
                    ]
                }, existNodeIds)
            }

            this.setState({
                loading: false
            });
        })
    }
    partialImport = (nodeIds) => {
        if (nodeIds.length === 0) {
            return;
        }
        this.setState({
            loading: true
        });
        const data = this.graphRef.current.getData();
        let existEdgeMap = {};
        let existNodeIds = [];
        data.nodes.forEach(n => {
            existNodeIds.push(n.id);
            existEdgeMap[n.id] = []
        })
        data.edges.forEach(e => {
            existEdgeMap[e.source].push(e.target)
            existEdgeMap[e.target].push(e.source)
        })
        const relIds = nodeIds.filter(id => existNodeIds.indexOf(id) < 0);
        this.getOntologyGraph((success, ontologyGraphData, ontologyGraphEdgeMap) => {
            if (success) {

                const graphIds = ontologyGraphData.nodes.map(o => {
                    if (!existEdgeMap[o.id]) {
                        existEdgeMap[o.id] = [];
                    }
                    return o.id;
                })
                
                const allNodesIds = [...existNodeIds, ...relIds]

                const relNodes = ontologyGraphData.nodes.filter(n => relIds.indexOf(n.id) > -1)

                const relEdges = ontologyGraphData.edges.filter(e => {
                    if (allNodesIds.indexOf(e.source) > -1 && allNodesIds.indexOf(e.target) > -1 && existEdgeMap[e.source].indexOf(e.target) < 0) {
                        return true
                    }
                    return false
                })
                this.graphRef.current.importDataAndLayout({
                    nodes: [
                        ...data.nodes,
                        ...relNodes
                    ],
                    edges: [
                        ...data.edges,
                        ...relEdges
                    ]
                }, existNodeIds)
            }
            this.setState({
                loading: false
            });
        })
    }
    importMockGraph = () => {
        this.graphRef.current.importData(mockData)
    }
    getData = async () => {
        this.setState({
            loading: true
        })
        const source = CancelToken.source();
        this.cancelTokensRef.current.push(source);
        const res = await getData(this.props.sceneId, source.token);
        // const res = await getData('3c7a7088730441dd98ae117c59af4420', source.token);
        this.cancelTokensRef.current.splice(this.cancelTokensRef.current.indexOf(source), 1)
        // const res = await getData('b41f53dc8ca44220b4bb2f903c4aa1db');
        // const res = await getData('71ef85395a5646a59d18659727e95db4');
        if (res.data?.success) {
            const data = res.data.data
            this.setState(() => {
                return {
                    sceneData: data,
                    sceneLabel: data.sceneLabel
                }
            }, () => {
                this.getOntologyGraph(async(success, ontologyGraph) => {
                    if (success) {
                        data.canvasId && await this.getCanvas(data.canvasId, ontologyGraph)
                        this.setState({
                            loading: false
                        })
                    } else {
                        this.setState({
                            loading: false
                        })
                    }
                });
            })
        } else {
            this.setState({
                loading: false
            })
        } 
    }
    getCanvas = (canvasId, ontologyGraph) => {
        let nodeMap = {};
        ontologyGraph.nodes.forEach(n => {
            nodeMap[n.id] = n;
        })
        const source = CancelToken.source();
        this.cancelTokensRef.current.push(source);
        return getCanvas(canvasId, source.token).then(res => {
            if (res.data?.success) {
                const canvasLayout = {
                    nodes: res.data.data.canvasLayout?.nodes.map(n => {
                        return {
                            ...n,
                            data: {
                                ...(n.data || {}),
                                name: nodeMap[n.id]?.data?.name || n?.data?.name,
                                label: nodeMap[n.id]?.data?.label || n?.data?.label,
                            }
                        }
                    }) || [],
                    edges: res.data.data.canvasLayout?.edges || []
                }
                this.setState({
                    originCanvasLayout: JSON.stringify(canvasLayout)
                })
                const nodes = canvasLayout.nodes || [];
                const ids = nodes.map(n => n.id);
                const edges = (canvasLayout?.edges || []).filter(e => ids.indexOf(e.source) > -1 && ids.indexOf(e.target) > -1);

                this.graphRef.current.importData({
                    nodes,
                    edges
                }, () => {
                    this.setState({
                        graphInit: true
                    })
                })
            }
        }).catch(err => {
            console.log(err);
        }).finally(() => {
            this.cancelTokensRef.current.splice(this.cancelTokensRef.current.indexOf(source), 1)
        })
    }
    getOntologyGraph = (callback, required) => {
        const {
            ontologyGraphData,
            ontologyGraphEdgeMap
        } = this.state;
        if (ontologyGraphData && !required) {
            typeof callback === 'function' && callback(true, ontologyGraphData, ontologyGraphEdgeMap)
            return;
        }

        const source = CancelToken.source();
        this.cancelTokensRef.current.push(source);

        return getOntologyGraph(this.state.sceneData.ontologyId, source.token).then(res => {
            if (res.data?.success && Array.isArray(res.data.data)) {
                this.setState({

                    ontologyGraph: res.data.data
                })
                const { data } = res.data;
                let edges = [];
                let edgeMap = {}

                const parseRef = (n, relations) => {
                    relations.forEach(e => {
                        edgeMap[n.elementId] =  edgeMap[n.elementId] || [];
                        edgeMap[e.id] = edgeMap[e.id] || []
                        if (edgeMap[n.elementId].indexOf(e.id) < 0 && edgeMap[e.id].indexOf(n.elementId) < 0) {
                            edges.push({
                                id: n.elementId + '_' + e.id,
                                source: n.elementId,
                                target: e.id,
                                sourceHandle: 'port-3',
                                targetHandle: 'port-1',
                                style: {
                                    stroke: 'var(--color-text-4)'
                                }
                            })
                            edgeMap[n.elementId].push(e.id)
                            edgeMap[e.id].push(n.elementId)
                        }
                       
                    })
                }
                
                const nodes = data.map(n => {
                    const {
                        objectRelations,
                        actionRelations,
                        logicRelations
                    } = n;
                    if (Array.isArray(objectRelations) && objectRelations.length > 0) {
                        parseRef(n, objectRelations.map(rel => {
                            return {
                                id: n.elementId === rel.sourceObjectTypeId ? rel.targetObjectTypeId : rel.sourceObjectTypeId
                            }
                        }))
                    }
                    if (Array.isArray(actionRelations) && actionRelations.length > 0) {
                        parseRef(n, actionRelations)
                    }
                    if (Array.isArray(logicRelations) && logicRelations.length > 0) {
                        parseRef(n, logicRelations.map(rel => { 
                            return {
                                id: rel.logicTypeId
                            }
                        }))
                    }

                    return {
                        id: n.elementId,
                        type: 'node',
                        data: {
                            type: n.nodeType,
                            name: n.name,
                            label: n.label,
                            dataStatus: 0
                        }
                    }
                })

                nodes.forEach(n => {
                    if (!edgeMap[n.id]) {
                        edgeMap[n.id] = [];
                    }
                })

                this.setState({
                    ontologyGraphData: {
                        nodes,
                        edges
                    },
                    ontologyGraphEdgeMap: edgeMap
                })
                typeof callback === 'function' && callback(true, {
                    nodes,
                    edges
                }, edgeMap)
                return;
            }
            throw 'err';
        }).catch(err => {
            console.log(err)
            typeof callback === 'function' && callback(false);
        }).finally(() => {
            this.cancelTokensRef.current.splice(this.cancelTokensRef.current.indexOf(source), 1)
        })
    }
    updateData = (data) => {
        const {
            sceneData
        } = this.state;
        this.setState({
            loading: true
        })
        updateData(
            sceneData.id,
            data
        ).then(res => {
            if (res.data?.success) {
                this.setState({
                    sceneData: res.data.data,
                    sceneLabel: res.data.data?.sceneLabel,
                    titleEditing: false
                })
                this.props.updateTabLabel(res.data.data?.sceneLabel)
                Message.success('修改成功！')
                return;
            }
            throw 'err'
        }).catch(err => {
            this.resetSceneLabel()
            Message.error('修改失败！')
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    }
    resetSceneLabel = () => {
        const {
            sceneData
        } = this.state;
        this.setState({
            sceneLabel: sceneData.sceneLabel
        })
    }
    checkSceneLabel = (val, callback) => {
        this.checkLabelTokens.current.forEach(cancelToken => {
            cancelToken('取消请求')
        })
        this.checkLabelTokens.current = [];
        checkSceneLabel({
            sceneLabel: val
        }, {
            cancelToken: new axios.CancelToken((cancel) => {
                this.checkLabelTokens.current.push(cancel)
            })
        }).then(res => {
            if (res.data?.success) {
                if (res.data.data) {
                    this.resetSceneLabel()
                    Message.error('场景中文名不能重复！')
                }  else {
                    callback()
                }
                return;
            }
            throw 'err';
        }).catch(err => {
            console.log(err);
            this.resetSceneLabel()
            Message.error('场景中文名验证失败！')
        })
    }
    
    handleSave = (callback) => {
        const graphData = this.graphRef.current.getData();
        const {
            sceneData
        } = this.state;
        const data = {
            "sceneId": sceneData.id,
            "canvasName": sceneData.canvasName,
            "canvasLayout": graphData,
            // "canvasLayout": JSON.stringify(graphData),
            "description": "",
            "nodes": graphData.nodes.map(n => {
                return {
                    elementId: n.id,
                    nodeType: n.data.type,
                    dataStatus: n.data.dataStatus
                }
            })
        }
        this.setState({
            loading: true
        })
        if (!sceneData.canvasId) {
            createCanvas(data).then(res => {
                if (res.data.success) {
                    Message.success('保存成功！')
                    typeof callback === 'function' && callback()
                    return;
                }
                throw 'err'
            }).catch(err => {
                Message.success('保存失败！')
            }).finally(() => {
                typeof callback !== 'function' && this.setState({
                    loading: false
                })
            })
        } else {
            updateCanvas(sceneData.canvasId, data).then(res => {
                if (res.data.success) {
                    Message.success('保存成功！')
                    typeof callback === 'function' && callback()
                    return;
                }
                throw 'err'
            }).catch(err => {
                Message.success('保存失败！')
            }).finally(() => {
                typeof callback !== 'function' && this.setState({
                    loading: false
                })
            })
        }
    }
    layoutGraph = () => {
        const data = this.graphRef.current.getData();
        this.graphRef.current.importDataAndLayout({
            nodes: [
                ...data.nodes
            ],
            edges: [
                ...data.edges
            ]
        }, [])
    }
    ontologyFindAll = () => {
        ontologyFindAll().then(res => {
            if (res.data?.success && Array.isArray(res.data.data)) {
                const ontologyOptions = res.data.data.map(o => {
                    return {
                        value: o.id,
                        label: o.ontologyLabel
                    }
                })
                this.setState({
                    ontologyOptions
                })
            }
        })
    }
    isObjectEqual = (obj1, obj2) => {
        if (obj1 === obj2) return true;

        if (obj1 === null || typeof obj1 !== 'object' || 
            obj2 === null || typeof obj2 !== 'object') {
            return false;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        for (let key of keys1) {
            if (!keys2.includes(key) || !this.isObjectEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true;
    }
    getCanvasStatus = () => {
        const canvasLayout = this.graphRef.current.getData();
        const originCanvasLayout = JSON.parse(this.state.originCanvasLayout);
        return this.isObjectEqual(canvasLayout, originCanvasLayout);
    }
    componentDidMount() {
        window.flow = this;
        this.getData();
        this.ontologyFindAll();
        typeof this.props.setRef === 'function' && this.props.setRef(this);
    }
    componentWillUnmount() {
        this.cancelTokensRef.current.forEach(source => {
            source.cancel('页面卸载，取消之前的未完成请求!')
        })
    }
    render() {
        const {
        } = this.props;
        const {
            isDemo,
            sceneData,
            sceneLabel,
            loading,
            deletePopupVisible,
            ontologyGraph,
            fullScreen,
            titleEditing,
            sceneEditModalVisible,
            sceneEditFormInitialValues,
            ontologyOptions,
            SIMULATION_GRAPH_TIP_HIDDEN,
            graphInit,
            logData
        } = this.state;
        return (
            <Spin
                className="simulation-flow-spin"
                loading={loading}>
            <div
                ref={this.simulationFlowRef}
                className="simulation-flow">
                {/*!SIMULATION_GRAPH_TIP_HIDDEN && <Alert
                    className="simulation-flow-alert"
                    type='warning'
                    content={(
                        <>
                            您在画布上的操作【保存】后使其生效，否则退出画布时编辑内容不作保留。
                            <Switch
                                uncheckedText="不再提醒"
                                onChange={val => {
                                    if (val) {
                                        localStorage.setItem('SIMULATION_GRAPH_TIP_HIDDEN', true)
                                        this.setState({
                                            SIMULATION_GRAPH_TIP_HIDDEN: true
                                        })
                                    }
                                }}/> 
                            </>
                    )}
                    closable
                  />*/}
                <div
                    className="simulation-flow-header">
                    <div
                        className="title">
                        <Typography.Paragraph
                            editable={{
                                editing: titleEditing,
                                onStart: () => {
                                    this.setState(() => {
                                        return {
                                            sceneEditModalVisible: true,
                                            sceneEditFormInitialValues: sceneData
                                        }
                                    }, () => {
                                        this.sceneEditFormRef.current?.setFieldsValue(sceneData)
                                    })
                                }
                            }}>
                            <div className='title-text' title={sceneLabel}>{sceneLabel}</div>
                        </Typography.Paragraph>
                    </div>
                    <div>
                        <Radio.Group
                            defaultValue={'object'}
                            disabled={true}>
                            <Radio
                                key={'object'}
                                value={'object'}>
                                {({ checked }) => {
                                  return (
                                    <Button
                                        tabIndex={-1}
                                        key={'object'}
                                        type={'outline'}
                                        className={`${checked ? 'checked' : ''}`}
                                        icon={(
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.10147 1.1696C9.39555 1.19954 9.62499 1.4481 9.62499 1.75008V4.37508C9.62499 4.69725 9.36382 4.95841 9.04166 4.95841H7.58332V6.41675H10.2083L10.2681 6.4196C10.5622 6.44954 10.7917 6.6981 10.7917 7.00008V9.04175H12.25L12.3098 9.0446C12.6039 9.07454 12.8333 9.3231 12.8333 9.62508V12.2501C12.8333 12.5722 12.5722 12.8334 12.25 12.8334H8.16666C7.84449 12.8334 7.58332 12.5722 7.58332 12.2501V9.62508L7.58617 9.56527C7.61612 9.27119 7.86468 9.04175 8.16666 9.04175H9.62499V7.58342H4.37499V9.04175H5.83332L5.89314 9.0446C6.18721 9.07454 6.41666 9.3231 6.41666 9.62508V12.2501C6.41666 12.5722 6.15549 12.8334 5.83332 12.8334H1.74999C1.42782 12.8334 1.16666 12.5722 1.16666 12.2501V9.62508L1.1695 9.56527C1.19945 9.27119 1.44801 9.04175 1.74999 9.04175H3.20832V7.00008L3.21117 6.94027C3.24112 6.64619 3.48968 6.41675 3.79166 6.41675H6.41666V4.95841H4.95832C4.63616 4.95841 4.37499 4.69725 4.37499 4.37508V1.75008L4.37784 1.69027C4.40778 1.39619 4.65635 1.16675 4.95832 1.16675H9.04166L9.10147 1.1696ZM2.33332 11.6667H5.24999V10.2084H2.33332V11.6667ZM8.74999 11.6667H11.6667V10.2084H8.74999V11.6667ZM5.54166 3.79175H8.45832V2.33341H5.54166V3.79175Z" fill="currentColor"/>
                                            </svg>
                                        )}/>
                                  );
                                }}
                            </Radio>
                            <Radio
                                key={'inst'}
                                value={'inst'}>
                                {({ checked }) => {
                                  return (
                                    <Button
                                        tabIndex={-1}
                                        key={'inst'}
                                        type={'outline'}
                                        className={`${checked ? 'checked' : ''}`}
                                        icon={(
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8.87304 11.8603C9.15546 11.7723 9.46391 11.911 9.58227 12.189C9.70053 12.4668 9.58695 12.785 9.3282 12.9278L9.27408 12.954C8.57454 13.2518 7.80568 13.4166 6.99999 13.4166C6.295 13.4166 5.6182 13.2904 4.99136 13.0594L4.7259 12.954L4.67235 12.9278C4.41335 12.7851 4.2994 12.4669 4.41771 12.189C4.53605 11.911 4.84454 11.7724 5.12694 11.8603L5.18277 11.8808L5.39468 11.9645C5.89465 12.1488 6.43504 12.2499 6.99999 12.2499C7.64568 12.2499 8.25942 12.1182 8.81721 11.8808L8.87304 11.8603Z" fill="currentColor"/>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.85513 8.91626C3.79062 8.91626 4.54361 9.67809 4.54361 10.611C4.54346 11.5438 3.79052 12.3052 2.85513 12.3052C1.9198 12.3051 1.1668 11.5437 1.16666 10.611C1.16666 9.67812 1.9197 8.91632 2.85513 8.91626ZM2.85513 10.0829C2.56984 10.083 2.33332 10.3166 2.33332 10.611C2.33347 10.9052 2.56992 11.1384 2.85513 11.1385C3.14038 11.1385 3.3768 10.9053 3.37694 10.611C3.37694 10.3166 3.14046 10.0829 2.85513 10.0829Z" fill="currentColor"/>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.1448 8.91626C12.0802 8.91641 12.8333 9.67819 12.8333 10.611C12.8332 11.5437 12.0801 12.305 11.1448 12.3052C10.2095 12.3051 9.45652 11.5437 9.45637 10.611C9.45637 9.67813 10.2094 8.91633 11.1448 8.91626ZM11.1448 10.0829C10.8595 10.083 10.623 10.3166 10.623 10.611C10.6232 10.9052 10.8596 11.1384 11.1448 11.1385C11.43 11.1384 11.6665 10.9052 11.6667 10.611C11.6667 10.3167 11.43 10.0831 11.1448 10.0829Z" fill="currentColor"/>
                                                <path d="M4.08845 2.47852C4.35656 2.35404 4.68045 2.45023 4.83471 2.7098C4.98893 2.96946 4.91851 3.30009 4.6809 3.47599L4.63134 3.50903C3.25568 4.32609 2.3334 5.83189 2.33332 7.55477C2.33332 7.62978 2.335 7.70457 2.33845 7.77865L2.35383 7.99967L2.35668 8.05949C2.35418 8.35504 2.12807 8.60674 1.82746 8.63485C1.52674 8.66289 1.2579 8.45725 1.20084 8.16715L1.19229 8.10791L1.17292 7.83333C1.16862 7.74106 1.16666 7.64803 1.16666 7.55477C1.16674 5.40548 2.31883 3.52606 4.03547 2.50643L4.08845 2.47852Z" fill="currentColor"/>
                                                <path d="M9.16527 2.7098C9.31954 2.45023 9.64342 2.35403 9.91153 2.47852L9.96451 2.50643L10.124 2.60441C11.7522 3.6437 12.8332 5.47271 12.8333 7.55477C12.8333 7.74104 12.8247 7.92573 12.8077 8.10791L12.7991 8.16715C12.7421 8.45725 12.4732 8.66289 12.1725 8.63485C11.8518 8.60487 11.6162 8.32041 11.6461 7.99967L11.6615 7.77865C11.665 7.70457 11.6667 7.62978 11.6667 7.55477C11.6666 5.88566 10.8011 4.42039 9.49625 3.58765L9.36864 3.50903L9.31908 3.47599C9.08145 3.30009 9.01104 2.96947 9.16527 2.7098Z" fill="currentColor"/>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.99999 0.583252C7.93539 0.583252 8.68832 1.34464 8.68847 2.27743C8.68847 3.21035 7.93547 3.97217 6.99999 3.97217C6.06457 3.9721 5.31151 3.21031 5.31151 2.27743C5.31166 1.34468 6.06465 0.583321 6.99999 0.583252ZM6.99999 1.74992C6.71477 1.74999 6.47832 1.98321 6.47818 2.27743C6.47818 2.57176 6.71467 2.80543 6.99999 2.8055C7.28537 2.8055 7.5218 2.57181 7.5218 2.27743C7.52166 1.98317 7.28527 1.74992 6.99999 1.74992Z" fill="currentColor"/>
                                            </svg>

                                        )}/>
                                  );
                                }}
                            </Radio>
                        </Radio.Group>
                    </div>
                    <div>
                        <Button
                            disabled
                            type="text"
                            icon={<IconBack />}/>
                        <Button
                            disabled
                            type="text"
                            icon={<IconBack
                                style={{
                                    transform: 'rotateY(180deg)'
                                }}/>}/>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            overflow: 'hidden'
                        }}>
                        <Steps
                            style={{
                                width: '480px',
                                margin: '0px auto'
                            }}
                            current={0}>
                            <Step title='配置画布节点' />
                            <Step title='仿真数据初始化' />
                            <Step title='开始仿真' />
                        </Steps>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            columnGap: '12px'
                        }}>
                        <div>
                            <Input.Search
                                placeholder="请输入"
                                onSearch={this.handleSearch}
                                onPressEnter={e => {
                                    this.handleSearch(e.target.value)
                                }}/>
                        </div>
                        <div>
                            <Button
                                icon={<IconRefresh />}
                                onClick={this.handleRefresh}/>
                        </div>
                        {/*<div>
                            <Button
                                type="primary"
                                onClick={() => {
                                    this.layoutGraph()
                                }}>
                                布局
                            </Button>
                        </div>
                        <div>
                            <Button
                                type="primary"
                                onClick={() => {
                                    this.importGraph()
                                }}>
                                导入样例1
                            </Button>
                        </div>
                        <div>
                            <Button
                                type="primary"
                                onClick={() => {
                                    this.importMockGraph()
                                }}>
                                导入样例2
                            </Button>
                        </div>*/}
                        <div>
                            <Button
                                type="primary"
                                onClick={() => {
                                    this.handleSave()
                                }}>
                                保存
                            </Button>
                        </div>
                    </div>
                </div>
                <div
                    className="simulation-flow-content">
                    <div
                        className={`graph-container${fullScreen ? ' fixed' : ''}`}>
                        <Graph
                            ref={this.graphRef}
                            sceneId={this.state?.sceneData?.id}
                            ontologyId={this.state?.sceneData?.ontologyId}
                            ontologyName={this.state?.sceneData?.ontologyName}
                            ontologyGraph={ontologyGraph}
                            fullImport={this.importGraph}
                            importRelRes={this.importRelRes}
                            partialImport={this.partialImport}
                            graphInit={graphInit}
                            getOntologyGraph={this.getOntologyGraph}
                            consoleLog={data => {
                                this.setState({
                                    logData: {...data, ontologyId: this.state?.sceneData?.ontologyId}
                                })
                            }}
                            fullScreen={() => {
                                this.setState({
                                    fullScreen: !fullScreen
                                })
                            }}/>
                    </div>
                </div>
                {isDemo && this.props.sceneId === '3c7a7088730441dd98ae117c59af4420' ? (
                    <OntologySimulationResultDemo
                        logData={logData}/>
                ) : (
                    <OntologySimulationResult 
                        logData={logData}/>
                )}
                <Modal
                    title={(
                        <div
                            style={{
                                textAlign: 'left',
                                fontSize: '16px',
                                fontWeight: 700
                            }}>
                            编辑场景信息
                        </div>
                    )}
                    wrapStyle={{
                        zIndex: 2000
                    }}
                    visible={sceneEditModalVisible}
                    onOk={async () => {
                        let valid = false;
                        try {
                            await this.sceneEditFormRef.current.validate();
                            valid = true;
                        } catch (e) {
                        }
                        if (valid) {
                            this.updateData(this.sceneEditFormRef.current.getFieldsValue())
                            this.setState({
                                sceneEditModalVisible: false
                            })
                        }
                        
                    }}
                    onCancel={() => {
                        this.setState({
                            sceneEditModalVisible: false
                        })
                    }}>
                    <Form
                        autoComplete='off'
                        layout={'vertical'}
                        initialValues={sceneEditFormInitialValues}
                        ref={this.sceneEditFormRef}>
                        <FormItem
                            label='中文名称'
                            field="sceneLabel"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入中文名称'
                                },
                                {
                                    validator: (value: any, cb: (err?: string) => void) => {
                                        if (!value) {
                                            cb();
                                            return;
                                        }
                                        const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                                        // 必须包含中文或字母的校验
                                        const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                                        if (!formatRegex.test(value)) {
                                            cb('仅支持中文、字母、数字和下划线');
                                            return;
                                        }
                                        if (!chineseOrLetterRegex.test(value)) {
                                            cb('必须包含中文或字母');
                                            return;
                                        }
                                        cb();
                                    },
                                },
                                {
                                    validator: async (value: any, cb: (err?: string) => void) => {
                                        if (!value || sceneData.sceneLabel === value) {
                                            cb();
                                            return;
                                        }
                                        await sceneIsLabelExists({
                                            sceneLabel: value,
                                        })
                                        .then(res => {
                                            if (res.data?.data) {
                                                cb('中文名称已存在');
                                            } else {
                                                cb();
                                            }
                                        })
                                        .catch(err => {
                                            cb(err);
                                        });
                                    },
                                  },
                            ]}>
                            <Input placeholder='请输入中文名称' maxLength={50} showWordLimit />
                        </FormItem>
                        <FormItem
                            label='英文名称'
                            field="sceneName"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入英文名称'
                                },
                                {
                                    validator: (value: any, cb: (err?: string) => void) => {
                                        if (!value) {
                                            cb();
                                            return;
                                        }
                                        if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value)) {
                                            cb('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                                            return;
                                        }
                                        cb();
                                    },
                                },
                                {
                                    validator: async (value: any, cb: (err?: string) => void) => {
                                        if (!value || sceneData.sceneName === value) {
                                            cb();
                                            return;
                                        }
                                        await sceneIsNameExists({
                                            sceneName: value,
                                        })
                                        .then(res => {
                                            if (res.data.data) {
                                                cb('英文名称已存在');
                                            } else {
                                                cb();
                                            }
                                        })
                                        .catch(err => {
                                            cb(err);
                                        });
                                    },
                                },
                            ]}>
                            <Input placeholder='请输入英文名称' />
                        </FormItem>
                        <FormItem label='描述' field="description">
                            <Input.TextArea placeholder='请输入描述' />
                        </FormItem>
                        <FormItem
                            label='来源本体'
                            field="ontologyId"
                            rules={[
                                { required: true, message: '请选择来源本体' }
                            ]}>
                            <Select
                                disabled
                                placeholder='请选择来源本体'
                                options={ontologyOptions}/>
                        </FormItem>
                      </Form>
                </Modal>
            </div>
            </Spin>                      
        )
    }
}

SimulationFlow.contextType = GlobalContext;

export default connect((state)=>({
    identity: state.identity
}))(SimulationFlow);
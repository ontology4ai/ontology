import React, { useState, useEffect, useMemo } from 'react';
import { getData, updateData } from './api';
import {
    Space,
    Spin,
    Switch,
    Button,
    Dropdown,
    Menu,
    Form,
    Grid,
    Input,
    Select,
    InputNumber,
    Alert,
    Message,
    Collapse, List, Tooltip
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import {debounce} from 'lodash';
import Table from '@/components/Table';
import {
    IconDataResDirColor,
    IconLinkColor,
    IconLessen,
    IconTopologyColor,
    IconBackupsShareColor,
    IconResourcesColor,
    IconDataCatalogMgrColor,
    IconEyeColor,
    IconDelete,
    IconAdd,
    IconCounterColor,
    IconDataIntegrationColor,
    IconCalendarColor,
    IconTextareaColor,
    IconUnitMgrColor,
    IconPlateCreatedColor,
    IconEditColor,
    IconDeleteColor,
    IconUserColor,
    IconDataMapColor,
    IconGuide,
    IconCopy,
    IconBubbleChartFill,
    IconFullscreenExit,
    IconArrowUp,
    IconArrowDown,
    IconFullscreen,
    IconCross,
    IconSearchColor,
    IconStarFill,
    IconStarOn,
    IconDownload, IconArrowLeft
} from 'modo-design/icon';
import ObjEmpty from './components/Empty'
import './style/index.less';
import oneToOneIcon from '@/pages/link-manager/images/oToO.svg';
import oneToManyIcon from '@/pages/link-manager/images/oToM.svg';
import manyToManyIcon from '@/pages/link-manager/images/mToM.svg';
import {checkExistOntology} from "@/pages/ontology-manager/api";
import {Typography} from "@arco-design/web-react/es/Typography";
import OntologyGraph from './components/graph-detail';
import GraphDetail from "@/pages/ontology-graph-manager/pages/graph-detail/graph-detail";
import fxIcon from "@/pages/function-manager/images/fx.svg";

const ButtonGroup = Button.Group;
class OntologyDetail extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: false,
            activeType:'form',
            /*data: {
                sharedAttributes: [],
                objectTypes: [],
                linkTypes: [],
                actionTypes: []
            }*/
        };
        this.formRef = React.createRef();
    }
    /* getData = () => {
        this.setState({
            loading: true
        })
        getData(this.props.ontology.id).then(res => {
            if (res.data.data) {
                const {
                    data
                } = res.data;
                this.setState({
                    data: {
                        ...data,
                        sharedAttributes: data.sharedAttributes || [],
                        objectTypes: data.objectTypes || [],
                        linkTypes: data.linkTypes || [],
                        actionTypes: data.actionTypes || [],
                    }
                })
                this.formRef.current.setFieldsValue({
                    ontologyName: data.ontologyName,
                    ontologyLabel: data.ontologyLabel,
                    ontologyDesc: data.ontologyDesc,
                    status: Boolean(data.status),
                    isRecommend: Boolean(data.isRecommend)
                })
            }
        }).catch(err => {

        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    } */
    init = () => {
        const { ontology } = this.props;
        this.formRef.current.setFieldsValue({
            ontologyName: ontology.ontologyName,
            ontologyLabel: ontology.ontologyLabel,
            ontologyDesc: ontology.ontologyDesc,
            status: Boolean(ontology.status),
            isRecommend: Boolean(ontology.isRecommend)
        })
    };
    handleSave = async(callback) => {
        let valid = true;
        try {
            await this.formRef.current.validate()
        } catch (e) {
            valid = false
        }
        if (!valid) {
            return;
        }
        this.setState({
            loading: true
        });
        const data = this.formRef.current.getFieldsValue();
        updateData(this.props.ontology.id, {
            ontologyName: data.ontologyName,
            ontologyLabel: data.ontologyLabel,
            ontologyDesc: data.ontologyDesc,
            status: Number(data.status),
            isRecommend: Number(data.isRecommend)
        }).then(res => {
            if (res.data.success) {
                typeof callback === 'function' && callback(data.ontologyLabel);
                Message.success('保存成功！');
                return;
            }
            throw 'err'
        }).catch(err => {
            Message.error('保存失败！')
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    };
    toggleShowType = (type)=>{
        //const type = this.state.activeType;
        this.setState({activeType:type});
    };
    componentDidUpdate(prevProps) {
        if (prevProps.ontology !== this.props.ontology) {
            this.init();
        }
    }
    componentDidMount() {
        this.init();
        // this.getData()
    }
    render() {
        const {
            loading,
            activeType,
            // data
        } = this.state;
        const {
            ontology: data
        } = this.props;
        return (
            <Spin
                loading={loading}
                className="ontology-detail-spin">
                <ButtonGroup className='form-graph-btn'>
                    <Button type={activeType=='form'?'primary':'outline'} icon={<IconCopy />} onClick={()=>this.toggleShowType('form')} >
                        表单
                    </Button>
                    <Button type={activeType=='graph'?'primary':'outline'}  icon={<IconBubbleChartFill />} onClick={()=>this.toggleShowType('graph')} >
                        图谱
                    </Button>
                </ButtonGroup>
                <div
                    className={`ontology-detail ${activeType == 'form'?'show':'hide'}`}>
                    <div
                        className="base-info card">
                        <div
                            className="card-header">
                            <div
                                className="title">
                                本体基础信息
                            </div>
                            <div
                                className="oper-group">

                            </div>
                        </div>
                        <div
                            className="card-content">
                            <Form
                                ref={this.formRef}
                                layout='vertical'
                                initialValues={{
                                    auth: [
                                        {
                                        }
                                    ]
                                }}>
                                <Grid.Row gutter={36}>
                                    <Grid.Col span={12}>
                                        <Form.Item
                                            label='中文名'
                                            field='ontologyLabel'
                                            rules={[
                                                { required: true, message: '中文名必填' },
                                                {
                                                    validator:
                                                      async (val, callback) => {
                                                          const value = val.trim();
                                                          if(this.props.ontology.ontologyLabel == value){
                                                              callback();
                                                              return;
                                                          }
                                                          const res = await checkExistOntology({
                                                              ontologyLabel:value
                                                          });
                                                          if (res.data && res.data.success) {
                                                              const {data} = res.data;
                                                              if (data && data.exists) {
                                                                  callback(`${value}已存在`);
                                                              }
                                                          }
                                                          callback();
                                                      }
                                                }
                                            ]}>
                                            <Input placeholder='请输入本体中文名称' maxLength={25} showWordLimit/>
                                        </Form.Item>
                                        <Form.Item
                                            label='英文名'
                                            field='ontologyName'
                                            rules={[
                                                { required: true, message: '英文名必填' },
                                                {
                                                    validator:
                                                      async (val, callback) => {
                                                          if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                                                              callback('必须包含英文字母，且只能输入英文字母、数字和下划线');
                                                              return;
                                                          }
                                                          const value = val.trim();
                                                          if(this.props.ontology.ontologyName == value){
                                                              callback();
                                                              return;
                                                          }
                                                          const res = await checkExistOntology({
                                                              ontologyName:value
                                                          });
                                                          if (res.data && res.data.success) {
                                                              const {data} = res.data;
                                                              if (data && data.exists) {
                                                                  callback(`${value}已存在`);
                                                              }
                                                          }
                                                          callback();
                                                      }
                                                }
                                            ]}>
                                            <Input placeholder='请输入本体英文名称' disabled maxLength={25} showWordLimit/>
                                        </Form.Item>
                                        <Form.Item label='描述' field='ontologyDesc'>
                                            <Input.TextArea
                                                maxLength={200}
                                                showWordLimit
                                                style={{height: '52px'}}
                                                placeholder='请输入本体描述' />
                                        </Form.Item>
                                    </Grid.Col>
                                    <Grid.Col span={12}>
                                        <Form.Item
                                            label='状态'
                                            field='status'
                                            triggerPropName='checked'>
                                            <Switch
                                                checkedText='启用'
                                                uncheckedText='禁用'/>
                                        </Form.Item>
                                        <Form.Item
                                            label='推荐本体'
                                            field='isRecommend'
                                            triggerPropName='checked'>
                                            <Switch
                                                checkedText='是'
                                                uncheckedText='否'/>
                                        </Form.Item>
                                        {/*<Form.Item label='权限分配' field='auth'>
                                            <Form.List field='auth'>
                                                {(fields, { add, remove, move }) => {
                                                    return (
                                                        <div>
                                                            {fields.map((item, index) => {
                                                                return (
                                                                    <div key={item.key}>
                                                                        <Grid.Row
                                                                            gutter={8}
                                                                            style={{
                                                                                marginBottom: '12px'
                                                                            }}>
                                                                            <Grid.Col
                                                                                flex='calc(50% - 40px)'>
                                                                                <Form.Item
                                                                                    field={item.field + '.a'}
                                                                                    noStyle>
                                                                                    <Input
                                                                                        placeholder="请输入"/>
                                                                                </Form.Item>
                                                                            </Grid.Col>
                                                                            <Grid.Col
                                                                                flex='calc(50% - 40px)'>
                                                                                <Form.Item
                                                                                    field={item.field + '.role'}
                                                                                    noStyle >
                                                                                    <Select
                                                                                        placeholder="请选择"/>
                                                                                </Form.Item>
                                                                            </Grid.Col>
                                                                            <Grid.Col
                                                                                flex='72px'>
                                                                                <Button
                                                                                    style={{
                                                                                        marginRight: '8px'
                                                                                    }}
                                                                                    icon={<IconAdd />}
                                                                                    shape='circle'
                                                                                    onClick={() => add(index)}>
                                                                                </Button>
                                                                                <Button
                                                                                    disabled={fields.length < 2}
                                                                                    icon={<IconLessen />}
                                                                                    shape='circle'
                                                                                    onClick={() => remove(index)} >
                                                                                </Button>
                                                                            </Grid.Col>
                                                                        </Grid.Row>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }}
                                            </Form.List>
                                        </Form.Item>*/}
                                    </Grid.Col>
                                </Grid.Row>
                            </Form>
                        </div>
                    </div>
                    <div
                        className="layout-5-5">
                        <div
                            className="object-type card">
                            <div
                                className="card-header">
                                <div
                                    className="title">
                                    对象
                                    <Tag size="small">{data.objectTypes.length}</Tag>
                                </div>
                                <div
                                    className="oper-group">
                                    <Button
                                        size="mini"
                                        type="text"
                                        onClick={() => {
                                            this.props.switchMenuKey('object')
                                        }}>
                                        <IconResourcesColor/>
                                        更多
                                    </Button>
                                </div>
                            </div>
                            <div
                                className="card-content">
                                <div
                                    className="object-type-list list">
                                    {/*[
                                        {
                                            label: '对象属性名称',
                                            date: '2025-05-17',
                                            edit: true
                                        },
                                        {
                                            label: '对象属性名称',
                                            date: '2025-05-17'
                                        },
                                        {
                                            label: '对象属性名称',
                                            date: '2025-05-17'
                                        },
                                        {
                                            label: '对象属性名称',
                                            date: '2025-05-17'
                                        },
                                        {
                                            label: '对象属性名称',
                                            date: '2025-05-17'
                                        },
                                    ].*/
                                    data.objectTypes.map(item => {
                                        return (
                                            <div
                                                className="object-item item">
                                                <div
                                                    className="icon">
                                                    {item.edit && (
                                                        <div className="warning-point">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                                <circle cx="3" cy="3" r="3" fill="var(--color-red-6"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <IconDataResDirColor/>
                                                </div>
                                                <div
                                                    className="label">
                                                    {item.objectTypeLabel}
                                                </div>
                                                <div
                                                    className="date">
                                                    {item.createTime}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {data.objectTypes.length === 0 && <ObjEmpty/>}
                            </div>
                        </div>
                      {/*  <div
                            className="attr card">
                            <div
                                className="card-header">
                                <div
                                    className="title">
                                    共享属性
                                    <Tag size="small">{data.sharedAttributes.length}</Tag>
                                </div>
                                <div
                                    className="oper-group">
                                    <Button
                                        size="mini"
                                        type="text"
                                        onClick={() => {
                                            this.props.switchMenuKey('attribute')
                                        }}>
                                        <IconResourcesColor/>
                                        更多
                                    </Button>
                                </div>
                            </div>
                            <div
                                className="card-content">
                                <div
                                    className="attr-list list">
                                    {data.sharedAttributes.map(item => {
                                        return (
                                            <div
                                                className="attr-item item">
                                                <div
                                                    className="icon">
                                                    {item.edit && (
                                                        <div className="warning-point">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                                <circle cx="3" cy="3" r="3" fill="var(--color-red-6"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <IconBackupsShareColor/>
                                                </div>
                                                <div
                                                    className="label">
                                                    {item.attributeLabel}
                                                </div>
                                                <div
                                                    className="num">
                                                    <IconLinkColor/>
                                                    {item.num || 5}
                                                </div>
                                                <div
                                                    className="date">
                                                    {item.createTime}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {data.sharedAttributes.length === 0 && <ObjEmpty/>}
                            </div>
                        </div>*/}
                        <div
                          className="logic-type card">
                            <div
                              className="card-header">
                                <div
                                  className="title">
                                    逻辑
                                    <Tag size="small">{data.logicTypes?.length||0}</Tag>
                                </div>
                                <div
                                  className="oper-group">
                                    <Button
                                      size="mini"
                                      type="text"onClick={() => {
                                        this.props.switchMenuKey('function')
                                    }}>
                                        <IconResourcesColor/>
                                        更多
                                    </Button>
                                </div>
                            </div>
                            <div
                              className="card-content">
                                <div
                                  className="logic-list list">
                                    {(data.logicTypes || []).map(item => {
                                        return (
                                          <div
                                            className="logic-item item">
                                              <div
                                                className="icon">
                                                  {item.edit && (
                                                    <div className="warning-point">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                            <circle cx="3" cy="3" r="3" fill="var(--color-red-6"/>
                                                        </svg>
                                                    </div>
                                                  )}
                                                  <img src={fxIcon} alt="" style={{width:'12px',height:'14px',marginTop:'4px'}}  />
                                              </div>
                                              <div
                                                className="label">
                                                  {item.logicTypeLabel || item.logicTypeName || item.logicTypeDesc || <span style={{color: 'var(--color-text-4)'}}>暂无描述</span>}
                                              </div>
                                              <div
                                                className="date">
                                                  {item.lastUpdate || item.createTime}
                                              </div>
                                          </div>
                                        )
                                    })}

                                </div>
                                {(data.logicTypes || []).length === 0 && <ObjEmpty/>}
                            </div>
                        </div>
                    </div>
                    <div
                        className="layout-5-5">
                        <div
                            className="link-type card">
                            <div
                                className="card-header">
                                <div
                                    className="title">
                                    关系
                                    <Tag size="small">{data.linkTypes?.length||0}</Tag>
                                </div>
                                <div
                                    className="oper-group">
                                    <Button
                                        size="mini"
                                        type="text"
                                        onClick={() => {
                                            this.props.switchMenuKey('link')
                                        }}>
                                        <IconResourcesColor/>
                                        更多
                                    </Button>
                                </div>
                            </div>
                            <div
                                className="card-content">
                                <div
                                    className="link-list list">
                                    {/*[
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        }
                                    ]*/
                                    data.linkTypes.map(item => {
                                        return (
                                            <div
                                                className="link-item item">
                                                <div
                                                    className="link-item-info">
                                                    <div
                                                        className="source">
                                                        <Tag
                                                            size="mini">
                                                            <IconUserColor />
                                                            {item?.sourceObjectType?.objectTypeLabel}
                                                        </Tag>
                                                    </div>
                                                    <div
                                                        className="link-icon">
                                                        <img
                                                            style={{
                                                                verticalAlign: 'middle'
                                                            }}
                                                            src={
                                                                item.linkType === 1 && item.linkMethod === 1
                                                                  ? oneToOneIcon
                                                                  : item.linkType === 1 && item.linkMethod === 2
                                                                  ? oneToManyIcon
                                                                  : manyToManyIcon
                                                            }
                                                        />
                                                    </div>
                                                    <div
                                                        className="target">
                                                        <Tag
                                                            size="mini">
                                                            <IconDataMapColor />
                                                            {item?.targetObjectType?.objectTypeLabel}
                                                        </Tag>
                                                    </div>
                                                </div>
                                                <div
                                                    className="date">
                                                    {item.date}
                                                </div>
                                            </div>
                                        )
                                    })}

                                </div>
                                {data.linkTypes.length === 0 && <ObjEmpty/>}
                            </div>
                        </div>
                        <div
                            className="action-type card">
                            <div
                                className="card-header">
                                <div
                                    className="title">
                                    动作

                                    <Tag size="small">{data.actionDtos?.length||0}</Tag>
                                </div>
                                <div
                                    className="oper-group">
                                    <Button
                                        size="mini"
                                        type="text"onClick={() => {
                                            this.props.switchMenuKey('action')
                                        }}>
                                        <IconResourcesColor/>
                                        更多
                                    </Button>
                                </div>
                            </div>
                            <div
                                className="card-content">
                                <div
                                    className="action-list list">
                                    {(data.actionDtos || []).map(item => {
                                        return (
                                            <div
                                                className="action-item item">
                                                <div
                                                    className="icon">
                                                    {item.edit && (
                                                        <div className="warning-point">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                                <circle cx="3" cy="3" r="3" fill="var(--color-red-6"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <IconTopologyColor/>
                                                </div>
                                                <div
                                                    className="label">
                                                    {item.actionLabel || item.actionName || item.actionDesc || <span style={{color: 'var(--color-text-4)'}}>暂无描述</span>}
                                                </div>
                                                <div
                                                    className="date">
                                                    {item.lastUpdate || item.createTime}
                                                </div>
                                            </div>
                                        )
                                    })}

                                </div>
                                {(data.actionDtos || []).length === 0 && <ObjEmpty/>}
                            </div>
                        </div>
                    </div>
                </div>
                {activeType == 'graph' ?
                  <GraphDetail
                  key={data.id}
                  pubVersion={false}
                  innerTab={true}
                  ontology={data}
                /> : ''}
                {/*{activeType == 'graph' ? <OntologyGraph ontology={data}/> : ''}*/}
            </Spin>
        )
    }
}

export default OntologyDetail;

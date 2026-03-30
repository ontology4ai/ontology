import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Button, Tooltip, Popconfirm, Typography } from '@arco-design/web-react';
import Editor from '@/components/Editor';
import { connect } from 'react-redux';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import ModoTable from '@/components/Table';
import { Tag, Face } from 'modo-design';
import { IconViewChanged, IconDifferenceAnalyse } from 'modo-design/icon';
import FilterForm from '../FilterForm';
import { getVersions } from './api';
import {
    getApp,
    getView,
    getModel,
    getTape
} from '../Diff/api';
import qs from 'qs';
import './style/index.less';

class History extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            versions: [],
            versionLoading: true,
            obj: {
                id: props.id
            },
            filterForm: {
                initialValues: {
                },
                min: 1,
                fields: [
                    {
                        type: 'input',
                        field: 'versionInfo',
                        label: '提交信息',
                        options: {
                            placeholder: '请输入提交信息'
                        }
                    }
                ]
            },
            pagination: {
                size: 'mini',
                simple: true,
                sizeCanChange: false,
                showTotal: true,
                total: 0,
                pageSize: 10,
                current: 1,
                pageSizeChangeResetCurrent: true
            }
        }
    }
    getParams = () => {
        const search = qs.parse(window.location.search.split('?')[1]);
        const params = this.props.match ? this.props.match.params : this.props;
        return {
            appName: params.appName,
            objType: params.objType,
            objName: params.objName
        }
    }
    handleVersionSwitch = (record) => {

    }
    handleVersionDiff = (record) => {
        const {
            appName,
            objName
        } = this.getParams();
        window.open(`/modo/${appName}/view/${objName}/diff?v1=${record.rev}&v2=-1`);
    }
    getVersions = (search, limit, offset, objId) => {
        const {
            appName,
            objName,
            objType
        } = this.getParams();

        this.setState({
            versionLoading: true
        })

        getVersions(appName, objType, (objId || this.props.objId || this.state.obj.id), search, limit, offset).then(res => {
            if (res.data && res.data.data) {
                const { data } = res.data;
                this.setState({
                    versionLoading: false,
                    versions: data.content,
                    pagination: {
                        ...this.state.pagination,
                        current: data.number + 1,
                        pageSize: data.size,
                        total: data.totalElements
                    }
                });
            } else {
                this.setState({
                    versionLoading: false
                })
            }
        }).catch(err => {
            this.setState({
                versionLoading: false
            })
        })
    }
    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
        }
    }
    componentDidMount() {
        if (this.props.objId) {
            this.getVersions('', 10, 0, this.props.objId);
        } else {
            const {
                appName,
                objName,
                objType
            } = this.getParams();
            /* getApp(appName).then(res => {
            }).catch(err => {

            }) */

            const getObj = {
                view: getView,
                model: getModel,
                tape: getTape
            }
            getObj[objType](appName, objName).then(res => {
                if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    const obj = res.data.data[0];
                    this.setState({
                        obj
                    });
                    this.getVersions('', 10, 0, obj.id);
                }
            }).catch(err => {

            })
        }
        
    }
    render() {
        const { visible } = this.props;
        const {
            versions,
            versionLoading,
            pagination
        } = this.state;
        return (
            <div
                className="modo-history">
                <FilterForm
                    {...this.state.filterForm}
                    search={(values) => {
                        const {
                            pageSize,
                            current
                        } = this.state.pagination;
                        this.getVersions(values.versionInfo, pageSize, pageSize * (current - 1), this.state.obj.id);
                    }}>
                </FilterForm>
                <ModoTable
                    data={versions}
                    loading={versionLoading}
                    style={{
                        height: 'calc(100% - 51px)'
                    }}
                    scroll={{
                        y: true
                    }}
                    columns={[
                        {
                            title: '版本号',
                            dataIndex: 'rev',
                            width: 120,
                            render(c, r) {
                                return <Tag
                                    effect="light"
                                    color="arcoblue">
                                    {`V${r.rev}`}
                                </Tag>;
                            }
                        },
                        {
                            title: '提交信息',
                            dataIndex: 'versionInfo',
                            width: 120,
                            render(c, r) {
                                if (!r.versionInfo) {
                                    return (
                                        <Typography.Text disabled>
                                            --
                                        </Typography.Text>
                                    )
                                } else {
                                    return r.versionInfo
                                }
                            }
                        },
                        {
                            title: '提交人',
                            dataIndex: 'committerName',
                            width: 120,
                            render: (col, render, index) => {
                                return <Face
                                    disabled={!col}
                                    text={col || ''}/>
                            }
                        },
                        {
                            title: '版本时间',
                            dataIndex: 'timestamp',
                            width: 160,
                        },
                        {
                            title: '操作',
                            dataIndex: 'operGroup',
                            fixed: 'right',
                            width: 80,
                            render: (col, record, index) => {
                                return (
                                    <Button.Group>
                                        <Tooltip
                                            content="跟当前版本对比">
                                            <Button
                                                size="mini"
                                                icon={<IconDifferenceAnalyse />}
                                                onClick={() => {
                                                    this.handleVersionDiff(record);
                                                }}>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            content="切换版本">
                                            <Popconfirm
                                                focusLock
                                                title='确定切换吗?'
                                                onOk={() => {
                                                    this.handleVersionSwitch(record);
                                                }}
                                                onCancel={() => {
                                                }}>
                                                <Button
                                                    size="mini"
                                                    icon={<IconViewChanged />}>
                                                </Button>
                                            </Popconfirm>
                                        </Tooltip>
                                    </Button.Group>
                                )
                            }
                        }
                    ]}
                    pagination={pagination}
                    onChange={(pagination, sorter, filters) => {
                        const { current, pageSize } = pagination;
                        this.getVersions('', pageSize, pageSize * (current - 1));
                    }}/>
            </div>
        );
    }
}

export default History;

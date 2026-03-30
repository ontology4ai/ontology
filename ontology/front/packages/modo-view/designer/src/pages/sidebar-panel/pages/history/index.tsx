import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Button, Tooltip, Popconfirm } from '@arco-design/web-react';
import Editor from '@/components/Editor';
import { connect } from 'react-redux';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import ModoTable from '@/components/Table';
import { Tag, Face } from 'modo-design';
import { IconViewChanged, IconDifferenceAnalyse } from 'modo-design/icon';
import { getVersions } from './api';
import History from '@/components/History';
import './style/index.less';

class ModoHistory extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            versions: [],
            versionLoading: true,
            pagination: {
                size: 'mini',
                simple: true,
                sizeCanChange: false,
                showTotal: true,
                total: 0,
                pageSize: 20,
                current: 1,
                pageSizeChangeResetCurrent: true
            }
        }
    }
    handleVersionSwitch = (record) => {

    };
    handleVersionDiff = (record) => {
        const {
            app,
            view
        } = this.props;
        window.open(`/modo/${app.name}/view/${view.name}/diff?v1=${record.rev}&v2=-1`);
    };
    getVersions = (limit, offset) => {
        getVersions(this.props.app.name).then(res => {
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
    };
    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
        }
    }
    componentDidMount() {
        this.getVersions();
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
                className="modo-design-history"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                <div className="header">
                    保存历史版本
                </div>
                <div className="content">
                    <History
                        appName={this.props.app.name}
                        objType="view"
                        objName={this.props.view.name}
                        objId={this.props.view.id}
                        />
                </div>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        app: state.app,
        view: state.view,
        nodes: state.nodes
    }
})(ModoHistory);

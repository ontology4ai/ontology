import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Spin, Modal, Notification, Button, Drawer, Divider, Typography, Input } from '@arco-design/web-react';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import { Tag } from 'modo-design';
import Editor from '@/components/Editor';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import logo from 'static/logo.png';
import './style/index.less';
import { updateView } from 'packages/modo-view/designer/src/api';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';

class HeaderPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            data: '',
            versionInfo: '',
            loading: false
        }
    }
    updateView = (callback) => {
        const parameters = JSON.stringify(generateView(this.props.nodes));
        const view = {
            ...this.props.view,
            parameters,
            versionInfo: this.state.versionInfo
        };
        this.setState({
            loading: true
        });
        updateView(view)
        .then(res => {
            if (res.data && res.data.data) {
                this.props.dispatch({
                    type: 'SETVIEW',
                    data: res.data.data
                });
                Notification.success({
                    title: '成功',
                    content: '更新视图成功',
                });
                typeof callback === 'function' && callback();
                this.setState({
                    visible: false,
                    loading: false
                });
                return;
            }
            Notification.error({
                title: '失败',
                content: '更新视图失败',
            });
            this.setState({
                visible: false,
                loading: false
            })
        })
        .catch(err => {
            if (err) {
                Notification.error({
                    title: '失败',
                    content: '更新视图失败',
                })
            }
            this.setState({
                visible: false,
                loading: false
            })
        })
    };
    handleSaveView = () => {
        this.setState({
            visible: true
        });
    };
    handlePreviewView = () => {
        this.updateView(() => {
            const { view } = this.props;
            window.open(`/modo/${view.appName}/render/${view.name}.${view.type}`);
        });
    };
    handleClearView = () => {
        this.props.dispatch({
            type: 'CLEARNODES'
        })
    };
    render() {
        const t = useClassLocale(this.context);

        return (
            <>
                <div className="modo-designer-header-panel">
                    <div
                        className="pos-left">
                        <img
                            className="logo"
                            src={logo}/>
                        <Divider
                            type='vertical'
                            style={{
                                height: '16px'
                            }}/>
                        <Typography.Text
                            style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                verticalAlign: 'middle'
                            }}>
                            {this.props.app.label}
                            /
                            {this.props.view.label}
                        </Typography.Text>
                        <Tag
                            color="magenta">
                            视图设计
                        </Tag>

                    </div>
                    <div className="pos-right">
                        <Button.Group>
                            <Button
                                onClick={this.handleClearView}>
                                {t('清空')}
                            </Button>
                            <Button
                                onClick={this.handlePreviewView}>
                                {t('预览')}
                            </Button>
                        </Button.Group>
                        <Button
                            style={{
                                marginLeft: '10px'
                            }}
                            type="primary"
                            onClick={this.handleSaveView}>
                            {t('保存')}
                        </Button>
                    </div>
                </div>
                <Modal
                    title={
                        <div style={{ textAlign: 'left' }}>
                            保存信息
                        </div>
                    }
                    visible={this.state.visible}
                    onCancel={() => {
                        this.setState({
                            visible: false
                        })
                    }}
                    onOk={() => {
                        this.updateView();
                    }}>
                    <Input.TextArea
                        value={this.state.versionInfo}
                        placeholder="请输入保存信息"
                        onChange={val => {
                            this.setState({
                                versionInfo: val
                            })
                        }}/>
                </Modal>
                <Spin
                    className={"full-loading " + (this.state.loading ? 'loading' : '')}
                    tip="保存中..."
                    loading={this.state.loading}>
                </Spin>
            </>
        );
    }
}
HeaderPanel.contextType = GlobalContext;

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        view: state.view,
        app: state.app
    }
})(HeaderPanel);

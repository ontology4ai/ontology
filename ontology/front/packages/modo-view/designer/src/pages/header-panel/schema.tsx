import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Button, Drawer } from '@arco-design/web-react';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import Editor from '@/components/Editor';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import logo from 'static/logo.png';
import './style/index.less';

class HeaderPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            data: ''
        }
    }
    printView = () => {
        this.setState({
            visible: true,
            data: JSON.stringify(generateView(this.props.nodes), null, 4),

            size: '50%'
        });
    };
    handleOk = () => {
        this.handleCloseEditor();
        try {
            this.props.dispatch({
                type: 'SETNODES',
                data: transform(JSON.parse(this.state.data))
            })
        } catch(e) {
            console.warn(e);
        }

    };
    handleCloseEditor = () => {
        this.setState({
            visible: false
        });
    };
    onChange = (value, e) => {
        this.setState({
            data: value
        });
    };
    handleFullscreenExit = () => {
        this.setState({
            size: '50%'
        });
    };
    handleFullscreen = () => {
        this.setState({
            size: '100%'
        });
    };
    handleSaveView = () => {

    };
    handlePreviewView = () => {

    };
    handleClearView = () => {
        this.props.dispatch({
            type: 'CLEARNODES'
        })
    };
    render() {
        return (
            <>
                <div className="modo-designer-header-panel">
                    <div
                        className="pos-left">
                        <img
                            className="logo"
                            src={logo}/>
                    </div>
                    <div className="pos-right">
                        <Button.Group>
                            <Button
                                onClick={this.printView}>
                                schema
                            </Button>
                            <Button
                                type="primary"
                                onClick={this.handleSaveView}>
                                保存
                            </Button>
                            <Button
                                onClick={this.handlePreviewView}>
                                预览
                            </Button>
                            <Button
                                onClick={this.handleClearView}>
                                清空
                            </Button>
                        </Button.Group>
                    </div>
                </div>
                <Drawer
                    width={this.state.size}
                    title={(
                        <>
                            视图数据
                            <span
                                className="drawer-resize-container">
                                {
                                    this.state.size === '100%' ?
                                    <IconFullscreenExit
                                        onClick={this.handleFullscreenExit}/> :
                                    <IconFullscreen
                                        onClick={this.handleFullscreen}/>
                                }
                            </span>
                        </>
                    )}
                    visible={this.state.visible}
                    placement="left"
                    onOk={this.handleOk}
                    onCancel={this.handleCloseEditor}>
                    <Editor
                        language="json"
                        value={this.state.data}
                        height="100%"
                        onChange={this.onChange}/>
                </Drawer>
            </>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes
    }
})(HeaderPanel);

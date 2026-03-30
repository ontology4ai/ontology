import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Button } from '@arco-design/web-react';
import { IconErrorFill } from 'modo-design/icon';
import './style/index.less';

class Panel extends React.Component {
    constructor(props: {visible: boolean}) {
        super(props);
        this.state = {
        };
    }
    handleClosePanel = () => {
        this.props.onClose();
    };
    handleCancel = () => {
        this.props.onClose();
        this.props.onCancel();
    };
    handleSave = () => {
        this.props.onClose();
        this.props.onSave();
    };
    render() {
        const {
            children,
            visible,
            style,
            onSave,
            onCancel,
            mask,
            ...rest
        } = this.props;

        const className = mask ? 'mask' : '';

        return (
            <div
                className={"modo-design-panel " + className}
                {...rest}
                style={{
                    ...style,
                    display: visible ? 'block' : 'none'
                }}>
                <div className="modo-design-panel_content">
                    <div
                        className="header">
                        <span
                            className="title">
                            {this.props.title}
                        </span>
                        <IconErrorFill
                            className="panel-close"
                            style={{
                                marginTop: '10px'
                            }}
                            onClick={this.handleClosePanel}/>
                    </div>
                    <div
                        className="content">
                        {this.props.children}
                    </div>
                    <div
                        className="footer">
                        <Button
                            size="mini"
                            onClick={this.handleCancel}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            size="mini"
                            onClick={this.handleSave}>
                            保存
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Panel;

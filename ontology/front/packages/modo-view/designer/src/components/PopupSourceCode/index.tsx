import React, { useState, useEffect, useMemo } from 'react';
import { Drawer } from '@arco-design/web-react';
import Editor from '@/components/Editor';
import './style/index.less';

class PopupSourceCode extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            placement: 'lf',
            title: '源码编辑',
            code: this.props.value
        };
    }
    setVisible = (val) => {
        this.setState({
            visible: val,
            placement: 'left'
        });
        const  { onVisibleChange } = this.props;
        onVisibleChange && onVisibleChange(val);
        if (val) {
            this.setState({
                code: this.props.value
            });
        }
    };
    onChange = (value, e) => {
        this.setState({
            code: value
        });
    };
    handleSave = () => {
        this.setVisible(false);
        this.props.onChange(this.state.code);
    };
    render() {
        const mergeProps = {
            onClick: () => {
                this.setVisible(true)
            }
        };

        return (
            <>
                {React.cloneElement(this.props.children, {...mergeProps})}
                <Drawer
                    className="source-code"
                    width={360}
                    mask={false}
                    title={this.state.title}
                    visible={this.state.visible}
                    placement={this.state.placement}
                    onOk={this.handleSave}
                    onCancel={() => {
                        this.setVisible(false);
                    }}>
                    <Editor
                        language={this.props.language || "javascript" }
                        value={this.state.code}
                        height="100%"
                        onChange={this.onChange}/>
                </Drawer>
            </>
        )
    }
}

export default PopupSourceCode;

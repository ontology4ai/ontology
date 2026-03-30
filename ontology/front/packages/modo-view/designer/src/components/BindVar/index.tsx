import React, { useState, useEffect, useMemo } from 'react';
import { IconDataDevelop } from 'modo-design/icon';
import { Input } from '@arco-design/web-react';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import './style/index.less';

class BindVar extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false
        };
    }
    onVisibleChange = val => {
        this.setState({
            visible: val
        });
    };
    onChange = val => {
        this.props.onChange && this.props.onChange(val);
    };
    render() {
        const classNames = ['code'];
        const size = this.props.size || 'default';
        classNames.push(size);
        if (this.state.visible || this.props.value) {
            classNames.push('active');
        }
        return (
            <div
                className="modo-designer-bind-var">
                <div className="element">
                    {this.props.children}
                </div>
                <PopupSourceCode
                    onVisibleChange={this.onVisibleChange}
                    value={this.props.value}
                    onChange={this.onChange}>
                    <div className={classNames.join(' ')}>
                        <IconDataDevelop />
                    </div>
                </PopupSourceCode>
            </div>
        )
    }
}

export default BindVar;

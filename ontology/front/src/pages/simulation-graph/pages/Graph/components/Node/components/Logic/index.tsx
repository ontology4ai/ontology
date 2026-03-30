import React, { useState, useEffect, useMemo } from 'react';
import { } from '@arco-design/web-react';
import {
    IconMpcShiticaozuo,
    IconNodeTreeColor
} from 'modo-design/icon';
import './style/index.less';

class LogicNode extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
    }
    render() {
        const {
            data,
            selected
        } = this.props;
        const {
        } = this.state;
        return (
            <div
                className={`logic-node${data.animated ? ' animated' : ''}${selected ? ' selected' : ''}${data.highlighted ? ' highlighted' : ''}`}>
                <div
                    className="node-header">
                    <div
                        className="node-title">
                        逻辑
                    </div>
                    <div
                        className="node-status">
                    </div>
                    <div
                        className="node-oper-group">
                    </div>
                </div>
                <div
                    className="node-content">
                    <div
                        className="node-icon">
                        <IconNodeTreeColor />
                    </div>
                    <div
                        className="node-info">
                        <div
                            className="label">
                            {data.label || '--'}
                        </div>
                        <div
                            className="descr">
                            {data.name || '--'}
                        </div>
                    </div>
                </div>
            </div>                        
        )
    }
}

export default LogicNode;
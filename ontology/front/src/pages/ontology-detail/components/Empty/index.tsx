import React, { useState, useEffect, useMemo } from 'react';
import {  } from '@arco-design/web-react';
import { } from 'modo-design';
import { IconEmptyColor} from 'modo-design/icon';
import './style/index.less';

class ObjEmpty extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: [],
            selectedRowKeys: []
        }
    }
    getData = () => {
        getData()
    }
    componentDidMount() {
        
    }
    render() {
        const {
            text
        } = this.props;
        return (
            <>
                <div
                    className="ontology-empty">
                    <div>
                        <div
                            className="icon">
                            <IconEmptyColor/>
                        </div>
                        <div
                            className="text">
                            {text || '暂无数据'}
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default ObjEmpty;
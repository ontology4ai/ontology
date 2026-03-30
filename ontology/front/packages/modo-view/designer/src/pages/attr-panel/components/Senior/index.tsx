import React, { useState, useEffect, useMemo } from 'react';
import { Collapse } from '@arco-design/web-react';
import Event from './components/Event';
import Loop from './components/Loop';

import './style/index.less';

class Senior extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    render() {
        return (
            <div className="modo-designer-senior">
                <Collapse
                    defaultActiveKey={['event', 'loop']}>
                    <Collapse.Item header='事件' name='event'>
                        <Event></Event>
                    </Collapse.Item>
                    <Collapse.Item header='循环' name='loop'>
                        <Loop></Loop>
                    </Collapse.Item>
                </Collapse>
            </div>
        );
    }
}

export default Senior;

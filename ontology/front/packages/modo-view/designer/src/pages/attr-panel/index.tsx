import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Typography } from '@arco-design/web-react';
import { connect } from 'react-redux';
import Attr from './components/Attr';
import Css from './components/Css';
import Senior from './components/Senior';
import './style/index.less';

const TabPane = Tabs.TabPane;

class AttrPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    render() {
        if (!this.props.node) {
            return <div>未找到选中节点</div>
        }
        return (
            <div className="modo-designer-attr-panel">
                <Tabs
                    type="capsule">
                    <TabPane
                        key="attr"
                        title="属性">
                        <Attr></Attr>
                    </TabPane>
                    <TabPane
                        key="css"
                        title="样式">
                        <Css></Css>
                    </TabPane>
                    <TabPane
                        key='senior'
                        title='高级'>
                        <Senior></Senior>
                    </TabPane>
              </Tabs>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    const { nodes, activeNodeKey} = state;
    const node = nodes.byId[activeNodeKey];
    return {
        node
    }
})(AttrPanel);

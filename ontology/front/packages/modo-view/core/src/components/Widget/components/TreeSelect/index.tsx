import React from 'react';
import { TreeSelect } from '@arco-design/web-react';

import Renderer from 'packages/modo-view/renderer';
import * as Icon from 'modo-design/icon';

class ModoTreeSelect extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
        };
    }

    componentDidUpdate() {

    }

    componentDidMount() {
    }

    handleChange = () => {

    };

    render() {
        if (window.abc) {
            console.log(`render-tree-select-${this.props.nodeKey}`);
        }
        const { treeCheckStrictly, data } = this.props;
        return (
            <TreeSelect
              {
                ...this.props
              }
              allowClear={true}
              treeCheckStrictly={treeCheckStrictly}
              treeData={data}
              placeholder='请选择...'
            />
        )
    }
}

export default ModoTreeSelect;

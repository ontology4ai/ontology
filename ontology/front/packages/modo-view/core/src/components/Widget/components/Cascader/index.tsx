import React from 'react';
import { Cascader } from '@arco-design/web-react';

import Renderer from 'packages/modo-view/renderer';
import * as Icon from 'modo-design/icon';

class ModoCascader extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
        };
    }

    render() {
        if (window.abc) {
            console.log(`render-cascader-${this.props.nodeKey}`);
        }
        const {
            className,
            showAllPath,
            split
        } = this.props;

        return (
            <Cascader
              {...this.props}
              className={className + ' ' + this.props.className}
              renderFormat={(valueShow) => { if(!showAllPath){ return valueShow[valueShow.length - 1]; } return `${valueShow.join(split || ' / ')}`}}
            />
        )
    }
}

export default ModoCascader;

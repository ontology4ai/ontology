import React from 'react';
import CascaderPanel from '@/components/CascaderPanel';

import Renderer from 'packages/modo-view/renderer';
import * as Icon from 'modo-design/icon';
import './style/index.less';

class ModoCascaderPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
        };
    }

    render() {
        if (window.abc) {
            console.log(`render-cascader-panel-${this.props.nodeKey}`);
        }
        const {
            className,
            showAllPath,
            split,
            onMouseLeave,
            onMouseOver,
            onClick,
            style
        } = this.props;

        return (
            <div
                className={className + (this.props.editable ? ' modo-cascader-panel-editable' : '')}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                <CascaderPanel
                  {...this.props}
                  dropdownMenuClassName={className}
                  renderFormat={(valueShow) => { if(!showAllPath){ return valueShow[valueShow.length - 1]; } return `${valueShow.join(split || ' / ')}`}}
                />
            </div>
        )
    }
}

export default ModoCascaderPanel;

import React, { useState, useEffect, useMemo } from 'react';
import { Select } from "@arco-design/web-react";
import * as iconMap from 'modo-design/icon';
import './style/index.less';

class IconSelect extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
    }
    render() {
        return (
            <Select
                {...this.props}
                size={this.props.size || "small"}
                showSearch={true}
                allowClear
                dropdownMenuClassName="icon-list"
                virtualListProps={{
                    threshold: null
                }}
                triggerProps={{
                    autoAlignPopupWidth: false,
                    autoAlignPopupMinWidth: true,
                }}
                options={Object.keys(iconMap).map(key => {
                    const Icon = iconMap[key];
                    return {
                        value: key,
                        label: (<Icon/>)
                    }
                })}/>  
        );
    }
}

export default IconSelect;

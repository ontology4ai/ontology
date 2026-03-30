import React , { useState} from 'react';
import { Select } from '@arco-design/web-react';
import getAppName from '@/core/src/utils/getAppName';

class ModoSelect extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-select-${this.props.nodeKey}`);
        }
        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            children,
            headersBindVar,
            options,
            props,
            ...rest
        } = this.props;

        const currentOptions = options ? options.map(option => {
            if (props) {
                return {
                    label: props.label ? option[props.label] : option.label,
                    value: props.value ? option[props.value] : option.value,
                    disabled: props.disabled ? option[props.disabled] : option.disabled
                }
            } else {
                return option;
            }
        }) : [];
        
        return (
            <Select
                {...rest}
                options={currentOptions}/>
        )
    }
}

export default ModoSelect;

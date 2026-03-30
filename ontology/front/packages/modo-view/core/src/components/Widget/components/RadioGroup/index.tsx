import React , { useState} from 'react';
import { Select } from '@arco-design/web-react';
import getAppName from '@/core/src/utils/getAppName';
import { Radio } from '@arco-design/web-react';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import * as IconMap from 'modo-design/icon';

const RadioGroup = Radio.Group;

class ModoRadioGroup extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-radio-group-${this.props.nodeKey}`);
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
                const {
                    label,
                    value,
                    icon,
                    ...o
                } = option;
                const currentLabel = props.label ? option[props.label] : option.label;
                const currentIcon = option.icon;
                const Icon = IconMap[currentIcon];
                return {
                    ...o,
                    label: (
                        <>
                            {Icon && <Icon style={{
                                marginRight: currentLabel ? '4px' : '0px'
                            }}/>}
                            {label}
                        </>
                    ),
                    value: props.value ? option[props.value] : option.value
                }
            } else {
                return option;
            }
        }) : [];
        
        return (
            <RadioGroup
                {...rest}
                options={currentOptions}/>
        )
    }
}

export default ModoRadioGroup;

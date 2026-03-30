import React , { useState} from 'react';
import { DatePicker } from '@arco-design/web-react';
import getAppName from '@/core/src/utils/getAppName';

class ModoSelect extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-datepicker-${this.props.nodeKey}`);
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

        const modeType = {
            'date': '',
            'week': 'WeekPicker',
            'month': 'MonthPicker',
            'year': 'YearPicker',
            'quarter': 'QuarterPicker'
        };

        const Widget = DatePicker[modeType[rest.mode]] || DatePicker;

        return (
            <Widget
                {...rest}/>
        )
    }
}

export default ModoSelect;

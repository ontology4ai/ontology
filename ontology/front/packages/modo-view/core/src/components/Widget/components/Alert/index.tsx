import React from 'react';
import { Alert } from '@arco-design/web-react';
import * as IconMap from 'modo-design/icon';

class ModoAlert extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-alert-${this.props.nodeKey}`);
        }
        const Icon = IconMap[this.props.icon];
        return (
                <Alert
                    {...this.props}
                    icon={Icon ? <Icon/> : null}/>
        )
    }
}

export default ModoAlert;

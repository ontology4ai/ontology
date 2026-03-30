import React , { useState} from 'react';
import { Progress } from '@arco-design/web-react';
import './style/index.less';

class ModoProgress extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-progress-${this.props.nodeKey}`);
        }
        const {
            className,
            style,
            onMouseLeave,
            onMouseOver,
            onClick
        } = this.props;

        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            ...rest
        } = this.props;
        
        return (
            <div
                className={className}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                <Progress
                    {...rest}/>
            </div>
        )
    }
}

export default ModoProgress;

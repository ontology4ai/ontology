import React , { useState} from 'react';
import { Button } from '@arco-design/web-react';
import * as Icon from 'modo-design/icon';

class ModoButton extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-button-${this.props.nodeKey}`);
        }
        const {
            icon,
            nodeKey,
            ...rest
        } = this.props;

        const ButtonIcon = Icon[icon];

        const className = rest.iconOnly ? [rest.className, 'arco-btn-icon-only'].join(' ') : rest.className;

        return (
            <Button
                {...rest}
                className={className}
                icon={ButtonIcon ? <ButtonIcon/> : null}/>
        )
    }
}

export default ModoButton;

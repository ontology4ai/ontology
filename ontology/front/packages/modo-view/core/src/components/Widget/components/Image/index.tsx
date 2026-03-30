import React , { useState} from 'react';
import { Image } from '@arco-design/web-react';

class ModoImage extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-image-${this.props.nodeKey}`);
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
                    display: 'inline-block',
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                <Image
                    {...rest}
                    loader={false}
                    preview={false}/>
            </div>
        )
    }
}

export default ModoImage;

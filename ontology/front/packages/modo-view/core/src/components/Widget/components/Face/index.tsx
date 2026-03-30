import React , { useState} from 'react';
import { Face } from 'modo-design';
import { connect } from 'react-redux';
import * as Icon from 'modo-design/icon';

class ModoTag extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-face-${this.props.nodeKey}`);
        }
        const {
            className,
            style,
            onMouseLeave,
            onMouseOver,
            onClick,
            text,
            size
        } = this.props;
        
        return (
            <Face
                className={className}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}
                size={size}>
                {text || '暂无数据'}
            </Face>
        )
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes
    }
})(ModoTag);

import React , { useState} from 'react';
import { Tag } from 'modo-design';
import { connect } from 'react-redux';
import * as Icon from 'modo-design/icon';

class ModoTag extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-tag-${this.props.nodeKey}`);
        }
        const {
            className,
            style,
            onMouseLeave,
            onMouseOver,
            onClick
        } = this.props;
        let {
            effect,
            icon,
            colors,
            icons,
            showTextColor
        } = this.props;

        colors = colors || [];
        icons = icons || [];

        let TagIcon = Icon[icon];
        const value = this.props.children;
        const iconMap = icons.find(item => {
            return item.value === value;
        });
        if (iconMap && iconMap.icon) {
            TagIcon = Icon[iconMap.icon]
        }
        const colorMap = colors.find(item => {
            return item.value === value;
        });

        let color = this.props.color;
        if (colorMap && colorMap.color) {
            color = colorMap.color
        }

        return (
            <Tag
                className={className}
                style={{
                    ...style
                }}
                effect={effect}
                color={(!(icon && TagIcon) || showTextColor) ? color : null}
                iconColor={icon && TagIcon ? color : null}
                icon={(icon && TagIcon) ? <TagIcon /> : null}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                {value || '暂无数据'}
            </Tag>
        )
    }
}

export default connect((state, ownProps) => {
    return {
    }
})(ModoTag);

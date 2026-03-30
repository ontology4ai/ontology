import React from 'react';
import * as iconMap from 'modo-design/icon';

class Icon extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-icon-${this.props.nodeKey}`);
        }
        let icon = this.props.class;

        if (icon === 'uex-icon-font') {
            icon = 'uex-icon-font-size';
        }
        if (icon === 'uex-icon-UexIcon-fill') {
            icon = 'uex-icon-heart-on';
        }

        let content = (<span class="modo-icon">图标</span>);
        if (icon && typeof icon === 'string') {
            const Component = iconMap[`Icon${icon.replace(' ', '').split('uex-icon-')[1].split('-').map(str => {
                return str.substring(0, 1).toLocaleUpperCase() + str.substring(1)
            }).join('')}`];
            if (Component) {
                content = <Component />;
            }
        }
        return (
            content
        )
    }
}

export default Icon;

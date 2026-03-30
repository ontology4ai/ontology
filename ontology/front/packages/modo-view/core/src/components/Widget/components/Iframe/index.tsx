import React from 'react';
import './style/index.less';

class Iframe extends React.Component {
    constructor(props: any) {
        super(props);
    }
    getClassName(classNames) {
        return classNames.filter(name => {
            return name;
        }).join(' ');
    }
    render() {
        if (window.abc) {
            console.log(`render-iframe-${this.props.nodeKey}`);
        }
        return (
            <iframe
                {...this.props}
                className={this.getClassName([
                    'modo-iframe',
                     (this.props.editable ? 'readOnly' : ''),
                    this.props.className])}/>
        )
    }
}

export default Iframe;

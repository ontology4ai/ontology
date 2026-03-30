import React from 'react';
import './style/index.less';

class Frame extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    render() {
    	return (
			<iframe
				className="modo-frame"
				src={this.props.state.url}>
			</iframe>
	    )
    }
};

export default Frame;

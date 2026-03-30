import React from 'react';
import './style/index.less';

class Placeholder extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    render() {
    	return (
			<div
				className="modo-placeholder">
                <div className="modo-placeholder-content">
                    <span>敬请期待</span>
                </div>
			</div>
	    )
    }
};

export default Placeholder;

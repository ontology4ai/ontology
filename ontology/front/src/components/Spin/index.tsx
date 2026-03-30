import React from 'react';
import { Spin } from '@arco-design/web-react';
import loadingGif from './imgs/loading-3.gif';
import { SpinProps } from '@arco-design/web-react/es/Spin/interface';
import './style/index.less';

class Loading extends React.Component {
    constructor(props: SpinProps) {
        super(props);
        this.state = {
        };
    }
    render() {
    	return (
            <Spin
                {...this.props}
                className={[
                    'modo-spin',
                    this.props.className || ''
                ].join(' ')}
                element={(<img
                    style={{
                        verticalAlign: 'middle'
                    }}
                    src={this.props.res || loadingGif}/>)
                }
            />
	    )
    }
};

export default Loading;

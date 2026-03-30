import React , { useState} from 'react';
import wrapHOC from '../../hoc/wrap';
import { Upload } from '@arco-design/web-react';
import getAppName from '@/core/src/utils/getAppName';

class ModoUpload extends React.Component {
    constructor(props: any) {
        super(props);
        this.uploadRef = React.createRef();
    }
    componentDidMount() {
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
    }
    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }
    render() {
        if (window.abc) {
            console.log(`render-upload-${this.props.nodeKey}`);
        }
        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            children,
            headersBindVar,
            ...rest
        } = this.props;

        const headers = {
            'X-Modo-Bucket': getAppName(),
            ...rest.headers
        };

        const env = process.env.NODE_ENV;
        const rootPath = env === 'production' ? '' : '/__modo';

        const action = rest.action ? (rootPath + rest.action) : undefined;
        
        return (
            <Upload
                ref={this.uploadRef}
                {...rest}
                name="file"
                action={action}
                headers={headers}/>
        )
    }
}

export default wrapHOC(ModoUpload, 'upload');

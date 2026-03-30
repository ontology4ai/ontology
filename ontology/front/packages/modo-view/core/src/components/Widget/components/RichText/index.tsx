import React , { useState} from 'react';
import { Select } from '@arco-design/web-react';
import getAppName from '@/core/src/utils/getAppName';
import RichEditor from '@/components/RichEditor';

class ModoRichText extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-rich-editor-${this.props.nodeKey}`);
        }
        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            headersBindVar,
            props,
            ...rest
        } = this.props;
        
        return (
            <RichEditor
                {...rest}
                preview={true}/>
        )
    }
}

export default ModoRichText;

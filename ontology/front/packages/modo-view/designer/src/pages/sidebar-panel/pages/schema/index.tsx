import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Button } from '@arco-design/web-react';
import Editor from '@/components/Editor';
import { connect } from 'react-redux';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import './style/index.less';

class Schema extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: ''
        }
    }
    onChange = (value, e) => {
        this.setState({
            data: value
        });
    };
    handleSave = () => {
        try {
            this.props.dispatch({
                type: 'SETNODES',
                data: transform(JSON.parse(this.state.data))
            })
        } catch(e) {
            console.warn(e);
        }

    };
    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
            this.setState({
                data: JSON.stringify(generateView(this.props.nodes), null, 4)
            });
        }
    }
    render() {
        const { visible } = this.props;

        return (
            <div
                className="modo-design-schema"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                <Editor
                    language="json"
                    value={this.state.data}
                    height="calc(100% - 30px)"
                    onChange={this.onChange}/>
                <div className="footer">
                    <Button
                        size="mini"
                        type="primary"
                        onClick={this.handleSave}>
                        保存
                    </Button>
                </div>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes
    }
})(Schema);

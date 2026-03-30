import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Spin } from '@arco-design/web-react';
import { IconLoading } from '@arco-design/web-react/icon';
import View from 'packages/modo-view/core/src/components/View';
import ViewPanel from 'packages/modo-view/designer/src/pages/view-panel';
import format from 'packages/modo-view/designer/src/utils/format';
import transform from 'packages/modo-view/designer/src/utils/transform';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from 'packages/modo-view/designer/src/store';
import NotFound from '@/router/NotFound';
import { normalize, schema } from 'normalizr';
import './src/style/index.less';
require('static/guid');
import IconUser from 'packages/modo-workflow/designer/modeler/icon/icon-user.svg';

// const demo = require('packages/modo-view/designer/src/mock/user.json');

class Renderer extends React.Component {
    constructor(props: any) {
        super(props);
        const viewKey = guid();
        this.state = {
            viewKey,
            renderKey: this.props.renderKey || viewKey
        };
        this.props.dispatch({
            type: 'SETVIEWKEY',
            data: viewKey
        });
        window.nodeVarMap[viewKey] = {};
        window.nodeRenderer[viewKey] = {};
        window.stateChange[viewKey] = {};

        /* this.props.dispatch({
            type: 'SETNODES',
            data: transform(demo)
        }) */
    }
    setNode = (data, node) => {

    };
    componentDidMount() {
    }
    render() {
        const prefix = 'modo-renderer';
        const {
            app,
            view,
            status,
        } = this.props;

        if (status === '1') {
            if (app && view) {
                return (
                    <div
                        className={prefix}
                        style={this.props.style}>
                        <ViewPanel
                            editable={false}
                            setParentChild={this.props.setParentChild}
                            deleteParentChild={this.props.deleteParentChild}
                            viewKey={this.state.viewKey}
                            renderKey={this.state.renderKey}
                            style={this.props.style}>
                        </ViewPanel>
                    </div>
                );
            } else {
                return (
                    <Spin
                        loading={true}
                        size={30}
                        block
                        style={{
                            width: '100%',
                            height: '100%',
                            minHeight: '50px',
                            ...this.props.style
                        }}
                        icon={<IconLoading />}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%'
                            }}>
                        </div>
                    </Spin>
                );
            }
        }

        if (status === '0') {
            return <NotFound/>;
        }
    }
}

export default connect((state, props) => {
    return {
        app: state.app,
        view: state.view,
        nodes: state.nodes
    }
})(Renderer);

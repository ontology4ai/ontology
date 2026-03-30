import React from 'react';
import { connect } from 'react-redux';

import utils from '../../utils';

import WrapProps from './interface';
import getViewChildren from 'packages/modo-view/core/src/utils/getViewChildren';

import diff from 'packages/modo-view/core/src//utils/diff';
import getBindVars from 'packages/modo-view/core/src/utils/getBindVars';
import formItemTypes from '../../components/Form/types';

const getRenderer = function(state, ownProps) {
    const {
        nodes,
        viewKey,
        view
    } = state;
    const {
        nodeKey
    } = ownProps;
    let {
        stateVars
    } = getBindVars(nodes, ownProps.editable, nodes.byId[nodeKey], viewKey, view.modoStoreList,);
    const {
        nodeRenderer
    } = window;
    const changeKey = nodeKey + '-changeIndex';
    const origin = nodeRenderer[viewKey][nodeKey];
    if (state.store.changeIndex !== nodeRenderer[viewKey][changeKey]) {
        if (state.store.changeList.slice(nodeRenderer[viewKey][changeKey]).find(k => {
            return stateVars.indexOf(k) > -1
        })) {
            nodeRenderer[viewKey][nodeKey] += 1;
            nodeRenderer[viewKey][changeKey] = state.store.changeIndex;
        }
    }
    if (stateVars.indexOf(state.store.change) > -1) {
        if (origin) {
            nodeRenderer[viewKey][nodeKey] += 1;
            nodeRenderer[viewKey][changeKey] = state.store.changeIndex;
        }
    }
    if (!origin) {
        nodeRenderer[viewKey][nodeKey] = 1;
        nodeRenderer[viewKey][changeKey] = 0;
    }
    return nodeRenderer[viewKey][nodeKey];
};

export default function wrapHOC(WrappedComponent:React.Component, type:string, noStore: boolean) {
	class Wrap extends React.Component {
		constructor(props: WrapProps) {
	        super(props);
	    }
	    componentDidMount() {
	    }
	    handleFormatNode = node => {
	        const id = guid();
	        node.id = id;
	        node.name = id;
	        if (Array.isArray(node.children)) {
	            node.children = node.children.map(child => {
	                return this.handleFormatNode(JSON.parse(JSON.stringify(child)));
	            });
	        }
	        return node;
	    };
	    cloneWidget = (item, key) => {
	    	if (item.parameters) {
	    		const node = this.handleFormatNode(JSON.parse(item.parameters));
	    		this.props.dispatch({
	                type: 'ADDNODE',
	                parentNodeKey: typeof key === 'string' ? key : this.props.nodeKey,
	                node
	            });
	            return node.id
	    	}
	        let id = item.toString();
	        if (id.indexOf('[') !== 0) {
	            return id;
	        } else {
	            id = guid();

	            this.props.dispatch({
	                type: 'ADDNODE',
	                parentNodeKey: typeof key === 'string' ? key : this.props.nodeKey,
	                node: new utils[item.type](id, id, item.label, item.type, {}, [])
	            });
	            return id;
	        }
	    };
	    setList = (list, key) => {
            this.props.dispatch({
                type: 'SETNODECHILDREN',
                data: list,
                nodeKey: typeof key === 'string' ? key : this.props.nodeKey
            });
        };
        shouldComponentUpdate(nextProps, nextState) {
        	if (formItemTypes.indexOf(this.props.node.type) > -1) {
	            return true
	        }
        	if (this.props.editable) {
        		return true;
        	}

        	if (noStore) {
        		return true;
        	}

        	if (diff(this, nextProps, nextState, 'hoc')) {
	        	return true;
	        }

	        if (this.props.node && this.props.node.type === 'view') {
	        	return true
	        }
	        return false;
	    }
	    render() {
	    	if (window.abc) {
	    		console.log(`render-widget-hoc-${this.props.node.id}`);
	    	}
	    	const {
	    		node,
	    		nodeKey
	        } = this.props;

        	if (!node) {
        		return <span>未成功渲染</span>
        	}

	    	const className = [
	            `modo-${type}`,
	            // node.options.className,
	            this.props.className
	        ].join(' ');

	        // console.log(this.props.className);

	        const canvasClassName = [
	            "widget-list-canvas",
	            `editor-${nodeKey}`
	        ].join(' ');

	    	const newProps = {
	    		className,
	    		canvasClassName,
	    		cloneWidget: this.cloneWidget,
	    		setList: this.setList
	    	};

	    	return <WrappedComponent
	    		{...this.props}
	    	    {...newProps}/>
	    }
    }

    if (noStore) {
		return Wrap;
	}

	return connect((state, ownProps) => {
	    const { nodes } = state;
	    const node = nodes.byId[ownProps.nodeKey];
	    return {
	    	lang: state.lang,
	    	appLang: state.appLang,
	        nodes,
	        node,
	        name: node.name,
	        params: state.params,
	        viewName: state.view.name,
	        initVars: state.store.initVars,
	        renderKey: ownProps.renderKey,
	        viewKey: state.viewKey,
	        stores: state.view.modoStoreList,
	        app: state.app,
	        appServices: state.app.services,
	        appModels: state.app.models,
	        appServiceMap: state.app.serviceMap,
	        appModelMap: state.app.modelMap,
	        renderer: getRenderer(state, ownProps)
	    }
	})(Wrap);
}

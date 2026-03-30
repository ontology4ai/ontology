import React , { useState} from 'react';
import { connect } from 'react-redux';
import { ReactSortable } from "react-sortablejs";
import { Spin } from '@arco-design/web-react';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import diff from 'packages/modo-view/core/src//utils/diff';
import './style/index.less';

class Container extends React.Component {
    constructor(props: any) {
        super(props);
    }
    /* shouldComponentUpdate(nextProps, nextState) {
        let change = false;
        let changeKey;
        for (let key in this.props) {
            if (this.props[key] !== nextProps[key]) {
                change = true;
                changeKey = key;
                console.log(this.props.node.id, change, changeKey, this.props[key], nextProps[key]);
            }
        }
        for (let key in this.state) {
            if (this.state[key] !== nextState[key]) {
                change = true;
                changeKey = key;
            }
        }
        console.log(this.props.node.id, change, changeKey);
        return true;
    } */
    render() {
        if (window.abc) {
            console.log(`render-container-${this.props.nodeKey}`);
        }
        const {
            node,
            nodeKey,
            parentNodeKey,
            viewKey,
            dispatch,
            dispatchEvent,

            cloneWidget,
            setList,

            className,
            canvasClassName,
            loading,
            loadingTip,

            editable,
            inForm,
            titleVisible,
            globalStore,
            $inner,

            ...rest
        } = this.props;

        let list = (
            <>
                {node.children.map((key : string) => {
                    return <Widget
                        key={key}
                        nodeKey={key}
                        parentNodeKey={nodeKey}
                        editable={editable}
                        inForm={inForm}
                        $inner={this.props.$inner}
                        get$this={this.props.get$this}>
                    </Widget>;
                })}
            </>
        );
        if (this.props.editable) {
            list = (
                <ReactSortable
                    className={canvasClassName}
                    list={node.children}
                    setList={setList}
                    animation={150}
                    group={{ name: "cloning-group-name" }}
                    sort={true}
                    clone={cloneWidget}>
                    {list}
                </ReactSortable>
            );
        }

        return (
            <div
                className={className}
                {...rest}>
                {this.props.children}
                {list}
                {loading ? <Spin
                    size={20}
                    tip={loadingTip} /> : null}
            </div>
        )
    }
}
export default connect((state, ownProps) => {
    return {
        node: state.nodes.byId[ownProps.nodeKey]
    }
})(wrapHOC(Container, 'container', true));

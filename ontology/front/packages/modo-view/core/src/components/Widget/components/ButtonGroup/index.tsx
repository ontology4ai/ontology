import React , { useState} from 'react';
import { connect } from 'react-redux';
import { ReactSortable } from "react-sortablejs";
import { Button } from '@arco-design/web-react';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import './style/index.less';

class Container extends React.Component {
    constructor(props: any) {
        super(props);
    }
    render() {
        if (window.abc) {
            console.log(`render-button-group-${this.props.nodeKey}`);
        }
        const {
            nodeKey,
            parentNodeKey,
            nodes,
            dispatch,
            dispatchEvent,

            cloneWidget,
            setList,

            className,
            canvasClassName,

            editable,
            inForm,
            titleVisible,

            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];

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
            <Button.Group
                className={className}
                {...rest}>
                {this.props.children}
                {list}
            </Button.Group>
        )
    }
}

export default connect((state, ownProps) => {
    const { nodes } = state;
    const node = nodes.byId[ownProps.nodeKey];
    return {
        nodes,
        node,
        name: node.name
    }
})(Container, 'container', true);

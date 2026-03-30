import React , { useState} from 'react';
import { ReactSortable } from "react-sortablejs";
import { Spin } from '@arco-design/web-react';
import { IconCut } from 'modo-design/icon';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import utils from '../../utils';
import './style/index.less';

class FLexLayout extends React.Component {
    constructor(props: any) {
        super(props);
    }
    addNode = (flexDirection) => {
        const id = guid();
        const type = 'flexLayout';
        this.props.dispatch({
            type: 'ADDNODE',
            parentNodeKey: this.props.nodeKey,
            node: new utils[type](id, id, 'flex布局', type, {width: flexDirection === 'column' ? '100%' : 'auto', height: 'auto'}, [])
        });
    };
    handleRowCut = () => {
        const { node } = this.props;
        if (node.options.flexDirection === 'row') {
            if (node.children.length === 0) {
                this.addNode();
                this.addNode();
            } else {
                this.addNode();
            }
        } else {
            if (node.children.length === 0) {
                node.options.flexDirection = 'row';
                this.props.dispatch({
                    type: 'SETNODE',
                    nodeKey: node.id,
                    currentNode: node
                });
                this.addNode();
                this.addNode();
            }
        }
    };
    handleColumnCut = () => {
        const { node } = this.props;
        if (node.options.flexDirection === 'column') {
            if (node.children.length === 0) {
                this.addNode('column');
                this.addNode('column');
            } else {
                this.addNode('column');
            }
        } else {
            if (node.children.length === 0) {
                node.options.flexDirection = 'column';
                this.props.dispatch({
                    type: 'SETNODE',
                    nodeKey: node.id,
                    currentNode: node
                });
                this.addNode('column');
                this.addNode('column');
            }
        }
    };
    render() {
        if (window.abc) {
            console.log(`render-flexlayout-${this.props.nodeKey}`);
        }
        const {
            nodeKey,
            parentNodeKey,
            viewKey,
            nodes,
            dispatch,
            dispatchEvent,

            cloneWidget,
            setList,

            className,
            canvasClassName,
            loading,
            loadingTip,
            flexGrow,
            justifyContent,

            editable,
            inForm,
            titleVisible,
            get$this,
            initVars,
            appModels,
            appModelMap,
            appServices,
            appServiceMap,
            globalStore,

            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];

        //    justify-content: flex-end;

        const style = {
            ...this.props.style,
            width: node.options.width,
            height: node.options.height,
            flex: node.options.flex,
            flexGrow: node.options.flexGrow ? 1 : 0,
            flexShrink: node.options.flexGrow ? 1 : 0,
            flexDirection: node.options.flexDirection,
            justifyContent: node.options.justifyContent
        };

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
                    style={style}
                    list={node.children}
                    setList={setList}
                    animation={150}
                    group={{ name: "cloning-group-name" }}
                    sort={true}
                    clone={cloneWidget}>
                    {list}
                </ReactSortable>
            )
        }

        let { height } = style;
        if (this.props.editable) {
            height = style.height.indexOf('px') > -1 ? (14 + Number(style.height.split('px')[0]) + 'px') : style.height;
        }

        return (
            <div
                className={`${className} ${this.props.flexDirection}`}
                {...rest}
                style={{
                    ...style,
                    height
                }}>
                {this.props.children}
                {
                    editable ? (
                        <>
                            {node.options.flexDirection === 'row' || node.children.length === 0 ? <span
                                className="row-cut"
                                onClick={this.handleRowCut}>
                                <IconCut />
                            </span>: null}
                            {node.options.flexDirection === 'column' || node.children.length === 0 ? <span
                                className="column-cut"
                                onClick={this.handleColumnCut}>
                                <IconCut />
                            </span>: null}
                        </>
                    ) : null
                }
                {list}
                {loading ? <Spin
                    size={20}
                    tip={loadingTip} /> : null}
            </div>
        )
    }
}

export default wrapHOC(FLexLayout, 'flexLayout');

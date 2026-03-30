import React , { useState} from 'react';
import { ReactSortable } from "react-sortablejs";
import { Spin } from '@arco-design/web-react';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import TableForm from '@/components/TableForm';
import getOptions from 'packages/modo-view/core/src/utils/getOptions';
import { initStyle, refreshStyle } from 'packages/modo-view/core/src/utils/processStyles';
import './style/index.less';

class ModoTableForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.ref = React.createRef();
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
            console.log(`render-table-form-${this.props.nodeKey}`);
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
            $inner,

            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];

        let list = (
            <>
                {node.children.map((key : string) => {
                    return (
                        <div className="column">
                            <div>{nodes.byId[key].label}</div>
                            <Widget
                                key={key}
                                nodeKey={key}
                                parentNodeKey={nodeKey}
                                editable={editable}
                                inForm={inForm}
                                $inner={this.props.$inner}
                                get$this={this.props.get$this}>
                            </Widget>
                        </div>
                    );
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
        } else {
            return (
                <TableForm
                    ref={this.ref}
                    {...this.props}
                    model={{
                        fields: node.children.filter(id => {
                                // return ['button', 'dropdown'].indexOf(nodes.byId[id].type) < 0;
                                return true
                            }).map(id => {
                                const {
                                    name,
                                    children,
                                    options,
                                    ...fieldNode
                                } = nodes.byId[id];
                                const currentOptions = getOptions(options, this.props.get$this(), this.props.$inner);
                                const items = currentOptions.options;
                                if (items && currentOptions.props) {
                                    currentOptions.options = items.map(item => {
                                        for (let key in currentOptions.props) {
                                            item[key] = currentOptions.props[key] ? item[currentOptions.props[key]] : key
                                        }
                                        return item;
                                    });
                                }
                                if (currentOptions.eventMap) {
                                    for (let eventKey in currentOptions.eventMap) {
                                        const { callback } = currentOptions.eventMap[eventKey];
                                        if (callback) {
                                            currentOptions[eventKey] = (...args) => {
                                                execMethod({
                                                    $this: this.props.get$this(),
                                                    ...this.props.$inner
                                                }, callback, ...args);
                                            }
                                        }
                                    }
                                }
                                const fieldNodeKey = nodeKey + name;
                                currentOptions.className = currentOptions.className + ' editor-' + fieldNodeKey;
                                initStyle({options: currentOptions}, fieldNodeKey);

                                return {
                                    name: name,
                                    options: currentOptions,
                                    ...fieldNode
                                };
                            })
                        }}
                    />
            )
        }

        return (
            <div
                className={className + ' modo-table-form-editable'}
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

export default wrapHOC(ModoTableForm, 'table-form');

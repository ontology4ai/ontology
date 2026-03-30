import React , { Component, useState, useRef} from 'react';
import { ReactSortable } from "react-sortablejs";
import { Tabs, Button, Spin } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconArrowRise, IconArrowFall } from '@arco-design/web-react/icon';
import wrapHOC from '../../hoc/wrap';
import Widget from "../../";
import TabsForm from "@/components/ModoTabsForm";
import getOptions from 'packages/modo-view/core/src/utils/getOptions';
import { initStyle, refreshStyle } from 'packages/modo-view/core/src/utils/processStyles';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import './style/index.less';

const { TabPane } = Tabs;

class ModoTabsForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            active: 0
        }
    }
    render() {
        if (window.abc) {
            console.log(`render-tabsform-${this.props.nodeKey}`);
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

        if (!this.props.editable) {
            return (
                <TabsForm
                    {...this.props}
                    fields={node.children.filter(id => {
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
                    })}
                    />
            )
        }

         let list = (
            <>
                {node.children.map((key : string, index: number) => {
                    return (
                        <li
                            style={{
                                display: this.state.active === index ? 'block' : 'none'
                            }}>
                            <Widget
                                key={key}
                                nodeKey={key}
                                parentNodeKey={nodeKey}
                                editable={editable}
                                inForm={inForm}
                                $inner={this.props.$inner}
                                get$this={this.props.get$this}>
                            </Widget>
                        </li>
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
        }

        return (
            <div
                className={className + ' modo-tabs-form-editable'}
                {...rest}>
                {this.props.children}
                <div
                    className="header">
                    <ul>
                        <ReactSortable
                        className={canvasClassName}
                        list={node.children}
                        setList={setList}
                        animation={150}
                        group={{ name: "cloning-group-name" }}
                        sort={true}
                        clone={cloneWidget}>
                        {node.children.map((key : string, index: number) => {
                            return (
                                <li
                                    className={this.state.active === index ? 'active' : ''}
                                    onClick={() => { this.setState({
                                        active: index
                                    })}}>
                                    {nodes.byId[key].label}
                                </li>
                            )
                        })}
                        </ReactSortable>
                    </ul>
                </div>
                <div className="list">
                    <ul>
                        {list}
                    </ul>
                </div>
            </div>
        )
    }
}

export default wrapHOC(ModoTabsForm, 'modoTabsForm');

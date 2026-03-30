import React from 'react';
import { connect } from 'react-redux';
import { ReactSortable } from "react-sortablejs";
import wrapHOC from '../../hoc/wrap';
import { Form, Button, Message, Input, Spin } from "@arco-design/web-react";
import FilterForm from '@/components/FilterForm';
import Widget from "../../";
import types from './types';
import getOptions from 'packages/modo-view/core/src/utils/getOptions';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import { initStyle, refreshStyle } from 'packages/modo-view/core/src/utils/processStyles';
import './style/index.less';

const { Item } = Form;

class ModoForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            options: {
                // layout: this.props.type,
                // labelAlign: this.props.labelPosition.state
            }
        };
        this.values = {};
        this.formRef = React.createRef();
        this.testRef = React.createRef();
    }
    getFieldsValue = () => {
        const form = this.formRef.current;
        return form.getFieldsValue()
    };
    getFiltersValue = () => {
        const {
            nodeKey,
            nodes
        } = this.props;

        const node = nodes.byId[nodeKey];
        const typeMap = {};
        node.children.forEach(id => {
            id = id.toString();
            const item = nodes.byId[id];
            typeMap[item.name] = item.type;
        });

        const form = this.formRef.current;
        let values = form.getFieldsValue();
        values = JSON.parse(JSON.stringify(values));
        delete values.$group;
        const currentValues = {};

        for (let key in values) {
            if (values[key] !== undefined) {
                if (typeMap[key] === 'input') {
                    currentValues[key] = `~%${values[key]}%`;
                } else if (typeMap[key] === 'rangePicker') {
                    if (values[key][0]) {
                        currentValues[`${key}.gte`] = values[key][0];
                    }
                    if (values[key][1]) {
                        currentValues[`${key}.lte`] = values[key][1];
                    }
                }else {
                    currentValues[key] = values[key];
                }
            }
        }
        return currentValues;
    };
    getReportFiltersValue = () => {
        const form = this.formRef.current;
        if (this.props.layout === 'inline' && !this.props.editable) {
             let values = form.getReportFiltersValue();
             return {
                 ...values
             }
        }
        let values = form.getFieldsValue();
        const groupPieces = [];
        for (let key in values.$group) {
            if (values.$group[key]) {
                groupPieces.push(key);
            }
        }
        return {
            ...this.getFiltersValue(),
            groupPiece: groupPieces.join(',')
        };
    };
    async validate (callback) {
        const form = this.formRef.current;
        const tableFormNodes = [];
        let valid = true;
        for (let key of this.props.node.children) {
            const child = this.props.nodes.byId[key];
            if (child.type === 'tableForm') {
                tableFormNodes.push(child);
            }
        }
        for (let node of tableFormNodes) {
            if (!await this.props.get$this().$refs[node.name].ref.current.validate()) {
                valid = false;
            }
        }
        try {
            form.validate(function(errors) {
                errors ? callback(false) : callback(true && valid);
            });
        } catch(e) {
            console.log(e);
        }
    }
    setRef = (name) => {
        this.props.dispatch({
            type: 'SETREF',
            name: name,
            ref: this
        });
    };
    deleteRef = (name) => {
        this.props.dispatch({
            type: 'DELETEREF',
            name: name
        });
    };
    componentWillUpdate(nextProps) {
    }
    componentDidUpdate(prevProps, prevState) {
        const prevName = prevProps.name;
        const name = this.props.name;
        if (prevName !== name) {
            this.deleteRef(prevName);
            this.setRef(name);
        }
        if (this.formRef.current) {
            if (JSON.stringify(this.props.values) !== JSON.stringify(this.values)) {
                this.formRef.current.setFieldsValue({
                    ...this.formRef.current.getFieldsValue(),
                    ...this.props.values,
                });
                this.values = this.props.values;
            }
        }
    }
    handleValuesChange = (changeValues, values) => {
        let name =  this.props.node.options.valuesBindVar;
        if (JSON.stringify(values) !== JSON.stringify(this.values)) {
            this.values = values;
            this.props.onValuesChange && this.props.onValuesChange(changeValues, values);
        }
        if (name) {
            const prevValues = this.props.get$this()[name];
            name = name.split('.')[1];
            const uName = name.substring(0, 1).toLocaleUpperCase() + name.substring(1);
            if (this.props.values) {
                if (!_.isEqual(this.props.values, values)) {
                    this.props.get$this()[`set${uName}`]({
                        ...prevValues,
                        ...this.props.values,
                        ...values
                    });
                }
            }
        }
    };
    componentDidMount() {
        this.setRef(this.props.name);
        this.formRef.current.setFieldsValue({
            ...this.formRef.current.getFieldsValue(),
            ...this.props.values
        });
    }
    componentWillUnmount() {
        this.deleteRef(this.props.name)
    }
    render() {
        if (window.abc) {
            console.log(`render-form-${this.props.nodeKey}`);
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
            modelName,
            titleVisible,
            get$this,
            initVars,
            appModels,
            appModelMap,
            appServices,
            appServiceMap,
            globalStore,
            valuesBindVar,

            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];



        if(this.props.layout === 'inline' && !this.props.editable) {
            return (
                <FilterForm
                    className={'editor-' + nodeKey}
                    {...rest}
                    ref={this.formRef}
                    initialValues={rest.initialValues}
                    labelCol={{
                        flex: node.options.labelFlex || '84px'
                    }}
                    min={rest.min}
                    fields={node.children.filter(id => {
                        // return ['button', 'dropdown'].indexOf(nodes.byId[id].type) < 0;
                        return true
                    }).map(id => {
                        const {
                            name,
                            children,
                            ...nodeOptions
                        } = nodes.byId[id];

                        const currentNodeOptions = getOptions(nodeOptions, this.props.get$this(), this.props.$inner);

                        const {
                            options: currentOptions,
                            ...fieldNode
                        } = currentNodeOptions;

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
                        if (fieldNode.type === 'tabsForm') {
                            currentOptions.fields= children.filter(id => {
                                // return ['button', 'dropdown'].indexOf(nodes.byId[id].type) < 0;
                                return true
                            }).map(id => {
                                const {
                                    name,
                                    children,
                                    ...nodeOptions
                                } = nodes.byId[id];

                                const currentNodeOptions = getOptions(nodeOptions, this.props.get$this(), this.props.$inner);

                                const {
                                    options: currentOptions,
                                    ...fieldNode
                                } = currentNodeOptions;

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
                        }

                        return {
                            field: name,
                            options: currentOptions,
                            span: currentOptions.span,
                            labelCol: {
                                flex: currentOptions.labelFlex
                            },
                            noStyle: currentOptions.noStyle,
                            noLabel: currentOptions.noLabel,
                            children,
                            ...fieldNode
                        };
                    })}
                    onValuesChange={this.handleValuesChange}
                    search={values => {
                        if (typeof this.props.search !== 'function') {
                            const relaStores = this.props.stores.filter(store => {
                                return store.filterFormId === node.id
                            });
                            relaStores.forEach(store => {
                                this.props.get$this().datasourceMap[store.name](values);
                            })
                        } else {
                            this.props.search(values);
                        }
                    }}>
                </FilterForm>
            )
        }

        let list = (
            <>
                {node.children.map((key: any) => {
                    return (
                        <Widget
                            key={key}
                            nodeKey={key}
                            parentNodeKey={nodeKey}
                            editable={editable}
                            inForm={true}
                            $inner={this.props.$inner}
                            style={{
                                gridArea: 'span 6 / span 24'
                            }}
                            get$this={this.props.get$this}/>
                    )
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
            <Form
                ref={this.formRef}
                className={className}
                {...this.state.options}
                {...rest}
                labelCol={{
                    flex: node.options.labelFlex || '100px'
                }}
                wrapperCol={{
                    flex: 1
                }}
                onChange={(value, values) => {this.props.onChange && this.props.onChange(value, values)}}
                onValuesChange={this.handleValuesChange}>
                {this.props.children}
                {list}
                {loading ? <Spin
                    size={20}
                    tip={loadingTip} /> : null}
            </Form>
        )
    }
}

export default wrapHOC(ModoForm, 'form');

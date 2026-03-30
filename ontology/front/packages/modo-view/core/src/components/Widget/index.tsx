import React, { lazy, useState, useEffect, useMemo, Suspense } from 'react';
import { ReactSortable } from "react-sortablejs";
import { connect } from 'react-redux';
import { Skeleton, Spin, Tooltip, Notification, Modal, Drawer, Pagination, Popconfirm, Form, Input, Upload } from "@arco-design/web-react";
import { IconDelete, IconCopy, IconAdd } from "modo-design/icon";
import { widgetMap } from './component';
import singleTypes from '../../utils/singleTypes';
import noChildTypes from '../../utils/noChildTypes';
import getProps from '../../utils/getProps';
import getFormItemProps from '../../utils/getFormItemProps';
import getChildren from '../../utils/getChildren';
import layoutTypes from './layoutTypes';
import loadingTypes from '../../utils/loadingTypes';
import formItemTypes from './components/Form/types';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import Renderer from 'packages/modo-view/renderer';
import { getApp, getView } from 'packages/modo-view/designer/src/api';
import getViewChildren from 'packages/modo-view/core/src/utils/getViewChildren';
import { createTemplate } from './api';
import getVal from '../../utils/getVal';
import diff from '../../utils/diff';
import getBindVars from 'packages/modo-view/core/src/utils/getBindVars';
import './style/index.less';
require('static/guid');

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
class Item extends React.Component {
    event: any;
    constructor(props: any) {
        super(props);

        const {
            nodeKey,
            viewKey,
            nodes,
            dispatch
        } = this.props;

        this.state = {
            widgetKey: (nodeKey === '0' || nodeKey === 0) ? this.props.view.name : nodeKey,
            hasError: false,
            actionVisible: false,
            actionViewName: null,
            actionViewTitle: '',
            actionViewParams: {},
            actionOptions: {},
            templateModalVisible: false
        };
        this.templateFormRef = React.createRef();
        this.event = {};

        if (this.props.editable) {
            this.event = {
                onMouseLeave(e)  {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();

                    dispatch({
                        type: 'SETUNHIGHLIGHTNODEKEY',
                        nodeKey
                    });
                },
                onMouseOver(e)  {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    dispatch({
                        type: 'SETHIGHLIGHTNODEKEY',
                        nodeKey
                    });
                },
                onClick: e => {
                    // e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    dispatch({
                        type: 'SETACTIVENODEKEY',
                        nodeKey
                    });
                    dispatch({
                        type: 'SETACTIVEINFORM',
                        value: typeof this.props.inForm  === 'boolean' ? this.props.inForm : false
                    });
                }
            }
        }
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    execExp = expression => {
        return execExp({
            $this: this.props.get$this(),
            ...this.props.$inner
        }, expression)
    };
    execMethod = (callback, ...args) => {
        execMethod({
            $this: this.props.get$this(),
            ...this.props.$inner
        }, callback, ...args.slice(0))
    };
    componentDidCatch(error, errorInfo) {
        console.log(error, errorInfo);
    }
    cloneWidget(item) {
        const id = guid();
        return {
            id,
            children: [],
            options: {},
            // className: '',
            ...item
        };
    }
    setCss(style, css) {
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.textContent = css;
        }
    }
    refreshStyle(styleDom) {
        const widget = this.getNode();
        const nodeKey = this.state.widgetKey;
        const css = widget.options.css || '';
        const style = styleDom || document.querySelector(`#_style_${nodeKey}`);
        const cssText = css.replace(/:root/g, `.editor-${nodeKey}`).replace(/\\n/g, '\n');
        this.setCss(style, cssText);
    }
    initStyle() {
        const nodeKey = this.state.widgetKey;
        if (!document.querySelector(`#_style_${nodeKey}`)) {
            const style = document.createElement('style');
            style.setAttribute('id', `_style_${nodeKey}`);
            document.body.appendChild(style);
        }
        this.refreshStyle();
    }
    onChange = (value, e) => {
        this.props.onChange && this.props.onChange(value, e);
    };
    getNode = () => {
        const {
            parentNodeKey,
            nodes,
            nodeKey
        } = this.props;

        return nodes.byId[nodeKey];
    };
    handleEvent = (...args) => {
        const { nodes, nodeKey } = this.props;
        const type = args[0];
        const action = nodes.byId[nodeKey].options.eventMap[type];
        this.props.dispatchEvent(action, ...args.slice(1));
    };
    parseValue = (value) => {
        if (typeof value === 'object' && value && !Array.isArray(value)) {
            return this.getObj(value);
        }
        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object' && item && !Array.isArray(item)) {
                    return this.getObj(item);
                }
                return item;
            });
        }
        return value;
    };
    getObj = (obj) => {
        const currentObj = {};
        for (let attr in obj) {
            let bindAttr = `${attr}BindVar`;
            let currentAttr = `${attr}`;
            if (currentAttr.indexOf('BindVar') > -1 && Object.keys(obj).indexOf(currentAttr.split('BindVar')[0]) < 0) {
                bindAttr = currentAttr;
                currentAttr = currentAttr.split('BindVar')[0];

            }
            if (Object.keys(obj).indexOf(bindAttr) > -1) {
                if (typeof obj[bindAttr] === 'string' && obj[bindAttr]) {
                    try {
                        currentObj[currentAttr] = this.execExp(obj[bindAttr]);
                    } catch(e) {
                        console.warn(e);
                        currentObj[currentAttr] = this.parseValue(obj[currentAttr]);
                    }
                } else {
                    currentObj[currentAttr] = this.parseValue(obj[currentAttr]);
                }
            } else {
                if (['viewActions', 'actions'].indexOf(currentAttr) > -1) {
                    currentObj[currentAttr] = obj[currentAttr];
                } else {
                    currentObj[currentAttr] = this.parseValue(obj[currentAttr]);
                }
            }
        }
        return currentObj;
    };
    getEvent = (eventMap) => {
        const event = {};
        const widget = this;
        for (let type in eventMap) {
            let obj = event;
            let currentType = type;
            if (type.indexOf('-') > -1) {
                const types = type.split('-');
                if (!event[types[0]]) {
                    event[types[0]] = {};
                }
                obj = event[types[0]];
                currentType = types[1];
            }
            if (currentType === 'onClick') {
                obj[currentType] = ((eventType) => {
                    return (...args) => {
                        this.event.onClick && this.event.onClick(...args);
                        this.handleEvent(type, ...args);
                    };
                })(currentType);
            } else if (currentType === 'onChange') {
                obj[currentType] = ((eventType) => {
                    return (...args) => {
                        this.props.onChange && this.props.onChange(...args);
                        this.handleEvent(type, ...args);
                    };
                })(currentType);
            } else {
                obj[currentType] = ((eventType) => {
                    return (...args) => {
                        this.handleEvent(type, ...args)
                    }
                })(currentType);
            }
        }
        return event
    };
    getRest = (rest) => {
        return this.getObj(rest);
    };
    getClassName = (className, node, nodeKey, highlightNodeKey, activeNodeKey) => {
        let classNameArr = [
            'modo-widget',
            `editor-${this.state.widgetKey}`,
        ];
        if (className) {
            classNameArr.push(className);
        }
        if (this.props.editable) {
            if (layoutTypes.indexOf(node.type) > -1) {
                const realClassName = `modo-widget-editor`;
                classNameArr.push(realClassName);
            }

            if (highlightNodeKey !== null && highlightNodeKey.toString() === nodeKey.toString()) {
                classNameArr.push('highlight');
            }
            if (activeNodeKey !== null && activeNodeKey.toString() === nodeKey.toString()) {
                classNameArr.push('active');
            }
        }
        if (loadingTypes.indexOf(node.type) > -1) {
            classNameArr.push('modo-widget-loading');
        }
        const currentClassName = classNameArr.join(' ');

        return currentClassName;
    };
    handleDeleteNode = () => {
        const {
            nodes,
            nodeKey,
            parentNodeKey
        } = this.props;
        const node = nodes.byId[nodeKey];
        this.props.dispatch({
            type: 'DELETENODE',
            parentNodeKey,
            node
        });
        setTimeout(() => {
            this.props.dispatch({
                type: 'SETACTIVENODEKEY',
                nodeKey: '0'
            })
        });
    };
    handleFormatNode = node => {
        const id = guid();
        node.id = id;
        node.name = id;
        if (Array.isArray(node.children)) {
            node.children = node.children.map(childId => {
                return this.handleFormatNode(JSON.parse(JSON.stringify(this.props.nodes.byId[childId])));
            });
        }
        return node;
    };
    handleCopyNode = () => {
        const node = this.handleFormatNode(JSON.parse(JSON.stringify(this.props.node)));
        if (this.props.parentNodeKey) {
            this.props.dispatch({
                type: 'ADDNODE',
                node,
                parentNodeKey: this.props.parentNodeKey
            });
        }
    };
    openTemplateModal = () => {
        this.setState({
            templateModalVisible: true
        });
        if (this.templateFormRef.current) {
            this.templateFormRef.current.resetFields();
        }
    };
    handleTemplateSuccessNotify = () => {
        Notification.success({
            title: '成功',
            content: '创建模板成功!',
        })
    };
    handleTemplateFailNotify = () => {
        Notification.error({
            title: '失败',
            content: '创建模板失败!',
        })
    };
    handleCreateTemplate = (template) => {
        delete template.image;
        createTemplate({
            createDt: null,
            createUser: null,
            descr: null,
            id: null,
            inputVars: null,
            label: null,
            lastupd: null,
            name: null,
            parameters: JSON.stringify(this.handleFormatNode(JSON.parse(JSON.stringify(this.props.node)))),
            state: "1",
            updateUser: null,
            version: 0,
            viewPlugins: null,
            imagePath: null,
            ...template
        }).then(res => {
            if (res.data.success) {
                const {
                    templates
                } = this.props.app;
                templates.push(res.data.data);
                this.props.dispatch({
                    type: 'SETTEMPLATES',
                    data: templates
                });
                this.handleTemplateSuccessNotify();
            } else {
                this.handleTemplateFailNotify();
            }
        }).catch(e => {
            this.handleTemplateFailNotify();
        })
    };
    componentDidMount() {
        if (this.props.editable) {
            this.initStyle();
        }
    }
    componentWillUnmount() {
        /* const nodeKey = this.state.widgetKey;
        const style = document.querySelector(`#_style_${nodeKey}`);
        if (style) {
            style.remove();
        } */
    }
    componentWillUpdate() {
        if (this.props.editable) {
            this.refreshStyle();
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (window.abc) {
            console.log(`render-widget${this.props.node.id}`);
        }
        if (formItemTypes.indexOf(this.props.node.type) > -1) {
            return true
        }
        if (this.props.editable) {
            return true;
        } else {
            // return true;
            return diff(this, nextProps, nextState, 'widget');
        }
    }
    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        const {
            parentNodeKey,
            nodes,
            nodeKey,
            highlightNodeKey,
            activeNodeKey,
            isHighlight,
            isActive,

            style,
            onChange,
            ...nodeProps
        } = this.props;
        const node = nodes.byId[nodeKey];

        const { type } = node;

        let Component = widgetMap[type];

        if (this.props.inForm && formItemTypes.indexOf(type) > -1) {
            Component = widgetMap['formItem'];
        }

        if(type === 'icon' && Component) {
            Component = Component[node.options.icon];
        }

        if (!Component) {
            return <div>未成功渲染----{node.label}----{node.type}</div>
        }

        const props = getProps(node);

        const {
            flexDirection,
            helpMessage,
            showPassword,
            eyeHidden,
            clearable,
            buttonType,
            showIcon,
            labelFlex,

            successActions,
            fragmentRef,

            showTooltip,
            // tooltip,
            // tooltipBindVar,

            inForm,
            css,

            appModels,
            appModelMap,
            appServices,
            appServiceMap,

            eventMap,

            ...rest
        } = props;

        let widgetVisual;
        let widgetTitle;
        let widgetOperGroup;
        let hasChild = false;
        let children;

        if (this.props.editable) {
            widgetTitle = <div
                className="modo-widget-editor-title">
                {node.label}
            </div>;
            widgetOperGroup = <div
                className="modo-widget-editor-oper-group">
                <IconAdd onClick={this.openTemplateModal}/>
                <IconCopy
                    onClick={this.handleCopyNode}/>
                <IconDelete
                    onClick={this.handleDeleteNode}/>
            </div>
        }

        if (singleTypes.indexOf(node.type) < 0) {
            children = getChildren({
                $this: this.props.get$this(),
                ...this.props.$inner
            }, node);
            if (children) {
                hasChild = true;
            }
        }

        const event = this.getEvent(eventMap);

        let realRest = this.getRest(rest);

        let nodeLabel = this.getRest({
            label: node.label,
            labelBindVar: node.labelBindVar
        });

        for (let key in event) {
            if (realRest[key]) {
                realRest[key] = {
                    ...realRest[key],
                    ...event[key]
                }
            } else {
                realRest[key] = event[key]
            }
        }

        let {
            isLoading,
            loading,
            loadingBindVar,
            loadingText,
            loadingTextBindVar,
            tooltip,
            tooltipBindVar,
            isSkeleton,
            skeletonLoading,
            skeletonLoadingBindVar,
            skeletonWidth,
            hidden,
            hiddenBindVar,
            loop,
            className,
            classNameBindVar,
            ...currentRest
        } = realRest;

        if (loadingTypes.indexOf(node.type) > -1 ) {
            currentRest.loading = loading;
        }
        currentRest.$inner= this.props.$inner;

        if (['table', 'dropdown', 'tree', 'treeChart'].indexOf(node.type) > -1) {
            currentRest.dispatchEvent = this.props.dispatchEvent;
        }

        const currentClassName = this.getClassName(className, node, nodeKey, highlightNodeKey, activeNodeKey);

        if (!hasChild) {
            children = null;
        }

        if (hasChild && isSkeleton && skeletonLoading) {
            children = (
                <Skeleton
                    animation
                    loading={true}
                    text={{
                        rows: 1,
                        width: skeletonWidth
                    }}>
                    {hasChild && children}
                </Skeleton>
            )
        }

        const types = ['text'];
        const blockTypes = ['progress', 'table', 'treeChart', 'iframe', 'alert', 'carousel'];

        if (node.type === 'view') {
            currentRest.setParentChild = this.props.setParentChild;
            currentRest.deleteParentChild = this.props.deleteParentChild;
            currentRest.renderKey = this.props.renderKey;
            currentRest.viewKey = this.props.viewKey;
        }
        currentRest.get$this = this.props.get$this;
        currentRest.widgetLabel = nodeLabel.label;

        const triggerPropNameMap = {
            switch: 'checked',
            upload: 'fileList'
        };
        let valueObj = {};
        if (formItemTypes.indexOf(type) > -1 && triggerPropNameMap[type]) {
            const valueName = triggerPropNameMap[type];
            valueObj[valueName] = this.props[valueName];
        }

        if (singleTypes.indexOf(node.type) > -1 && !this.props.inForm) {
            const {
                $inner,
                groupChecked,
                isGroup,
                nodeKey,
                ...componentRest
            } = currentRest;

            widgetVisual = <span
                style={{
                    position: 'relative',
                    display: hidden && !this.props.editable ? 'none' : (blockTypes.indexOf(node.type) > -1 ? 'block' : (formItemTypes.indexOf(node.type) > -1 ? 'block' : 'inline-block')),
                    ...currentRest.style
                }}>
                {isActive && widgetOperGroup}
                <Component
                    className={currentClassName}
                    onChange={onChange}
                    nodeKey={node.id}
                    editable={types.indexOf(node.type) < 0 && this.props.editable}
                    {...this.event}
                    {...componentRest}
                    value={getVal(this.props.value, componentRest.value)}
                    {...valueObj}/>
            </span>;
        } else if (noChildTypes.indexOf(node.type) > -1 && !this.props.inForm) {
            const {
                $inner,
                isGroup,
                nodeKey,
                ...componentRest
            } = currentRest;
            widgetVisual = (
                <span
                    style={{
                        position: 'relative',
                        display: hidden && !this.props.editable ? 'none' : (blockTypes.indexOf(node.type) > -1 ? 'block' : (formItemTypes.indexOf(node.type) > -1 ? 'block' : 'inline-block')),
                        ...currentRest.style
                    }}>
                    {isActive && widgetOperGroup}
                    <Component
                        className={currentClassName}
                        onChange={onChange}
                        name={node.name}
                        nodeKey={node.id}
                        editable={types.indexOf(node.type) < 0 && this.props.editable}
                        {...this.event}
                        {...componentRest}
                        value={getVal(this.props.value, componentRest.value)}
                        {...valueObj}>
                        {children}
                    </Component>
                </span>
            );
        } else {
            widgetVisual = (
                <Component
                    className={currentClassName}
                    nodeKey={node.id}
                    parentNodeKey={parentNodeKey}
                    editable={this.props.editable}
                    inForm={this.props.inForm}
                    style={{
                        display: hidden && !this.props.editable ? 'none' : null
                    }}
                    onChange={onChange}
                    {...this.event}
                    {...currentRest}
                    value={getVal(this.props.value, currentRest.value)}>
                    {widgetTitle}
                    {isActive && widgetOperGroup}
                    {children}
                </Component>
            );
        }

        if (showTooltip && tooltip && widgetVisual) {
            widgetVisual = (
                <Tooltip
                    content={tooltip || '无'}
                    disabled={!showTooltip || !tooltip}>
                    {widgetVisual}
                </Tooltip>
            )
        }

        const env = process.env.NODE_ENV;
        const rootPath = env === 'production' ? '' : '/__modo';

        if (!this.props.editable && node.options.initRenderCondiBindVar && !realRest.initRenderCondi) {
            widgetVisual = <span></span>;
        }
        return (
            <>
                {widgetVisual}
                <Modal
                    title="创建模板"
                    visible={this.state.templateModalVisible}
                    onOk={() => {
                        this.templateFormRef.current.validate().then(() => {
                            this.handleCreateTemplate(this.templateFormRef.current.getFieldsValue());
                            this.setState({
                                templateModalVisible: false
                            });
                        }).catch(() => {

                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            templateModalVisible: false
                        });
                    }}
                    autoFocus={false}
                    focusLock={true}>
                    <Form
                        ref={this.templateFormRef}
                        labelCol={{
                            flex: '80px'
                        }}
                        wrapperCol={{
                            flex: 1
                        }}>
                        <Form.Item
                            label="英文名"
                            field="name"
                            rules={[{ required: true }]}>
                            <Input placeholder="请输入英文名" />
                        </Form.Item>
                        <Form.Item
                            label="中文名"
                            field="label"
                            rules={[{ required: true }]}>
                            <Input placeholder="请输入中文名" />
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="descr">
                            <Input.TextArea placeholder="请输入描述" />
                        </Form.Item>
                        <Form.Item
                            label="上传图片"
                            field="image"
                            rules={[{ required: true }]}>
                            <Upload
                                action={ rootPath + "/_api/minio/singleFileUpload" }
                                headers={{
                                    'X-Modo-Bucket': this.props.app.name
                                }}
                                onChange={(files, file) => {
                                    if (file.status === 'done') {
                                        this.templateFormRef.current.setFieldValue('imagePath', file.response.data);
                                    }
                                }}/>
                        </Form.Item>
                        <Form.Item
                            label="图片地址"
                            field="imagePath"
                            rules={[{ required: true }]}>
                            <Input/>
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        );
    }
}

const WidgetItem = connect((state, ownProps) => {
    const {
        highlightNodeKey,
        activeNodeKey
    } = state;
    const {
        nodeKey
    } = ownProps;

    return {
        lang: state.lang,
        appLang: state.appLang,
        app: state.app,
        view: state.view,
        nodes: state.nodes,
        renderKey: ownProps.renderKey,
        viewKey: state.viewKey,
        highlightNodeKey,
        activeNodeKey,
        initVars: state.store.initVars,
        isActive: activeNodeKey !== null && activeNodeKey.toString() === nodeKey.toString(),
        isHighlight: highlightNodeKey !== null && highlightNodeKey.toString() === nodeKey.toString(),
        stores: state.view.modoStoreList,
        renderer: getRenderer(state, ownProps)
    }
}, null, null, {forwardRef: true})(Item);



class Widget extends React.Component {
    event: any;
    constructor(props: any) {
        super(props);
        const {
            loop
        } = props.node.options;
        this.state = {
            getData: false,
            hasError: false,
            loopData: null,
            loading: false,
            pagination: {
                total: 0,
                data: [],
                current: 1,
                pageSize: loop && loop.pagination ? loop.pagination.pageSize : 20
            },
            actionOptions: {}
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.log(error, errorInfo);
    }
    getLoopData = () => {
        const {
            loop
        } = this.props.node.options;
        if (!loop || !(loop.data || loop.dataBindVar)) {
            if (!this.state.getData) {
                this.setState({
                    getData: true
                });
            }
            return;
        }

        let loopData = loop.data;
        try {
            loopData = execExp({
                ...this.props.$inner,
                $this: this.props.get$this()
            }, loop.dataBindVar);
            if (!loopData) {
                if (!loop.pagination.show) {
                    loopData = [];
                } else {
                    loopData = {
                        pageable: {
                            pageNumber: 0,
                            pageSize: loop ? loop.pagination.pageSize : 20
                        },
                        totalElements: 0,
                        content: []
                    };
                }
            }
        } catch(e) {
            console.log(e);
        }
        if (!_.isEqual(loopData, this.state.loopData)) {
            this.setState({
                loopData
            });
            if (loop.pagination.show && loopData) {
                this.setState({
                    pagination: {
                        total: loopData.totalElements,
                        data: loopData.content,
                        current: loopData.pageable.pageNumber + 1,
                        pageSize: loopData.pageable.pageSize
                    }
                });
            }
        }
        if (!this.state.getData) {
            this.setState({
                getData: true
            });
        }
    };
    getLoading = () => {
        const {
            loop
        } = this.props.node.options;
        if (!loop || !loop.isLoading) {
            return;
        }
        if (loop.loadingBindVar) {
            return execExp({
                ...this.props.$inner,
                $this: this.props.get$this()
            }, loop.loadingBindVar)
        } else {
            return loop.loading;
        }
    };
    handlePageChange = (pageNumber, pageSize) => {
        this.handleAction(this.props.node.options.loop.event, pageNumber, pageSize);
    };
    execExp = expression => {
        return execExp({
            $this: this.props.get$this(),
            ...this.props.$inner
        }, expression)
    };
    execMethod = (callback, ...args) => {
        execMethod({
            $this: this.props.get$this(),
            ...this.props.$inner
        }, callback, ...args.slice(0))
    };
    isNull = (val) => {
        return val === null || val === undefined;
    };
    handleExpTabViewAction = (viewAction, title, params) => {
        this.setState({
            actionVisible: true,
            actionOptions: {
                ...viewAction,
                title,
                params
            }
        })
    };
    handleTabViewAction = (viewAction, title, params, tabKey) => {
        this.props.get$this().$refs[viewAction.tabNodeName].addTab(tabKey, title, viewAction.tabIcon, viewAction.viewName, params)
    };
    handleViewAction = (viewAction) => {
        let callBefore = false;
        if (viewAction.before && viewAction.before.toString().replace(/\s/g, '').split('{')[1].split('}')[0].length !== 0) {
            callBefore = true;
        }
        let title = viewAction.title;
        if (viewAction.titleBindVar) {
            const currentTitle = this.execExp(viewAction.titleBindVar);
            title = !this.isNull(currentTitle) ? currentTitle : title;
        }
        if (viewAction.showType !== 'tab') {
            const params = this.execExp(viewAction.params);
            if (callBefore) {
                this.execMethod(viewAction.before, (bParams) => {
                    this.handleExpTabViewAction(viewAction, title, bParams || params);
                }, params)
            } else {
                this.handleExpTabViewAction(viewAction, title, params);
            }
        } else {
            let tabKey = viewAction.tabKey || guid();
            const currentTabKey = this.execExp(viewAction.tabKeyBindVar);
            tabKey = !this.isNull(currentTabKey) ? tabKey : tabKey;
            const params = this.execExp(viewAction.params);
            if (callBefore) {
                this.execMethod(viewAction.before, (bParams) => {
                    this.handleTabViewAction(viewAction, title, bParams || params, tabKey);
                }, params)
            } else {
                this.handleTabViewAction(viewAction, title, params, tabKey);
            }
        }
    };
    handleAction = (action, ...args) => {
        if (this.props.editable) {
            return;
        }
        const { nodes, nodeKey } = this.props;
        const $this = this.props.get$this();
        if (action.callback) {
            try {
                this.execMethod(action.callback, ...args.slice(0));
            } catch(e) {
                console.warn(e);
            }
        }
        const actionType = action.builtIn.type;
        if (actionType === 'url') {
            const { urlAction } = action.builtIn;
            if (urlAction.url) {
                if (urlAction.blank) {
                    window.open(urlAction.url)
                } else {
                    window.location.href = urlAction.url;
                }
            }
        } else if (actionType === 'view') {
            const { viewActions } = action.builtIn;
            const currentViewAction = viewActions.find(viewAction => {
                return this.execExp(viewAction.condition);
            });
            if (currentViewAction) {
                this.handleViewAction(currentViewAction);
            }
        } else {
        }
    };
    componentDidUpdate(prevProps, prevState) {
        this.getLoopData();
    }
    componentDidMount() {
        this.getLoopData();
        //this.xxx = guid();
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (window.abc) {
            console.log(`render-widget-container--loop--${this.props.node.id}`);
        }
        if (formItemTypes.indexOf(this.props.node.type) > -1) {
            return true
        }
        if (this.props.editable) {
            return true;
        } else {
            // return true;
            return diff(this, nextProps, nextState, 'widget-loop');
        }
    }
    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        /* if (this.props.node.id === 'e400c4c56a1abe91') {
            console.log(`render${this.props.node.id}`, this.xxx);
        } */
        const {
            node,
            editable,
            $inner
        } = this.props;

        const {
            loop,
        } = node.options;

        const {
            loopData,
            pagination
        } = this.state;

        const loading = this.getLoading();

        if (!this.state.getData) {
            return <span></span>
        }
        return (
            <>
                <>
                    { (editable || !loopData) && <WidgetItem
                        dispatchEvent={this.handleAction}
                        {...this.props}/>}
                    { !editable && loopData && loop.pagination.show && Array.isArray(loopData.content) && (
                        <div className="modo-widget-loop">
                            <div className="content">
                            {loopData.content.map((item, index) => {
                                let inner = {};
                                inner[`$${loop.item}`] = item;
                                inner[`$${loop.index}`] = index;
                                return (
                                    <WidgetItem
                                        key={index}
                                        {...this.props}
                                        dispatchEvent={this.handleAction}
                                        $inner={{
                                            ...$inner,
                                            ...inner
                                        }}/>
                                );
                            })}
                            </div>
                            <div className="pagination-container">
                                <Pagination
                                    simple
                                    showTotal
                                    showJumper
                                    sizeCanChange
                                    size="mini"
                                    total={pagination.total}
                                    current={pagination.current}
                                    pageSize={pagination.pageSize}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                            {loading ? <Spin
                                size={20} /> : null}
                        </div>
                    )}
                    { !editable && loopData && !loop.pagination.show && Array.isArray(loopData) && (
                        <div className="modo-widget-loop">
                            {loopData.map((item, index) => {
                                let inner = {};
                                inner[`$${loop.item}`] = item;
                                inner[`$${loop.index}`] = index;
                                return (
                                    <WidgetItem
                                        key={index}
                                        {...this.props}
                                        dispatchEvent={this.handleAction}
                                        $inner={{
                                            ...$inner,
                                            ...inner
                                        }}/>)
                            })}
                            {loading ? <Spin
                                size={20} /> : null}
                        </div>
                    )}
                    {
                        this.state.actionOptions.showType === 'modal' ?
                        (<Modal
                            className="view-modal"
                            title={
                                <div style={{ textAlign: 'left' }}>
                                    {this.state.actionOptions.title}
                                </div>
                            }
                            visible={this.state.actionVisible}
                            footer={null}
                            style={{
                                width: this.state.actionOptions.width
                            }}
                            unmountOnExit={true}
                            onCancel={() => {
                                this.setState({
                                    actionVisible: false
                                })
                            }}>
                            {this.state.actionVisible && <Renderer
                                key={this.state.actionVisible}
                                appName={this.props.app.name}
                                fileName={this.state.actionOptions.viewName + '.fragment'}
                                params={this.state.actionOptions.params}
                                parentViewKey={this.props.viewKey}
                                close={() => {
                                    this.setState({
                                        actionVisible: false
                                    })
                                }}
                            />}
                        </Modal>) :
                        (<Drawer
                            className="view-drawer"
                            title={this.state.actionOptions.title}
                            visible={this.state.actionVisible}
                            unmountOnExit={true}
                            footer={null}
                            style={{
                                width: this.state.actionOptions.width
                            }}
                            onCancel={() => {
                                this.setState({
                                    actionVisible: false
                                })
                            }}>
                            {this.state.actionVisible && <Renderer
                                key={this.state.actionVisible}
                                appName={this.props.app.name}
                                fileName={this.state.actionOptions.viewName + '.fragment'}
                                params={this.state.actionOptions.params}
                                parentViewKey={this.props.viewKey}
                                close={() => {
                                    this.setState({
                                        actionVisible: false
                                    })
                                }}
                            />}
                        </Drawer>)
                    }
                </>
            </>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        lang: state.lang,
        appLang: state.appLang,
        app: state.app,
        renderKey: ownProps.renderKey,
        viewKey: state.viewKey,
        nodes: state.nodes,
        node: state.nodes.byId[ownProps.nodeKey],
        activeNodeKey: state.activeNodeKey,
        stores: state.view.modoStoreList,
        renderer: getRenderer(state, ownProps)
    }
}, null, null, {forwardRef: true})(Widget);

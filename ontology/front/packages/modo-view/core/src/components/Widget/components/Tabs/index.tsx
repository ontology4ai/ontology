import React , { useState} from 'react';
import { Tabs, Typography } from '@arco-design/web-react';
import { ReactSortable } from "react-sortablejs";
import wrapHOC from '../../hoc/wrap';
import Renderer from 'packages/modo-view/renderer';
import * as Icon from 'modo-design/icon';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import isNull from 'packages/modo-view/core/src/utils/isNull';
import Widget from "../../";
import './style/index.less';

const TabPane = Tabs.TabPane;

class ModoTabs extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
            tabs: [],
            editable: false,
            activeTab: '1'
        };
    }
    addTab = (key, title, icon, viewName, params) => {
        const {
            activeTab,
            tabs
        } = this.state;
        if (tabs.find(tab => {
            return tab.key === key
        })) {
            this.setActive(key);
            return;
        }
        if (typeof params !== 'string') {
            params = JSON.stringify(params);
        }
        const newTab = {
            key,
            title,
            icon,
            viewName,
            params
        };
        this.setTabs([...tabs, newTab]);
        this.setActive(newTab.key);
    };
    delete = (key) => {
        const {
            activeTab,
            tabs
        } = this.state;
        const index = tabs.findIndex((x) => x.key === key);
        const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1));

        if (key === activeTab && index > -1 && newTabs.length) {
            this.setActive(newTabs[index] ? newTabs[index].key : newTabs[index - 1].key);
        }

        if (index > -1) {
            this.setTabs(newTabs);
        }
        if (newTabs.length === 0) {
            this.setActive(null);
        }
    };
    deleteTab = (key) => {
        const {
            onBeforeDeleteTab,
            onDeleteTab
        } = this.props;
        if (typeof onBeforeDeleteTab === 'function') {
            onBeforeDeleteTab(key, () => {
                this.delete(key);
                typeof onDeleteTab === 'function' && onDeleteTab(key);
            });
        } else {
            this.delete(key);
            typeof onDeleteTab === 'function' && onDeleteTab(key);
        }
    };
    setTabs = (tabs) => {
        this.setState({
            tabs
        });
    };
    setActive = (key) => {
        this.setState({
            activeTab: key
        });
    };
    componentDidUpdate(prevProps) {
        if (!_.isEqual(this.props.tabs, prevProps.tabs)) {
            this.setState({
                tabs: this.props.tabs
            });
        }
    }
    componentDidMount() {
        this.setState({
            activeTab: this.props.defaultActiveTab,
            tabs: this.props.tabs
        });
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
            console.log(`render-tabs-${this.props.nodeKey}`);
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

            editable,
            inForm,
            titleVisible,
            $this,
            globalStore,
            initVars,
            appModels,
            appModelMap,
            appServices,
            appServiceMap,
            tabs,
            defaultActiveTab,
            edit,
            ...rest
        } = this.props;

        const {
            style,
            onMouseLeave,
            onMouseOver,
            onClick
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

        const tabTitle = (
            <div
                className="tab-title"
                onClick={() => {
                    this.setState({
                        activeTab: null
                    });
                }}>
                <Icon.IconTopic />
                <span>{this.props.widgetLabel}</span>
            </div>
        );

        return (
            <div
                className={className + (edit ? ' modo-tabs-editable' : '') + (!this.state.activeTab ? ' placeholder' : '')}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                <Tabs
                    defaultActiveTab={defaultActiveTab}
                    {...rest}
                    activeTab={this.state.activeTab}
                    onChange={this.setActive}
                    onAddTab={this.addTab}
                    onDeleteTab={this.deleteTab}
                    editable={edit}
                    showAddButton={false}
                    lazyload={isNull(rest.lazyload) ? true : rest.lazyload}
                    extra={edit ? tabTitle : null}>
                    {
                        this.state.tabs.filter(tab => {
                            return !tab.hidden;
                        }).map((tab, index) => {
                            const TabIcon = tab.icon ? Icon[tab.icon] : null;
                            const params = execExp({$this: this.props.get$this()}, tab.params);
                            return (
                                <TabPane
                                    key={tab.key}
                                    disabled={tab.disabled}
                                    title={
                                        <Typography.Text
                                            ellipsis={{
                                                cssEllipsis: true,
                                                rows: 1,
                                                showTooltip: true
                                            }}>
                                            {TabIcon && <TabIcon
                                                style={{ marginRight: 6 }} />}
                                            {
                                                tab.title
                                            }
                                        </Typography.Text>
                                    }>
                                    {tab.viewName && <Renderer
                                        key={index}
                                        appName={this.props.app.name}
                                        fileName={tab.viewName + '.fragment'}
                                        params={params}
                                        parentViewKey={this.props.viewKey}
                                        renderKey={tab.key}
                                        close={() => {
                                            this.deleteTab(tab.key);
                                        }}
                                    />}
                                </TabPane>
                            )
                        })
                    }
                </Tabs>
                <div
                    className="tab-placeholder"
                    style={{
                        // visibility: !this.state.activeTab ? 'visible' : 'hidden',
                        opacity: !this.state.activeTab ? '1' : '0',
                        zIndex: !this.state.activeTab ? 0 : -1,
                        height: !this.state.activeTab ? 'calc(100% - 40px)': '0px',
                    }}>
                    {list}
                </div>
            </div>
        )
    }
}

export default wrapHOC(ModoTabs, 'tabs');

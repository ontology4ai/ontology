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

class ModoVTabs extends React.Component {
    constructor(props: any) {
        super(props);
        this.state={
            tabs: [],
            editable: false,
            activeTab: null
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
    deleteTab = (key) => {
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
    setDefaultActive = () => {
        const {
            node,
            nodes,
            defaultActiveTab
        } = this.props;
        const names = node.children.map(k => {
            return nodes.byId[k].name
        });
        if (names.length > 0) {
            if (names.indexOf(this.state.activeTab) < 0 &&
                names.indexOf(defaultActiveTab) < 0) {
                this.setState({
                    activeTab: names[0]
                });
            } else {
                if (this.state.activeTab !== defaultActiveTab &&
                    !this.state.activeTab &&
                    defaultActiveTab) {
                    this.setState({
                        activeTab: defaultActiveTab
                    });
                }
            }
        }
    };
    componentDidUpdate(prevProps, prevState) {
        this.setDefaultActive();
    }
    componentDidMount() {
        this.setDefaultActive();
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

        const tabTitle = (
            <div
                className="tab-title"
                onClick={() => {
                    this.setState({
                        activeTab: null
                    });
                }}>
                <Icon.IconTopic />
                <span>{this.props.node.label}</span>
            </div>
        );

        return (
            <div
                className={className + (edit ? ' modo-v-tabs-editable' : '')}
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
                        node.children.map(n => {
                            const tab = nodes.byId[n];
                            let list = (
                                <>
                                    {tab.children.map((key : string) => {
                                        return <Widget
                                            key={key}
                                            nodeKey={key}
                                            parentNodeKey={n}
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
                                        list={tab.children}
                                        setList={(list)=> setList(list, n)}
                                        animation={150}
                                        group={{ name: "cloning-group-name" }}
                                        sort={true}
                                        clone={(item)=> cloneWidget(item, n)}>
                                        {list}
                                    </ReactSortable>
                                );
                            }
                            const TabIcon = tab.options && tab.options.icon ? Icon[tab.options.icon] : null;
                            return (
                                <TabPane
                                    key={tab.name}
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
                                                tab.label
                                            }
                                        </Typography.Text>
                                    }>
                                    {list}
                                </TabPane>
                            )
                        })
                    }
                </Tabs>
            </div>
        )
    }
}

export default wrapHOC(ModoVTabs, 'v-tabs');

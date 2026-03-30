import React from 'react';
import { Tabs, Typography, Tooltip, Modal, Trigger } from '@arco-design/web-react';
import * as Icon from 'modo-design/icon';
import './style/index.less';

const TabPane = Tabs.TabPane;

class ModoTabs extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            activeTab: null,
            tabs: []
        };
    }
    addTab = tab => {
        /*
        key
        title
        icon
        view
        */
        const {
            activeTab,
            tabs
        } = this.state;
        if (tabs.find(item => {
            return item.key === tab.key
        })) {
            this.setActive(tab.key);
            return;
        }
        const newTab = {
            ...tab
        };
        this.setTabs([...tabs, newTab]);
        this.setActive(newTab.key);
    }
    updateTabLabel = (key, label) => {
        this.setTabs(this.state.tabs.map(tab => {
            if (tab.key === key) {
                return {
                    ...tab,
                    title: label
                }
            }
            return tab;
        }))
    }
    handleDeleteTab = (key) => {
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
    }
    deleteTab = (key) => {
        if (typeof this.props.beforeDeteleTab === 'function') {
            this.props.beforeDeteleTab(key, () => {
                this.handleDeleteTab(key);
            });
        } else {
            this.handleDeleteTab(key);
        }
    }
    setTabs = (tabs) => {
        this.setState({
            tabs
        });
    }
    setActive = (key) => {
        this.setState({
            activeTab: key
        });
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.state.activeTab !== prevState.activeTab && typeof this.props.onChange === 'function') {
            this.props.onChange(this.state.activeTab)
        }
    }
    componentWillUnmount() {
    }
    render() {
        const tabTitle = (
            <div
                className="tab-title"
                onClick={() => {
                    this.setState({
                        activeTab: null
                    });
                }}>
                {this.props.icon ? this.props.icon :  <Icon.IconTopic />}
                <span>{this.props.title}</span>
            </div>
        );

    	return (
			<div
				className={`modo-tabs editable ${(this.state.tabs.length === 0 || !this.state.activeTab) ? 'no-tabs' : ''}` }>
                <Tabs
                    activeTab={this.state.activeTab}
                    onChange={this.setActive}
                    onAddTab={this.addTab}
                    onDeleteTab={this.deleteTab}
                    editable={true}
                    showAddButton={false}
                    extra={tabTitle}
                    deleteButton={this.props.deleteButton}>
                    {
                        this.state.tabs.map((tab, index) => {
                            const TabIcon = tab.icon ? Icon[tab.icon] : null;
                            return (
                                <TabPane
                                    key={tab.key}
                                    title={
                                        <Tooltip
                                            content={tab.title}>
                                            <Typography.Text
                                                ellipsis={true}>
                                                {TabIcon && <TabIcon
                                                    style={{ marginRight: 6 }} />}
                                                {
                                                    tab.title
                                                }
                                            </Typography.Text>
                                        </Tooltip>
                                    }>
                                    {tab.view}
                                </TabPane>
                            )
                        })
                    }
                </Tabs>
                <div
                    className="tab-placeholder"
                    style={{
                        display: !this.state.activeTab ? 'block' : 'none'
                    }}>
                    {this.props.children}
                </div>
			</div>
	    )
    }
};

export default ModoTabs;

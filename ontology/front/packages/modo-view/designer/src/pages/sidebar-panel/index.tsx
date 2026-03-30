import React, { useState, useEffect, useMemo } from 'react';
import { Menu } from '@arco-design/web-react';
import WidgetList from './pages/widget-list';
import Outline from './pages/outline';
import DsList from './pages/ds-list';
import ModelList from './pages/model-list';
import EventList from './pages/event-list';
import TemplateList from './pages/template-list';
import Schema from './pages/schema';
import History from './pages/history';
import LangList from './pages/lang-list';
import { IconModel, IconNodeTree, IconRedis, IconMenuCard, IconTask, IconMetadataGovernance, IconDatabase, IconHistory, IconGlobal } from 'modo-design/icon';
import './style/index.less';


const MenuItem = Menu.Item;

class SidebarPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            menuActive: 'widget',
            menuList: [
                {
                    icon: <IconNodeTree />,
                    title: '大纲树',
                    type: 'outline'
                },
                {
                    icon: <IconRedis />,
                    title: '事件清单',
                    type: 'event'
                },
                {
                    icon: <IconMenuCard />,
                    title: '组件列表',
                    type: 'widget'
                },
                {
                    icon: <IconTask />,
                    title: '模板列表',
                    type: 'template'
                },
                {
                    icon: <IconModel />,
                    title: '视图模型',
                    type: 'model'
                },
                {
                    icon: <IconMetadataGovernance />,
                    title: '数据源',
                    type: 'ds'
                },
                {
                    icon: <IconDatabase />,
                    title: '视图schema',
                    type: 'schema'
                },
                {
                    icon: <IconHistory />,
                    title: '视图历史版本',
                    type: 'history'
                },
                {
                    icon: <IconGlobal />,
                    title: '多语言文案管理',
                    type: 'lang'
                }
            ],
            widthMap: {
                lang: 700
            }
        };
    }
    onClickMenuItem = item => {
        this.setState({
            menuActive: item
        });
        this.props.setWidth(this.state.widthMap[item] || 300);
    };
    render() {
        const { menuList, menuActive } = this.state;

        return (
            <div
                className="modo-designer-sidebar-panel">
                <Menu
                    style={{
                        width: 40
                    }}
                    collapse={true}
                    defaultSelectedKeys={[menuActive]}
                    onClickMenuItem={this.onClickMenuItem} >
                    {menuList.map((item: any) => {
                        return (<MenuItem
                            key={item.type}>
                            {item.icon}
                            <span className="menu-title">
                                {item.title}
                            </span>
                        </MenuItem>)
                    })}
                </Menu>
                <Outline
                    visible={menuActive === 'outline'} />
                <EventList
                    visible={menuActive === 'event'} />
                <WidgetList
                    visible={menuActive === 'widget'} />
                <TemplateList
                    visible={menuActive === 'template'} />
                <DsList
                    visible={menuActive === 'ds'} />
                <ModelList
                    visible={menuActive === 'model'} />
                <Schema
                    visible={menuActive === 'schema'} />
                <History
                    visible={menuActive === 'history'} />
                <LangList
                    visible={menuActive === 'lang'} />
            </div>
        );
    }
}

export default SidebarPanel;
